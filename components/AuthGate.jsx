'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MaterialIcon } from '@/lib/icons';

export default function AuthGate({ children }) {
  const [ready, setReady] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [session, setSession] = useState(null);
  
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // 1. Check Secret URL or LocalStorage Flag
    const params = new URLSearchParams(window.location.search);
    if (params.get('acesso') === 'gcfiv') {
      localStorage.setItem('acesso_permitido', 'true');
      setHasAccess(true);
    } else if (localStorage.getItem('acesso_permitido') === 'true') {
      setHasAccess(true);
    } else {
      setHasAccess(false);
    }

    // 2. Initialize Supabase Auth Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Preencha usuário e senha.');
      return;
    }

    const email = `${username}@seuapp.com`;

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError('Credenciais inválidas.');
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) setError(error.message);
    }
  }

  if (!ready) {
    return <div className="auth-gate auth-gate--loading">Carregando…</div>;
  }

  if (!hasAccess) {
    // Retorna nulo para ser uma "página em branco" conforme solicitado
    return null;
  }

  if (!session) {
    return (
      <div className="auth-gate">
        <form className="auth-gate__panel" onSubmit={handleSubmit}>
          <MaterialIcon name="lock" size={28} />
          <h1 className="auth-gate__title">Projetos do Jack</h1>
          <p className="auth-gate__hint">
            {isLogin ? 'Faça login para continuar.' : 'Crie sua conta para acessar.'}
          </p>
          
          <input
            type="text"
            className="auth-gate__input"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
            placeholder="Usuário"
            autoFocus
            autoComplete="username"
            style={{ marginBottom: '8px' }}
          />
          <input
            type="password"
            className="auth-gate__input"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            placeholder="Senha"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />
          
          {error && <p className="auth-gate__error">{error}</p>}
          
          <button type="submit" className="btn btn--primary">
            {isLogin ? 'Entrar' : 'Criar Conta'}
          </button>
          
          <button
            type="button"
            className="btn"
            style={{ marginTop: '8px', background: 'transparent', color: 'var(--text-muted)' }}
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
          >
            {isLogin ? 'Ainda não tem conta? Criar Conta' : 'Já tem conta? Entrar'}
          </button>
        </form>
      </div>
    );
  }

  // Clona o elemento filho para injetar a prop de session
  return React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { session });
    }
    return child;
  });
}
