import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function middleware(request: NextRequest) {
  // Resposta padrão caso nada precise ser redirecionado
  let response = NextResponse.next({ request });

  // Cria o cliente Supabase usando cookies seguros
  const supabase = await createClient();

  // Verifica o usuário autenticado
  const { data: { user } } = await supabase.auth.getUser();

  // Usuário NÃO autenticado → redireciona para /login
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Usuário já autenticado tentando acessar /login → redireciona para a home
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Caso nada precise ser redirecionado, devolve a resposta padrão
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
