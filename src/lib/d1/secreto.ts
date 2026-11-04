import 'server-only'

/**
 * Un secreto SERVER-ONLY (SESION_SECRETO), de nem-d1/src/lib/env.ts con un cambio de orden:
 * aquí manda el secreto del WORKER (`wrangler secret put`) y process.env queda solo para
 * `next dev`. OpenNext copia `.env*` dentro del paquete y los pone en process.env (manual 3b):
 * si process.env mandara, un `.env.local` olvidado firmaría las sesiones de producción con la
 * llave de este equipo, sin ningún error. `revisar-paquete.mjs` además frena ese despliegue.
 * Si no aparece en ningún lado, truena: nunca devuelve cadena vacía.
 */
export async function getServerSecret(name: string): Promise<string> {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare')
    const { env } = await getCloudflareContext({ async: true })
    const value = (env as Record<string, unknown>)[name]
    if (typeof value === 'string' && value) return value
  } catch {
    // No estamos en el runtime de Cloudflare (p. ej. `next dev`): se mira process.env.
  }
  const fromProcess = process.env[name]
  if (fromProcess) return fromProcess
  throw new Error(`Falta el secreto server-only "${name}". En producción: wrangler secret put ${name}; en local: .dev.vars.`)
}
