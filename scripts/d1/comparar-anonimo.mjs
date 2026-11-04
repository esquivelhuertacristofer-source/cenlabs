// Etapa A — comparación ANÓNIMA producción vs piloto (solo GET, sin cuentas: no escribe nada).
//   node scripts/d1/comparar-anonimo.mjs            # reanuda; corta solo a los ~8.5 min
//   PILOTO=http://127.0.0.1:8790 PROD=https://cenlaboratorios.com.mx  (por omisión)
// Por cada pantalla: HTTP y destino final, texto visible normalizado, errores de JS,
// peticiones ≥ 400, y en los labs el lienzo 3D (tamaño y una captura: un lienzo negro
// comprime a casi nada). Ritmo: una página a la vez por lado, ~2 s entre labs. No es carga.
// Salida: .export/comparar-anonimo/resultados.jsonl (+ capturas de los lienzos).
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire('C:/Users/crist/Desktop/nem-d1/package.json')
const { chromium } = require('playwright')

const PROD = process.env.PROD ?? 'https://cenlaboratorios.com.mx'
const PILOTO = process.env.PILOTO ?? 'http://127.0.0.1:8790'
if (/cenlaboratorios/.test(PILOTO)) throw new Error('PILOTO no puede ser el dominio de producción')
const DIR = process.env.DIR ?? '.export/comparar-anonimo' // otra carpeta por ronda (p. ej. contra el piloto D1)
fs.mkdirSync(`${DIR}/capturas`, { recursive: true })
const OUT = `${DIR}/resultados.jsonl`
const hechos = new Set(fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).ruta) : [])
const LIMITE = Date.now() + 8.5 * 60e3

const FIJAS = ['/', '/login', '/forgot-password', '/reset-password', '/laboratorios', '/alumnos', '/auditoria', '/planeamiento',
  '/alumno/inicio', '/admin/usuarios', '/alumno/laboratorio/mecanica', '/alumno/laboratorio/fisica', '/api/health',
  '/dev/lab/x', '/dev/muestrario-3d', '/manifest.webmanifest', '/sw.js', '/no-existe-xyz']
const LABS = fs.readdirSync('public/labs').filter((f) => f.endsWith('.html')).sort().map((f) => `/labs/${f}`)
// Una muestra de MP3 de voz de cada carpeta (bytes idénticos ya comprobados; aquí: que se SIRVEN).
const VOZ = fs.readdirSync('public/assets/voz').sort().filter((_, i) => i % 15 === 0)
  .map((d) => { const f = fs.readdirSync(`public/assets/voz/${d}`).find((x) => x.endsWith('.mp3')); return f && `/assets/voz/${d}/${f}` }).filter(Boolean)

const norm = (t) => t.replace(/\s+/g, ' ').trim()
async function mide(ctx, base, ruta, esLab) {
  const p = await ctx.newPage()
  const errores = [], fallidas = []
  p.on('pageerror', (e) => errores.push(String(e.message).slice(0, 160)))
  p.on('response', (r) => { if (r.status() >= 400) fallidas.push(`${r.status()} ${r.url().replace(base, '').slice(0, 120)}`) })
  let status = null, final = null, texto = '', lienzo = null
  try {
    const r = await p.goto(base + ruta, { waitUntil: 'load', timeout: 45e3 })
    status = r?.status() ?? null
    final = p.url().replace(base, '')
    await p.waitForTimeout(esLab ? 5000 : 1200)
    texto = norm(await p.evaluate(() => document.body?.innerText ?? ''))
    if (esLab) {
      lienzo = await p.evaluate(() => { const c = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0]; return c ? { w: c.width, h: c.height, n: document.querySelectorAll('canvas').length } : null })
      if (lienzo?.w > 50) {
        const png = await p.locator('canvas').first().screenshot({ timeout: 10e3 }).catch(() => null)
        if (png) { lienzo.png = png.length; fs.writeFileSync(`${DIR}/capturas/${(base === PROD ? 'prod' : 'piloto')}_${path.basename(ruta, '.html')}.png`, png) }
      }
    }
  } catch (e) { errores.push('NAVEGACION: ' + String(e.message).slice(0, 120)) }
  await p.close()
  return { status, final, texto, errores, fallidas, lienzo }
}

const nav = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
const cP = await nav.newContext({ viewport: { width: 1280, height: 800 } })
const cL = await nav.newContext({ viewport: { width: 1280, height: 800 } })
let n = 0
for (const ruta of [...FIJAS, ...VOZ, ...LABS]) {
  if (hechos.has(ruta)) continue
  if (Date.now() > LIMITE) { console.log(`pausa por tiempo: ${n} nuevas; corre otra vez para seguir`); break }
  const esLab = ruta.startsWith('/labs/')
  let a, b
  if (ruta.startsWith('/assets/voz/')) {
    const g = async (base) => { const r = await fetch(base + ruta); const buf = Buffer.from(await r.arrayBuffer()); return { status: r.status, final: ruta, texto: `${r.headers.get('content-type')} ${buf.length}`, errores: [], fallidas: [] } }
    ;[a, b] = await Promise.all([g(PROD), g(PILOTO)])
  } else {
    ;[a, b] = await Promise.all([mide(cP, PROD, ruta, esLab), mide(cL, PILOTO, ruta, esLab)])
  }
  const fila = {
    ruta, prod: { ...a, texto: undefined, largo: a.texto.length }, piloto: { ...b, texto: undefined, largo: b.texto.length },
    mismoTexto: a.texto === b.texto, mismoStatus: a.status === b.status, mismoFinal: a.final === b.final,
    textoProd: a.texto === b.texto ? undefined : a.texto.slice(0, 1500), textoPiloto: a.texto === b.texto ? undefined : b.texto.slice(0, 1500),
  }
  fs.appendFileSync(OUT, JSON.stringify(fila) + '\n')
  n++
  if (esLab) await new Promise((r) => setTimeout(r, 1500))
}
await nav.close()
const todas = fs.readFileSync(OUT, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
console.log(`hechas ${todas.length}/${FIJAS.length + VOZ.length + LABS.length}`)
