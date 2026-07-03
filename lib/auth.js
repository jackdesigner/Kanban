const AUTH_KEY = 'kanban-authed';

const PANEL_PASSWORD =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_PANEL_PASSWORD) || 'jack2026';

export function isAuthenticated() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(AUTH_KEY) === '1';
}

export function authenticate(password) {
  if (password === PANEL_PASSWORD) {
    localStorage.setItem(AUTH_KEY, '1');
    return true;
  }
  return false;
}

export function logout() {
  if (typeof window !== 'undefined') localStorage.removeItem(AUTH_KEY);
}
