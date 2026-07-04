'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { exportBoardAsJSON } from '@/lib/storage';
import { exportBoardReport } from '@/lib/report';
import { createEmptyBoard, createCard, normalizeCard } from '@/lib/initialData';
import { supabase } from '@/lib/supabaseClient';
import { formatDate, daysLabel } from '@/lib/date';
import { MaterialIcon } from '@/lib/icons';
import KanbanColumn from './KanbanColumn';
import CardModal from './CardModal';

/* ---- Constantes ---- */
const FILTERS = [
  { key: 'all', label: 'Todos', shortLabel: 'T' },
  { key: 'eu', label: 'Eu', shortLabel: 'E' },
  { key: 'cliente', label: 'Cliente', shortLabel: 'C' },
  { key: 'interno', label: 'Interno', shortLabel: 'I' },
];

const THEMES = [
  { key: 'default', label: 'Padrão',  swatches: ['--theme-swatch1','--theme-swatch2','--theme-swatch3'] },
  { key: 'dark',    label: 'Escuro',  swatches: ['--theme-swatch1','--theme-swatch2','--theme-swatch3'] },
  { key: 'matrix',  label: 'Matrix',  swatches: ['--theme-swatch1','--theme-swatch2','--theme-swatch3'] },
  { key: 'mario',   label: 'Mário',   swatches: ['--theme-swatch1','--theme-swatch2','--theme-swatch3'] },
  { key: 'beach',   label: 'Beach',   swatches: ['--theme-swatch1','--theme-swatch2','--theme-swatch3'] },
  { key: 'abyss',   label: 'Abyss',   swatches: ['--theme-swatch1','--theme-swatch2','--theme-swatch3'] },
];

const THEME_COLORS = {
  default: ['#1c1c1e', '#a0a0a6', '#f6f6f7'],
  dark:    ['#7c6af5', '#0d0d0f', '#2a2a35'],
  matrix:  ['#00ff41', '#003300', '#000000'],
  mario:   ['#e52521', '#0064ce', '#fbd000'],
  beach:   ['#46b8cf', '#2c84db', '#f5f1e8'],
  abyss:   ['#2ee6a6', '#3d7ef5', '#1a2138'],
};

function normalizeBoardData(data) {
  if (!data) return createEmptyBoard();
  const cards = {};
  Object.entries(data.cards || {}).forEach(([id, c]) => {
    cards[id] = normalizeCard(c);
  });
  return { ...data, cards };
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
  const [showArchived, setShowArchived] = useState(false);
  const menuRef = useRef(null);

  const [listModalCard, setListModalCard] = useState(null);
  const [listModalColId, setListModalColId] = useState(null);
  const [listModalMode, setListModalMode] = useState('view');

  const boardRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileColIdx, setMobileColIdx] = useState(0);

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
          setBoard(normalizeBoardData(data.data));
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
            setBoard(normalizeBoardData(payload.new.data));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
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

  /* Rastreia posição do mouse/touch para auto-scroll durante drag */
  useEffect(() => {
    function track(e) {
      const t = e.touches?.[0];
      const x = t ? t.clientX : e.clientX;
      const y = t ? t.clientY : e.clientY;
      if (x != null) window.__dragMousePosition = { x, y };
    }
    window.addEventListener('mousemove', track);
    window.addEventListener('touchmove', track, { passive: true });
    return () => {
      window.removeEventListener('mousemove', track);
      window.removeEventListener('touchmove', track);
    };
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

  function handleArchiveCard(colId, cardId) {
    setBoard((prev) => {
      const next = {
        ...prev,
        cards: {
          ...prev.cards,
          [cardId]: {
            ...prev.cards[cardId],
            archived: true,
            archivedAt: Date.now(),
            archivedFromColId: colId,
          },
        },
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

  function handleDeleteCard(cardId) {
    setBoard((prev) => {
      const cards = { ...prev.cards };
      delete cards[cardId];
      const next = { ...prev, cards };
      persistirNoSupabase(next);
      return next;
    });
  }

  function handleUnarchiveCard(cardId) {
    setBoard((prev) => {
      const card = prev.cards[cardId];
      const colId = card.archivedFromColId || prev.columnOrder[0];
      const next = {
        ...prev,
        cards: {
          ...prev.cards,
          [cardId]: {
            ...card,
            archived: false,
            archivedAt: null,
          },
        },
        columns: {
          ...prev.columns,
          [colId]: {
            ...prev.columns[colId],
            cardIds: [...prev.columns[colId].cardIds, cardId],
          },
        },
      };
      persistirNoSupabase(next);
      return next;
    });
  }

  function handleMoveCard(cardId, fromColId, toColId) {
    if (fromColId === toColId) return;
    setBoard((prev) => {
      const fromCol = {
        ...prev.columns[fromColId],
        cardIds: prev.columns[fromColId].cardIds.filter((id) => id !== cardId),
      };
      const toCol = {
        ...prev.columns[toColId],
        cardIds: [...prev.columns[toColId].cardIds, cardId],
      };
      const next = {
        ...prev,
        columns: { ...prev.columns, [fromColId]: fromCol, [toColId]: toCol },
        cards: {
          ...prev.cards,
          [cardId]: { ...prev.cards[cardId], owner: toCol.owner },
        },
      };
      persistirNoSupabase(next);
      return next;
    });
    setListModalColId(toColId);
  }

  function scrollToColumn(idx) {
    const boardEl = boardRef.current;
    const cols = boardEl?.querySelectorAll('.column');
    const col = cols?.[idx];
    if (!col || !boardEl) return;
    const left = col.offsetLeft - (boardEl.clientWidth - col.clientWidth) / 2;
    boardEl.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
    setMobileColIdx(idx);
  }

  function goPrevColumn() {
    scrollToColumn(Math.max(0, mobileColIdx - 1));
  }

  function goNextColumn() {
    if (!board) return;
    scrollToColumn(Math.min(board.columnOrder.length - 1, mobileColIdx + 1));
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
    setListModalMode('edit');
    setListModalCard(card);
    setListModalColId(colId);
  }

  function openListModal(card, colId) {
    setListModalMode('view');
    setListModalCard(card);
    setListModalColId(colId);
  }

  function closeListModal() {
    setListModalCard(null);
    setListModalColId(null);
    setListModalMode('view');
  }

  const activeCards = board ? Object.values(board.cards).filter((c) => !c.archived) : [];
  const archivedCards = board ? Object.values(board.cards).filter((c) => c.archived) : [];
  const totalCards = activeCards.length;

  const filterCard = (c) => filter === 'all' || c.owner === filter;

  const columnsList = board
    ? board.columnOrder.map((id) => ({ id, title: board.columns[id].title }))
    : [];

  const filterChip = (f) => (
    <button
      key={f.key}
      className={`filter-chip${filter === f.key ? ' active' : ''}`}
      onClick={() => setFilter(f.key)}
      title={f.label}
    >
      <span className="filter-chip__full">{f.label}</span>
      <span className="filter-chip__short">{f.shortLabel}</span>
    </button>
  );

  const mobileColNav = isMobile && viewMode === 'kanban' && !showArchived && (
    <nav className="mobile-col-nav" aria-label="Navegar colunas">
      <button
        type="button"
        className="mobile-col-nav__btn"
        onClick={goPrevColumn}
        disabled={mobileColIdx <= 0}
      >
        <MaterialIcon name="chevron_left" size={18} />
        Anterior
      </button>
      <button
        type="button"
        className="mobile-col-nav__btn"
        onClick={goNextColumn}
        disabled={!board || mobileColIdx >= board.columnOrder.length - 1}
      >
        Próximo
        <MaterialIcon name="chevron_right" size={18} />
      </button>
    </nav>
  );

  if (!board) return <div style={{ padding: 32, color: 'var(--text-muted)' }}>Carregando do Supabase…</div>;

  /* ---- Topbar ---- */
  const topbar = (
    <header className="topbar">
      <div className="topbar__row topbar__row--primary">
        <div className="topbar__brand">
          <span className="bracket">[</span>
          <span className="topbar__title">Projetos do Jack</span>
          <span className="bracket">]</span>
          <span className="topbar__subtitle topbar__subtitle--desktop">processo de sistemas · {totalCards} cards</span>
        </div>

        <div className="topbar__primary-actions">
          <span className="topbar__count">{totalCards} cards</span>
          <div className="actions-menu" ref={menuRef}>
            <button
              className="actions-menu__trigger btn btn--sm actions-menu__trigger--icon"
              onClick={() => setMenuOpen((o) => !o)}
              title="Mais ações"
              aria-label="Mais ações"
            >
              <MaterialIcon name="more_vert" size={16} />
              <span className="actions-menu__trigger-label">Ações</span>
            </button>

            {menuOpen && (
              <div className="actions-menu__panel">
                <button
                  className="actions-menu__item"
                  onClick={() => { setShowArchived(true); setMenuOpen(false); }}
                >
                  <MaterialIcon name="archive" size={14} />
                  Ver arquivados
                </button>
                <button
                  className="actions-menu__item"
                  onClick={() => { exportBoardReport(board); setMenuOpen(false); }}
                >
                  <MaterialIcon name="description" size={14} />
                  Exportar relatório
                </button>
                <button
                  className="actions-menu__item"
                  onClick={() => { exportBoardAsJSON(board); setMenuOpen(false); }}
                >
                  <MaterialIcon name="download" size={14} />
                  Baixar JSON
                </button>
                <button className="actions-menu__item actions-menu__item--danger" onClick={handleReset}>
                  <MaterialIcon name="restart_alt" size={14} />
                  Limpar board
                </button>

                <div className="actions-menu__divider" />
                <div className="actions-menu__section-label">Tema</div>

                {THEMES.map((t) => (
                  <button
                    key={t.key}
                    className="actions-menu__item"
                    onClick={() => applyTheme(t.key)}
                    style={{ fontWeight: theme === t.key ? 700 : 400 }}
                  >
                    {theme === t.key ? (
                      <MaterialIcon name="check" size={14} />
                    ) : (
                      <span style={{ width: 14 }} />
                    )}
                    {t.label}
                    <span className="theme-swatches" style={{ marginLeft: 'auto' }}>
                      {THEME_COLORS[t.key].map((color, i) => (
                        <span key={i} className="theme-swatch" style={{ background: color }} />
                      ))}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {!showArchived && (
        <div className="topbar__row topbar__row--secondary">
          <div className="filter-group" role="group" aria-label="Filtrar por responsável">
            {FILTERS.map(filterChip)}
          </div>

          <div className="view-group" role="group" aria-label="Modo de visualização">
            <button
              className={`view-btn${viewMode === 'kanban' ? ' active' : ''}`}
              onClick={() => setViewMode('kanban')}
              title="Kanban"
              aria-label="Kanban"
            >
              <MaterialIcon name="view_kanban" size={18} />
              <span className="view-btn__label">Kanban</span>
            </button>
            <button
              className={`view-btn${viewMode === 'lista' ? ' active' : ''}`}
              onClick={() => setViewMode('lista')}
              title="Lista"
              aria-label="Lista"
            >
              <MaterialIcon name="view_list" size={18} />
              <span className="view-btn__label">Lista</span>
            </button>
            <button
              className={`view-btn${viewMode === 'overview' ? ' active' : ''}`}
              onClick={() => setViewMode('overview')}
              title="Visão geral"
              aria-label="Overview"
            >
              <MaterialIcon name="grid_view" size={18} />
              <span className="view-btn__label">Overview</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );

  /* ---- VIEW: ARQUIVADOS ---- */
  if (showArchived) {
    const filtered = archivedCards.filter(filterCard);

    return (
      <div className="app">
        {topbar}
        <main className="board--list">
          <div className="archived-view">
            <div className="archived-view__header">
              <button className="btn btn--sm" onClick={() => setShowArchived(false)}>
                <MaterialIcon name="arrow_back" size={14} />
                Voltar ao board
              </button>
              <span className="archived-view__title">Cards arquivados ({filtered.length})</span>
            </div>

            <div className="filter-group archived-view__filters" role="group" aria-label="Filtrar arquivados">
              {FILTERS.map(filterChip)}
            </div>

            {filtered.length === 0 && (
              <div className="empty-state">Nenhum card arquivado.</div>
            )}

            <div className="archived-view__list">
              {filtered.map((card) => (
                <div
                  key={card.id}
                  className="list-view__row"
                  onClick={() => openListModal(card, card.archivedFromColId)}
                >
                  <span className="list-view__row-title">{card.title || 'sem título'}</span>
                  {card.clientName && (
                    <span className="list-view__row-client">{card.clientName.split(' ')[0]}</span>
                  )}
                  {card.archivedAt && (
                    <span className="list-view__row-due">
                      arquivado em {new Date(card.archivedAt).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {listModalCard && (
            <CardModal
              card={listModalCard}
              columnId={listModalColId}
              columnTitle={board.columns[listModalColId]?.title || 'Arquivado'}
              columns={columnsList}
              initialMode="view"
              isArchivedView
              onClose={closeListModal}
              onSave={(updated) => { handleUpdateCard(updated); closeListModal(); }}
              onUnarchive={() => {
                handleUnarchiveCard(listModalCard.id);
                closeListModal();
              }}
              onDelete={() => {
                if (confirm('Excluir permanentemente este card?')) {
                  handleDeleteCard(listModalCard.id);
                  closeListModal();
                }
              }}
            />
          )}
        </main>
      </div>
    );
  }

  /* ---- VIEW: KANBAN ---- */
  if (viewMode === 'kanban') {
    return (
      <div className={`app${isMobile ? ' app--kanban-mobile' : ''}`}>
        {topbar}
        <main className="board" ref={boardRef}>
          <DragDropContext onDragEnd={onDragEnd} onDragUpdate={onDragUpdate}>
            <div className="board__track">
              {board.columnOrder.map((colId) => {
                const col = board.columns[colId];
                const allColCards = col.cardIds
                  .map((id) => board.cards[id])
                  .filter(Boolean)
                  .filter((c) => !c.archived);
                const cards = allColCards.filter(filterCard);

                return (
                  <KanbanColumn
                    key={colId}
                    column={col}
                    cards={cards}
                    allCards={allColCards}
                    columns={columnsList}
                    onAddCard={handleAddCard}
                    onUpdateCard={handleUpdateCard}
                    onArchiveCard={handleArchiveCard}
                    onMoveCard={handleMoveCard}
                  />
                );
              })}
            </div>
          </DragDropContext>
        </main>
        {mobileColNav}
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
                .filter((c) => !c.archived)
                .filter(filterCard);

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
                      onClick={() => openListModal(card, colId)}
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
              columnId={listModalColId}
              columnTitle={board.columns[listModalColId]?.title}
              columns={columnsList}
              initialMode={listModalMode}
              onClose={closeListModal}
              onSave={(updated) => {
                handleUpdateCard(updated);
                closeListModal();
              }}
              onPatch={handleUpdateCard}
              onArchive={() => {
                handleArchiveCard(listModalColId, listModalCard.id);
                closeListModal();
              }}
              onMoveCard={handleMoveCard}
              onColumnChange={setListModalColId}
            />
          )}
        </main>
      </div>
    );
  }

  /* ---- VIEW: OVERVIEW ---- */
  if (viewMode === 'overview') {
    const cols = board.columnOrder.map((colId) => {
      const col = board.columns[colId];
      const cards = col.cardIds
        .map((id) => board.cards[id])
        .filter(Boolean)
        .filter((c) => !c.archived)
        .filter(filterCard);
      return { col, cards };
    });

    return (
      <div className="app">
        {topbar}
        <main className="board--overview">
          <div className="overview-grid">
            {cols.map(({ col, cards }) => (
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
                      onClick={() => openListModal(card, col.id)}
                    >
                      {card.title || 'sem título'}
                    </div>
                  ))}
                  <button className="overview-add" onClick={() => handleAddCardInView(col.id)}>
                    <MaterialIcon name="add" size={10} />
                    novo
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal compartilhado da view overview */}
          {listModalCard && listModalColId && (
            <CardModal
              card={listModalCard}
              columnId={listModalColId}
              columnTitle={board.columns[listModalColId]?.title}
              columns={columnsList}
              initialMode={listModalMode}
              onClose={closeListModal}
              onSave={(updated) => {
                handleUpdateCard(updated);
                closeListModal();
              }}
              onPatch={handleUpdateCard}
              onArchive={() => {
                handleArchiveCard(listModalColId, listModalCard.id);
                closeListModal();
              }}
              onMoveCard={handleMoveCard}
              onColumnChange={setListModalColId}
            />
          )}
        </main>
      </div>
    );
  }

  return null;
}
