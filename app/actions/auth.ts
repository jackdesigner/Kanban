'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username || !password) {
    return { error: 'Usuário e senha são obrigatórios' }
  }

  // Tratamento da entrada do usuário de forma limpa e invisível para o Supabase
  const cleanUsername = username.trim().replace(/\s+/g, '')
  const email = `${cleanUsername}@seuapp.com`

  const supabase = await createClient()

  // Conexão e autenticação gerando cookies seguros do lado do servidor
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Erro de Autenticação SSR:', error.message)
    return { error: 'Credenciais inválidas. Verifique usuário e senha.' }
  }

  // Redirecionamento após o login bem-sucedido
  revalidatePath('/', 'layout')
  redirect('/')
}
