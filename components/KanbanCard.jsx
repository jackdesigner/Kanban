'use client';

import { dueStatus, formatDate, daysLabel } from '@/lib/date';
import { OWNER_LABELS } from '@/lib/initialData';
import { MaterialIcon } from '@/lib/icons';

export default function KanbanCard({ card, onClick, onArchive }) {
  const checklist = card.checklist || [];
  const checkDone = checklist.filter((i) => i.done).length;
  const checkTotal = checklist.length;
  const checkPct = checkTotal > 0 ? Math.round((checkDone / checkTotal) * 100) : 0;

  const status = dueStatus(card.dueDate);
  const ownerKey = card.owner || 'eu';
  const ownerLabel = OWNER_LABELS[ownerKey];
  const firstName = card.clientName ? card.clientName.trim().split(/\s+/)[0] : '';

  function handleArchive(e) {
    e.stopPropagation();
    onArchive?.();
  }

  return (
    <div
      className="card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="card__title-row">
        <div className={`card__title${!card.title ? ' is-empty' : ''}`}>
          {card.title || 'sem título'}
        </div>
        <div className="card__title-actions">
          {firstName && (
            <span className="card__client-name" title={card.clientName}>
              {firstName}
            </span>
          )}
          {onArchive && (
            <button
              className="icon-btn card__archive-btn"
              onClick={handleArchive}
              title="Arquivar card"
              type="button"
            >
              <MaterialIcon name="archive" size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="card__meta">
        <span className={`tag tag--owner-${ownerKey}`}>
          {ownerLabel?.short || ownerKey}
        </span>

        {card.tags?.totemPrevio && (
          <span className="tag tag--totem tag--totem-icon">
            <MaterialIcon name="contrast" size={10} />
            totem
          </span>
        )}

        {card.dueDate && (
          <span className={`tag tag--due status-${status}`}>
            {status === 'soon' || status === 'overdue' ? (
              <MaterialIcon name="warning" size={10} />
            ) : null}
            {formatDate(card.dueDate)} · {daysLabel(card.dueDate)}
          </span>
        )}

        {card.cityState && (
          <span className="tag tag--location" title={card.cityState}>
            <MaterialIcon name="location_on" size={10} />
            {card.cityState}
          </span>
        )}
      </div>

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
