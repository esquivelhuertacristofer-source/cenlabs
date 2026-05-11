import * as Sentry from '@sentry/nextjs';

// Solo se inicializa si NEXT_PUBLIC_SENTRY_DSN está configurado.
// Sin DSN es un no-op completo — cero overhead.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.0,
    integrations: [
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
  });
}
