// =============================================================================
// Recarga la D1 LOCAL (miniflare, .wrangler/state) desde la exportación:
//   node scripts/d1/recargar-local.mjs
// Borra las tablas con SQL (no el .sqlite: en Windows la vista previa lo tiene abierto),
// luego carga d1/esquema.sql y .export/datos-*.sql. Nunca toca la D1 remota (--local fijo).
// =============================================================================
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const wr = (args) => execFileSync('npx', ['wrangler', 'd1', 'execute', 'labs-d1', '--local', ...args], { encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'pipe'] })
const tablas = JSON.parse(wr(['--json', '--command', `"SELECT type, name FROM sqlite_master WHERE type IN ('table','trigger','view') AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'"`]))[0].results
  // Primero triggers y vistas, y las tablas en orden INVERSO al de creación (hijas antes que
  // madres): D1 local ignora PRAGMA foreign_keys = OFF y el DROP de una hija revisa su FK.
  .reverse().sort((a, b) => (a.type === 'table') - (b.type === 'table')).map((r) => `DROP ${r.type.toUpperCase()} IF EXISTS "${r.name}";`)
if (tablas.length) {
  fs.mkdirSync('.export', { recursive: true })
  fs.writeFileSync('.export/borrar-local.sql', `PRAGMA foreign_keys = OFF;\n${tablas.join('\n')}\n`)
  wr(['--file', '.export/borrar-local.sql'])
}
console.log(`borrados ${tablas.length} objetos (tablas, triggers, vistas)`)
wr(['--file', 'd1/esquema.sql'])
const datos = fs.readdirSync('.export').filter((f) => /^datos-\d+\.sql$/.test(f)).sort()
for (const f of datos) wr(['--file', `.export/${f}`])
const cuenta = JSON.parse(wr(['--json', '--command', `"SELECT (SELECT count(*) FROM auth_users) au, (SELECT count(*) FROM profiles) p, (SELECT count(*) FROM intentos) i, (SELECT count(*) FROM alumnos_grupos) ag, (SELECT count(*) FROM grupos) g, (SELECT count(*) FROM asignaciones) a"`]))[0].results[0]
console.log(`cargados esquema + ${datos.length} archivo(s) de datos:`, cuenta)
