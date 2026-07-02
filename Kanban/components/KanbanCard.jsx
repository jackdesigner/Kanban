'use client';

import { dueStatus, formatDate, daysLabel } from '@/lib/date';
import { OWNER_LABELS } from '@/lib/initialData';

export default function KanbanCard({ card, onClick }) {
  const checklist = card.checklist || [];
  const checkDone = checklist.filter((i) => i.done).length;
  const checkTotal = checklist.length;
  const checkPct = checkTotal > 0 ? Math.round((checkDone / checkTotal) * 100) : 0;

  const status = dueStatus(card.dueDate);
  const ownerKey = card.owner || 'eu';
  const ownerLabel = OWNER_LABELS[ownerKey];

  // Primeiro nome do responsável/cliente
  const firstName = card.clientName ? card.clientName.trim().split(/\s+/)[0] : '';

  return (
    <div className="card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}>

      {/* Título + primeiro nome */}
      <div className="card__title-row">
        <div className={`card__title${!card.title ? ' is-empty' : ''}`}>
          {card.title || 'sem título'}
        </div>
        {firstName && (
          <span className="card__client-name" title={card.clientName}>
            {firstName}
          </span>
        )}
      </div>

      <div className="card__meta">
        {/* Owner tag */}
        <span className={`tag tag--owner-${ownerKey}`}>
          {ownerLabel?.short || ownerKey}
        </span>

        {/* Totem prévio */}
        {card.tags?.totemPrevio && (
          <span className="tag tag--totem">totem</span>
        )}

        {/* Due date */}
        {card.dueDate && (
          <span className={`tag tag--due status-${status}`}>
            {formatDate(card.dueDate)} · {daysLabel(card.dueDate)}
          </span>
        )}

        {/* Cidade/Estado */}
        {card.cityState && (
          <span className="tag" title={card.cityState}>
            📍 {card.cityState}
          </span>
        )}
      </div>

      {/* Checklist progress */}
      {checkTotal > 0 && (
        <div className="card__checklist-progress">
          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: `${checkPct}%` }} />
          </div>
          <span>{checkDone}/{checkTotal}</span>
        </div>
      )}
    </div>
  );
}
