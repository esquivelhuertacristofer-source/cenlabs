import { NextResponse, type NextRequest } from 'next/server';

// =============================================================================
// Labs sobre D1 (2026-11-03). Convención middleware.ts (edge), no proxy.ts: OpenNext en
// Cloudflare no soporta el middleware con runtime Node de Next 16 (igual que Financiera).
//
// Antes: en cada petición que llegaba a Next se llamaba a supabase.auth.getUser(), un viaje de
// red a Supabase. (Los estáticos de public/ los sirve el binding de assets de Cloudflare antes
// del worker, así que en producción no deberían llegar aquí; el matcher de abajo los excluye
// también en `next dev`, donde sí pasaban porque la exclusión `public/` no casaba con nada.)
// Ahora: se revisa la firma y la caducidad de la cookie propia `labs_sesion` (HMAC-SHA256 con
// SESION_SECRETO), sin consultar la base. Lo que la firma no ve (sesión cerrada o contraseña
// cambiada, por sesion_version; y el ROL) lo revisa el servidor al pedir los datos.
// =============================================================================

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Rutas que requieren autenticación por match exacto (no de prefijo)
const PROTECTED_EXACT = new Set(['/']);
// Rutas que requieren autenticación por prefijo
const PROTECTED_PREFIXES = ['/alumno', '/admin', '/laboratorios', '/planeamiento', '/auditoria', '/alumnos'];

const COOKIE_SESION = 'labs_sesion';
let llaveFirma: { secreto: string; llave: Promise<CryptoKey> } | null = null;

async function secretoDeSesion(): Promise<string | null> {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = await getCloudflareContext({ async: true });
    const v = (env as Record<string, unknown>).SESION_SECRETO;
    if (typeof v === 'string' && v) return v;
  } catch { /* fuera de Workers (next dev): process.env */ }
  return process.env.SESION_SECRETO || null;
}

const desB64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function sesionFirmada(token: string | undefined): Promise<boolean> {
  const secreto = await secretoDeSesion();
  const [cuerpo, firma] = (token ?? '').split('.');
  if (!secreto || !cuerpo || !firma) return false;
  if (llaveFirma?.secreto !== secreto) {
    llaveFirma = { secreto, llave: crypto.subtle.importKey('raw', new TextEncoder().encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']) };
  }
  try {
    if (!(await crypto.subtle.verify('HMAC', await llaveFirma.llave, desB64u(firma), new TextEncoder().encode(cuerpo)))) return false;
    const carga = JSON.parse(new TextDecoder().decode(desB64u(cuerpo)));
    return typeof carga.u === 'string' && typeof carga.e === 'number' && carga.e > Date.now() / 1000;
  } catch {
    return false;
  }
}

function applySecurityHeaders(response: NextResponse) {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected =
    PROTECTED_EXACT.has(pathname) ||
    PROTECTED_PREFIXES.some(p => pathname.startsWith(p));

  if (isProtected && !(await sesionFirmada(request.cookies.get(COOKIE_SESION)?.value))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    applySecurityHeaders(redirectResponse);
    return redirectResponse;
  }

  // Las cabeceras de seguridad de las respuestas normales las pone next.config.ts (headers()).
  // Ponerlas también aquí las DUPLICABA («SAMEORIGIN, SAMEORIGIN», medido 2026-11-03 en
  // producción y en el piloto). Aquí solo van en la redirección de arriba, que no pasa por ahí.
  return NextResponse.next({ request });
}

export const config = {
  // Fuera: los estáticos que sirve Cloudflare tal cual (labs, sus datos, voz, imágenes, el SW).
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|labs/|labs-data/|assets/|images/|sw\\.js|manifest\\.webmanifest|icon-).*)',
  ],
};
