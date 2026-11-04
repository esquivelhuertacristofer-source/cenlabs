// =============================================================================
// ¿Cada usuario LEE exactamente lo mismo en D1 que en producción?
//   npx tsx --conditions=react-server scripts/d1/equivalencia-rls.mts
//   CONTROL_NEGATIVO=1 …   → a los alumnos se les da rol de docente del lado D1: DEBE fallar
//
// Oráculo: Postgres local con lo exportado de producción (oraculo-pg.mts). Del otro lado, la
// capa D1 de la app (src/lib/d1/consulta.ts) sobre la D1 LOCAL con los mismos datos
// (wrangler d1 execute --local, d1/esquema.sql + .export/datos-*.sql).
// Para cada usuario de auth.users (y el anónimo) y cada tabla: el conjunto de llaves primarias
// visibles en Postgres contra el de D1. Debe ser idéntico. No imprime datos, solo conteos.
// =============================================================================
import { getPlatformProxy } from 'wrangler'
import { Consulta, type Contexto } from '../../src/lib/d1/consulta'
import { armarOraculo, q } from './oraculo-pg.mts'

const { pg, d, tablas, pk, comoUsuario, faltantes } = await armarOraculo()
const { env, dispose } = await getPlatformProxy<{ DB: D1Database }>()

const llavesPg = (t: string, uid: string | null) => comoUsuario(uid, async () =>
  new Set((await pg.query<{ k: string }>(`SELECT (${pk[t].map((c) => `${q(c)}::text`).join(` || '|' || `)}) AS k FROM public.${q(t)}`)).rows.map((f) => f.k)))

async function llavesD1(t: string, ctx: Contexto): Promise<Set<string>> {
  const fuera = new Set<string>()
  for (let desde = 0; ; desde += 1000) {
    const r = (await (new Consulta(env.DB, ctx, t) as any).select(pk[t].join(',')).range(desde, desde + 999)) as { data: any[]; error: any }
    if (r.error) throw new Error(`${t}: ${r.error.code} ${r.error.message}`)
    for (const f of r.data) fuera.add(pk[t].map((c) => String(f[c])).join('|'))
    if (r.data.length < 1000) break
  }
  return fuera
}

const perfiles = new Map<string, any>(d.filas.profiles.map((p: any) => [p.id, p]))
const sesiones: { quien: string; uid: string | null; ctx: Contexto }[] = [
  { quien: 'anónimo', uid: null, ctx: { servicio: false, uid: null, role: null } as Contexto }]
for (const u of d.auth_users) {
  const p = perfiles.get(u.id)
  const role = process.env.CONTROL_NEGATIVO && p?.role === 'alumno' ? 'profesor' : p?.role ?? null
  sesiones.push({ quien: p?.role ?? 'sin-perfil', uid: u.id, ctx: { servicio: false, uid: u.id, role } as Contexto })
}

let difieren = 0, comparaciones = 0
const porRol: Record<string, { n: number; filas: number }> = {}
const detalle: string[] = []
for (const s of sesiones) {
  for (const t of tablas) {
    const [a, b] = [await llavesPg(t, s.uid), await llavesD1(t, s.ctx)]
    comparaciones++
    const sobran = [...b].filter((k) => !a.has(k)).length, faltan = [...a].filter((k) => !b.has(k)).length
    ;(porRol[s.quien] ??= { n: 0, filas: 0 }).filas += a.size
    if (sobran || faltan) { difieren++; detalle.push(`${s.quien.padEnd(12)} ${t.padEnd(32)} producción ${a.size}, D1 ${b.size} (faltan ${faltan}, sobran ${sobran})`) }
  }
  porRol[s.quien].n++
}
await dispose()
for (const [k, v] of Object.entries(faltantes)) if (v.length) console.log(`oráculo sin ${k}: ${v.join(', ')}`)
for (const [r, v] of Object.entries(porRol)) console.log(`${r.padEnd(12)} ${String(v.n).padStart(4)} sesiones, ${v.filas} filas visibles en total (producción)`)
for (const l of detalle.slice(0, 40)) console.log('✗', l)
console.log(`\n${comparaciones - difieren}/${comparaciones} combinaciones usuario×tabla idénticas`)
process.exit(difieren ? 1 : 0)
