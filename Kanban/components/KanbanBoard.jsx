'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { exportBoardAsJSON } from '@/lib/storage';
import { createEmptyBoard, createCard } from '@/lib/initialData';
import { supabase } from '@/lib/supabaseClient';
import { formatDate, daysLabel } from '@/lib/date';
import KanbanColumn from './KanbanColumn';
import CardModal from './CardModal';

/* ---- Constantes ---- */
const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'eu', label: 'Eu' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'interno', label: 'Interno' },
];

const THEMES = [
  { key: 'default', label: 'Padrão',  swatches: ['--theme-swatch1','--theme-swatch2','--theme-swatch3'] },
  { key: 'dark',    label: 'Escuro',  swatches: ['--theme-swatch1','--theme-swatch2','--theme-swatch3'] },
  { key: 'matrix',  label: 'Matrix',  swatches: ['--theme-swatch1','--theme-swatch2','--theme-swatch3'] },
  { key: 'mario',   label: 'Mário',   swatches: ['--theme-swatch1','--theme-swatch2','--theme-swatch3'] },
];

const THEME_COLORS = {
  default: ['#1c1c1e', '#a0a0a6', '#f6f6f7'],
  dark:    ['#7c6af5', '#0d0d0f', '#2a2a35'],
  matrix:  ['#00ff41', '#003300', '#000000'],
  mario:   ['#e52521', '#0064ce', '#fbd000'],
};

/* ---- Ícones SVG inline ---- */
function IconKanban() {
  return (
    <svg viewBox="0 0 16 16"><rect x="1" y="1" width="4" height="14" rx="1"/><rect x="6" y="1" width="4" height="10" rx="1"/><rect x="11" y="1" width="4" height="12" rx="1"/></svg>
  );
}
function IconList() {
  return (
    <svg viewBox="0 0 16 16"><line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="14" y2="12"/></svg>
  );
}
function IconOverview() {
  return (
    <svg viewBox="0 0 16 16"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
  );
}
function IconMenu() {
  return (
    <svg viewBox="0 0 16 16" style={{width:13,height:13,stroke:'currentColor',fill:'none',strokeWidth:2,strokeLinecap:'round'}}>
      <circle cx="8" cy="3" r="0.8" fill="currentColor" stroke="none"/>
      <circle cx="8" cy="8" r="0.8" fill="currentColor" stroke="none"/>
      <circle cx="8" cy="13" r="0.8" fill="currentColor" stroke="none"/>
    </svg>
  );
}

/* ---- Scroll automático durante drag ---- */
const SCROLL_ZONE = 100; // px desde as bordas da tela
const SCROLL_SPEED = 14;
let rafId = null;

function startAutoScroll(x, y) {
  cancelAnimationFrame(rafId);
  function tick() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    let dx = 0, dy = 0;

    // Horizontal (bordas esquerda/direita)
    if (x < SCROLL_ZONE) dx = -SCROLL_SPEED * (1 - x / SCROLL_ZONE);
    else if (x > W - SCROLL_ZONE) dx = SCROLL_SPEED * (1 - (W - x) / SCROLL_ZONE);

    // Vertical (bordas topo/baixo)
    if (y < SCROLL_ZONE) dy = -SCROLL_SPEED * (1 - y / SCROLL_ZONE);
    else if (y > H - SCROLL_ZONE) dy = SCROLL_SPEED * (1 - (H - y) / SCROLL_ZONE);

    if (dx !== 0 || dy !== 0) {
      window.scrollBy(dx, dy);
      // Também scrola o elemento .board se tiver overflow horizontal
      const board = document.querySelector('.board');
      if (board && dx !== 0) board.scrollLeft += dx;
    }
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);
}

function stopAutoScroll() {
  cancelAnimationFrame(rafId);
  rafId = null;
}

/* ---- Componente ---- */
export default function KanbanBoard() {
  const [board, setBoard] = useState(null);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'lista' | 'overview'
  const [theme, setTheme] = useState('default');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Modal aberto na view lista/overview
  const [listModalCard, setListModalCard] = useState(null);
  const [listModalColId, setListModalColId] = useState(null);

  /* Aplica tema no <html> */
  useEffect(() => {
    const saved = localStorage.getItem('kanban-theme') || 'default';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  function applyTheme(key) {
    setTheme(key);
    document.documentElement.setAttribute('data-theme', key);
    localStorage.setItem('kanban-theme', key);
    setMenuOpen(false);
  }

  /* Fecha menu ao clicar fora */
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* Carrega do Supabase e assina realtime */
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

    return () => { supabase.removeChannel(subscription); };
  }, []);

  /* Salvar no Supabase */
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
  const onDragUpdate = useCallback((update) => {
    if (!update.destination) return;
    // Pega a posição do mouse via evento nativo armazenado pelo hello-pangea
    const event = window.__dragMousePosition;
    if (event) startAutoScroll(event.x, event.y);
  }, []);

  const onDragEnd = useCallback((result) => {
    stopAutoScroll();
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

  /* Rastreia posição do mouse para o auto-scroll durante drag */
  useEffect(() => {
    function track(e) { window.__dragMousePosition = { x: e.clientX, y: e.clientY }; }
    window.addEventListener('mousemove', track);
    return () => window.removeEventListener('mousemove', track);
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
    setMenuOpen(false);
    if (confirm('Limpar todo o board? Esta ação não pode ser desfeita.')) {
      const boardVazio = createEmptyBoard();
      setBoard(boardVazio);
      persistirNoSupabase(boardVazio);
    }
  }

  /* Adicionar card a partir da view lista/overview */
  function handleAddCardInView(colId) {
    const col = board.columns[colId];
    const card = createCard({ owner: col.owner });
    handleAddCard(colId, card);
    setListModalCard(card);
    setListModalColId(colId);
  }

  if (!board) return <div style={{ padding: 32, color: 'var(--text-muted)' }}>Carregando do Supabase…</div>;

  const totalCards = Object.keys(board.cards).length;

  /* ---- Topbar ---- */
  const topbar = (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="bracket">[</span>
        <span className="topbar__title">Projetos do Jack</span>
        <span className="bracket">]</span>
        <span className="topbar__subtitle">processo de sistemas · {totalCards} cards</span>
      </div>

      <div className="topbar__actions">
        {/* Filtros */}
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

        {/* Modos de visualização */}
        <div className="view-group" role="group" aria-label="Modo de visualização">
          <button
            className={`view-btn${viewMode === 'kanban' ? ' active' : ''}`}
            onClick={() => setViewMode('kanban')}
            title="Kanban"
          >
            <IconKanban /> Kanban
          </button>
          <button
            className={`view-btn${viewMode === 'lista' ? ' active' : ''}`}
            onClick={() => setViewMode('lista')}
            title="Lista"
          >
            <IconList /> Lista
          </button>
          <button
            className={`view-btn${viewMode === 'overview' ? ' active' : ''}`}
            onClick={() => setViewMode('overview')}
            title="Visão geral"
          >
            <IconOverview /> Overview
          </button>
        </div>

        {/* Menu de ações */}
        <div className="actions-menu" ref={menuRef}>
          <button
            className="actions-menu__trigger btn btn--sm"
            onClick={() => setMenuOpen((o) => !o)}
            title="Mais ações"
          >
            <IconMenu /> Ações
          </button>

          {menuOpen && (
            <div className="actions-menu__panel">
              {/* Download JSON */}
              <button
                className="actions-menu__item"
                onClick={() => { exportBoardAsJSON(board); setMenuOpen(false); }}
              >
                ↓ Baixar JSON
              </button>

              {/* Limpar */}
              <button className="actions-menu__item actions-menu__item--danger" onClick={handleReset}>
                ↺ Limpar board
              </button>

              <div className="actions-menu__divider" />
              <div className="actions-menu__section-label">Tema</div>

              {/* Temas */}
              {THEMES.map((t) => (
                <button
                  key={t.key}
                  className="actions-menu__item"
                  onClick={() => applyTheme(t.key)}
                  style={{ fontWeight: theme === t.key ? 700 : 400 }}
                >
                  {theme === t.key ? '✓ ' : '    '}{t.label}
                  <span className="theme-swatches" style={{ marginLeft: 'auto' }}>
                    {THEME_COLORS[t.key].map((color, i) => (
                      <span
                        key={i}
                        className="theme-swatch"
                        style={{ background: color }}
                      />
                    ))}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );

  /* ---- VIEW: KANBAN ---- */
  if (viewMode === 'kanban') {
    return (
      <div className="app">
        {topbar}
        <main className="board">
          <DragDropContext onDragEnd={onDragEnd} onDragUpdate={onDragUpdate}>
            <div className="board__track">
              {board.columnOrder.map((colId) => {
                const col = board.columns[colId];
                const allColCards = col.cardIds.map((id) => board.cards[id]).filter(Boolean);
                const cards = allColCards.filter((c) => filter === 'all' || c.owner === filter);

                return (
                  <KanbanColumn
                    key={colId}
                    column={col}
                    cards={cards}
                    allCards={allColCards}
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

  /* ---- VIEW: LISTA ---- */
  if (viewMode === 'lista') {
    return (
      <div className="app">
        {topbar}
        <main className="board--list">
          <div className="list-view">
            {board.columnOrder.map((colId) => {
              const col = board.columns[colId];
              const cards = col.cardIds
                .map((id) => board.cards[id])
                .filter(Boolean)
                .filter((c) => filter === 'all' || c.owner === filter);

              return (
                <div key={colId} className="list-view__section">
                  <div className="list-view__section-header">
                    <span className="list-view__section-title">{col.title}</span>
                    <span className="list-view__section-count">{cards.length}</span>
                  </div>
                  {cards.length === 0 && (
                    <div className="list-view__empty">Nenhum card</div>
                  )}
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      className="list-view__row"
                      onClick={() => { setListModalCard(card); setListModalColId(colId); }}
                    >
                      <span className="list-view__row-title">{card.title || 'sem título'}</span>
                      {card.clientName && (
                        <span className="list-view__row-client">{card.clientName.split(' ')[0]}</span>
                      )}
                      {card.dueDate && (
                        <span className="list-view__row-due">
                          {formatDate(card.dueDate)} · {daysLabel(card.dueDate)}
                        </span>
                      )}
                    </div>
                  ))}
                  <button className="list-view__add-btn" onClick={() => handleAddCardInView(colId)}>
                    + novo card
                  </button>
                </div>
              );
            })}
          </div>

          {/* Modal compartilhado da view lista */}
          {listModalCard && listModalColId && (
            <CardModal
              card={listModalCard}
              columnTitle={board.columns[listModalColId]?.title}
              onClose={() => { setListModalCard(null); setListModalColId(null); }}
              onSave={(updated) => {
                handleUpdateCard(updated);
                setListModalCard(null);
                setListModalColId(null);
              }}
              onDelete={() => {
                handleDeleteCard(listModalColId, listModalCard.id);
                setListModalCard(null);
                setListModalColId(null);
              }}
            />
          )}
        </main>
      </div>
    );
  }

  /* ---- VIEW: OVERVIEW (2 linhas × 7 colunas) ---- */
  if (viewMode === 'overview') {
    const cols = board.columnOrder.map((colId) => {
      const col = board.columns[colId];
      const cards = col.cardIds
        .map((id) => board.cards[id])
        .filter(Boolean)
        .filter((c) => filter === 'all' || c.owner === filter);
      return { col, cards };
    });

    // Divide em 2 linhas de 7
    const row1 = cols.slice(0, 7);
    const row2 = cols.slice(7);

    return (
      <div className="app">
        {topbar}
        <main className="board--overview">
          {[row1, row2].map((row, ri) => (
            <div key={ri} className="overview-grid" style={{ marginBottom: 8 }}>
              {row.map(({ col, cards }) => (
                <div key={col.id} className="overview-col">
                  <div className="overview-col__header">
                    <span className="overview-col__title">{col.title}</span>
                    <span className="overview-col__count">{cards.length}</span>
                  </div>
                  <div className="overview-col__body">
                    {cards.map((card) => (
                      <div
                        key={card.id}
                        className="overview-card"
                        title={card.title || 'sem título'}
                        onClick={() => { setListModalCard(card); setListModalColId(col.id); }}
                      >
                        {card.title || 'sem título'}
                      </div>
                    ))}
                    <button className="overview-add" onClick={() => handleAddCardInView(col.id)}>
                      + novo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Modal compartilhado da view overview */}
          {listModalCard && listModalColId && (
            <CardModal
              card={listModalCard}
              columnTitle={board.columns[listModalColId]?.title}
              onClose={() => { setListModalCard(null); setListModalColId(null); }}
              onSave={(updated) => {
                handleUpdateCard(updated);
                setListModalCard(null);
                setListModalColId(null);
              }}
              onDelete={() => {
                handleDeleteCard(listModalColId, listModalCard.id);
                setListModalCard(null);
                setListModalColId(null);
              }}
            />
          )}
        </main>
      </div>
    );
  }

  return null;
}