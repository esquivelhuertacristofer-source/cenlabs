import * as Sentry from '@sentry/nextjs';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,

    // Captura TODOS los errores de servidor sin sampling — producción crítica.
    // Un 404 inesperado en una ruta dinámica que debería existir se reporta aquí.
    beforeSend(event) {
      // Detectar específicamente el patrón del incidente del 2026-05-11:
      // notFound() disparado en rutas de simuladores que deberían ser válidas.
      const url = event.request?.url ?? '';
      if (
        url.includes('/alumno/simulador/') &&
        event.tags?.['http.status_code'] === 404
      ) {
        event.tags = {
          ...event.tags,
          'incident.type': 'simulador-route-404',
          'alert.priority': 'high',
        };
        event.fingerprint = ['simulador-route-unexpected-404'];
      }
      return event;
    },
  });
}
