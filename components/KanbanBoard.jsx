'use client';

import { useState, useEffect, useCallback } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { exportBoardAsJSON } from '@/lib/storage';
import { createEmptyBoard } from '@/lib/initialData';
import { supabase } from '@/lib/supabaseClient';
import KanbanColumn from './KanbanColumn';

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'eu', label: 'Eu' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'interno', label: 'Interno' },
];

export default function KanbanBoard() {
  const [board, setBoard] = useState(null);
  const [filter, setFilter] = useState('all');

  /* Carrega direto do Supabase ao abrir o site e assina as mudanças em tempo real */
  useEffect(() => {
    async function initBoard() {
      try {
        const { data, error } = await supabase
          .from('board_state')
          .select('data')
          .eq('id', 1)
          .single();

        if (error) throw error;

        if (data && data.data && Object.keys(data.data).length > 0) {
          setBoard(data.data);
        } else {
          setBoard(createEmptyBoard());
        }
      } catch (err) {
        console.error('Erro ao carregar dados do Supabase:', err);
        setBoard(createEmptyBoard());
      }
    }
    initBoard();

    /* Assina as atualizações em tempo real do banco de dados */
    const subscription = supabase
      .channel('board-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'board_state', filter: 'id=eq.1' },
        (payload) => {
          if (payload.new && payload.new.data) {
            setBoard(payload.new.data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  /* Função auxiliar para salvar na nuvem */
  async function persistirNoSupabase(novoBoard) {
    try {
      const { error } = await supabase
        .from('board_state')
        .upsert({ id: 1, data: novoBoard, updated_at: new Date().toISOString() });

      if (error) throw error;
    } catch (err) {
      console.error('Erro ao salvar no Supabase:', err);
    }
  }

  /* Drag and drop */
  const onDragEnd = useCallback((result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    setBoard((prev) => {
      const next = { ...prev, columns: { ...prev.columns }, cards: { ...prev.cards } };

      const srcCol = { ...next.columns[source.droppableId], cardIds: [...next.columns[source.droppableId].cardIds] };
      const dstCol = source.droppableId === destination.droppableId
        ? srcCol
        : { ...next.columns[destination.droppableId], cardIds: [...next.columns[destination.droppableId].cardIds] };

      srcCol.cardIds.splice(source.index, 1);
      dstCol.cardIds.splice(destination.index, 0, draggableId);

      if (source.droppableId !== destination.droppableId) {
        next.cards = {
          ...next.cards,
          [draggableId]: { ...next.cards[draggableId], owner: dstCol.owner },
        };
      }

      next.columns[source.droppableId] = srcCol;
      next.columns[destination.droppableId] = dstCol;

      persistirNoSupabase(next);
      return next;
    });
  }, []);

  /* CRUD de cards */
  function handleAddCard(colId, card) {
    setBoard((prev) => {
      const next = {
        ...prev,
        cards: { ...prev.cards, [card.id]: card },
        columns: {
          ...prev.columns,
          [colId]: { ...prev.columns[colId], cardIds: [...prev.columns[colId].cardIds, card.id] },
        },
      };
      persistirNoSupabase(next);
      return next;
    });
  }

  function handleUpdateCard(updated) {
    setBoard((prev) => {
      const next = {
        ...prev,
        cards: { ...prev.cards, [updated.id]: updated },
      };
      persistirNoSupabase(next);
      return next;
    });
  }

  function handleDeleteCard(colId, cardId) {
    setBoard((prev) => {
      const cards = { ...prev.cards };
      delete cards[cardId];
      const next = {
        ...prev,
        cards,
        columns: {
          ...prev.columns,
          [colId]: {
            ...prev.columns[colId],
            cardIds: prev.columns[colId].cardIds.filter((id) => id !== cardId),
          },
        },
      };
      persistirNoSupabase(next);
      return next;
    });
  }

  function handleReset() {
    if (confirm('Limpar todo o board? Esta ação não pode ser desfeita.')) {
      const boardVazio = createEmptyBoard();
      setBoard(boardVazio);
      persistirNoSupabase(boardVazio);
    }
  }

  if (!board) return <div style={{ padding: 32, color: 'var(--gray-500)' }}>Carregando do Supabase…</div>;

  const totalCards = Object.keys(board.cards).length;

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="bracket">[</span>
          <span className="topbar__title">Design Kanban</span>
          <span className="bracket">]</span>
          <span className="topbar__subtitle">processo de sistemas · {totalCards} cards</span>
        </div>

        <div className="topbar__actions">
          <div className="filter-group" role="group" aria-label="Filtrar por responsável">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`filter-chip${filter === f.key ? ' active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button className="btn btn--sm" onClick={() => exportBoardAsJSON(board)} title="Exportar JSON">
            ↓ JSON
          </button>
          <button className="btn btn--sm btn--danger" onClick={handleReset} title="Limpar board">
            ↺ Limpar
          </button>
        </div>
      </header>

      <main className="board">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="board__track">
            {board.columnOrder.map((colId) => {
              const col = board.columns[colId];
              const cards = col.cardIds
                .map((id) => board.cards[id])
                .filter(Boolean)
                .filter((c) => filter === 'all' || c.owner === filter);

              return (
                <KanbanColumn
                  key={colId}
                  column={col}
                  cards={cards}
                  onAddCard={handleAddCard}
                  onUpdateCard={handleUpdateCard}
                  onDeleteCard={handleDeleteCard}
                />
              );
            })}
          </div>
        </DragDropContext>
      </main>
    </div>
  );
}