import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que requieren autenticación
const PROTECTED_ROUTES = [
    '/alumno',
    '/alumnos',
    '/laboratorios',
    '/api/resultados',
];

// Rutas públicas
const PUBLIC_ROUTES = [
    '/',
    '/login',
    '/landing',
    '/_not-found',
];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Verificar si es una ruta protegida
    const isProtectedRoute = PROTECTED_ROUTES.some(route =>
        pathname.startsWith(route)
    );

    // Verificar si es una ruta pública
    const isPublicRoute = PUBLIC_ROUTES.some(route =>
        pathname === route || pathname.startsWith('/_next') || pathname.startsWith('/api/auth')
    );

    // En desarrollo, permitir todo
    if (process.env.NODE_ENV === 'development') {
        return NextResponse.next();
    }

    // Para rutas públicas, permitir
    if (isPublicRoute) {
        return NextResponse.next();
    }

    // Para rutas protegidas, verificar autenticación
    if (isProtectedRoute) {
        // TODO: Implementar verificación real con Supabase/JWT
        // Por ahora, verificamos cookie de sesión
        const sessionCookie = request.cookies.get('cen_session');
        const authToken = request.cookies.get('supabase-auth-token');

        if (!sessionCookie && !authToken) {
            // En producción, redirigir a login
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Verificar si el token ha expirado
        const tokenExpiry = request.cookies.get('token_expiry');
        if (tokenExpiry) {
            const expiryTime = parseInt(tokenExpiry.value, 10);
            if (Date.now() > expiryTime) {
                // Token expirado, redirigir a login
                const loginUrl = new URL('/login', request.url);
                loginUrl.searchParams.set('reason', 'expired');
                loginUrl.searchParams.set('redirect', pathname);

                const response = NextResponse.redirect(loginUrl);
                // Limpiar cookies expiradas
                response.cookies.delete('cen_session');
                response.cookies.delete('supabase-auth-token');
                response.cookies.delete('token_expiry');
                return response;
            }
        }

        // Agregar headers de seguridad para rutas protegidas
        const response = NextResponse.next();
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        response.headers.set('X-XSS-Protection', '1; mode=block');

        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
};
