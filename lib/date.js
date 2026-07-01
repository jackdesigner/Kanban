// Retorna 'overdue' | 'soon' | 'ok' | null (sem data)
export function dueStatus(dueDate) {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0)  return 'overdue';
  if (diffDays <= 2) return 'soon';
  return 'ok';
}

export function formatDate(dueDate) {
  if (!dueDate) return '';
  const due = new Date(dueDate + 'T00:00:00');
  return due.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function daysLabel(dueDate) {
  if (!dueDate) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
  if (diffDays === 0)  return 'hoje';
  if (diffDays === 1)  return 'amanhã';
  if (diffDays === -1) return '1 dia atrasado';
  if (diffDays < 0)   return `${Math.abs(diffDays)} dias atrasado`;
  return `em ${diffDays} dias`;
}
