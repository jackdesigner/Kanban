import KanbanBoard from '@/components/KanbanBoard';
import { supabase } from '@/lib/supabaseClient';
export default function HomePage() {
  return <KanbanBoard />;
}
'use client' // IMPORTANTE: Avise o Next.js que esse arquivo roda no navegador

import { useEffect, useState } from 'react'
// 1. Importe a conexão que você criou no Passo 2 (ajuste os ../ se necessário)
import { supabase } from '@/lib/supabaseClient' 

export default function KanbanPage() {
  const [boardData, setBoardData] = useState({})

  // 2. Cole as funções de carregar e salvar aqui dentro:
  async function carregarMeuKanban() {
    const { data, error } = await supabase
      .from('board_state')
      .select('data')
      .eq('id', 1)
      .single()

    if (!error && data) {
      setBoardData(data.data) // Salva o JSON vindo do banco no seu estado local
    }
  }

  async function salvarMeuKanban(novoObjetoKanban) {
    const { error } = await supabase
      .from('board_state')
      .update({ data: novoObjetoKanban })
      .eq('id', 1)

    if (error) console.error('Erro ao salvar:', error)
  }

  // 3. Executa a função assim que o usuário abre a página
  useEffect(() => {
    carregarMeuKanban()
  }, [])

  // O restante do código do seu HTML/JSX do Kanban continua abaixo...
  return (
    <div>
       {/* Quando o usuário mover um card, você chama: salvarMeuKanban(novoEstado) */}
       <h1>Meu Quadro Kanban</h1>
    </div>
  )
}