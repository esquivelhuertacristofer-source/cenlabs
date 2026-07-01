import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const isDev = process.env.NODE_ENV === 'development';

// Dev mode requires 'unsafe-eval' for Next.js HMR / React Refresh runtime.
// Production omits it for stricter security.
const scriptSrc = isDev
  ? "'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.youtube.com https://s.ytimg.com"
  : "'self' 'unsafe-inline' blob: https://www.youtube.com https://s.ytimg.com";

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: false,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src ${scriptSrc}; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://raw.githack.com https://cdn.jsdelivr.net https://i.ytimg.com https://images.unsplash.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' *.supabase.co https://raw.githack.com https://cdn.jsdelivr.net blob:; frame-src 'self' https://www.youtube.com https://youtube.com;`
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  }
};

export default withSentryConfig(nextConfig, {
  // Org y project de Sentry — configurar con variables de entorno si se usa multi-proyecto.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Solo subir source maps si hay auth token. Sin token, el build sigue limpio.
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // No bloquear el build si Sentry falla — producción no depende de Sentry.
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // Ocultar source maps del bundle público (solo Sentry los recibe via upload).
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },

  // No hacer logging verbose del SDK de Sentry en consola de servidor.
  disableLogger: true,

  // Tuneles para evitar que ad blockers bloqueen los reportes de Sentry.
  tunnelRoute: "/monitoring-tunnel",

  // Deshabilitar telemetría interna de Sentry.
  telemetry: false,
});
