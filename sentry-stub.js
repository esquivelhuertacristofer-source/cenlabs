// Stub de @sentry/nextjs para builds SIN DSN.
//
// Cuando NEXT_PUBLIC_SENTRY_DSN no está definido (estado por defecto), next.config.ts
// sustituye '@sentry/nextjs' por este módulo vía `resolve.alias` de webpack. Así el
// SDK real (@sentry/node + OpenTelemetry + instrumentaciones de Node, ~1 MiB gz) NO
// entra al grafo del bundle y por tanto NO lo inlinea OpenNext en el worker de
// Cloudflare — donde además no aplica (workerd no es Node) ni sirve de nada sin DSN.
//
// Importante: esto es necesario porque OpenNext inlinea TODOS los chunks del build de
// servidor al worker (Workers no tienen filesystem para lazy-load), así que ni los
// `import()` dinámicos guardados por DSN evitan que el SDK entre. El alias sí lo evita.
//
// Reactivar Sentry en un despliegue: define NEXT_PUBLIC_SENTRY_DSN. Con DSN presente
// NO se aplica el alias y se usa el SDK real (ver next.config.ts).
const noop = () => {};

export const init = noop;
export const captureException = noop;
export const captureMessage = noop;
export const captureRequestError = noop;
export const flush = async () => true;
export const close = async () => true;
export const setTag = noop;
export const setTags = noop;
export const setContext = noop;
export const setUser = noop;
export const setExtra = noop;
export const addBreadcrumb = noop;
export const withScope = (cb) => {
  if (typeof cb === 'function') cb({ setTag: noop, setExtra: noop, setContext: noop, setUser: noop });
};
export const replayIntegration = () => ({ name: 'Replay' });
export const browserTracingIntegration = () => ({ name: 'BrowserTracing' });
export const getCurrentScope = () => ({ setTag: noop, setExtra: noop, setContext: noop, setUser: noop });

const Sentry = {
  init, captureException, captureMessage, captureRequestError, flush, close,
  setTag, setTags, setContext, setUser, setExtra, addBreadcrumb, withScope,
  replayIntegration, browserTracingIntegration, getCurrentScope,
};
export default Sentry;
