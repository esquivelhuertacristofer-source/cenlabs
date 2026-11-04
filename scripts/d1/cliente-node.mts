// =============================================================================
// Cliente de D1 para los SCRIPTS (Node), con la misma forma que supabase-js.
//
// Después del cambio, los scripts de contenido (sembrar clases, fijar audio_key, motores…)
// ya no pueden escribir a Supabase: lo que escriban ahí el sitio no lo ve. Con esto, pasar
// un script es cambiar UNA línea:
//     const supabase = createClient(URL, claveServiceRole())      // antes
//     const supabase = clienteD1()                                 // ahora
// y el resto (`.from('actividades_nem').update({...}).eq('codigo', c)`) queda igual.
// Usa el MISMO traductor que la app (src/lib/d1/consulta.ts), con el contexto de servicio
// (como la service_role: sin políticas), y el mismo tope de 1,000 filas por consulta.
//
// Se corre con tsx y la condición react-server (por el `import 'server-only'` de la app):
//     D1_BASE=<id> npx tsx --conditions=react-server scripts/mi-script.mts
// D1_BASE es obligatorio a propósito: ningún script escribe en una base por omisión.
// Credencial: CF_API_TOKEN, o la sesión de wrangler (`npx wrangler whoami` la renueva).
//
// Diferencias con supabase-js que hay que saber:
//   · .storage no existe: los medios van a R2 (scripts/medios/subir-medios.mjs).
//   · .rpc() no existe (la app tampoco usa ninguna).
//   · Un batch (varias sentencias) NO es atómico aquí: la API HTTP las manda una por una.
//   · El sitio guarda el currículo en caché hasta 25 min; tras publicar, correr
//     scripts/d1/purgar-cache.mjs para que se vea en ~10 min.
// =============================================================================
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { crearClienteD1 } from '../../src/lib/d1/cliente'

const CUENTA = '226aa1ea2896760a5b68180a66c3170f'

function token(): string {
  if (process.env.CF_API_TOKEN) return process.env.CF_API_TOKEN
  const toml = fs.readFileSync(path.join(os.homedir(), 'AppData/Roaming/xdg.config/.wrangler/config/default.toml'), 'utf8')
  return toml.match(/oauth_token\s*=\s*"([^"]+)"/)![1]
}

type Fila = Record<string, unknown>
type Resultado = { results: Fila[]; success: boolean; meta: Record<string, unknown> }

/** La API de D1 por HTTP, con la forma del binding (prepare/bind/first/all/run/batch). */
function d1PorHttp(base: string) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CUENTA}/d1/database/${base}/query`
  async function consultar(sql: string, params: unknown[]): Promise<Resultado> {
    for (let i = 0; i < 5; i++) {
      const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ sql, params }) })
      const j = (await r.json().catch(() => ({}))) as { success?: boolean; result?: Resultado[]; errors?: unknown }
      if (r.ok && j.success && j.result) return { results: j.result[0].results, success: true, meta: j.result[0].meta }
      if (r.status >= 500 || r.status === 429) { await new Promise((s) => setTimeout(s, 2000 * (i + 1))); continue }
      throw new Error(`D1_ERROR: ${JSON.stringify(j.errors ?? r.status).slice(0, 300)}`)
    }
    throw new Error('D1_ERROR: reintentos agotados')
  }
  function sentencia(sql: string, params: unknown[] = []) {
    return {
      sql, params,
      bind: (...p: unknown[]) => sentencia(sql, p),
      all: () => consultar(sql, params),
      run: () => consultar(sql, params),
      first: async (col?: string) => {
        const f = (await consultar(sql, params)).results[0] ?? null
        return col ? (f ? f[col] : null) : f
      },
    }
  }
  return {
    prepare: (sql: string) => sentencia(sql),
    batch: async (sts: { all: () => Promise<Resultado> }[]) => { const out: Resultado[] = []; for (const s of sts) out.push(await s.all()); return out },
    exec: (sql: string) => consultar(sql, []),
  }
}

export function clienteD1(base = process.env.D1_BASE) {
  if (!base || !/^[0-9a-f-]{36}$/.test(base)) throw new Error('Falta D1_BASE=<id de la base D1>: ningún script escribe en una base por omisión.')
  // Mismo cliente que la app, en modo servicio. El tipo es el de la app (casteado a la forma
  // de supabase-js en server.ts); aquí se deja abierto para no arrastrar los tipos de Next.
  return crearClienteD1({ db: d1PorHttp(base) as unknown as D1Database, servicio: true }) as unknown as {
    from: (tabla: string) => any // eslint-disable-line @typescript-eslint/no-explicit-any
    auth: { admin: { createUser: (a: { email: string; password: string; email_confirm?: boolean; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }) => Promise<unknown> } }
  }
}
