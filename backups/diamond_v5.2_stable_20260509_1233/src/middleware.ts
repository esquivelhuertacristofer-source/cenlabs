import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

const PROTECTED_PREFIXES = ['/alumno', '/admin'];

function applySecurityHeaders(response: NextResponse) {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
}

export async function middleware(request: NextRequest) {
  // supabaseResponse debe ser el objeto que se retorna para que
  // @supabase/ssr pueda actualizar las cookies de sesión correctamente.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Propagar cookies al request
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Reconstruir response con cookies actualizadas
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() valida el JWT con Supabase y renueva el token si está próximo a expirar.
  // No usar getSession() aquí — es inseguro en el servidor porque no valida el JWT.
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));

  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    applySecurityHeaders(redirectResponse);
    return redirectResponse;
  }

  applySecurityHeaders(supabaseResponse);
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
