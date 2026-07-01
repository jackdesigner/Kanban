'use client';

import { useState, useId } from 'react';
import { createCard } from '@/lib/initialData';
import CardModal from './CardModal';
import KanbanCard from './KanbanCard';
import { Draggable, Droppable } from '@hello-pangea/dnd';

const OWNER_ICONS = { eu: '●', cliente: '○', interno: '◈' };

export default function KanbanColumn({ column, cards, onAddCard, onUpdateCard, onDeleteCard }) {
  const [openCardId, setOpenCardId] = useState(null);
  const droppableId = column.id;
  const openCard = openCardId ? cards.find((c) => c.id === openCardId) : null;

  function handleAdd() {
    const card = createCard({ owner: column.owner });
    onAddCard(column.id, card);
    setOpenCardId(card.id);
  }

  return (
    <div className="column">
      {/* Header */}
      <div className="column__header">
        <div className="column__title-row">
          <span className="column__title">{column.title}</span>
          <span className="column__count">{cards.length}</span>
        </div>
        {column.hint && <div className="column__hint">{column.hint}</div>}
        <div className="column__owner">
          <span>{OWNER_ICONS[column.owner] || '●'}</span>
          <span>{column.owner}</span>
          {column.waitsOn && <span title="Aguardando resposta — due date recomendado">· ⏱</span>}
        </div>
      </div>

      {/* Droppable body */}
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
                    <KanbanCard card={card} onClick={() => setOpenCardId(card.id)} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add button */}
      <button className="column__add btn--ghost" onClick={handleAdd}>
        + novo card
      </button>

      {/* Modal */}
      {openCard && (
        <CardModal
          card={openCard}
          columnTitle={column.title}
          onClose={() => setOpenCardId(null)}
          onSave={(updated) => { onUpdateCard(updated); setOpenCardId(null); }}
          onDelete={() => { onDeleteCard(column.id, openCard.id); setOpenCardId(null); }}
        />
      )}
    </div>
  );
}
