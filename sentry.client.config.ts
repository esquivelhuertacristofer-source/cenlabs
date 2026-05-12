import * as Sentry from '@sentry/nextjs';

// No-op completo si el DSN no está configurado — cero overhead en local sin cuenta Sentry.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // 10% de trazas de performance para no saturar la cuota gratuita.
    tracesSampleRate: 0.1,

    // Grabar replay completo solo en sesiones con error.
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.0,
    integrations: [
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],

    // Filtrar errores que no son bugs de la aplicación.
    beforeSend(event, hint) {
      const error = hint?.originalException;
      const msg = typeof error === 'string' ? error : (error as Error)?.message ?? '';
      const stack = (error as Error)?.stack ?? '';

      // Errores de extensiones de navegador (Chrome, Firefox).
      if (
        stack.includes('chrome-extension://') ||
        stack.includes('moz-extension://') ||
        stack.includes('safari-extension://')
      ) return null;

      // Violaciones de CSP — ruido, no errores de app.
      if (msg.includes('Content Security Policy') || msg.includes('CSP')) return null;

      // Ad blockers — bloquean requests de analytics, no es un bug.
      if (msg.includes('ERR_BLOCKED_BY_CLIENT') || msg.includes('net::ERR_FAILED')) return null;

      // THREE.Clock deprecated — warning de librería, no bug de app.
      if (msg.includes('THREE.Clock') && msg.includes('deprecated')) return null;

      // Errores de hidratación de React en producción (componentes de terceros).
      if (msg.includes('Hydration failed') && stack.includes('node_modules')) return null;

      return event;
    },

    // Ignorar patrones conocidos de ruido.
    ignoreErrors: [
      // ResizeObserver — bug conocido de browsers en resize rápido.
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // Fetch abortado por navegación.
      'AbortError',
      'The user aborted a request',
      // Errores de red no accionables.
      'NetworkError',
      'Failed to fetch',
      'Load failed',
    ],
  });
}
