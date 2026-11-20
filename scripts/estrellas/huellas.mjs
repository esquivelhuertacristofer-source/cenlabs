// =============================================================================
// Módulo común de scripts/estrellas: comprobar un paquete del origen y escribir huellas.json.
//
// Lo usan copiar-estrellas.mjs (E1…E7) y copiar-practicas.mjs (ACT, CTL, PLC, CNC, ELA).
// Las dos copias escriben en public/estrellas/, así que huellas.json se calcula SIEMPRE a
// partir de lo que hay en disco: correr una no borra las huellas de la otra.
// =============================================================================
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'

export const ORIGEN_POR_DEFECTO = 'C:/Users/crist/Documents/Codex/2026-11-11/files-pasted-by-the-user-encargo/outputs/produccion-estrellas'
export const MAX_BYTES = 25 * 1024 * 1024 // tope por archivo de los assets de Cloudflare Workers

export const sha256 = (archivo) => crypto.createHash('sha256').update(fs.readFileSync(archivo)).digest('hex')

/** Versión vigente que declara el propio app.js («ID-mayor.menor»); el HTML nombra también versiones viejas. */
export function versionDeApp(id, js) {
  const m = new RegExp(`VERSION\\s*=\\s*["'](${id}-[0-9.]+)["']`).exec(js)
  return m ? m[1] : null
}

/**
 * Lee resultados-validacion.json y lo reduce a { estado, fallos, comprobaciones, version }.
 * Las siete estrellas no comparten formato (E5 y E7 dicen `verde: true`, E7 cuenta `totalFallos`,
 * E3 y E4 guardan la versión en `modelo`), así que se normaliza aquí.
 */
export function leerValidacion(raiz) {
  const archivo = path.join(raiz, 'resultados-validacion.json')
  if (!fs.existsSync(archivo)) return { estado: 'SIN-RESULTADOS', fallos: null, comprobaciones: 0, version: null, mtime: 0 }
  const v = JSON.parse(fs.readFileSync(archivo, 'utf8'))
  const estado = v.estado ?? (v.verde === true ? 'VERDE' : v.verde === false ? 'ROJO' : 'SIN-ESTADO')
  let fallos = 0
  if (Array.isArray(v.fallos)) fallos = v.fallos.length
  else if (typeof v.fallos === 'number') fallos = v.fallos
  if (typeof v.totalFallos === 'number') fallos = Math.max(fallos, v.totalFallos)
  if (Array.isArray(v.lista_de_fallos)) fallos = Math.max(fallos, v.lista_de_fallos.length)
  if (Array.isArray(v.detalle_de_fallos)) fallos = Math.max(fallos, v.detalle_de_fallos.length)
  const comprobaciones = v.comprobaciones ?? v.total ?? 0
  return { estado, fallos, comprobaciones, version: v.version ?? v.modelo ?? null, mtime: fs.statSync(archivo).mtimeMs }
}

function listar(dir, salida = []) {
  if (!fs.existsSync(dir)) return salida
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) listar(p, salida)
    else salida.push(p)
  }
  return salida
}

/**
 * Compuerta de publicación de UN paquete del origen. Devuelve la lista de motivos por los que
 * NO está listo (vacía = listo) y los datos de su validación. Comprueba:
 *  1. resultados-validacion.json en VERDE, con 0 fallos y comprobaciones > 0;
 *  2. `node <id>/herramientas/manifiesto.mjs --comprobar` sale con 0;
 *  3. la validación es posterior a todo el código que valida (src/, app.js, index.html,
 *     verificar.mjs): un manifiesto regenerado tras tocar el código sin repetir la suite
 *     pasa el punto 2 con un VERDE viejo, y eso no vale;
 *  4. lo que se va a copiar (para-alumno/index.html y app.js) es byte a byte lo del manifiesto;
 *  5. la versión del app.js que se copia es la que se validó (cuando la validación la dice).
 */
export function comprobarPaquete(origen, id) {
  const raiz = path.join(origen, id)
  const motivos = []
  const val = leerValidacion(raiz)
  if (val.estado !== 'VERDE') motivos.push(`validación en ${val.estado}`)
  if (val.fallos !== 0) motivos.push(`${val.fallos} fallo(s) en la validación`)
  if (!(val.comprobaciones > 0)) motivos.push('la validación no dice cuántas comprobaciones hizo')

  const herramienta = path.join(raiz, 'herramientas', 'manifiesto.mjs')
  if (!fs.existsSync(herramienta)) motivos.push('no tiene herramientas/manifiesto.mjs')
  else {
    const r = spawnSync(process.execPath, [herramienta, '--comprobar'], { cwd: origen, encoding: 'utf8' })
    if (r.status !== 0) motivos.push(`manifiesto --comprobar falla: ${(r.stdout + r.stderr).trim().split('\n')[0].slice(0, 160)}`)
  }

  const fuentes = [...listar(path.join(raiz, 'src')), ...['app.js', 'index.html', 'verificar.mjs'].map((f) => path.join(raiz, f))].filter((f) => fs.existsSync(f))
  const posteriores = fuentes.filter((f) => fs.statSync(f).mtimeMs > val.mtime + 1000).map((f) => path.relative(raiz, f).split(path.sep).join('/'))
  if (posteriores.length) motivos.push(`código posterior a la validación: ${posteriores.slice(0, 4).join(', ')}`)

  const manifiesto = fs.existsSync(path.join(raiz, 'manifiesto.json')) ? JSON.parse(fs.readFileSync(path.join(raiz, 'manifiesto.json'), 'utf8')) : null
  const enManifiesto = (rel) => {
    const a = manifiesto?.archivos?.[rel]
    return typeof a === 'string' ? a : a?.sha256 ?? null
  }
  for (const f of ['index.html', 'app.js']) {
    const p = path.join(raiz, 'para-alumno', f)
    if (!fs.existsSync(p)) { motivos.push(`falta para-alumno/${f}`); continue }
    const esperado = enManifiesto(`para-alumno/${f}`)
    if (esperado && esperado !== sha256(p)) motivos.push(`para-alumno/${f} no coincide con el manifiesto`)
  }

  let versionApp = null
  const app = path.join(raiz, 'para-alumno', 'app.js')
  if (fs.existsSync(app)) {
    versionApp = versionDeApp(id, fs.readFileSync(app, 'utf8'))
    if (!versionApp) motivos.push('el app.js no declara VERSION')
    else if (val.version && val.version !== versionApp) motivos.push(`app.js ${versionApp} y validación ${val.version} no coinciden`)
  }
  return { motivos, validacion: { version: versionApp ?? val.version, comprobaciones: val.comprobaciones } }
}

/**
 * Escribe public/estrellas/huellas.json con el SHA-256 de TODO lo que hay en disco, la versión
 * de cada paquete (leída de su app.js) y lo que dijo su validación. `validacionNueva` reemplaza
 * la de los paquetes que se acaban de copiar; la de los demás se conserva del huellas.json anterior.
 * Sin fecha a propósito: si los paquetes no cambian, volver a correr deja el archivo idéntico.
 */
export function escribirHuellas(destino, validacionNueva = {}) {
  const archivoHuellas = path.join(destino, 'huellas.json')
  const anterior = fs.existsSync(archivoHuellas) ? JSON.parse(fs.readFileSync(archivoHuellas, 'utf8')) : {}
  const archivos = {}
  for (const abs of listar(destino).sort()) {
    const rel = path.relative(destino, abs).split(path.sep).join('/')
    if (rel === 'huellas.json') continue
    const bytes = fs.statSync(abs).size
    if (bytes > MAX_BYTES) throw new Error(`${rel} pesa ${(bytes / 1048576).toFixed(1)} MiB: Cloudflare no sirve archivos de más de 25 MiB`)
    archivos[rel] = { sha256: sha256(abs), bytes }
  }
  const paquetes = fs.readdirSync(destino, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== 'portadas' && fs.existsSync(path.join(destino, e.name, 'app.js')))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b))
  const versiones = {}
  const validacion = {}
  for (const id of paquetes) {
    versiones[id] = versionDeApp(id, fs.readFileSync(path.join(destino, id, 'app.js'), 'utf8'))
    const v = validacionNueva[id] ?? anterior.validacion?.[id]
    if (v) validacion[id] = { version: v.version, comprobaciones: v.comprobaciones }
  }
  const ordenadas = Object.fromEntries(Object.entries(archivos).sort(([a], [b]) => a.localeCompare(b)))
  fs.writeFileSync(archivoHuellas, JSON.stringify({ algoritmo: 'sha256', versiones, validacion, archivos: ordenadas }, null, 2) + '\n')
  return { archivos: ordenadas, versiones }
}
