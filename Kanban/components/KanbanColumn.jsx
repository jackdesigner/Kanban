'use client';

import { useState } from 'react';
import { createCard } from '@/lib/initialData';
import CardModal from './CardModal';
import KanbanCard from './KanbanCard';
import { Draggable, Droppable } from '@hello-pangea/dnd';

const OWNER_ICONS = { eu: '●', cliente: '○', interno: '◈' };

export default function KanbanColumn({ column, cards, allCards, onAddCard, onUpdateCard, onDeleteCard }) {
  const [openCardId, setOpenCardId] = useState(null);
  const droppableId = column.id;
  // Usa allCards (não filtrado) para garantir que o modal abre mesmo com filtro ativo
  const cardPool = allCards || cards;
  const openCard = openCardId ? cardPool.find((c) => c.id === openCardId) : null;

  function handleAdd() {
    const card = createCard({ owner: column.owner });
    onAddCard(column.id, card);
    setOpenCardId(card.id);
  }

  function handleSave(updated) {
    onUpdateCard(updated);
    setOpenCardId(null);
  }

  function handleDelete() {
    onDeleteCard(column.id, openCard.id);
    setOpenCardId(null);
  }

  return (
    <div className="column">
      {/* Header */}
      <div className="column__header">
        <div className="column__title-row">
          <span className="column__title">{column.title}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Ícone ⓘ com tooltip — só aparece se há hint */}
            {column.hint && (
              <span className="column__info" aria-label={column.hint}>
                <span className="column__info-icon">i</span>
                <span className="column__info-tooltip">{column.hint}</span>
              </span>
            )}
            <span className="column__count">{cards.length}</span>
          </div>
        </div>
        <div className="column__owner">
          <span>{OWNER_ICONS[column.owner] || '●'}</span>
          <span>{column.owner}</span>
          {column.waitsOn && <span title="Aguardando resposta — due date recomendado">· ⏱</span>}
        </div>
      </div>

      {/* Droppable body com botão "+ novo card" como último item */}
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

            {/* Botão novo card — logo após o último card ou primeiro se vazio */}
            <button className="column__add" onClick={handleAdd}>
              + novo card
            </button>
          </div>
        )}
      </Droppable>

      {/* Modal */}
      {openCard && (
        <CardModal
          card={openCard}
          columnTitle={column.title}
          onClose={() => setOpenCardId(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
