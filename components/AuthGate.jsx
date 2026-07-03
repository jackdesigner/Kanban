'use client';

import { useState, useEffect } from 'react';
import { isAuthenticated, authenticate } from '@/lib/auth';
import { MaterialIcon } from '@/lib/icons';

export default function AuthGate({ children }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    setAuthed(isAuthenticated());
    setReady(true);
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (authenticate(password)) {
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  if (!ready) {
    return <div className="auth-gate auth-gate--loading">Carregando…</div>;
  }

  if (!authed) {
    return (
      <div className="auth-gate">
        <form className="auth-gate__panel" onSubmit={handleSubmit}>
          <MaterialIcon name="lock" size={28} />
          <h1 className="auth-gate__title">Projetos do Jack</h1>
          <p className="auth-gate__hint">Digite a senha para acessar este dispositivo.</p>
          <input
            type="password"
            className="auth-gate__input"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="Senha"
            autoFocus
            autoComplete="current-password"
          />
          {error && <p className="auth-gate__error">Senha incorreta.</p>}
          <button type="submit" className="btn btn--primary">Entrar</button>
        </form>
      </div>
    );
  }

  return children;
}
