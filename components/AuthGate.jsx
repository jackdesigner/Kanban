export default function AuthGate({ children }) {
  // A versão anterior continha bloqueios de senha e integração com o Supabase.
  // Conforme solicitado, foi tudo removido para liberar acesso direto ao sistema.
  return <>{children}</>;
}
