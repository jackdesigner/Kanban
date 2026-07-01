'use client';

import { useState, useEffect, useCallback } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { loadBoard, saveBoard, exportBoardAsJSON } from '@/lib/storage';
import { createEmptyBoard } from '@/lib/initialData';
import KanbanColumn from './KanbanColumn';

const FILTERS = [
  { key: 'all',     label: 'Todos' },
  { key: 'eu',      label: 'Eu' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'interno', label: 'Interno' },
];

export default function KanbanBoard() {
  const [board, setBoard] = useState(null);
  const [filter, setFilter] = useState('all');

  /* Carrega do localStorage na montagem */
  useEffect(() => {
    const saved = loadBoard();
    setBoard(saved || createEmptyBoard());
  }, []);

  /* Persiste sempre que o board muda */
  useEffect(() => {
    if (board) saveBoard(board);
  }, [board]);

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

      // Ao mover de coluna, atualiza owner do card para o owner padrão da coluna destino
      if (source.droppableId !== destination.droppableId) {
        next.cards = {
          ...next.cards,
          [draggableId]: { ...next.cards[draggableId], owner: dstCol.owner },
        };
      }

      next.columns[source.droppableId] = srcCol;
      next.columns[destination.droppableId] = dstCol;

      return next;
    });
  }, []);

  /* CRUD de cards */
  function handleAddCard(colId, card) {
    setBoard((prev) => ({
      ...prev,
      cards: { ...prev.cards, [card.id]: card },
      columns: {
        ...prev.columns,
        [colId]: { ...prev.columns[colId], cardIds: [...prev.columns[colId].cardIds, card.id] },
      },
    }));
  }

  function handleUpdateCard(updated) {
    setBoard((prev) => ({
      ...prev,
      cards: { ...prev.cards, [updated.id]: updated },
    }));
  }

  function handleDeleteCard(colId, cardId) {
    setBoard((prev) => {
      const cards = { ...prev.cards };
      delete cards[cardId];
      return {
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
    });
  }

  function handleReset() {
    if (confirm('Limpar todo o board? Esta ação não pode ser desfeita.')) {
      setBoard(createEmptyBoard());
    }
  }

  if (!board) return <div style={{ padding: 32, color: 'var(--gray-500)' }}>Carregando…</div>;

  const totalCards = Object.keys(board.cards).length;

  return (
    <div className="app">
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar__brand">
          <span className="bracket">[</span>
          <span className="topbar__title">Design Kanban</span>
          <span className="bracket">]</span>
          <span className="topbar__subtitle">processo de sistemas · {totalCards} cards</span>
        </div>

        <div className="topbar__actions">
          {/* Filtro por owner */}
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

      {/* Board */}
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
