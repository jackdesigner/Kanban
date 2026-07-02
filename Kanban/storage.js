import { supabase } from '@/lib/supabase';

export async function loadBoard() {
  try {
    const { data, error } = await supabase
      .from('board_state')
      .select('data')
      .eq('id', 1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found, return null to initialize empty board
        return null;
      }
      console.error('Falha ao carregar board do Supabase:', error);
      return null;
    }

    if (!data || !data.data || Object.keys(data.data).length === 0) {
      return null;
    }

    return data.data;
  } catch (err) {
    console.error('Erro ao carregar board salvo:', err);
    return null;
  }
}

export async function saveBoard(board) {
  try {
    const { error } = await supabase
      .from('board_state')
      .update({ data: board, updated_at: new Date().toISOString() })
      .eq('id', 1);

    if (error) {
      // If the row doesn't exist yet, we insert it
      await supabase
        .from('board_state')
        .insert([{ id: 1, data: board }]);
    }
  } catch (err) {
    console.error('Falha ao salvar board:', err);
  }
}

export function exportBoardAsJSON(board) {
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
