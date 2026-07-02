'use client';

import { useState } from 'react';
import { createCard } from '@/lib/initialData';
import { MaterialIcon } from '@/lib/icons';
import CardModal from './CardModal';
import KanbanCard from './KanbanCard';
import { Draggable, Droppable } from '@hello-pangea/dnd';

const OWNER_ICONS = { eu: 'person', cliente: 'person_outline', interno: 'groups' };

export default function KanbanColumn({
  column,
  cards,
  allCards,
  onAddCard,
  onUpdateCard,
  onArchiveCard,
}) {
  const [openCardId, setOpenCardId] = useState(null);
  const [modalMode, setModalMode] = useState('view');
  const droppableId = column.id;
  const cardPool = allCards || cards;
  const openCard = openCardId ? cardPool.find((c) => c.id === openCardId) : null;

  function handleAdd() {
    const card = createCard({ owner: column.owner });
    onAddCard(column.id, card);
    setModalMode('edit');
    setOpenCardId(card.id);
  }

  function openCardView(cardId) {
    setModalMode('view');
    setOpenCardId(cardId);
  }

  function handlePatch(updated) {
    onUpdateCard(updated);
  }

  function handleSave(updated) {
    onUpdateCard(updated);
    setOpenCardId(null);
  }

  function handleArchive(cardId) {
    onArchiveCard(column.id, cardId);
    if (openCardId === cardId) setOpenCardId(null);
  }

  return (
    <div className="column">
      <div className="column__header">
        <div className="column__title-row">
          <span className="column__title">{column.title}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {column.hint && (
              <span className="column__info" aria-label={column.hint}>
                <MaterialIcon name="info" size={14} className="column__info-icon" />
                <span className="column__info-tooltip">{column.hint}</span>
              </span>
            )}
            <span className="column__count">{cards.length}</span>
          </div>
        </div>
        <div className="column__owner">
          <MaterialIcon name={OWNER_ICONS[column.owner] || 'person'} size={12} />
          <span>{column.owner}</span>
          {column.waitsOn && (
            <span title="Aguardando resposta — due date recomendado">
              · <MaterialIcon name="schedule" size={12} />
            </span>
          )}
        </div>
      </div>

      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`column__body${snapshot.isDraggingOver ? ' is-dragging-over' : ''}`}
          >
            {cards.map((card, index) => (
              <Draggable key={card.id} draggableId={card.id} index={index}>
                {(drag, dragSnapshot) => (
                  <div
                    ref={drag.innerRef}
                    {...drag.draggableProps}
                    {...drag.dragHandleProps}
                    className={dragSnapshot.isDragging ? 'is-dragging' : ''}
                  >
                    <KanbanCard
                      card={card}
                      onClick={() => openCardView(card.id)}
                      onArchive={() => handleArchive(card.id)}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            <button className="column__add" onClick={handleAdd}>
              + novo card
            </button>
          </div>
        )}
      </Droppable>

      {openCard && (
        <CardModal
          card={openCard}
          columnTitle={column.title}
          initialMode={modalMode}
          onClose={() => setOpenCardId(null)}
          onSave={handleSave}
          onPatch={handlePatch}
          onArchive={() => handleArchive(openCard.id)}
        />
      )}
    </div>
  );
}
