// =============================================================================
// Paso de la ventana del cambio de LABS: desplegar la versión D1 (copia de Financiera, 2026-11-03).
//   node scripts/d1/desplegar-produccion.mjs --seco      → revisa wrangler.produccion.jsonc; NO despliega
//   node scripts/d1/desplegar-produccion.mjs --ensayo    → revisa y despliega al ENSAYO (labs-d1-ensayo)
//   node scripts/d1/desplegar-produccion.mjs --ventana   → revisa y despliega a PRODUCCIÓN (cen-dashboard).
//                                                         Solo en la ventana y con el visto bueno del usuario.
// Antes (en la misma carpeta): npm run lint && npm run cf:build. Este script no construye.
//
// Comprueba lo que a mano se olvida:
//   · la configuración: nombre, las 2 rutas del dominio (solo producción), id real de la base
//     (no PENDIENTE), el KV de siempre, frenos con espacios propios (93021–93023);
//   · la base es la que dice ser y NO está vacía (con una base vacía nadie entraría);
//   · el paquete es de las últimas 3 h y no lleva secretos (revisar-paquete.mjs);
//   · en producción: la versión activa es la del regreso anotado en wrangler.produccion.jsonc
//     (si alguien desplegó otra, el regreso apuntaría a una versión vieja).
// El secreto de sesiones se genera aquí, NUEVO (nunca el del piloto), en JSON y sin «$», con
// SESION_SECRETO quitado del entorno, y se sube en el MISMO despliegue (--secrets-file): una
// versión sin secreto deja el sitio sin login, y en el ensayo del 2026-11-03 un regreso a la
// versión desplegada antes de subir el secreto aparte lo dejó así. El archivo vive en la carpeta
// temporal y se borra al terminar.
// SE RETIRA SOLO (10d.14): tras un --ventana bueno deja scripts/d1/.desplegar-produccion-retirado.
// Repetir --ventana generaría OTRO secreto y sacaría a todos; después del cambio se despliega
// con «npm run deploy».
// =============================================================================
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'

const MODO = ['--seco', '--ensayo', '--ventana'].find((m) => process.argv.includes(m))
if (!MODO) {
  console.log('uso: node scripts/d1/desplegar-produccion.mjs --seco | --ensayo | --ventana   (lee el encabezado antes)')
  process.exit(1)
}
const RETIRO = 'scripts/d1/.desplegar-produccion-retirado'
if (MODO === '--ventana' && fs.existsSync(RETIRO)) {
  console.log(`RETIRADO: ${fs.readFileSync(RETIRO, 'utf8').trim()}\nPara desplegar producción ahora: npm run deploy.`)
  process.exit(1)
}
const PROD = MODO !== '--ensayo'
const CONFIG = PROD ? 'wrangler.produccion.jsonc' : 'wrangler.ensayo.jsonc'
const NOMBRE = PROD ? 'cen-dashboard' : 'labs-d1-ensayo'
const BASE = PROD ? 'labs-produccion' : 'labs-d1-ensayo'
const CUENTA = '226aa1ea2896760a5b68180a66c3170f'
const leerToken = () => process.env.CF_API_TOKEN ?? fs.readFileSync(path.join(os.homedir(), 'AppData/Roaming/xdg.config/.wrangler/config/default.toml'), 'utf8').match(/oauth_token\s*=\s*"([^"]+)"/)[1]
spawnSync('npx', ['wrangler', 'whoami'], { stdio: 'ignore', shell: true }) // renueva la sesión OAuth si caducó
const token = leerToken()
const api = (ruta, init = {}) => fetch(`https://api.cloudflare.com/client/v4/accounts/${CUENTA}${ruta}`, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }).then((r) => r.json()).catch(() => null)

let fallos = 0
const ok = (c, m) => { console.log(c ? '  ✓' : '  ✗', m); if (!c) fallos++ }

console.log(`1. ${CONFIG}`)
const crudo = fs.readFileSync(CONFIG, 'utf8')
const conf = crudo.replace(/^\s*\/\/.*$/gm, '')
const idBase = new RegExp(`"database_name":\\s*"${BASE}",\\s*"database_id":\\s*"([^"]+)"`).exec(conf)?.[1]
ok(new RegExp(`^\\s*"name":\\s*"${NOMBRE}",`, 'm').test(conf), `nombre ${NOMBRE}`)
ok(new RegExp(`"service":\\s*"${NOMBRE}"`).test(conf), 'la autorreferencia de OpenNext lleva el mismo nombre')
ok(/^[0-9a-f-]{36}$/.test(idBase ?? ''), `id real de la base ${BASE} (${idBase})`)
ok(/"main":\s*"worker\.ts"/.test(conf), 'main = worker.ts (los frenos y la cookie de dispositivo)')
if (PROD) {
  const rutas = [...conf.matchAll(/"pattern":\s*"(www\.)?cenlaboratorios\.com\.mx",\s*"custom_domain":\s*true/g)].length
  ok(rutas === 2, `las 2 rutas del dominio (hay ${rutas})`)
  ok(/"NEXT_INC_CACHE_KV",\s*"id":\s*"0da92b588ccb44aa9af534d2596f541b"/.test(conf), 'el KV de caché de siempre')
  ok(/"namespace_id":\s*"9302[1-3]"/.test(conf) && !/"namespace_id":\s*"930[01][1-3]"/.test(conf), 'frenos con espacios propios de producción (93021–93023)')
  ok(!/0d75ce94|f7d74fd0|c12796fe|ea0beee8/.test(conf), 'ningún recurso del piloto ni del ensayo')
} else ok(!/"routes"/.test(conf), 'el ensayo no tiene rutas al dominio')

console.log('2. La base')
if (/^[0-9a-f-]{36}$/.test(idBase ?? '')) {
  const info = await api(`/d1/database/${idBase}`)
  ok(info?.result?.name === BASE, `la base se llama ${BASE} (${info?.result?.name})`)
  const q = await api(`/d1/database/${idBase}/query`, { method: 'POST', body: JSON.stringify({ sql: 'SELECT (SELECT count(*) FROM auth_users) AS usuarios, (SELECT count(*) FROM profiles) AS perfiles, (SELECT count(*) FROM intentos) AS intentos' }) })
  const n = q?.result?.[0]?.results?.[0]
  ok(n?.usuarios > 0 && n?.perfiles > 0, `la base NO está vacía (${n ? `${n.usuarios} usuarios, ${n.perfiles} perfiles, ${n.intentos} intentos` : 'no se pudo leer'})`)
} else ok(false, 'base: sin id real, no se puede revisar')

console.log('3. El paquete')
const handler = '.open-next/server-functions/default/handler.mjs'
const edad = fs.existsSync(handler) ? (Date.now() - fs.statSync(handler).mtimeMs) / 3600_000 : Infinity
ok(edad < 3, `build de las últimas 3 h (${Number.isFinite(edad) ? `${edad.toFixed(1)} h` : 'no hay build'})`)
ok(spawnSync(process.execPath, ['scripts/d1/revisar-paquete.mjs'], { stdio: 'inherit' }).status === 0, 'sin secretos dentro')

const regreso = /rollback ([0-9a-f-]{36}) --name cen-dashboard/.exec(crudo)?.[1]
if (PROD) {
  console.log('4. El regreso')
  ok(!!regreso, `anotado en ${CONFIG} (${regreso ?? 'no está'})`)
  // Solo lee (deployments list). Formato de wrangler 4.155: [{ created_on, versions: [{ version_id, percentage }] }].
  const r = spawnSync('npx', ['wrangler', 'deployments', 'list', '--name', 'cen-dashboard', '--json'], { encoding: 'utf8', shell: true })
  const activa = (() => { try { return JSON.parse(r.stdout).sort((x, y) => x.created_on.localeCompare(y.created_on)).at(-1).versions.sort((x, y) => y.percentage - x.percentage)[0].version_id } catch { return null } })()
  ok(activa && activa === regreso, `la versión activa de producción es la del regreso (${activa ?? 'no se pudo leer'} / ${regreso})`)
}

if (MODO === '--seco') {
  console.log(`\n--seco: ${fallos ? `${fallos} revisión(es) no pasan (con el id PENDIENTE y sin build reciente es lo esperado antes de la ventana)` : 'todo listo para la ventana'}. No se desplegó nada.`)
  process.exit(0)
}
if (fallos) {
  console.log(`\n${fallos} revisión(es) fallaron. NO se desplegó nada.`)
  process.exit(1)
}

const entorno = Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== 'SESION_SECRETO'))
console.log(`5. Desplegar ${NOMBRE} (con el secreto en el mismo despliegue)`)
const archivo = path.join(os.tmpdir(), `labs-secreto-${crypto.randomBytes(6).toString('hex')}.json`)
try {
  fs.writeFileSync(archivo, JSON.stringify({ SESION_SECRETO: crypto.randomBytes(32).toString('base64url') }), { mode: 0o600 })
  const r = spawnSync('npx', ['opennextjs-cloudflare', 'deploy', '-c', CONFIG, '--secrets-file', `"${archivo}"`], { stdio: 'inherit', shell: true, env: entorno })
  if (r.status !== 0) { console.log(`\nEl despliegue falló. ${NOMBRE} sigue como estaba (wrangler no cambia nada si falla).`); process.exit(1) }
} finally {
  fs.rmSync(archivo, { force: true })
}
console.log(`\nDesplegado ${NOMBRE}.`)
if (PROD) {
  fs.writeFileSync(RETIRO, `desplegar-produccion --ventana ya se corrió el ${new Date().toISOString()}.\n`)
  console.log(`Retirado: ${RETIRO}.\nSi algo falla ANTES de que alguien escriba en D1: npx wrangler rollback ${regreso} --name cen-dashboard`)
}
