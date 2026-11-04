import 'server-only'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { cache } from 'react'

/** La base D1 del piloto (binding `DB` de wrangler.jsonc). En `next dev` es la local de miniflare. */
export async function getD1(): Promise<D1Database> {
  const { env, ctx } = await getCloudflareContext({ async: true })
  const db = (env as { DB?: D1Database }).DB
  if (!db) throw new Error('[d1] Falta el binding DB (wrangler.jsonc → d1_databases).')
  return medir(db, contadorDe(ctx))
}

// ── Detector de bucles ───────────────────────────────────────────────────────
// Hoy una página hace de 1 a 19 consultas. Si una sola petición pasa de AVISO deja
// una alerta en el log; si pasa de CORTE se detiene: es casi seguro una consulta
// dentro de un bucle (el error que ya tumbó /aula/campo en producción).
const AVISO = 100
const CORTE = 300
const contadores = new WeakMap<object, { n: number; avisado: boolean }>()
// En Workers `ctx` es el ExecutionContext de CADA petición. En `next dev` es un solo objeto para
// todas, y el contador sumaba las consultas de toda la sesión hasta cortar a los 300 (medido
// 2026-11-03: /auditoria y /admin/usuarios cayeron así). En dev la llave es la petición de React.
const llaveDePeticion = cache((): object => ({}))
function contadorDe(ctx: unknown) {
  const llave = (process.env.NODE_ENV !== 'production' ? llaveDePeticion() : ctx && typeof ctx === 'object' ? ctx : globalThis) as object
  let c = contadores.get(llave)
  if (!c) { c = { n: 0, avisado: false }; contadores.set(llave, c) }
  return c
}

// Piloto: cada sentencia deja `d1q <filas leídas> <filas escritas> <ms> <sql>` en el log;
// `wrangler tail` lo agrupa por petición (perfil exacto de costo por ruta).
type Meta = { rows_read?: number; rows_written?: number; duration?: number }
const anotar = (m: Meta | undefined, sql = '') =>
  console.debug(`d1q ${m?.rows_read ?? 0} ${m?.rows_written ?? 0} ${(m?.duration ?? 0).toFixed(2)} ${sql.replace(/\s+/g, ' ').slice(0, 90)}`)

// ── Reintento ante saturación ────────────────────────────────────────────────
// «D1 DB is overloaded» significa que la consulta no llegó a ejecutarse. Las LECTURAS
// se reintentan hasta 2 veces con espera aleatoria (150–450 ms, 400–900 ms): el niño
// ve la página un poco más lenta en vez de un error. Las escrituras NO se reintentan
// aquí: repetir una escritura a ciegas podría duplicarla.
const SATURADA = /overloaded|queued for too long|too many requests/i
async function conReintento<T>(sql: string, fn: () => Promise<T>): Promise<T> {
  const lectura = /^\s*(SELECT|WITH)\b/i.test(sql)
  for (let intento = 0; ; intento++) {
    try {
      return await fn()
    } catch (e) {
      if (!lectura || intento >= 2 || !SATURADA.test((e as Error).message)) throw e
      console.warn(`[d1] saturada, reintento ${intento + 1}`)
      await new Promise((r) => setTimeout(r, (intento === 0 ? 150 : 400) + Math.random() * (intento === 0 ? 300 : 500)))
    }
  }
}

type Contador = { n: number; avisado: boolean }
function contar(c: Contador, sql: string) {
  c.n++
  if (c.n > CORTE) throw new Error(`[d1] ${c.n} consultas en una sola petición: se corta (posible bucle). Última: ${sql.slice(0, 80)}`)
  if (c.n > AVISO && !c.avisado) { c.avisado = true; console.error(`[d1] ALERTA: más de ${AVISO} consultas en una petición. Última: ${sql.slice(0, 80)}`) }
}

function sentencia(s: D1PreparedStatement, sql: string, c: Contador): D1PreparedStatement {
  return {
    bind: (...v: unknown[]) => sentencia(s.bind(...v), sql, c),
    all: async <T,>() => { contar(c, sql); const r = await conReintento(sql, () => s.all<T>()); anotar(r.meta, sql); return r },
    run: async <T,>() => { contar(c, sql); const r = await conReintento(sql, () => s.run<T>()); anotar(r.meta, sql); return r },
    first: async <T,>(col?: string) => {
      contar(c, sql)
      const r = await conReintento(sql, () => s.all<Record<string, unknown>>())
      anotar(r.meta, sql)
      const f = r.results[0]
      return (f == null ? null : col ? (f[col] as T) : (f as T))
    },
    // `batch` necesita la sentencia original de D1, no este envoltorio.
    _original: s,
  } as D1PreparedStatement
}

function medir(db: D1Database, c: Contador): D1Database {
  return {
    prepare: (sql: string) => sentencia(db.prepare(sql), sql, c),
    batch: async <T,>(ss: D1PreparedStatement[]) => {
      ss.forEach(() => contar(c, 'batch'))
      const rs = await db.batch<T>(ss.map((x) => (x as unknown as { _original?: D1PreparedStatement })._original ?? x))
      rs.forEach((r) => anotar(r.meta))
      return rs
    },
    exec: (sql: string) => db.exec(sql),
  }
}
