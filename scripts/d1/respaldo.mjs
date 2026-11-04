// =============================================================================
// Respaldo de una base D1 a disco, FUERA de Cloudflare (solo lectura sobre la base).
//   BASE_D1=<id> node scripts/d1/respaldo.mjs                → respalda
//   BASE_D1=<id> DIR=<carpeta> node scripts/d1/respaldo.mjs --verificar → compara esa base con un respaldo
//
// Por qué: D1 ya guarda 30 días de «Time Travel», pero vive en la MISMA cuenta. Si la cuenta
// se pierde (pago, robo de acceso, un borrado), se van la base y su historial juntos. Esto deja
// una copia en este equipo.
//
// Sale en el mismo formato que usa el ensayo (esquema.sql + datos-NN.sql, una sentencia por
// línea), así que se restaura con el importador ya probado:
//   BASE_D1=<base vacía> DIR=<carpeta> node scripts/d1/importar-remoto.mjs <carpeta>/esquema.sql
//   BASE_D1=<base vacía> DIR=<carpeta> node scripts/d1/importar-remoto.mjs
// manifiesto.json guarda filas y huella SHA-256 por tabla para comprobar la restauración.
// =============================================================================
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'

const CUENTA = '226aa1ea2896760a5b68180a66c3170f'
const BASE_D1 = process.env.BASE_D1
if (!/^[0-9a-f-]{36}$/.test(BASE_D1 ?? '')) throw new Error('BASE_D1=<id de la base> es obligatorio')
const VERIFICAR = process.argv.includes('--verificar')
const fecha = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
const DIR = process.env.DIR ?? `.export/respaldos/${BASE_D1.slice(0, 8)}-${fecha}`
const token = process.env.CF_API_TOKEN ?? fs.readFileSync(path.join(os.homedir(), 'AppData/Roaming/xdg.config/.wrangler/config/default.toml'), 'utf8').match(/oauth_token\s*=\s*"([^"]+)"/)[1]

async function q(sql, params = []) {
  for (let i = 0; i < 5; i++) {
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CUENTA}/d1/database/${BASE_D1}/query`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ sql, params }) })
    const j = await r.json().catch(() => ({}))
    if (r.ok && j.success) return j.result[0].results
    if (r.status >= 500 || r.status === 429) { await new Promise((s) => setTimeout(s, 2000 * (i + 1))); continue }
    throw new Error(JSON.stringify(j.errors ?? r.status).slice(0, 300))
  }
  throw new Error('reintentos agotados')
}

const lit = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? (Number.isFinite(v) ? String(v) : 'NULL') : `'${String(v).replace(/'/g, "''")}'`)

const objetos = await q(`SELECT type, name, tbl_name, sql FROM sqlite_master WHERE sql IS NOT NULL AND substr(name, 1, 7) <> 'sqlite_' AND substr(name, 1, 4) <> '_cf_' AND name <> 'd1_migrations'`)
const tablas = objetos.filter((o) => o.type === 'table').map((o) => o.name)

// Orden por llaves foráneas: primero las tablas de las que dependen otras (D1 las hace cumplir).
const deps = {}
for (const t of tablas) deps[t] = new Set((await q(`SELECT "table" AS t FROM pragma_foreign_key_list('${t}')`)).map((f) => f.t).filter((x) => x !== t && tablas.includes(x)))
const orden = []
const visto = new Set()
const visitar = (t) => { if (visto.has(t)) return; visto.add(t); for (const d of deps[t]) visitar(d); orden.push(t) }
tablas.sort().forEach(visitar)

/** Filas de una tabla en orden de rowid, por páginas; llama `cada(fila)`. */
async function recorrer(t, cada) {
  const cols = (await q(`SELECT name FROM pragma_table_info('${t}') ORDER BY cid`)).map((c) => c.name)
  let ultimo = -Infinity, n = 0
  for (;;) {
    const filas = await q(`SELECT rowid AS __r, ${cols.map((c) => `"${c}"`).join(', ')} FROM "${t}" WHERE rowid > ? ORDER BY rowid LIMIT 500`, [ultimo === -Infinity ? -9e15 : ultimo])
    for (const f of filas) { cada(cols, f); n++ }
    if (filas.length < 500) break
    ultimo = filas.at(-1).__r
  }
  return { cols, n }
}
const huellaDe = (cols, f) => JSON.stringify(cols.map((c) => f[c] ?? null))

if (VERIFICAR) {
  const man = JSON.parse(fs.readFileSync(`${DIR}/manifiesto.json`, 'utf8'))
  let fallos = 0
  for (const t of Object.keys(man.tablas)) {
    const h = crypto.createHash('sha256')
    const { n } = await recorrer(t, (cols, f) => h.update(huellaDe(cols, f) + '\n'))
    const okT = n === man.tablas[t].filas && h.digest('hex') === man.tablas[t].huella
    if (!okT) fallos++
    console.log(okT ? '  ✓' : '  ✗', t, n, 'filas')
  }
  console.log(fallos ? `${fallos} tabla(s) distintas` : `Idénticas: ${Object.keys(man.tablas).length} tablas`)
  process.exit(fallos ? 1 : 0)
}

fs.mkdirSync(DIR, { recursive: true })
const ddl = [
  ...objetos.filter((o) => o.type === 'table').sort((a, b) => orden.indexOf(a.name) - orden.indexOf(b.name)),
  ...objetos.filter((o) => o.type === 'index'),
  ...objetos.filter((o) => o.type === 'view'),
  ...objetos.filter((o) => o.type === 'trigger'),
].map((o) => o.sql.trim().replace(/;$/, '') + ';')
fs.writeFileSync(`${DIR}/esquema.sql`, ddl.join('\n') + '\n')

const manifiesto = { base: BASE_D1, fecha: new Date().toISOString(), tablas: {} }
let archivo = 1, tam = 0
let salida = fs.openSync(`${DIR}/datos-${String(archivo).padStart(2, '0')}.sql`, 'w')
for (const t of orden) {
  const h = crypto.createHash('sha256')
  const { n } = await recorrer(t, (cols, f) => {
    const linea = `INSERT INTO "${t}" (${cols.map((c) => `"${c}"`).join(', ')}) VALUES (${cols.map((c) => lit(f[c])).join(', ')});\n`
    h.update(huellaDe(cols, f) + '\n')
    if (tam + linea.length > 20 * 1024 * 1024) { fs.closeSync(salida); archivo++; tam = 0; salida = fs.openSync(`${DIR}/datos-${String(archivo).padStart(2, '0')}.sql`, 'w') }
    fs.writeSync(salida, linea); tam += linea.length
  })
  manifiesto.tablas[t] = { filas: n, huella: h.digest('hex') }
  console.log(' ', t, n)
}
fs.closeSync(salida)
fs.writeFileSync(`${DIR}/manifiesto.json`, JSON.stringify(manifiesto, null, 1))
console.log(`Respaldo en ${DIR}: ${orden.length} tablas, ${Object.values(manifiesto.tablas).reduce((s, x) => s + x.filas, 0)} filas`)
