// =============================================================================
// Último paso de la ventana de LABS: Desktop\labs-d1 pasa a ser LA carpeta de producción y las
// viejas (scratch\Proyecto LABS\cen-dashboard y su worktree cen-deploy) quedan bloqueadas por
// todos lados (manual 10e.20). Modelo Financiera, decisión del usuario del 2026-11-03.
//   node scripts/d1/cambiar-carpeta.mjs             → en seco: revisa y dice qué haría; no toca nada
//   node scripts/d1/cambiar-carpeta.mjs --aplicar   → lo hace (solo en la ventana, después de
//                                                     desplegar-produccion --ventana, con el visto bueno)
//
// En labs-d1:
//   · wrangler.jsonc (piloto) → wrangler.piloto.jsonc; wrangler.produccion.jsonc → wrangler.jsonc.
//     NUNCA al revés ni copiando: con el wrangler del piloto en la carpeta de producción, cada
//     despliegue iría al piloto y producción se congelaría sin ningún error (trampa del encargo);
//   · «npm run deploy» = lint + build + revisar-paquete + deploy -c wrangler.jsonc.
//   · el push sigue anulado: reactivarlo es decisión del usuario (se imprime el comando).
// En cada carpeta vieja:
//   · `deploy:cf` termina con un mensaje que dice dónde está producción;
//   · su wrangler.jsonc pierde el nombre y las rutas de producción (workers_dev: false, sin routes);
//   · el push se anula (git remote set-url --push origin NO-PUSH--…; el worktree comparte config);
//   · las llaves de Supabase (.env.local, .env.production, .dev.vars) se apartan en
//     .env.supabase-archivo-* (git ya ignora .env*), y se agrega por si acaso a .gitignore;
//   · un aviso al inicio de CLAUDE.md, AGENTS.md y README.md.
// Cada archivo que se toca se respalda ANTES, fuera de los proyectos:
//   Desktop\labs-respaldo-cambio-d1\<fecha>\<carpeta>\…   (dentro, el build y TypeScript lo leerían).
// No borra nada. Los 163 archivos sin commit de Mecánica 261–270 en cen-dashboard NO se tocan:
// qué pasa con ellos lo decide el usuario (congelación de contenido) ANTES de la ventana.
// SE RETIRA SOLO: tras --aplicar deja scripts/d1/.cambiar-carpeta-retirado.
// =============================================================================
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const APLICAR = process.argv.includes('--aplicar')
// --parcial (decisión del usuario, ventana del 2026-11-03): Codex sigue terminando labs en
// cen-dashboard hasta el día siguiente. Se bloquea TODO despliegue desde las carpetas viejas (lo
// que pondría a producción otra vez en Supabase) pero se le dejan sus llaves locales, su servidor
// del puerto 3011 y el push a GitHub (que no despliega nada). Cuando termine, se corre sin
// --parcial: cada paso revisa si ya está hecho y solo hace lo que falta.
const PARCIAL = process.argv.includes('--parcial')
const MARCA_PARCIAL = 'scripts/d1/.cambiar-carpeta-parcial'
const RETIRO = 'scripts/d1/.cambiar-carpeta-retirado'
if (fs.existsSync(RETIRO)) { console.log(`RETIRADO: ${fs.readFileSync(RETIRO, 'utf8').trim()}`); process.exit(1) }
// CAMBIO_PRUEBA=<carpeta>: ensayo del script sobre COPIAS (cwd = copia de labs-d1,
// <carpeta>/viejas = copias de las viejas con .env falsos; no toca git).
const PRUEBA = process.env.CAMBIO_PRUEBA
const AQUI = process.cwd().replace(/\\/g, '/')
if (!PRUEBA && !/\/Desktop\/labs-d1$/.test(AQUI)) throw new Error(`correr desde Desktop\\labs-d1 (estoy en ${AQUI})`)
const VIEJA = PRUEBA ? `${PRUEBA}/viejas` : 'C:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS'
const VIEJAS = ['cen-dashboard', 'cen-deploy'].map((n) => `${VIEJA}/${n}`)
const RESPALDO = `${PRUEBA ? `${PRUEBA}/respaldo` : 'C:/Users/crist/Desktop/labs-respaldo-cambio-d1'}/${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}`
const AVISO_PARCIAL = '> **NO SE DESPLIEGA DESDE AQUÍ (cambio a D1, 2026-11-03).** Producción de CEN Laboratorios corre sobre D1 y se despliega desde `C:\\Users\\crist\\Desktop\\labs-d1`. Desplegar desde esta carpeta regresaría producción a Supabase. Los labs que se terminen aquí: commit y avisar al usuario; Claude los pasa a labs-d1 y los despliega.\n\n'
const AVISO = '> **CARPETA RETIRADA (cambio a D1).** Producción de CEN Laboratorios se despliega desde `C:\\Users\\crist\\Desktop\\labs-d1`. Aquí no se despliega, no se hace push y no se trabaja.\n\n'

let fallos = 0
const ok = (c, m) => { console.log(c ? '  ✓' : '  ✗', m); if (!c) fallos++ }
const acciones = []
const hacer = (desc, fn) => acciones.push({ desc, fn })
const respaldar = (archivo) => {
  // <carpeta del proyecto>/<archivo> (labs-d1/…, cen-dashboard/…, cen-deploy/…)
  const rel = archivo.split('/').slice(-2).join('/')
  const dest = path.join(RESPALDO, rel)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(archivo, dest)
}

console.log('1. Requisitos')
ok(fs.existsSync('scripts/d1/.desplegar-produccion-retirado'), 'producción ya se desplegó con D1 (desplegar-produccion --ventana retirado)')
const prod = fs.existsSync('wrangler.produccion.jsonc') ? fs.readFileSync('wrangler.produccion.jsonc', 'utf8') : ''
const yaCambiado = !prod && fs.existsSync('wrangler.piloto.jsonc') && /"name":\s*"cen-dashboard"/.test(fs.readFileSync('wrangler.jsonc', 'utf8'))
if (yaCambiado) ok(true, 'los wrangler de labs-d1 ya se cambiaron en una corrida anterior (wrangler.jsonc = producción)')
else {
  ok(/"name":\s*"cen-dashboard"/.test(prod) && !/"database_id":\s*"PENDIENTE"/.test(prod), 'wrangler.produccion.jsonc existe, se llama cen-dashboard y tiene el id real de labs-produccion')
  ok(/"name":\s*"labs-d1"/.test(fs.readFileSync('wrangler.jsonc', 'utf8')), 'el wrangler.jsonc actual es el del piloto')
}
for (const v of VIEJAS) ok(fs.existsSync(`${v}/package.json`), `existe ${v}`)

console.log('\n2. Lo que se haría')
hacer('labs-d1: wrangler.jsonc → wrangler.piloto.jsonc', () => { if (yaCambiado) return; respaldar(`${AQUI}/wrangler.jsonc`); fs.renameSync('wrangler.jsonc', 'wrangler.piloto.jsonc') })
hacer('labs-d1: wrangler.produccion.jsonc → wrangler.jsonc', () => { if (yaCambiado) return; respaldar(`${AQUI}/wrangler.produccion.jsonc`); fs.renameSync('wrangler.produccion.jsonc', 'wrangler.jsonc') })
hacer('labs-d1: «npm run deploy» con compuertas (lint, build, revisar-paquete, deploy -c wrangler.jsonc)', () => {
  respaldar(`${AQUI}/package.json`)
  const p = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  p.scripts.deploy = 'npm run lint && npm run cf:build && node scripts/d1/revisar-paquete.mjs && opennextjs-cloudflare deploy -c wrangler.jsonc'
  p.scripts['deploy:cf'] = 'npm run deploy'
  fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n')
})
for (const v of VIEJAS) {
  const n = path.basename(v)
  hacer(`${n}: deploy:cf termina con un aviso`, () => {
    respaldar(`${v}/package.json`)
    const p = JSON.parse(fs.readFileSync(`${v}/package.json`, 'utf8'))
    for (const k of Object.keys(p.scripts)) if (/deploy|upload/.test(k)) p.scripts[k] = `node -e "console.error('Carpeta retirada: produccion de Labs se despliega desde C:/Users/crist/Desktop/labs-d1');process.exit(1)"`
    fs.writeFileSync(`${v}/package.json`, JSON.stringify(p, null, 2) + '\n')
  })
  hacer(`${n}: wrangler.jsonc sin nombre ni rutas de producción`, () => {
    respaldar(`${v}/wrangler.jsonc`)
    let w = fs.readFileSync(`${v}/wrangler.jsonc`, 'utf8')
    if (/RETIRADO-no-desplegar/.test(w)) return
    w = w.replace(/"name":\s*"cen-dashboard"/, '"name": "cen-dashboard-RETIRADO-no-desplegar"').replace(/"workers_dev":\s*true/, '"workers_dev": false').replace(/\s*"routes":\s*\[[\s\S]*?\],/, '')
    if (/cenlaboratorios|"name":\s*"cen-dashboard"/.test(w.replace(/^\s*\/\/.*$/gm, ''))) throw new Error(`${n}: no se pudo quitar el nombre o las rutas`)
    fs.writeFileSync(`${v}/wrangler.jsonc`, '// RETIRADO: producción de Labs se despliega desde C:\\Users\\crist\\Desktop\\labs-d1.\n' + w)
  })
  if (!PARCIAL) hacer(`${n}: llaves de Supabase apartadas en .env.supabase-archivo-*`, () => {
    for (const f of ['.env.local', '.env.production', '.dev.vars']) if (fs.existsSync(`${v}/${f}`)) { respaldar(`${v}/${f}`); fs.renameSync(`${v}/${f}`, `${v}/.env.supabase-archivo${f.replace(/^\.env|^\.dev\.vars$/, (m) => (m === '.env' ? '' : '-devvars'))}`) }
    const gi = `${v}/.gitignore`
    if (fs.existsSync(gi) && !fs.readFileSync(gi, 'utf8').includes('.env.supabase-archivo')) { respaldar(gi); fs.appendFileSync(gi, '\n# Llaves apartadas en el cambio a D1\n.env.supabase-archivo*\n') }
  })
  hacer(`${n}: aviso al inicio de CLAUDE.md, AGENTS.md y README.md`, () => {
    for (const f of ['CLAUDE.md', 'AGENTS.md', 'README.md']) if (fs.existsSync(`${v}/${f}`)) {
      // Sin repetir avisos: el de la corrida parcial se cambia por el definitivo.
      const t = fs.readFileSync(`${v}/${f}`, 'utf8')
      const sin = t.startsWith(AVISO_PARCIAL) ? t.slice(AVISO_PARCIAL.length) : t.startsWith(AVISO) ? t.slice(AVISO.length) : t
      respaldar(`${v}/${f}`)
      fs.writeFileSync(`${v}/${f}`, (PARCIAL ? AVISO_PARCIAL : AVISO) + sin)
    }
  })
}
if (!PARCIAL) hacer('cen-dashboard (y su worktree): push anulado', () => {
  if (PRUEBA) return
  const r = spawnSync('git', ['-C', VIEJAS[0], 'remote', 'set-url', '--push', 'origin', 'NO-PUSH--se-movio-a-Desktop-labs-d1'], { encoding: 'utf8' })
  if (r.status !== 0) throw new Error(r.stderr)
})
for (const a of acciones) console.log(`  · ${a.desc}`)

if (!APLICAR) {
  console.log(`\nEn seco: ${fallos ? `${fallos} requisito(s) no se cumplen (antes de la ventana es lo esperado)` : 'todo listo'}. No se tocó nada.`)
  process.exit(0)
}
if (fallos) { console.log(`\n${fallos} requisito(s) no se cumplen. No se tocó nada.`); process.exit(1) }
console.log(`\n3. Aplicando (respaldo en ${RESPALDO})`)
for (const a of acciones) { a.fn(); console.log(`  ✓ ${a.desc}`) }
if (PARCIAL) {
  fs.writeFileSync(MARCA_PARCIAL, `parcial ${new Date().toISOString()} (respaldo en ${RESPALDO}). Falta la corrida completa cuando Codex termine.\n`)
  console.log(`\nParcial hecho (${MARCA_PARCIAL}). Cuando Codex termine: node scripts/d1/cambiar-carpeta.mjs --aplicar`)
  process.exit(0)
}
fs.writeFileSync(RETIRO, `cambiar-carpeta --aplicar ya se corrió el ${new Date().toISOString()} (respaldo en ${RESPALDO}).\n`)
console.log(`\nRetirado: ${RETIRO}.`)
console.log('Falta, decisión del usuario: reactivar el push de labs-d1 al repositorio de siempre:')
console.log('  git -C C:/Users/crist/Desktop/labs-d1 remote set-url --push origin https://github.com/esquivelhuertacristofer-source/cenlabs.git')
