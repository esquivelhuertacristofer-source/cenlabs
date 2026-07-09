// Next.js 15 instrumentation hook — carga los configs de Sentry según el runtime.
// Si NEXT_PUBLIC_SENTRY_DSN no está configurado, los configs son no-op.
export async function register() {
  // Sin DSN, Sentry está desactivado: no importamos el SDK de servidor.
  // Esto evita cargar @sentry/nextjs (SDK de Node) en runtimes donde su
  // instrumentación no aplica (p. ej. Cloudflare Workers/workerd sin DSN).
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

// Captura errores no manejados del lado del servidor y los envía a Sentry.
// El tipo exacto de los parámetros lo provee Next.js internamente.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const onRequestError = async (...args: any[]) => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  const { captureRequestError } = await import('@sentry/nextjs');
  captureRequestError(...(args as Parameters<typeof captureRequestError>));
};
