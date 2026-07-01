'use client';

import { useState } from 'react';
import { OWNER_LABELS } from '@/lib/initialData';

/* -------- helpers -------- */
function uid() {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/* -------- sub-componentes -------- */
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

/* -------- Modal principal -------- */
export default function CardModal({ card, columnTitle, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState({ ...card });

  function set(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  function setTag(key, value) {
    setDraft((d) => ({ ...d, tags: { ...d.tags, [key]: value } }));
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Editar card">

        {/* Header */}
        <div className="modal__header">
          <span className="modal__header-label">
            {columnTitle}
          </span>
          <button className="icon-btn" onClick={onClose} title="Fechar">×</button>
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

          {/* Owner + Due date */}
          <div className="two-col">
            <div className="field">
              <span className="field__label">Responsável</span>
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

          <hr className="section-divider" />

          {/* Notas / descrição */}
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
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--sm" onClick={onClose}>Cancelar</button>
            <button className="btn btn--primary btn--sm" onClick={() => onSave(draft)}>
              Salvar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
