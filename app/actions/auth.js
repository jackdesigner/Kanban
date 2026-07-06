'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function loginAction(formData) {
  const username = formData.get('username')
  const password = formData.get('password')

  if (!username || !password) {
    return { error: 'Usuário e senha são obrigatórios' }
  }

  const cleanUsername = username.trim().replace(/\s+/g, '')
  const email = `${cleanUsername}@seuapp.com`

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Erro de Autenticação SSR:', error.message)
    return { error: 'Credenciais inválidas. Verifique usuário e senha.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
