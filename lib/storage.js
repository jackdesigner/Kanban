const STORAGE_KEY = 'design-kanban-board-v1';

export function loadBoard() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Falha ao carregar board salvo:', err);
    return null;
  }
}

export function saveBoard(board) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  } catch (err) {
    console.error('Falha ao salvar board:', err);
  }
}

export function exportBoardAsJSON(board) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([JSON.stringify(board, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `board-design-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
