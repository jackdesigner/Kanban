'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { OWNER_LABELS } from '@/lib/initialData';

/* -------- helpers -------- */
function uid() {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/* -------- ListEditor -------- */
function ListEditor({ label, items, onChange }) {
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
      <span className="field__label">{label}</span>
      <div className="list-editor">
        {items.map((item) => (
          <div key={item.id} className={`list-editor__item${item.done ? ' done' : ''}`}>
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => toggleDone(item.id)}
            />
            <input
              type="text"
              value={item.text}
              placeholder="item…"
              onChange={(e) => updateText(item.id, e.target.value)}
            />
            <button className="icon-btn" onClick={() => remove(item.id)} title="Remover">×</button>
          </div>
        ))}
        <button className="list-editor__add" onClick={add}>+ item</button>
      </div>
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
            <button className="icon-btn" onClick={() => removeEmail(idx)} title="Remover">×</button>
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
              {copied ? '✓ Copiado!' : '⎘ Copiar todos'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------- CidadeEstadoPicker -------- */
function CidadeEstadoPicker({ value, onChange }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const cacheRef = useRef(null);
  const timerRef = useRef(null);
  const wrapRef = useRef(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function fetchCidades(q) {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    setOpen(true);
    try {
      // Carrega todos na primeira vez e cacheia
      if (!cacheRef.current) {
        const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome');
        const data = await res.json();
        cacheRef.current = data.map((m) => ({
          label: `${m.nome} – ${m.microrregiao.mesorregiao.UF.sigla}`,
          nome: m.nome,
        }));
      }
      const lower = q.toLowerCase();
      const filtered = cacheRef.current
        .filter((m) => m.nome.toLowerCase().startsWith(lower))
        .slice(0, 30);
      setResults(filtered);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleInput(e) {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchCidades(q), 250);
  }

  function handleSelect(label) {
    setQuery(label);
    onChange(label);
    setOpen(false);
    setResults([]);
  }

  function handleBlur() {
    // Se o usuário digitou algo diferente do valor salvo, salva o que está escrito
    if (query !== value) onChange(query);
  }

  return (
    <div className="field">
      <span className="field__label">Cidade / Estado</span>
      <div className="city-picker" ref={wrapRef}>
        <input
          className="city-picker__input"
          type="text"
          value={query}
          onChange={handleInput}
          onBlur={handleBlur}
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
              <div
                key={r.label}
                className="city-picker__option"
                onMouseDown={() => handleSelect(r.label)}
              >
                {r.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------- Modal principal -------- */
export default function CardModal({ card, columnTitle, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState({
    clientName: '',
    emails: [],
    cityState: '',
    ...card,
  });

  // Salvar e fechar — sempre salva o draft atual
  const saveAndClose = useCallback(() => {
    onSave(draft);
  }, [draft, onSave]);

  // ESC fecha e salva
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        saveAndClose();
      }
    }
    document.addEventListener('keydown', handleKey, true);
    return () => document.removeEventListener('keydown', handleKey, true);
  }, [saveAndClose]);

  function set(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  function setTag(key, value) {
    setDraft((d) => ({ ...d, tags: { ...d.tags, [key]: value } }));
  }

  // Clique no overlay → salva e fecha
  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) saveAndClose();
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Editar card">

        {/* Header */}
        <div className="modal__header">
          <span className="modal__header-label">{columnTitle}</span>
          <button className="icon-btn" onClick={saveAndClose} title="Fechar (salva automaticamente)">×</button>
        </div>

        {/* Body */}
        <div className="modal__body">

          {/* Título */}
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

          {/* Responsável (cliente) + Cidade/Estado */}
          <div className="two-col">
            <div className="field">
              <label className="field__label" htmlFor="modal-client-name">Responsável</label>
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

          {/* E-mails */}
          <EmailsEditor
            emails={draft.emails || []}
            onChange={(v) => set('emails', v)}
          />

          {/* Cidade / Estado */}
          <CidadeEstadoPicker
            value={draft.cityState || ''}
            onChange={(v) => set('cityState', v)}
          />

          <hr className="section-divider" />

          {/* Owner */}
          <div className="field">
            <span className="field__label">Etapa / Responsável</span>
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

          {/* Notas */}
          <div className="field">
            <label className="field__label">Notas</label>
            <textarea
              placeholder="Descrição, contexto, observações…"
              value={draft.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>

          {/* Ajustes feitos */}
          <ListEditor
            label="✅ Ajustes feitos"
            items={draft.doneItems}
            onChange={(v) => set('doneItems', v)}
          />

          {/* Ajustes pendentes */}
          <ListEditor
            label="⏳ Ajustes pendentes"
            items={draft.pendingItems}
            onChange={(v) => set('pendingItems', v)}
          />

          {/* Checklist de features */}
          <ListEditor
            label="☐ Checklist de features"
            items={draft.checklist}
            onChange={(v) => set('checklist', v)}
          />

          <hr className="section-divider" />

          {/* Tags especiais */}
          <div className="field">
            <span className="field__label">Tags especiais</span>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={!!draft.tags?.totemPrevio}
                onChange={(e) => setTag('totemPrevio', e.target.checked)}
              />
              ◐ Totem prévio ativo
            </label>
          </div>

        </div>

        {/* Footer */}
        <div className="modal__footer">
          <button className="btn btn--danger btn--sm" onClick={onDelete}>
            Excluir card
          </button>
          <button className="btn btn--primary btn--sm" onClick={saveAndClose}>
            Salvar e fechar
          </button>
        </div>

      </div>
    </div>
  );
}
