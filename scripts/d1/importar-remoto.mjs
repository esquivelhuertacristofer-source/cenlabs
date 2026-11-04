// Importa d1/esquema.sql y <DIR>/datos-*.sql a una D1 REMOTA por la API /query (la de import
// rechaza el token OAuth de wrangler). Reanudable: guarda el avance en <DIR>/avance-<base>.json.
//   BASE_D1=<id> DIR=<carpeta> node scripts/d1/importar-remoto.mjs <carpeta>/esquema.sql   → esquema
//   BASE_D1=<id> DIR=<carpeta> node scripts/d1/importar-remoto.mjs                         → datos
// BASE_D1 es obligatorio (antes caía en el piloto por omisión) y el avance es por base: con uno
// solo por carpeta, importar la misma carpeta a una segunda base se «saltaba» todo y la dejaba
// vacía. El esquema solo entra en una base sin tablas.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CUENTA = '226aa1ea2896760a5b68180a66c3170f'
const BASE_D1 = process.env.BASE_D1
if (!/^[0-9a-f-]{36}$/.test(BASE_D1 ?? '')) throw new Error('BASE_D1=<id de la base> es obligatorio (npx wrangler d1 list)')
const DIR = process.env.DIR ?? '.export'
const toml = fs.readFileSync(path.join(os.homedir(), 'AppData/Roaming/xdg.config/.wrangler/config/default.toml'), 'utf8')
const token = toml.match(/oauth_token\s*=\s*"([^"]+)"/)[1]
const url = `https://api.cloudflare.com/client/v4/accounts/${CUENTA}/d1/database/${BASE_D1}/query`
const info = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CUENTA}/d1/database/${BASE_D1}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).catch(() => null)
if (!info?.success) throw new Error('No se encontró esa base (¿id mal copiado o sesión de wrangler caducada?)')
console.log(`Base: ${info.result.name} · carpeta: ${DIR}`)

async function ejecutar(sql) {
  for (let i = 0; i < 5; i++) {
    const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ sql }) })
    const j = await r.json().catch(() => ({}))
    if (r.ok && j.success) return j
    const msg = JSON.stringify(j.errors ?? r.status).slice(0, 300)
    if (r.status >= 500 || r.status === 429) { await new Promise((s) => setTimeout(s, 2000 * (i + 1))); continue }
    throw new Error(msg)
  }
  throw new Error('reintentos agotados')
}

const avancePath = `${DIR}/avance-${BASE_D1}.json`
const avance = fs.existsSync(avancePath) ? JSON.parse(fs.readFileSync(avancePath, 'utf8')) : {}
const archivos = process.argv[2] ? [process.argv[2]] : fs.readdirSync(DIR).filter((f) => /^datos-\d+\.sql$/.test(f)).sort().map((f) => `${DIR}/${f}`)
if (archivos.some((a) => a.endsWith('esquema.sql')) && !avance[archivos[0]]) {
  const tablas = (await ejecutar(`SELECT count(*) AS n FROM sqlite_master WHERE type = 'table' AND name NOT LIKE '\\_cf\\_%' ESCAPE '\\' AND name NOT LIKE 'sqlite\\_%' ESCAPE '\\'`)).result[0].results[0].n
  if (tablas > 0) throw new Error(`${info.result.name} ya tiene ${tablas} tablas: el esquema solo se importa en una base nueva. No se tocó nada.`)
}
const TOPE = 800_000
let total = 0
for (const a of archivos) {
  const texto = fs.readFileSync(a, 'utf8')
  // DDL: sentencias separadas por línea en blanco; datos: una sentencia por línea.
  const sentencias = a.endsWith('esquema.sql') ? texto.split(/;\s*\n/).map((s) => s.trim()).filter((s) => s && !/^--[^\n]*$/.test(s)).map((s) => s + ';')
    : texto.split('\n').filter(Boolean)
  let i = avance[a] ?? 0
  while (i < sentencias.length) {
    let lote = '', j = i
    while (j < sentencias.length && (lote.length + sentencias[j].length < TOPE || j === i)) lote += sentencias[j++] + '\n'
    await ejecutar(lote)
    total += j - i
    i = j
    avance[a] = i
    fs.writeFileSync(avancePath, JSON.stringify(avance))
  }
  console.log(a, sentencias.length, 'sentencias')
}
console.log('total', total)
