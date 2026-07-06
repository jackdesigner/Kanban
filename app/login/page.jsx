'use client'

import { useState, useTransition } from 'react'
import { loginAction } from '@/app/actions/auth'

export default function LoginPage() {
  const [error, setError] = useState(null)
  const [isPending, startTransition] = useTransition()

  function handleFormAction(formData) {
    setError(null)
    startTransition(async () => {
      const result = await loginAction(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="auth-gate">
      <form className="auth-gate__panel" action={handleFormAction}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: 'var(--text-muted)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>lock</span>
        </div>
        
        <h1 className="auth-gate__title">Projetos do Jack</h1>
        <p className="auth-gate__hint">Faça login com seu usuário SSR.</p>
        
        <input
          type="text"
          name="username"
          className="auth-gate__input"
          placeholder="E-mail ou Usuário"
          autoFocus
          autoComplete="username"
          style={{ marginBottom: '8px' }}
        />
        <input
          type="password"
          name="password"
          className="auth-gate__input"
          placeholder="Senha"
          autoComplete="current-password"
        />
        
        {error && <p className="auth-gate__error">{error}</p>}
        
        <button type="submit" className="btn btn--primary" disabled={isPending}>
          {isPending ? 'Validando...' : 'Entrar Seguramente'}
        </button>
      </form>
    </div>
  )
}
