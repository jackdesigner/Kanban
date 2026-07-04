'use client';

import { useState, useEffect, useRef } from 'react';
import { MaterialIcon } from '@/lib/icons';
import { formatDate, daysLabel } from '@/lib/date';

/* ---- Constantes ---- */
const CONCLUDED_COL = 'col-13';   // Instalação concluída
const FEATURE_COL   = 'col-12';   // Feature pendente
const XP_PER_LEVEL  = 3;          // conclusões por nível

const EMBLEMS = [
  { key: 'person',           label: 'Pessoa' },
  { key: 'design_services',  label: 'Design' },
  { key: 'auto_awesome',     label: 'Estrela' },
  { key: 'brush',            label: 'Pincel' },
  { key: 'shield_person',    label: 'Escudo' },
  { key: 'military_tech',    label: 'Medalha' },
];

const DEFAULT_PROFILE = {
  name: 'Fer',
  title: 'Arquiteta de Interfaces Errantes',
  bio: '',
  specialty: 'UI · Totens · React',
  emblem: 'design_services',
  avatar: null,
  attributes: [
    { key: 'criatividade', label: 'Criatividade',        value: 7 },
    { key: 'agilidade',    label: 'Agilidade',           value: 6 },
    { key: 'paciencia',    label: 'Paciência c/ revisão', value: 8 },
  ],
};

function loadProfile() {
  try {
    const raw = localStorage.getItem('rpg-profile');
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function saveProfile(p) {
  localStorage.setItem('rpg-profile', JSON.stringify(p));
}

/* ---- Cálculo de nível / XP ---- */
function computeStats(board) {
  if (!board) return {
    level: 1, xpPct: 0, concluded: 0,
    active: [], blocked: [], secondary: [],
    achievements: [], nextDeadline: null,
  };

  const concludedCards = (board.columns[CONCLUDED_COL]?.cardIds || [])
    .map((id) => board.cards[id])
    .filter(Boolean)
    .filter((c) => !c.archived);

  const concluded = concludedCards.length;
  const level = Math.floor(concluded / XP_PER_LEVEL) + 1;
  const xpPct  = ((concluded % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;

  const secondary = (board.columns[FEATURE_COL]?.cardIds || [])
    .map((id) => board.cards[id])
    .filter(Boolean)
    .filter((c) => !c.archived);

  const blockedColIds = board.columnOrder.filter((id) => board.columns[id]?.waitsOn);
  const blocked = blockedColIds.flatMap((colId) =>
    (board.columns[colId]?.cardIds || [])
      .map((id) => ({ card: board.cards[id], colId }))
      .filter(({ card }) => card && !card.archived)
  );

  const excludedCols = new Set([CONCLUDED_COL, FEATURE_COL, ...blockedColIds]);
  const active = board.columnOrder
    .filter((id) => !excludedCols.has(id))
    .flatMap((colId) =>
      (board.columns[colId]?.cardIds || [])
        .map((id) => ({ card: board.cards[id], colId }))
        .filter(({ card }) => card && !card.archived)
    );

  const achievements = [...concludedCards]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 5);

  const withDue = blocked
    .filter(({ card }) => card.dueDate)
    .sort((a, b) => new Date(a.card.dueDate) - new Date(b.card.dueDate));
  const nextDeadline = withDue[0] || null;

  return { level, xpPct, concluded, active, blocked, secondary, achievements, nextDeadline };
}

function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

/* ---- Componente ---- */
export default function OperatorCard({ board, onClose, onPatchCard }) {
  const [profile, setProfile] = useState(loadProfile);
  const [editing, setEditing]  = useState(false);
  const [draft, setDraft]      = useState(null);
  const [missionSort, setMissionSort] = useState('prazo');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [xpAnimated, setXpAnimated]   = useState(0);
  const prevLevelRef  = useRef(null);
  const fileInputRef  = useRef(null);

  const stats = computeStats(board);

  /* Anima XP ao entrar */
  useEffect(() => {
    setXpAnimated(0);
    const t = setTimeout(() => setXpAnimated(stats.xpPct), 80);
    return () => clearTimeout(t);
  }, [stats.xpPct]);

  /* Detecta level up */
  useEffect(() => {
    if (prevLevelRef.current !== null && stats.level > prevLevelRef.current) {
      setShowLevelUp(true);
      const t = setTimeout(() => setShowLevelUp(false), 2800);
      return () => clearTimeout(t);
    }
    prevLevelRef.current = stats.level;
  }, [stats.level]);

  function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const updated = { ...profile, avatar: ev.target.result };
      setProfile(updated);
      saveProfile(updated);
    };
    reader.readAsDataURL(file);
  }

  function startEdit() {
    setDraft({ ...profile, attributes: profile.attributes.map((a) => ({ ...a })) });
    setEditing(true);
  }
  function saveEdit() { setProfile(draft); saveProfile(draft); setEditing(false); }
  function cancelEdit() { setDraft(null); setEditing(false); }
  function updateDraft(field, value) { setDraft((d) => ({ ...d, [field]: value })); }
  function updateAttr(idx, value) {
    setDraft((d) => {
      const attrs = d.attributes.map((a, i) =>
        i === idx ? { ...a, value: Math.min(10, Math.max(0, Number(value))) } : a
      );
      return { ...d, attributes: attrs };
    });
  }

  function sortedActive() {
    const list = [...stats.active];
    if (missionSort === 'prazo') {
      return list.sort((a, b) => {
        if (!a.card.dueDate && !b.card.dueDate) return 0;
        if (!a.card.dueDate) return 1;
        if (!b.card.dueDate) return -1;
        return new Date(a.card.dueDate) - new Date(b.card.dueDate);
      });
    }
    const colOrder = board?.columnOrder || [];
    return list.sort((a, b) => colOrder.indexOf(a.colId) - colOrder.indexOf(b.colId));
  }

  function sortedBlocked() {
    const list = [...stats.blocked];
    if (missionSort === 'prazo') {
      return list.sort((a, b) => {
        const ao = isOverdue(a.card.dueDate);
        const bo = isOverdue(b.card.dueDate);
        if (ao && !bo) return -1;
        if (!ao && bo) return 1;
        if (!a.card.dueDate && !b.card.dueDate) return 0;
        if (!a.card.dueDate) return 1;
        if (!b.card.dueDate) return -1;
        return new Date(a.card.dueDate) - new Date(b.card.dueDate);
      });
    }
    const colOrder = board?.columnOrder || [];
    return list.sort((a, b) => colOrder.indexOf(a.colId) - colOrder.indexOf(b.colId));
  }

  const p = editing ? draft : profile;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal op-modal" role="dialog" aria-modal="true" aria-label="Ficha do Operador">
        
        {showLevelUp && (
          <div className="op-levelup-toast">
            {'>>> NÍVEL ' + stats.level + ' ALCANÇADO <<<'}
          </div>
        )}

        <div className="modal__header">
          <div className="op-header-identity">
            <span className="op-header-title">FICHA DO OPERADOR</span>
            <span className="op-header-level">
              <MaterialIcon name="military_tech" size={16} />
              NÍVEL {stats.level} · {profile.title || 'Designer de Sistemas'}
            </span>
          </div>
          <div className="modal__header-actions">
            <button className="icon-btn" onClick={onClose} title="Fechar">
              <MaterialIcon name="close" size={18} />
            </button>
          </div>
        </div>

        <div className="modal__body op-modal-body">
          {/* Avatar + stats rápidos */}
          <section className="op-section op-section--top">
            <div className="op-avatar-wrap">
              <div
                className="op-avatar"
                onClick={() => fileInputRef.current?.click()}
                title="Clique para trocar imagem"
              >
                {profile.avatar
                  ? <img src={profile.avatar} alt="avatar" className="op-avatar__img" />
                  : <MaterialIcon name="person" size={54} className="op-avatar__icon-svg" />
                }
                <div className="op-avatar__overlay">
                  <MaterialIcon name="photo_camera" size={20} />
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
            </div>

            <div className="op-quick-stats">
              <div className="op-xp">
                <div className="op-xp__label">
                  XP
                  <span className="op-xp__pct">{Math.round(xpAnimated)}% → nível {stats.level + 1}</span>
                </div>
                <div className="op-xp__track">
                  <div className="op-xp__fill" style={{ width: xpAnimated + '%', transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)' }} />
                </div>
              </div>
              <div className="op-stats-grid">
                <div className="op-stat">
                  <span className="op-stat__val">{stats.concluded}</span>
                  <span className="op-stat__lbl">Projetos concluídos</span>
                </div>
                <div className="op-stat">
                  <span className="op-stat__val">{stats.active.length}</span>
                  <span className="op-stat__lbl">Missões ativas</span>
                </div>
                <div className="op-stat">
                  <span className="op-stat__val">{stats.blocked.length}</span>
                  <span className="op-stat__lbl">Missões bloqueadas</span>
                </div>
                {stats.nextDeadline && (
                  <div className="op-stat op-stat--deadline">
                    <MaterialIcon name="hourglass_top" size={13} />
                    <span className="op-stat__lbl">Próximo prazo: {daysLabel(stats.nextDeadline.card.dueDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Bio */}
          <section className="op-section">
            <div className="op-section__header">
              <span className="op-section__title">BIO</span>
              {!editing && (
                <button className="btn btn--sm btn--ghost" onClick={startEdit} style={{ padding: '2px 8px' }}>
                  <MaterialIcon name="edit" size={12} />
                  Editar
                </button>
              )}
            </div>

            {!editing ? (
              <div className="op-bio-view">
                <div className="op-bio-row"><span className="op-bio-label">Nome/apelido</span><span className="op-bio-val">"{profile.name}"</span></div>
                <div className="op-bio-row"><span className="op-bio-label">Título</span><span className="op-bio-val">"{profile.title}"</span></div>
                {profile.bio && <div className="op-bio-row op-bio-row--full"><span className="op-bio-label">Bio</span><span className="op-bio-val">{profile.bio}</span></div>}
                {profile.specialty && <div className="op-bio-row"><span className="op-bio-label">Especialidade</span><span className="op-bio-val">{profile.specialty}</span></div>}
                <div className="op-bio-row" style={{ alignItems: 'center' }}>
                  <span className="op-bio-label">Emblema</span>
                  <span className="op-emblem-display-wrap">
                    <MaterialIcon name={profile.emblem} size={20} />
                  </span>
                </div>
              </div>
            ) : (
              <div className="op-bio-form">
                <label className="op-field">
                  <span className="op-field__label">Nome/apelido</span>
                  <input className="op-field__input" value={draft.name} onChange={(e) => updateDraft('name', e.target.value)} />
                </label>
                <label className="op-field">
                  <span className="op-field__label">Título</span>
                  <input className="op-field__input" value={draft.title} onChange={(e) => updateDraft('title', e.target.value)} />
                </label>
                <label className="op-field">
                  <span className="op-field__label">Bio</span>
                  <textarea className="op-field__input op-field__input--textarea" value={draft.bio} onChange={(e) => updateDraft('bio', e.target.value)} rows={3} />
                </label>
                <label className="op-field">
                  <span className="op-field__label">Especialidade</span>
                  <input className="op-field__input" placeholder="ex: UI · Totens · React" value={draft.specialty} onChange={(e) => updateDraft('specialty', e.target.value)} />
                </label>
                <div className="op-field">
                  <span className="op-field__label">Emblema</span>
                  <div className="op-emblem-picker">
                    {EMBLEMS.map((em) => (
                      <button
                        key={em.key}
                        className={`op-emblem-opt${draft.emblem === em.key ? ' active' : ''}`}
                        title={em.label}
                        onClick={() => updateDraft('emblem', em.key)}
                      >
                        <MaterialIcon name={em.key} size={20} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="op-field">
                  <span className="op-field__label">Foto / caricatura</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn--sm" onClick={() => fileInputRef.current?.click()}>
                      <MaterialIcon name="upload" size={13} />
                      {profile.avatar ? 'Trocar imagem' : 'Enviar imagem'}
                    </button>
                    {profile.avatar && (
                      <button className="btn btn--sm btn--danger" onClick={() => {
                        const updated = { ...profile, avatar: null };
                        setProfile(updated);
                        saveProfile(updated);
                      }}>Remover</button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Atributos */}
          <section className="op-section">
            <div className="op-section__header">
              <span className="op-section__title">ATRIBUTOS COSMÉTICOS</span>
              {!editing && <span className="op-section__hint">Modifique editando a bio</span>}
            </div>
            <div className="op-attrs">
              {p.attributes.map((attr, idx) => (
                <div key={attr.key} className="op-attr">
                  <span className="op-attr__label">{attr.label}</span>
                  {editing ? (
                    <input type="number" min={0} max={10} className="op-attr__num-input" value={attr.value} onChange={(e) => updateAttr(idx, e.target.value)} />
                  ) : null}
                  <div className="op-attr__track">
                    <div className="op-attr__fill" style={{ width: (attr.value / 10 * 100) + '%' }} />
                  </div>
                  {!editing && <span className="op-attr__val">{attr.value}/10</span>}
                </div>
              ))}
            </div>
          </section>

          {/* Missões */}
          <section className="op-section">
            <div className="op-section__header">
              <span className="op-section__title">MISSÕES ATIVAS</span>
              <div className="op-sort-toggle">
                <button className={`op-sort-btn${missionSort === 'prazo' ? ' active' : ''}`} onClick={() => setMissionSort('prazo')}>prazo</button>
                <button className={`op-sort-btn${missionSort === 'tipo' ? ' active' : ''}`} onClick={() => setMissionSort('tipo')}>tipo</button>
              </div>
            </div>
            <div className="op-mission-list">
              {sortedActive().length === 0 && sortedBlocked().length === 0 && stats.secondary.length === 0 && (
                <div className="op-empty">Nenhuma missão em andamento.</div>
              )}
              {sortedActive().map(({ card, colId }) => (
                <div key={card.id} className="op-mission op-mission--active">
                  <MaterialIcon name="bolt" size={16} className="op-mission__icon-svg" />
                  <div className="op-mission__body">
                    <span className="op-mission__title">{card.title || 'sem título'}</span>
                    <span className="op-mission__meta">
                      {board?.columns[colId]?.title}{card.dueDate && <> · {daysLabel(card.dueDate)}</>}
                    </span>
                  </div>
                </div>
              ))}
              {sortedBlocked().map(({ card, colId }) => {
                const overdue = isOverdue(card.dueDate);
                return (
                  <div key={card.id} className={`op-mission op-mission--blocked${overdue ? ' op-mission--overdue' : ''}`}>
                    <MaterialIcon name={overdue ? 'warning' : 'hourglass_top'} size={16} className="op-mission__icon-svg" />
                    <div className="op-mission__body">
                      <span className="op-mission__title">{card.title || 'sem título'}</span>
                      <span className="op-mission__meta">
                        {board?.columns[colId]?.title}
                        {card.dueDate && <> · {formatDate(card.dueDate)}</>}
                        {overdue && <span className="op-mission__overdue-tag"> ATRASADO</span>}
                      </span>
                    </div>
                    <span className="op-mission__tag">{overdue ? '!!' : '!'}</span>
                  </div>
                );
              })}
              {stats.secondary.map((card) => (
                <div key={card.id} className="op-mission op-mission--secondary">
                  <MaterialIcon name="checklist" size={16} className="op-mission__icon-svg" />
                  <div className="op-mission__body">
                    <span className="op-mission__title">{card.title || 'sem título'}</span>
                    <span className="op-mission__meta">
                      Feature pendente
                      {card.checklist?.length > 0 && <> · {card.checklist.filter((i) => i.done).length}/{card.checklist.length} itens</>}
                    </span>
                    {card.checklist?.length > 0 && (
                      <div className="op-checklist">
                        {card.checklist.map((item) => (
                          <label key={item.id} className="op-checklist__item">
                            <input
                              type="checkbox"
                              checked={item.done}
                              onChange={() => {
                                if (!onPatchCard) return;
                                const newChecklist = card.checklist.map((ci) =>
                                  ci.id === item.id ? { ...ci, done: !ci.done } : ci
                                );
                                onPatchCard({ ...card, checklist: newChecklist });
                              }}
                            />
                            <span className={item.done ? 'op-checklist__text--done' : ''}>{item.text}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="op-mission__tag">~</span>
                </div>
              ))}
            </div>
          </section>

          {/* Conquistas */}
          {stats.achievements.length > 0 && (
            <section className="op-section">
              <div className="op-section__header">
                <span className="op-section__title">CONQUISTAS RECENTES</span>
              </div>
              <div className="op-achievements">
                {stats.achievements.map((card) => (
                  <div key={card.id} className="op-achievement">
                    <MaterialIcon name="military_tech" size={16} />
                    <span className="op-achievement__title">{card.title || 'sem título'}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="modal__footer">
          {editing ? (
            <>
              <button className="btn btn--sm" onClick={cancelEdit}>
                Cancelar
              </button>
              <button className="btn btn--primary btn--sm" onClick={saveEdit}>
                Salvar
              </button>
            </>
          ) : (
            <button className="btn btn--sm" onClick={onClose}>
              <MaterialIcon name="arrow_back" size={14} />
              Voltar ao board
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

