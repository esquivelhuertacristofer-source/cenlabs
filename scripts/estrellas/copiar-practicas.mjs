// =============================================================================
// Copia las prácticas de formación industrial (ACT, CTL, PLC, CNC, ELA) a public/estrellas/.
//
//   node scripts/estrellas/copiar-practicas.mjs                 (las de src/lib/estrellas.ts)
//   node scripts/estrellas/copiar-practicas.mjs --solo ACT-01,PLC-20
//   node scripts/estrellas/copiar-practicas.mjs --sin-capturas  (reusa la portada que ya haya)
//   node scripts/estrellas/copiar-practicas.mjs --origen "D:/otra/carpeta/produccion-estrellas"
//
// La lista sale de `src/lib/estrellas.ts` (cada `practica('XXX-NN', …)`): el hub y la copia no
// pueden desalinearse. Es el mismo paquete que se publicó para las siete estrellas:
//   · `para-alumno/index.html` y `para-alumno/app.js` (y `voz/` o `modelos/` si un día los
//     trae) a `public/estrellas/<COD>/`, byte a byte; los `.md` del paquete NO se copian;
//   · la portada `public/estrellas/portadas/<COD>.webp` (960 px, 16:10) se fotografía de la
//     escena 3D de la propia página ya copiada, abierta en Chromium sin internet;
//   · al final, `public/estrellas/huellas.json` se recalcula desde el disco (huellas.mjs).
//
// Compuerta: ANTES de tocar public/ se comprueba cada práctica de la lista con
// `comprobarPaquete` (VERDE con 0 fallos, `manifiesto --comprobar` al día, validación posterior
// al código y para-alumno idéntico al manifiesto). Si una sola falla, no se copia NADA: la lista
// del hub promete esas prácticas y una a medias sería una pestaña rota. El origen es de solo lectura.
// =============================================================================
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import sharp from 'sharp'
import { ORIGEN_POR_DEFECTO, MAX_BYTES, comprobarPaquete, escribirHuellas } from './huellas.mjs'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const DESTINO = path.join(RAIZ, 'public', 'estrellas')
const LISTA_TS = path.join(RAIZ, 'src', 'lib', 'estrellas.ts')
const PLAYWRIGHT = process.env.CEN_PLAYWRIGHT || 'C:/Users/crist/AppData/Roaming/npm/node_modules/playwright'
const ANCHO_PORTADA = 960

const args = process.argv.slice(2)
const valor = (k) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] ? args[i + 1] : null }
const ORIGEN = path.resolve(valor('--origen') || process.env.ESTRELLAS_ORIGEN || ORIGEN_POR_DEFECTO)
const SOLO = valor('--solo')?.split(',').map((x) => x.trim().toUpperCase()) ?? null
const SIN_CAPTURAS = args.includes('--sin-capturas')

const alto = (m) => { console.error(`copiar-practicas: ALTO. ${m} No se copió nada.`); process.exit(1) }

const LISTA = [...fs.readFileSync(LISTA_TS, 'utf8').matchAll(/practica\(\s*'([A-Z]{3}-\d{2})'/g)].map((m) => m[1])
if (LISTA.length === 0) alto(`no encontré ninguna práctica en ${path.relative(RAIZ, LISTA_TS)}.`)
if (new Set(LISTA).size !== LISTA.length) alto('hay códigos repetidos en src/lib/estrellas.ts.')
if (SOLO) for (const c of SOLO) if (!LISTA.includes(c)) alto(`${c} no está en src/lib/estrellas.ts: añádela primero al hub.`)
const COPIAR = SOLO ?? LISTA
if (!fs.existsSync(ORIGEN)) alto(`no existe el origen ${ORIGEN}.`)

// 1. Compuerta de todas, antes de tocar nada.
const validacion = {}
const rechazadas = []
for (const id of COPIAR) {
  const { motivos, validacion: v } = comprobarPaquete(ORIGEN, id)
  if (motivos.length) rechazadas.push(`${id}: ${motivos.join('; ')}`)
  else validacion[id] = v
}
if (rechazadas.length) alto(`estas prácticas no están listas:\n  · ${rechazadas.join('\n  · ')}\nQuítalas de src/lib/estrellas.ts o espera a que su suite quede en VERDE.`)

// 2. Copia byte a byte.
function copiarArchivo(desde, hasta) {
  if (fs.statSync(desde).size > MAX_BYTES) alto(`${desde} pasa de 25 MiB: Cloudflare no lo serviría.`)
  fs.mkdirSync(path.dirname(hasta), { recursive: true })
  fs.copyFileSync(desde, hasta)
}
function copiarCarpeta(desde, hasta) {
  for (const e of fs.readdirSync(desde, { withFileTypes: true })) {
    const a = path.join(desde, e.name)
    const b = path.join(hasta, e.name)
    if (e.isDirectory()) copiarCarpeta(a, b)
    else if (!/\.md$/i.test(e.name)) copiarArchivo(a, b)
  }
}
for (const id of COPIAR) {
  const desde = path.join(ORIGEN, id, 'para-alumno')
  const hasta = path.join(DESTINO, id)
  fs.rmSync(hasta, { recursive: true, force: true })
  copiarArchivo(path.join(desde, 'index.html'), path.join(hasta, 'index.html'))
  copiarArchivo(path.join(desde, 'app.js'), path.join(hasta, 'app.js'))
  for (const sub of ['voz', 'modelos']) if (fs.existsSync(path.join(desde, sub))) copiarCarpeta(path.join(desde, sub), path.join(hasta, sub))
}

// 3. Portadas: foto de la escena 3D de la página copiada (la «demostración» con valores nominales,
//    la misma para todos los alumnos), sin los letreros que flotan sobre ella, recortada a 16:10.
const pendientes = COPIAR.filter((id) => !(SIN_CAPTURAS && fs.existsSync(path.join(DESTINO, 'portadas', `${id}.webp`))))
if (pendientes.length) {
  const { chromium } = createRequire(path.join(PLAYWRIGHT, 'package.json'))('playwright')
  const navegador = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  try {
    for (const id of pendientes) {
      // A 1600×900 la escena mide entre 680×390 y 785×468 px: con escala 1,5 el recorte 16:10 pasa de 960 px
      // de ancho y la portada sale reducida, nunca ampliada.
      const pagina = await navegador.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.5 })
      const errores = []
      pagina.on('pageerror', (e) => errores.push(e.message))
      await pagina.goto(pathToFileURL(path.join(DESTINO, id, 'index.html')).href)
      await pagina.waitForSelector('canvas', { timeout: 30000 })
      await pagina.waitForTimeout(6000)
      const caja = await pagina.evaluate(() => {
        const lienzos = [...document.querySelectorAll('canvas')].filter((c) => c.getBoundingClientRect().width > 300)
        lienzos.sort((a, b) => b.getBoundingClientRect().width * b.getBoundingClientRect().height - a.getBoundingClientRect().width * a.getBoundingClientRect().height)
        const cv = lienzos[0]
        if (!cv) return null
        for (const el of cv.parentElement.querySelectorAll('*')) if (el !== cv && !el.contains(cv)) el.style.visibility = 'hidden'
        const r = cv.getBoundingClientRect()
        return { x: r.x, y: r.y, width: r.width, height: r.height }
      })
      if (!caja) throw new Error(`${id}: la página no pintó la escena 3D`)
      if (errores.length) throw new Error(`${id}: la página dio errores al abrir: ${errores.slice(0, 2).join(' | ')}`)
      const png = await pagina.screenshot({ clip: caja })
      await pagina.close()
      const { width: ancho, height: altoC } = await sharp(png).metadata() // en píxeles reales (×1,5)
      const w = Math.min(ancho, Math.floor(altoC * 1.6)), h = Math.round(w / 1.6)
      if (w < ANCHO_PORTADA) throw new Error(`${id}: la escena mide ${ancho}×${altoC}; el recorte 16:10 queda de ${w} px, menos de ${ANCHO_PORTADA}`)
      const salida = path.join(DESTINO, 'portadas', `${id}.webp`)
      fs.mkdirSync(path.dirname(salida), { recursive: true })
      await sharp(png)
        .removeAlpha()
        .extract({ left: Math.floor((ancho - w) / 2), top: Math.floor((altoC - h) / 2), width: w, height: h })
        .resize({ width: ANCHO_PORTADA, height: ANCHO_PORTADA / 1.6, fit: 'fill' })
        .webp({ quality: 84, effort: 6 })
        .toFile(salida)
      console.log(`portada ${id} · ${(fs.statSync(salida).size / 1024).toFixed(0)} KiB`)
    }
  } finally {
    await navegador.close()
  }
}

// 4. Huellas de todo public/estrellas (estrellas incluidas) desde el disco.
const { archivos } = escribirHuellas(DESTINO, validacion)
for (const id of COPIAR) console.log(`${id} ${validacion[id].version} · ${validacion[id].comprobaciones} comprobaciones`)
const total = Object.values(archivos).reduce((a, v) => a + v.bytes, 0)
console.log(`copiar-practicas: ${COPIAR.length} práctica(s) copiada(s); public/estrellas tiene ${Object.keys(archivos).length} archivos, ${(total / 1048576).toFixed(1)} MiB · huellas.json escrito`)
