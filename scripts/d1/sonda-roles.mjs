// =============================================================================
// Sonda por rol del piloto D1 de Labs: entra por el LOGIN REAL con las cuentas sintéticas
// (.export/carga.json, dominio .invalid) y, para cada rol, visita cada ruta protegida:
// anota a dónde termina (guardias de rol), cuántas peticiones hace a /api/datos y al resto
// del sitio, y los errores de consola. NUNCA contra producción: exige BASE con
// 127.0.0.1/localhost o *.workers.dev.
//   BASE=http://127.0.0.1:3012 node scripts/d1/sonda-roles.mjs
// No imprime la clave ni datos: solo rutas, conteos y mensajes de error truncados.
// =============================================================================
import fs from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire('C:/Users/crist/Desktop/nem-d1/package.json')
const { chromium } = require('playwright')

const BASE = process.env.BASE ?? 'http://127.0.0.1:3012'
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$|^https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev$/.test(BASE)) throw new Error(`BASE no permitida: ${BASE}`)
const c = JSON.parse(fs.readFileSync('.export/carga.json', 'utf8'))
const cuentas = [
  { rol: 'alumno', email: c.correos[0], inicio: '/alumno/inicio' },
  { rol: 'alumno sin grupo', email: c.alumnoSinGrupo, inicio: '/alumno/inicio' },
  { rol: 'alumno en dos grupos', email: c.correos[299], inicio: '/alumno/inicio' },
  { rol: 'docente', email: c.docente, inicio: '/' },
  { rol: 'docente sin grupos', email: c.docenteSinGrupos, inicio: '/' },
  { rol: 'admin', email: c.admin, inicio: '/admin/usuarios' },
]
const RUTAS = ['/', '/alumnos', '/auditoria', '/laboratorios', '/planeamiento', '/alumno/inicio', '/admin/usuarios']
const ESPERA = Number(process.env.ESPERA ?? 4000)

// Reanudable: guarda tras cada ruta y salta las cuentas ya hechas (SONDA_NUEVA=1 empieza de cero).
const ARCH = ".export/sonda-roles.json"
const salida = !process.env.SONDA_NUEVA && fs.existsSync(ARCH) ? JSON.parse(fs.readFileSync(ARCH, "utf8")) : []
const guardar = () => { fs.mkdirSync(".export", { recursive: true }); fs.writeFileSync(ARCH, JSON.stringify(salida, null, 1)) }
const hechas = (rol) => salida.filter((s) => s.rol === rol).length === RUTAS.length + 1
const inicio = Date.now(), LIMITE = Number(process.env.LIMITE_S ?? 480) * 1000
const nav = await chromium.launch()
for (const cu of cuentas) {
  if (hechas(cu.rol)) continue
  if (Date.now() - inicio > LIMITE) { console.log("pausa por tiempo; corre otra vez para seguir"); break }
  for (let i = salida.length - 1; i >= 0; i--) if (salida[i].rol === cu.rol) salida.splice(i, 1)
  const ctx = await nav.newContext()
  const pg = await ctx.newPage()
  let datos = 0, otras = 0, fallidas = 0
  const errores = []
  pg.on('request', (r) => { const u = new URL(r.url()); if (u.origin !== new URL(BASE).origin) return; if (u.pathname === '/api/datos') datos++; else otras++ })
  pg.on('response', (r) => { if (r.status() >= 400 && new URL(r.url()).origin === new URL(BASE).origin) fallidas++ })
  pg.on('console', (m) => { if (m.type() === 'error') errores.push(m.text().slice(0, 140)) })
  pg.on('pageerror', (e) => errores.push(`pageerror ${String(e.message).slice(0, 140)}`))
  const reset = () => { datos = 0; otras = 0; fallidas = 0; errores.length = 0 }

  // Login real
  await pg.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 120000 })
  // En dev, un clic antes de la hidratación se pierde: se reintenta hasta que el botón se habilita.
  // Aviso de privacidad: la casilla es sr-only; se marca con clic en su etiqueta, como el usuario.
  const casilla = pg.locator('input[type="checkbox"]').first(), boton = pg.locator('button[type="submit"]')
  for (let i = 0; i < 30 && !(await boton.isEnabled()); i++) {
    await pg.fill('input[placeholder="usuario@institucion.edu"]', cu.email)
    await pg.fill('input[placeholder="••••••••"]', c.clave)
    if (!(await casilla.isChecked())) await pg.locator('label:has(input[type="checkbox"])').first().click()
    await pg.waitForTimeout(1000)
    if (!(await boton.isEnabled()) && (await casilla.isChecked())) await pg.locator('label:has(input[type="checkbox"])').first().click()
  }
  reset()
  await pg.click('button[type="submit"]')
  await pg.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 60000 }).catch(() => {})
  await pg.waitForLoadState('networkidle').catch(() => {})
  await pg.waitForTimeout(ESPERA)
  const tras = new URL(pg.url()).pathname
  salida.push({ rol: cu.rol, ruta: 'login →', final: tras, ok: tras === cu.inicio, datos, otras, fallidas, errores: [...errores] })

  for (const r of RUTAS) {
    reset()
    await pg.goto(`${BASE}${r}`, { waitUntil: 'networkidle', timeout: 120000 }).catch(() => {})
    await pg.waitForTimeout(ESPERA)
    salida.push({ rol: cu.rol, ruta: r, final: new URL(pg.url()).pathname, datos, otras, fallidas, errores: [...errores] })
    guardar()
  }
  await ctx.close()
}
await nav.close()
guardar()
console.log('rol'.padEnd(20), 'ruta'.padEnd(16), 'termina en'.padEnd(18), 'datos', 'otras', '4xx/5xx', 'errores')
for (const s of salida) console.log(s.rol.padEnd(20), s.ruta.padEnd(16), (s.final + (s.ok === false ? ' ✗' : '')).padEnd(18), String(s.datos).padStart(5), String(s.otras).padStart(5), String(s.fallidas).padStart(7), s.errores.length ? s.errores[0] : '')
