'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { OWNER_LABELS, formatCardLocation, normalizeCard } from '@/lib/initialData';
import { formatDate } from '@/lib/date';
import { MaterialIcon } from '@/lib/icons';

function uid() {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function formatLogDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/* -------- ListEditor -------- */
function ListEditor({ label, icon, items, onChange }) {
  function updateText(id, text) {
    onChange(items.map((i) => (i.id === id ? { ...i, text } : i)));
  }
  function toggleDone(id) {
    onChange(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }
  function remove(id) {
    onChange(items.filter((i) => i.id !== id));
  }
  function add() {
    onChange([...items, { id: uid(), text: '', done: false }]);
  }

  return (
    <div className="field">
      <span className="field__label field__label--icon">
        {icon && <MaterialIcon name={icon} size={14} />}
        {label}
      </span>
      <div className="list-editor">
        {items.map((item) => (
          <div key={item.id} className={`list-editor__item${item.done ? ' done' : ''}`}>
            <input type="checkbox" checked={item.done} onChange={() => toggleDone(item.id)} />
            <input
              type="text"
              value={item.text}
              placeholder="item…"
              onChange={(e) => updateText(item.id, e.target.value)}
            />
            <button className="icon-btn" onClick={() => remove(item.id)} title="Remover">
              <MaterialIcon name="close" size={14} />
            </button>
          </div>
        ))}
        <button className="list-editor__add" onClick={add}>+ item</button>
      </div>
    </div>
  );
}

function ListView({ label, icon, items }) {
  if (!items?.length) return null;
  return (
    <div className="field">
      <span className="field__label field__label--icon">
        {icon && <MaterialIcon name={icon} size={14} />}
        {label}
      </span>
      <ul className="list-view-readonly">
        {items.filter((i) => i.text?.trim()).map((item) => (
          <li key={item.id} className={item.done ? 'done' : ''}>
            <MaterialIcon name={item.done ? 'check' : 'checklist'} size={12} />
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChecklistViewInteractive({ label, icon, items, onChange }) {
  const visible = (items || []).filter((i) => i.text?.trim());
  if (!visible.length) return null;

  function toggle(id) {
    onChange(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }

  return (
    <div className="field">
      <span className="field__label field__label--icon">
        {icon && <MaterialIcon name={icon} size={14} />}
        {label}
      </span>
      <ul className="list-view-readonly list-view-interactive">
        {visible.map((item) => (
          <li key={item.id} className={item.done ? 'done' : ''}>
            <input type="checkbox" checked={!!item.done} onChange={() => toggle(item.id)} />
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------- EmailsEditor -------- */
function EmailsEditor({ emails, onChange }) {
  const [copied, setCopied] = useState(false);

  function updateEmail(idx, value) {
    const next = [...emails];
    next[idx] = value;
    onChange(next);
  }
  function removeEmail(idx) {
    onChange(emails.filter((_, i) => i !== idx));
  }
  function addEmail() {
    onChange([...emails, '']);
  }
  function copyAll() {
    const valid = emails.filter((e) => e.trim());
    if (!valid.length) return;
    navigator.clipboard.writeText(valid.join(', ')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="field">
      <span className="field__label">E-mails</span>
      <div className="emails-editor">
        {emails.map((email, idx) => (
          <div key={idx} className="emails-editor__item">
            <input
              type="text"
              value={email}
              placeholder="email@exemplo.com"
              onChange={(e) => updateEmail(idx, e.target.value)}
            />
            <button className="icon-btn" onClick={() => removeEmail(idx)} title="Remover">
              <MaterialIcon name="close" size={14} />
            </button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="list-editor__add" onClick={addEmail}>+ e-mail</button>
          {emails.some((e) => e.trim()) && (
            <button
              className={`emails-copy-btn${copied ? ' copied' : ''}`}
              onClick={copyAll}
              title="Copiar todos os e-mails separados por vírgula"
            >
              <MaterialIcon name={copied ? 'check' : 'content_copy'} size={14} />
              {copied ? 'Copiado!' : 'Copiar todos'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EmailsView({ emails }) {
  const valid = (emails || []).filter((e) => e.trim());
  if (!valid.length) return null;
  return (
    <div className="field">
      <span className="field__label">E-mails</span>
      <div className="field__value">{valid.join(', ')}</div>
    </div>
  );
}

/* -------- Cidade + Estado -------- */
function LocationFields({ city, state, onCityChange, onStateChange }) {
  const [query, setQuery] = useState(city || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const cacheRef = useRef(null);
  const timerRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => { setQuery(city || ''); }, [city]);

  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function fetchCidades(q) {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    setOpen(true);
    try {
      if (!cacheRef.current) {
        const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome');
        const data = await res.json();
        cacheRef.current = data.map((m) => ({
          label: `${m.nome} – ${m.microrregiao.mesorregiao.UF.sigla}`,
          nome: m.nome,
          uf: m.microrregiao.mesorregiao.UF.sigla,
        }));
      }
      const lower = q.toLowerCase();
      setResults(cacheRef.current.filter((m) => m.nome.toLowerCase().startsWith(lower)).slice(0, 30));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleInput(e) {
    const q = e.target.value;
    setQuery(q);
    onCityChange(q);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchCidades(q), 250);
  }

  function handleSelect(item) {
    setQuery(item.nome);
    onCityChange(item.nome);
    onStateChange(item.uf);
    setOpen(false);
    setResults([]);
  }

  return (
    <div className="two-col">
      <div className="field">
        <span className="field__label">Cidade</span>
        <div className="city-picker" ref={wrapRef}>
          <input
            className="city-picker__input"
            type="text"
            value={query}
            onChange={handleInput}
            onFocus={() => { if (query.length >= 2) setOpen(true); }}
            placeholder="Digite a cidade…"
            autoComplete="off"
          />
          {open && (
            <div className="city-picker__dropdown">
              {loading && <div className="city-picker__loading">Carregando…</div>}
              {!loading && results.length === 0 && query.length >= 2 && (
                <div className="city-picker__empty">Nenhuma cidade encontrada</div>
              )}
              {results.map((r) => (
                <div key={r.label} className="city-picker__option" onMouseDown={() => handleSelect(r)}>
                  {r.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="modal-state">Estado (UF)</label>
        <input
          id="modal-state"
          type="text"
          value={state || ''}
          maxLength={2}
          placeholder="SP"
          onChange={(e) => onStateChange(e.target.value.toUpperCase().slice(0, 2))}
        />
      </div>
    </div>
  );
}

function TagsEditor({ tags, onChange }) {
  function setTag(key, value) {
    onChange({ ...tags, [key]: value });
  }

  return (
    <div className="field">
      <span className="field__label">Tags especiais</span>
      <label className="checkbox-row checkbox-row--icon">
        <input type="checkbox" checked={!!tags?.totemPrevio} onChange={(e) => setTag('totemPrevio', e.target.checked)} />
        <MaterialIcon name="contrast" size={14} />
        Totem prévio ativo
      </label>
      <label className="checkbox-row checkbox-row--icon">
        <input type="checkbox" checked={!!tags?.salaInstalada} onChange={(e) => setTag('salaInstalada', e.target.checked)} />
        <MaterialIcon name="brick" size={14} />
        Sala já instalada
      </label>
      <label className="checkbox-row checkbox-row--icon">
        <input type="checkbox" checked={!!tags?.telaCliente} onChange={(e) => setTag('telaCliente', e.target.checked)} />
        <MaterialIcon name="monitor" size={14} />
        Tela do cliente
      </label>
    </div>
  );
}

function TagsView({ tags }) {
  const active = [
    tags?.totemPrevio && { icon: 'contrast', label: 'Totem prévio ativo' },
    tags?.salaInstalada && { icon: 'brick', label: 'Sala já instalada' },
    tags?.telaCliente && { icon: 'monitor', label: 'Tela do cliente' },
  ].filter(Boolean);

  if (!active.length) return null;

  return (
    <div className="field">
      <span className="field__label">Tags especiais</span>
      <div className="tags-view">
        {active.map((t) => (
          <span key={t.label} className="tag tag--totem tag--totem-icon">
            <MaterialIcon name={t.icon} size={12} />
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* -------- Move card modal -------- */
function MoveCardModal({ columns, currentColId, onConfirm, onClose }) {
  const [selected, setSelected] = useState(currentColId);

  return (
    <div className="modal-overlay modal-overlay--nested" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--sm" role="dialog" aria-label="Mover card para">
        <div className="modal__header">
          <span className="modal__header-label">Mover card para:</span>
          <button className="icon-btn" onClick={onClose} title="Cancelar">
            <MaterialIcon name="close" size={18} />
          </button>
        </div>
        <div className="modal__body move-col-list">
          {columns.map((col) => (
            <label key={col.id} className={`move-col-option${selected === col.id ? ' selected' : ''}`}>
              <input
                type="radio"
                name="move-col"
                value={col.id}
                checked={selected === col.id}
                onChange={() => setSelected(col.id)}
              />
              {col.title}
            </label>
          ))}
        </div>
        <div className="modal__footer">
          <button className="btn btn--sm" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn--primary btn--sm"
            disabled={selected === currentColId}
            onClick={() => onConfirm(selected)}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------- Contact log modals -------- */
function ContactLogCreateModal({ onSave, onClose }) {
  const [date, setDate] = useState(todayISO());
  const [comment, setComment] = useState('');

  return (
    <div className="modal-overlay modal-overlay--nested" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--sm" role="dialog" aria-label="Criar log de contatos">
        <div className="modal__header">
          <span className="modal__header-label">Log de contatos</span>
          <button className="icon-btn" onClick={onClose} title="Cancelar">
            <MaterialIcon name="close" size={18} />
          </button>
        </div>
        <div className="modal__body">
          <div className="field">
            <label className="field__label" htmlFor="log-date">Data</label>
            <input id="log-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="log-comment">Comentário</label>
            <textarea
              id="log-comment"
              placeholder="Descreva a interação…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <div className="modal__footer modal__footer--end">
          <button className="btn btn--primary btn--sm" onClick={() => onSave({ id: uid(), date, comment })}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactLogReadModal({ log, onClose }) {
  return (
    <div className="modal-overlay modal-overlay--nested" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--sm" role="dialog" aria-label="Comentário do log">
        <div className="modal__header">
          <span className="modal__header-label">{formatLogDate(log.date)}</span>
          <button className="icon-btn" onClick={onClose} title="Fechar">
            <MaterialIcon name="close" size={18} />
          </button>
        </div>
        <div className="modal__body">
          <p className="contact-log__comment">{log.comment || '(sem comentário)'}</p>
        </div>
        <div className="modal__footer modal__footer--end">
          <button className="btn btn--sm" onClick={onClose}>
            <MaterialIcon name="arrow_back" size={14} />
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactLogSection({ logs, isEditing, onAdd, onRemove, onRead }) {
  const sorted = [...(logs || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <div className="contact-log-section">
      <div className="contact-log-section__header">
        <span className="field__label">Log de contatos</span>
        <button className="btn btn--sm contact-log__create" onClick={onAdd} type="button">
          <MaterialIcon name="whatsapp" size={14} />
          Criar log de contatos
        </button>
      </div>
      {sorted.length === 0 ? (
        <p className="contact-log__empty">Nenhum registro ainda.</p>
      ) : (
        <ol className="contact-log__list">
          {sorted.map((log, idx) => (
            <li key={log.id} className="contact-log__item">
              <span className="contact-log__index">{idx + 1}.</span>
              <span className="contact-log__date">{formatLogDate(log.date)}</span>
              {log.comment?.trim() && (
                <button
                  className="icon-btn contact-log__comment-btn"
                  onClick={() => onRead(log)}
                  title="Ver comentário"
                  type="button"
                >
                  <MaterialIcon name="comment" size={14} />
                </button>
              )}
              {isEditing && (
                <button
                  className="icon-btn contact-log__remove"
                  onClick={() => onRemove(log.id)}
                  title="Remover registro"
                  type="button"
                >
                  <MaterialIcon name="close" size={14} />
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* -------- Modal principal -------- */
export default function CardModal({
  card,
  columnId,
  columnTitle,
  columns = [],
  initialMode = 'view',
  isArchivedView = false,
  onClose,
  onSave,
  onPatch,
  onArchive,
  onUnarchive,
  onDelete,
  onMoveCard,
  onColumnChange,
}) {
  const [mode, setMode] = useState(initialMode);
  const [draft, setDraft] = useState(() => normalizeCard({
    clientName: '',
    emails: [],
    city: '',
    state: '',
    contactLogs: [],
    ...card,
  }));
  const [showLogCreate, setShowLogCreate] = useState(false);
  const [readLog, setReadLog] = useState(null);
  const [showMove, setShowMove] = useState(false);

  const isView = mode === 'view';
  const canPatch = isView && !!onPatch && !isArchivedView;

  useEffect(() => {
    setMode(initialMode);
    setDraft(normalizeCard({
      clientName: '',
      emails: [],
      city: '',
      state: '',
      contactLogs: [],
      ...card,
    }));
  }, [card.id, initialMode]);

  const saveAndClose = useCallback(() => {
    const next = normalizeCard({
      ...draft,
      cityState: formatCardLocation(draft),
    });
    onSave(next);
  }, [draft, onSave]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape' && !showLogCreate && !readLog && !showMove) {
        e.stopPropagation();
        if (isView) onClose();
        else setMode('view');
      }
    }
    document.addEventListener('keydown', handleKey, true);
    return () => document.removeEventListener('keydown', handleKey, true);
  }, [isView, onClose, showLogCreate, readLog, showMove]);

  function set(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  function patch(next) {
    const normalized = normalizeCard({ ...next, cityState: formatCardLocation(next) });
    setDraft(normalized);
    onPatch?.(normalized);
  }

  function handleOverlayClick(e) {
    if (e.target !== e.currentTarget) return;
    if (isView) onClose();
    else setMode('view');
  }

  function addContactLog(log) {
    const next = normalizeCard({ ...draft, contactLogs: [...(draft.contactLogs || []), log] });
    setDraft(next);
    setShowLogCreate(false);
    if (isView) onPatch?.(next);
  }

  function removeContactLog(logId) {
    set('contactLogs', (draft.contactLogs || []).filter((l) => l.id !== logId));
  }

  function handleMoveConfirm(toColId) {
    if (onMoveCard && columnId && toColId !== columnId) {
      onMoveCard(draft.id, columnId, toColId);
      onColumnChange?.(toColId);
    }
    setShowMove(false);
  }

  const location = formatCardLocation(draft);

  return (
    <>
      <div className="modal-overlay" onClick={handleOverlayClick}>
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-label={isView ? 'Visualizar card' : 'Editar card'}
        >
          <div className="modal__header">
            {onMoveCard && columnId && !isArchivedView ? (
              <button
                type="button"
                className="modal__header-label modal__header-label--clickable"
                onClick={() => setShowMove(true)}
                title="Mover card para outra coluna"
              >
                {columnTitle}
                <MaterialIcon name="chevron_right" size={14} />
              </button>
            ) : (
              <span className="modal__header-label">{columnTitle}</span>
            )}
            <div className="modal__header-actions">
              {isView && onArchive && !isArchivedView && (
                <button className="icon-btn" onClick={() => onArchive()} title="Arquivar card">
                  <MaterialIcon name="archive" size={18} />
                </button>
              )}
              <button
                className="icon-btn"
                onClick={isView ? onClose : () => setMode('view')}
                title={isView ? 'Fechar' : 'Voltar à visualização'}
              >
                <MaterialIcon name={isView ? 'close' : 'arrow_back'} size={18} />
              </button>
            </div>
          </div>

          <div className="modal__body">
            {isView ? (
              <>
                <h2 className="modal__title-readonly">{draft.title || 'sem título'}</h2>
                <hr className="section-divider" />

                <div className="two-col">
                  {draft.clientName && (
                    <div className="field">
                      <span className="field__label">Cliente Responsável</span>
                      <div className="field__value">{draft.clientName}</div>
                    </div>
                  )}
                  <div className="field">
                    <span className="field__label">Prazo</span>
                    {canPatch ? (
                      <input
                        type="date"
                        value={draft.dueDate || ''}
                        onChange={(e) => patch({ ...draft, dueDate: e.target.value || null })}
                      />
                    ) : (
                      <div className="field__value">{draft.dueDate ? formatDate(draft.dueDate) : '—'}</div>
                    )}
                  </div>
                </div>

                <EmailsView emails={draft.emails} />

                {location && (
                  <div className="field">
                    <span className="field__label field__label--icon">
                      <MaterialIcon name="location_on" size={14} />
                      Local
                    </span>
                    <div className="field__value">{location}</div>
                  </div>
                )}

                <div className="field">
                  <span className="field__label">Responsável da etapa</span>
                  <div className="field__value">{OWNER_LABELS[draft.owner]?.text || draft.owner}</div>
                </div>

                {draft.notes?.trim() && (
                  <div className="field">
                    <span className="field__label">Notas</span>
                    <div className="field__value field__value--pre">{draft.notes}</div>
                  </div>
                )}

                <ListView label="Ajustes feitos" icon="check_circle" items={draft.doneItems} />
                <ListView label="Ajustes pendentes" icon="hourglass_empty" items={draft.pendingItems} />
                {canPatch ? (
                  <ChecklistViewInteractive
                    label="Checklist de features"
                    icon="checklist"
                    items={draft.checklist}
                    onChange={(v) => patch({ ...draft, checklist: v })}
                  />
                ) : (
                  <ListView label="Checklist de features" icon="checklist" items={draft.checklist} />
                )}

                <TagsView tags={draft.tags} />

                <hr className="section-divider" />
                <ContactLogSection
                  logs={draft.contactLogs}
                  isEditing={false}
                  onAdd={() => setShowLogCreate(true)}
                  onRemove={removeContactLog}
                  onRead={setReadLog}
                />
              </>
            ) : (
              <>
                <div className="field">
                  <input
                    className="title-input"
                    type="text"
                    placeholder="Nome do projeto / cliente"
                    value={draft.title}
                    onChange={(e) => set('title', e.target.value)}
                    autoFocus
                  />
                </div>

                <hr className="section-divider" />

                <div className="two-col">
                  <div className="field">
                    <label className="field__label" htmlFor="modal-client-name">Cliente Responsável</label>
                    <input
                      id="modal-client-name"
                      type="text"
                      value={draft.clientName || ''}
                      onChange={(e) => set('clientName', e.target.value)}
                      placeholder="Nome do responsável…"
                    />
                  </div>
                  <div className="field">
                    <label className="field__label" htmlFor="modal-due">Prazo</label>
                    <input
                      id="modal-due"
                      type="date"
                      value={draft.dueDate || ''}
                      onChange={(e) => set('dueDate', e.target.value || null)}
                    />
                  </div>
                </div>

                <EmailsEditor emails={draft.emails || []} onChange={(v) => set('emails', v)} />
                <LocationFields
                  city={draft.city || ''}
                  state={draft.state || ''}
                  onCityChange={(v) => set('city', v)}
                  onStateChange={(v) => set('state', v)}
                />

                <hr className="section-divider" />

                <div className="field">
                  <span className="field__label">Responsável da etapa</span>
                  <div className="owner-select-row">
                    {Object.entries(OWNER_LABELS).map(([key, { text }]) => (
                      <button
                        key={key}
                        className={`owner-option${draft.owner === key ? ' selected' : ''}`}
                        onClick={() => set('owner', key)}
                        type="button"
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="section-divider" />

                <div className="field">
                  <label className="field__label">Notas</label>
                  <textarea
                    placeholder="Descrição, contexto, observações…"
                    value={draft.notes}
                    onChange={(e) => set('notes', e.target.value)}
                  />
                </div>

                <ListEditor label="Ajustes feitos" icon="check_circle" items={draft.doneItems} onChange={(v) => set('doneItems', v)} />
                <ListEditor label="Ajustes pendentes" icon="hourglass_empty" items={draft.pendingItems} onChange={(v) => set('pendingItems', v)} />
                <ListEditor label="Checklist de features" icon="checklist" items={draft.checklist} onChange={(v) => set('checklist', v)} />

                <hr className="section-divider" />
                <TagsEditor tags={draft.tags} onChange={(v) => set('tags', v)} />

                <hr className="section-divider" />
                <ContactLogSection
                  logs={draft.contactLogs}
                  isEditing
                  onAdd={() => setShowLogCreate(true)}
                  onRemove={removeContactLog}
                  onRead={setReadLog}
                />
              </>
            )}
          </div>

          <div className="modal__footer">
            {isView ? (
              <>
                <button className="btn btn--sm" onClick={onClose}>
                  <MaterialIcon name="arrow_back" size={14} />
                  Voltar
                </button>
                <div className="modal__footer-actions">
                  {isArchivedView && onUnarchive && (
                    <button className="btn btn--sm" onClick={onUnarchive}>
                      <MaterialIcon name="unarchive" size={14} />
                      Desarquivar
                    </button>
                  )}
                  {isArchivedView && (
                    <button className="btn btn--danger btn--sm" onClick={onDelete}>
                      <MaterialIcon name="delete" size={14} />
                      Excluir
                    </button>
                  )}
                  {!isArchivedView && (
                    <button className="btn btn--primary btn--sm" onClick={() => setMode('edit')}>
                      <MaterialIcon name="edit" size={14} />
                      Editar
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <button className="btn btn--sm" onClick={() => { setDraft(normalizeCard(card)); setMode('view'); }}>
                  <MaterialIcon name="arrow_back" size={14} />
                  Voltar
                </button>
                <button className="btn btn--primary btn--sm" onClick={saveAndClose}>
                  Salvar
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showMove && (
        <MoveCardModal
          columns={columns}
          currentColId={columnId}
          onConfirm={handleMoveConfirm}
          onClose={() => setShowMove(false)}
        />
      )}
      {showLogCreate && (
        <ContactLogCreateModal onSave={addContactLog} onClose={() => setShowLogCreate(false)} />
      )}
      {readLog && (
        <ContactLogReadModal log={readLog} onClose={() => setReadLog(null)} />
      )}
    </>
  );
}
