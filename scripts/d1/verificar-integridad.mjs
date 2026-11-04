// =============================================================================
// Integridad de la migración: ¿lo que hay en D1 es EXACTAMENTE lo que se exportó?
//   BASE_D1=<id> DIR=<carpeta de la exportación> node scripts/d1/verificar-integridad.mjs
//
// Fila por fila, no solo conteos: cada fila se reduce a una huella (SHA-256 de todos
// sus valores normalizados: booleanos, números, JSON con llaves ordenadas, fechas ISO)
// y se comparan los dos multiconjuntos. Detecta filas que faltan, que sobran y filas
// con un solo valor cambiado. Los datos sintéticos del piloto (dominio .invalid y la
// escuela de carga) se descartan del lado de D1.
//
// Solo lectura. No imprime datos de alumnos: solo conteos y huellas truncadas.
// =============================================================================
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'

const CUENTA = '226aa1ea2896760a5b68180a66c3170f'
// Obligatoria: con el piloto por omisión, olvidarla comparaba contra la base equivocada.
const BASE_D1 = process.env.BASE_D1
if (!/^[0-9a-f-]{36}$/.test(BASE_D1 ?? '')) throw new Error('BASE_D1=<id de la base> es obligatorio (npx wrangler d1 list)')
const token = fs.readFileSync(path.join(os.homedir(), 'AppData/Roaming/xdg.config/.wrangler/config/default.toml'), 'utf8').match(/oauth_token\s*=\s*"([^"]+)"/)[1]
const url = `https://api.cloudflare.com/client/v4/accounts/${CUENTA}/d1/database/${BASE_D1}/query`
const info = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CUENTA}/d1/database/${BASE_D1}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).catch(() => null)
if (!info?.success) throw new Error('No se encontró esa base (¿id mal copiado o sesión de wrangler caducada?)')
console.log(`Base: ${info.result.name} · exportación: ${process.env.DIR ?? '.export'}`)

async function consultar(sql, params = []) {
  for (let i = 0; i < 6; i++) {
    const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ sql, params }) })
    const j = await r.json().catch(() => ({}))
    if (r.ok && j.success) return j.result[0].results
    if (r.status >= 500 || r.status === 429) { await new Promise((s) => setTimeout(s, 2000 * (i + 1))); continue }
    throw new Error(JSON.stringify(j.errors ?? r.status).slice(0, 300))
  }
  throw new Error('reintentos agotados')
}

const d = JSON.parse(fs.readFileSync(`${process.env.DIR ?? '.export'}/dump.json`, 'utf8'))
const columnas = {}
for (const c of d.columnas) (columnas[c.table_name] ??= []).push(c)
const clase = (u) => (u === 'jsonb' || u === 'json' ? 'json' : u.startsWith('_') ? 'arr' : u === 'bool' ? 'bool' : ['int2', 'int4', 'int8', 'numeric', 'float4', 'float8'].includes(u) ? 'num' : 'txt')

const canon = (v) => (Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])])) : v)
function normal(v, k) {
  if (v === null || v === undefined) return null
  if (k === 'bool') return v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0
  if (k === 'num') return Number(v)
  if (k === 'json' || k === 'arr') return JSON.stringify(canon(typeof v === 'string' ? JSON.parse(v) : v))
  if (v instanceof Date || (typeof v === 'string' && /^\d{4}-\d\d-\d\d[T ]\d\d:\d\d/.test(v))) return new Date(v).toISOString()
  return String(v)
}
const huella = (fila, cols) => crypto.createHash('sha256').update(JSON.stringify(cols.map((c) => normal(fila[c.column_name], clase(c.udt_name))))).digest('hex')

// Lo sintético del piloto, para descartarlo del lado de D1.
const sinteticos = new Set((await consultar(`SELECT id FROM auth_users WHERE email LIKE '%.invalid'`)).map((r) => r.id))
// Labs no tiene escuelas: los grupos sintéticos se llaman «Piloto…» o son de un docente sintético.
for (const r of await consultar(`SELECT id FROM grupos WHERE nombre LIKE 'Piloto%' OR id_profesor IN (SELECT value FROM json_each(?))`, [JSON.stringify([...sinteticos])])) sinteticos.add(r.id)
const esSintetica = (fila) => Object.values(fila).some((v) => typeof v === 'string' && sinteticos.has(v))
console.log(`ids sintéticos del piloto descartados: ${sinteticos.size}\n`)

async function todasDeD1(tabla, cols) {
  const filas = []
  for (let desde = 0; ; desde += 2000) {
    const lote = await consultar(`SELECT ${cols.map((c) => `"${c.column_name}"`).join(', ')} FROM "${tabla}" ORDER BY rowid LIMIT 2000 OFFSET ${desde}`)
    filas.push(...lote)
    if (lote.length < 2000) return filas
  }
}

const tablasExport = { ...d.filas, auth_users: d.auth_users.filter((u) => !u.deleted_at) }
// auth_users solo se compara en las columnas que se migraron.
const COLS_AUTH = ['id', 'email', 'encrypted_password', 'email_confirmed_at', 'created_at', 'banned_until'].map((n) => ({ column_name: n, udt_name: 'text' }))
let problemas = 0
console.log('tabla'.padEnd(30), 'export', '    d1', ' faltan', ' sobran', ' resultado')
for (const [tabla, filasExp] of Object.entries(tablasExport).sort()) {
  const cols = tabla === 'auth_users' ? COLS_AUTH : columnas[tabla]
  const filasD1 = (await todasDeD1(tabla, cols)).filter((f) => !esSintetica(f))
  const cuenta = new Map()
  for (const f of filasExp) { const h = huella(f, cols); cuenta.set(h, (cuenta.get(h) ?? 0) + 1) }
  let sobran = 0
  for (const f of filasD1) {
    const h = huella(f, cols)
    const n = cuenta.get(h) ?? 0
    if (n > 0) cuenta.set(h, n - 1)
    else sobran++
  }
  const faltan = [...cuenta.values()].reduce((a, b) => a + b, 0)
  const ok = faltan === 0 && sobran === 0
  if (!ok) problemas++
  console.log(tabla.padEnd(30), String(filasExp.length).padStart(6), String(filasD1.length).padStart(6), String(faltan).padStart(7), String(sobran).padStart(7), ok ? '  ✓ idéntica' : '  ✗ DIFIERE')
}
console.log(problemas ? `\n${problemas} tabla(s) con diferencias (ver arriba). Una fila «sobrante» puede ser actividad nueva del piloto.` : '\nTodas las tablas idénticas a la exportación.')
if (problemas) process.exitCode = 1 // para que el paso 2 de la ventana se detenga solo
