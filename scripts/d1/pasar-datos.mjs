// =============================================================================
// Paso de la ventana del cambio de LABS: Supabase (wbvcclpxxwzkuddjxqig) → D1.
//   Ensayo:   DESTINO=labs-d1-ensayo BASE_D1=<id del ensayo> node scripts/d1/pasar-datos.mjs
//   Ventana:  DESTINO=labs-produccion BASE_D1=<id de labs-produccion> node scripts/d1/pasar-datos.mjs
// (Copia de Financiera, adaptada el 2026-11-03.) Encadena lo del ensayo y se detiene en el primer problema:
//   1. la base destino se llama ${DESTINO} y está VACÍA (sin tablas);
//   2. exportar: una sola transacción READ ONLY en Supabase (exportar.mjs), a una carpeta nueva;
//   3. generar el esquema y los datos (generar.mjs);
//   4. el esquema y las reglas de acceso deben ser IDÉNTICOS a los probados (d1/esquema.sql y
//      src/lib/d1/esquema.gen.ts, con los que se construyó y probó el código). Si producción
//      cambió una tabla o una política desde el ensayo, se para ANTES de escribir nada en D1;
//   5. importar el esquema y los datos (importar-remoto.mjs);
//   6. integridad fila por fila (verificar-integridad.mjs): todas idénticas o se para.
// Si se para, no pasó nada en producción: el sitio sigue en Supabase.
//
// SE RETIRA SOLO (manual 10d.14): al terminar bien contra labs-produccion deja
// scripts/d1/.pasar-datos-retirado y ya no corre contra producción. Repetido después del
// cambio, PISARÍA la base nueva (con los intentos que los alumnos ya guardaron en D1) con los
// datos viejos de Supabase. El ensayo no lo retira.
// =============================================================================
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const CUENTA = '226aa1ea2896760a5b68180a66c3170f'
const RETIRO = 'scripts/d1/.pasar-datos-retirado'
const BASE_D1 = process.env.BASE_D1
const DESTINO = process.env.DESTINO ?? 'labs-produccion'
if (!['labs-produccion', 'labs-d1-ensayo'].includes(DESTINO)) throw new Error(`DESTINO no permitido: ${DESTINO}`)
if (DESTINO === 'labs-produccion' && fs.existsSync(RETIRO)) {
  console.log(`RETIRADO: ${fs.readFileSync(RETIRO, 'utf8').trim()}\nRepetirlo pisaría labs-produccion con los datos viejos de Supabase. No se hizo nada.`)
  process.exit(1)
}
if (!/^[0-9a-f-]{36}$/.test(BASE_D1 ?? '')) throw new Error(`BASE_D1=<id de ${DESTINO}> es obligatorio (npx wrangler d1 list)`)
// La conexión de Supabase vive fuera de git, en .export/labs.env (la dio el usuario).
const ENV_ORIGEN = process.env.ENV_ORIGEN ?? '.export/labs.env'
const DIR = `.export/${DESTINO === 'labs-d1-ensayo' ? 'ensayo' : 'cambio'}-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}`
const token = fs.readFileSync(path.join(os.homedir(), 'AppData/Roaming/xdg.config/.wrangler/config/default.toml'), 'utf8').match(/oauth_token\s*=\s*"([^"]+)"/)[1]
const api = (ruta, init = {}) => fetch(`https://api.cloudflare.com/client/v4/accounts/${CUENTA}/d1/database/${BASE_D1}${ruta}`, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }).then((r) => r.json()).catch(() => null)
const t0 = Date.now()
const reloj = () => `${Math.round((Date.now() - t0) / 1000)} s`
function parar(motivo) {
  console.log(`\nALTO (${reloj()}): ${motivo}\nProducción no cambió: el sitio sigue en Supabase.`)
  process.exit(1)
}
function correr(titulo, script, args = []) {
  console.log(`\n── ${titulo} (${reloj()})`)
  const r = spawnSync(process.execPath, [script, ...args], { stdio: 'inherit', env: { ...process.env, DIR, BASE_D1, ENV_ORIGEN } })
  if (r.status !== 0) parar(`${titulo} falló`)
}

console.log('── 1. La base destino')
const info = await api('')
if (info?.result?.name !== DESTINO) parar(`la base ${BASE_D1} se llama «${info?.result?.name ?? '¿?'}», no ${DESTINO} (¿sesión de wrangler caducada? npx wrangler whoami)`)
const tablas = (await api('/query', { method: 'POST', body: JSON.stringify({ sql: "SELECT count(*) AS n FROM sqlite_master WHERE type = 'table' AND name NOT LIKE '\\_cf\\_%' ESCAPE '\\' AND name NOT LIKE 'sqlite\\_%' ESCAPE '\\'" }) }))?.result?.[0]?.results?.[0]?.n
if (tablas !== 0) parar(`${DESTINO} debe estar vacía y tiene ${tablas ?? '¿?'} tablas`)
console.log(`  ✓ ${DESTINO}, vacía · carpeta ${DIR}`)
fs.mkdirSync(DIR, { recursive: true })

correr('2. Exportar de Supabase (solo lectura)', 'scripts/d1/exportar.mjs')
correr('3. Generar esquema y datos', 'scripts/d1/generar.mjs')

console.log(`\n── 4. ¿El esquema de producción es el probado? (${reloj()})`)
const sinFecha = (f) => fs.readFileSync(f, 'utf8').replace(/^-- Generado por .*\n/, '')
if (sinFecha(`${DIR}/esquema.sql`) !== sinFecha('d1/esquema.sql')) parar(`el esquema cambió desde el ensayo (compara ${DIR}/esquema.sql con d1/esquema.sql)`)
if (fs.readFileSync(`${DIR}/esquema.gen.ts`, 'utf8') !== fs.readFileSync('src/lib/d1/esquema.gen.ts', 'utf8')) parar(`los tipos o las reglas de acceso cambiaron desde el ensayo (compara ${DIR}/esquema.gen.ts con src/lib/d1/esquema.gen.ts)`)
console.log('  ✓ esquema y reglas de acceso idénticos a los probados')

correr('5a. Importar el esquema', 'scripts/d1/importar-remoto.mjs', [`${DIR}/esquema.sql`])
correr('5b. Importar los datos', 'scripts/d1/importar-remoto.mjs')
correr('6. Integridad fila por fila', 'scripts/d1/verificar-integridad.mjs')

if (DESTINO === 'labs-produccion') {
  fs.writeFileSync(RETIRO, `pasar-datos ya se corrió contra labs-produccion el ${new Date().toISOString()} (carpeta ${DIR}).\n`)
  console.log(`\nRetirado: ${RETIRO}. Ya no corre contra producción.`)
}
console.log(`\nListo en ${reloj()}: ${DESTINO} tiene exactamente lo que había en Supabase.`)
