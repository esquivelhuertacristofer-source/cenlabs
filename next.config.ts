import type { NextConfig } from "next";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const isDev = process.env.NODE_ENV === 'development';

// Sentry solo se activa cuando hay DSN configurado. Sin DSN (estado por defecto),
// se sustituye '@sentry/nextjs' por un stub no-op vía webpack alias, de modo que el
// SDK real de servidor (@sentry/node + OpenTelemetry, ~1 MiB gz) NO entra al grafo
// del build ni al worker de Cloudflare (que inlinea todos los chunks). Ver sentry-stub.js.
const sentryEnabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN;
const sentryStub = path.join(process.cwd(), "sentry-stub.js");

// jsPDF (~100 KiB gz) es solo-cliente (pdfGenerator.ts, reportUtils.ts,
// admin/usuarios). En el build de servidor se aliasa a un stub no-op para que no
// entre al worker de Cloudflare. En cliente se usa el jspdf real. Ver jspdf-stub.js.
const jspdfStub = path.join(process.cwd(), "jspdf-stub.js");

// Dev mode requires 'unsafe-eval' for Next.js HMR / React Refresh runtime.
// Production omits it for stricter security.
// Los labs 3D de Mecánica (public/labs/*.html) cargan three.js como módulos ES
// desde jsdelivr vía importmap; deben estar permitidos en script-src o el
// navegador bloquea el módulo entero y el lab se queda pegado en la intro.
const scriptSrc = isDev
  ? "'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.youtube.com https://s.ytimg.com https://cdn.jsdelivr.net"
  : "'self' 'unsafe-inline' blob: https://www.youtube.com https://s.ytimg.com https://cdn.jsdelivr.net";

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: false,
  },
  // Sin DSN: aliasa '@sentry/nextjs' al stub no-op para que el SDK no entre al bundle.
  // Con DSN: passthrough — se usa el SDK real (y withSentryConfig lo instrumenta abajo).
  // En servidor: aliasa 'jspdf' al stub no-op (es solo-cliente) para no inflar el worker.
  webpack: (config, { isServer }) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    if (!sentryEnabled) {
      config.resolve.alias["@sentry/nextjs"] = sentryStub;
    }
    if (isServer) {
      config.resolve.alias["jspdf"] = jspdfStub;
    }
    return config;
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

// Con DSN: se envuelve el config con withSentryConfig para instrumentar el build.
// Sin DSN: se exporta nextConfig tal cual (el webpack alias de arriba ya sustituyó
// '@sentry/nextjs' por el stub, así que el SDK no entra al bundle del worker).
// Para activar Sentry en un despliegue: define NEXT_PUBLIC_SENTRY_DSN
// (y opcionalmente SENTRY_AUTH_TOKEN para subir source maps).
export default sentryEnabled
  ? withSentryConfig(nextConfig, {
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
    })
  : nextConfig;

// Solo activo durante `next dev`: expone los bindings de Cloudflare (KV, etc.)
// vía getCloudflareContext() en desarrollo. Es no-op en `next build` (Vercel),
// así que no afecta el despliegue actual en Vercel.
initOpenNextCloudflareForDev();
