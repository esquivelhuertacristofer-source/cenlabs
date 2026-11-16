// =============================================================================
// Copia las siete prácticas estrella (Ingeniería Avanzada) a public/estrellas/.
//
//   node scripts/estrellas/copiar-estrellas.mjs
//   node scripts/estrellas/copiar-estrellas.mjs --origen "D:/otra/carpeta/produccion-estrellas"
//
// Qué hace, por cada E1…E7:
//   · copia `para-alumno/index.html`, `para-alumno/app.js` y, si existe, `para-alumno/modelos/`
//     a `public/estrellas/E#/` (los `.md` del paquete NO se copian: son para el docente);
//   · genera la portada `public/estrellas/portadas/E#.webp` (960 px de ancho como máximo)
//     recortando la escena 3D de una captura de la propia práctica;
//   · al final escribe `public/estrellas/huellas.json` con el SHA-256 de cada archivo.
//
// Se puede correr las veces que haga falta: cada carpeta E# se borra y se vuelve a copiar, así
// que un archivo que desaparezca del paquete no se queda viejo en public/. El origen es de solo
// lectura: de ahí únicamente se lee.
//
// Las prácticas se sirven como archivos estáticos (igual que /labs/*.html): Cloudflare no acepta
// archivos de más de 25 MiB, así que el script se detiene si alguno lo rebasa.
// =============================================================================
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const DESTINO = path.join(RAIZ, 'public', 'estrellas')
const ORIGEN_POR_DEFECTO = 'C:/Users/crist/Documents/Codex/2026-11-11/files-pasted-by-the-user-encargo/outputs/produccion-estrellas'
const MAX_BYTES = 25 * 1024 * 1024 // tope por archivo de los assets de Cloudflare Workers
const ANCHO_PORTADA = 960

const args = process.argv.slice(2)
const iOrigen = args.indexOf('--origen')
const ORIGEN = path.resolve(iOrigen >= 0 && args[iOrigen + 1] ? args[iOrigen + 1] : process.env.ESTRELLAS_ORIGEN || ORIGEN_POR_DEFECTO)

// Portadas: de qué captura sale cada una y qué rectángulo (en píxeles de ESA captura) se recorta
// para dejar solo la escena 3D, sin los paneles ni los rótulos de la página. Todas a 16:10.
// `candidatas` va en orden de preferencia; si ninguna existe se usa `vista-escritorio.png` entera.
// Si la captura cambia de tamaño, el recorte ya no vale: se avisa y se usa la imagen completa.
const PORTADAS = {
  E1: { candidatas: [{ archivo: 'capturas-visual/extra/1600x900-lienzo-general.png', mide: [930, 598], recorte: [100, 38, 830, 519] }] },
  E2: { candidatas: [{ archivo: 'capturas-visual/1600x900@1-vista.png', mide: [1600, 900], recorte: [130, 205, 820, 512] }] },
  E3: { candidatas: [{ archivo: 'capturas-visual/1600x900@1-inicial.png', mide: [1600, 900], recorte: [100, 150, 864, 540] }] },
  E4: { candidatas: [{ archivo: 'capturas-visual/extra/1600x900-lienzo-general.png', mide: [949, 639], recorte: [30, 48, 912, 570] }] },
  E5: { candidatas: [{ archivo: 'capturas-visual/extra/1600x900-lienzo-general.png', mide: [949, 600], recorte: [60, 40, 885, 553] }] },
  E6: { candidatas: [{ archivo: 'capturas-visual/1600x900@1-media.png', mide: [1600, 900], recorte: [30, 135, 672, 420] }] },
  E7: { candidatas: [{ archivo: 'capturas-visual/1600x900@1-media.png', mide: [1600, 900], recorte: [60, 150, 890, 556] }] },
}
const PRACTICAS = Object.keys(PORTADAS)

const avisos = []
const huellas = {}
const sha256 = (archivo) => crypto.createHash('sha256').update(fs.readFileSync(archivo)).digest('hex')
const relativo = (archivo) => path.relative(DESTINO, archivo).split(path.sep).join('/')

function anotar(archivo) {
  const bytes = fs.statSync(archivo).size
  if (bytes > MAX_BYTES) throw new Error(`${relativo(archivo)} pesa ${(bytes / 1048576).toFixed(1)} MiB: Cloudflare no sirve archivos de más de 25 MiB`)
  huellas[relativo(archivo)] = { sha256: sha256(archivo), bytes }
}

function copiarArchivo(desde, hasta) {
  fs.mkdirSync(path.dirname(hasta), { recursive: true })
  fs.copyFileSync(desde, hasta)
  anotar(hasta)
}

function copiarCarpeta(desde, hasta) {
  for (const e of fs.readdirSync(desde, { withFileTypes: true })) {
    const a = path.join(desde, e.name)
    const b = path.join(hasta, e.name)
    if (e.isDirectory()) copiarCarpeta(a, b)
    else if (!/\.md$/i.test(e.name)) copiarArchivo(a, b)
  }
}

async function portada(id) {
  const base = path.join(ORIGEN, id)
  const salida = path.join(DESTINO, 'portadas', `${id}.webp`)
  fs.mkdirSync(path.dirname(salida), { recursive: true })
  let fuente = null
  let recorte = null
  for (const c of PORTADAS[id].candidatas) {
    const f = path.join(base, c.archivo)
    if (!fs.existsSync(f)) continue
    const m = await sharp(f).metadata()
    fuente = f
    if (m.width === c.mide[0] && m.height === c.mide[1]) recorte = c.recorte
    else avisos.push(`${id}: ${c.archivo} mide ${m.width}×${m.height} y se esperaba ${c.mide.join('×')}; la portada sale sin recortar. Revisa PORTADAS.`)
    break
  }
  if (!fuente) {
    fuente = path.join(base, 'vista-escritorio.png')
    if (!fs.existsSync(fuente)) throw new Error(`${id}: no hay captura para la portada (ni las de PORTADAS ni vista-escritorio.png)`)
    avisos.push(`${id}: no está la captura prevista; la portada sale de vista-escritorio.png sin recortar. Revisa PORTADAS.`)
  }
  let img = sharp(fuente)
  if (recorte) img = img.extract({ left: recorte[0], top: recorte[1], width: recorte[2], height: recorte[3] })
  await img.resize({ width: ANCHO_PORTADA, withoutEnlargement: true }).webp({ quality: 84, effort: 6 }).toFile(salida)
  anotar(salida)
}

function version(id, js) {
  // La versión vigente es la constante VERSION que declara el propio app.js («E#-mayor.menor»).
  // El index.html y los comentarios nombran también versiones anteriores, así que no sirven.
  const m = new RegExp(`VERSION = "(${id}-[0-9.]+)"`).exec(js)
  return m ? m[1] : null
}

if (!fs.existsSync(ORIGEN)) {
  console.error(`copiar-estrellas: no existe el origen ${ORIGEN}`)
  process.exit(1)
}
// Primero se comprueba todo el origen: si falta algo, no se toca public/.
for (const id of PRACTICAS) {
  for (const f of ['index.html', 'app.js']) {
    const p = path.join(ORIGEN, id, 'para-alumno', f)
    if (!fs.existsSync(p)) {
      console.error(`copiar-estrellas: falta ${p}. No se copió nada.`)
      process.exit(1)
    }
  }
}

const versiones = {}
for (const id of PRACTICAS) {
  const desde = path.join(ORIGEN, id, 'para-alumno')
  const hasta = path.join(DESTINO, id)
  fs.rmSync(hasta, { recursive: true, force: true })
  copiarArchivo(path.join(desde, 'index.html'), path.join(hasta, 'index.html'))
  copiarArchivo(path.join(desde, 'app.js'), path.join(hasta, 'app.js'))
  if (fs.existsSync(path.join(desde, 'modelos'))) copiarCarpeta(path.join(desde, 'modelos'), path.join(hasta, 'modelos'))
  await portada(id)
  versiones[id] = version(id, fs.readFileSync(path.join(hasta, 'app.js'), 'utf8'))
  const propios = Object.entries(huellas).filter(([k]) => k.startsWith(`${id}/`))
  const mib = propios.reduce((a, [, v]) => a + v.bytes, 0) / 1048576
  console.log(`${id} ${versiones[id] ?? '(sin versión)'} · ${propios.length} archivo(s) · ${mib.toFixed(1)} MiB · portada ${(huellas[`portadas/${id}.webp`].bytes / 1024).toFixed(0)} KiB`)
}

// Mosaico de la ficha del inicio y del encabezado del catálogo: las siete escenas en tres filas
// (2 · 3 · 2) con esquinas redondeadas y FONDO TRANSPARENTE. Transparente y no blanco porque la
// ficha lo pinta con `mix-blend-multiply` en modo claro y tal cual en modo oscuro: un fondo
// blanco se vería como un bloque blanco sobre la tarjeta oscura.
{
  const AN = 440, AL = 275, HUECO = 22, RADIO = 26
  const filas = [['E2', 'E7'], ['E1', 'E3', 'E4'], ['E5', 'E6']]
  const ancho = 3 * AN + 2 * HUECO
  const alto = 3 * AL + 2 * HUECO
  const mascara = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${AN}" height="${AL}"><rect width="${AN}" height="${AL}" rx="${RADIO}" ry="${RADIO}" fill="#fff"/></svg>`)
  const piezas = []
  for (let f = 0; f < filas.length; f++) {
    const sangria = Math.round((ancho - (filas[f].length * AN + (filas[f].length - 1) * HUECO)) / 2)
    for (let c = 0; c < filas[f].length; c++) {
      const input = await sharp(path.join(DESTINO, 'portadas', `${filas[f][c]}.webp`))
        .resize(AN, AL, { fit: 'cover' })
        .composite([{ input: mascara, blend: 'dest-in' }])
        .png()
        .toBuffer()
      piezas.push({ input, left: sangria + c * (AN + HUECO), top: f * (AL + HUECO) })
    }
  }
  const salida = path.join(DESTINO, 'portadas', 'mosaico.webp')
  await sharp({ create: { width: ancho, height: alto, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(piezas)
    .webp({ quality: 82, alphaQuality: 90, effort: 6 })
    .toFile(salida)
  anotar(salida)
  console.log(`mosaico ${ancho}×${alto} · ${(huellas['portadas/mosaico.webp'].bytes / 1024).toFixed(0)} KiB`)
}

// Sin fecha a propósito: si los paquetes no cambian, volver a correr deja el archivo idéntico.
const ordenadas = Object.fromEntries(Object.entries(huellas).sort(([a], [b]) => a.localeCompare(b)))
fs.writeFileSync(path.join(DESTINO, 'huellas.json'), JSON.stringify({ algoritmo: 'sha256', versiones, archivos: ordenadas }, null, 2) + '\n')

const total = Object.values(huellas).reduce((a, v) => a + v.bytes, 0)
console.log(`copiar-estrellas: ${Object.keys(huellas).length} archivos, ${(total / 1048576).toFixed(1)} MiB en public/estrellas · huellas.json escrito`)
for (const a of avisos) console.warn(`AVISO · ${a}`)
