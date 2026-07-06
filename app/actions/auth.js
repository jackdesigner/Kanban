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
  // Se o usuário já digitar o e-mail completo, usamos ele. Se não, forçamos o padrão.
  const email = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@gmail.com`

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Erro de Autenticação SSR:', error.message)
    return { error: `Erro do Supabase: ${error.message}` }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
