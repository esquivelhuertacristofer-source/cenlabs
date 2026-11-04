// =============================================================================
// Labs sobre D1 — Worker envolvente: los FRENOS van antes de Next.
// Es el de financiera-d1 (en producción desde 2026-11-02; antes nem-d1), con las rutas de Labs (2026-11-03).
//
// Una petición frenada aquí cuesta ~1 ms de CPU y ninguna consulta a D1, así que un
// bucle (un componente que reintenta sin parar, un script, un robot) no puede llevar
// carga ni costo a la base. Los límites van POR SESIÓN, no por IP: una escuela
// entera sale a internet por una sola IP y no se le puede castigar por eso. Por IP
// solo se frena lo anónimo y los logins.
//
// Dos capas, porque ninguna sola basta (medido 2026-10-28):
//  1. Contador EXACTO en memoria del isolate, ventana de 10 s. Un navegador usa una
//     sola conexión y cae siempre en el mismo isolate (60/60 peticiones), así que una
//     pestaña en bucle se corta al instante y sin costo.
//  2. Limitador nativo de Cloudflare (binding `ratelimits`, 60 s). Es aproximado y
//     llega tarde (cortó a los 31 s un bucle de 20 pet/s), pero cuenta entre
//     máquinas: es la red para un script que abre muchas conexiones a la vez.
// =============================================================================
// @ts-expect-error: lo genera `opennextjs-cloudflare build`
import { default as openNext } from './.open-next/worker.js'

// @ts-expect-error: lo genera `opennextjs-cloudflare build`
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from './.open-next/worker.js'

type Limitador = { limit(o: { key: string }): Promise<{ success: boolean }> }
type Env = {
  RL_SESION?: Limitador
  RL_ANONIMO?: Limitador
  RL_LOGIN?: Limitador
  SESION_SECRETO?: string
  [k: string]: unknown
}

const MAX_CUERPO = 256 * 1024
// Los archivos que existen (/_next/static, /assets, /games, /data…) los sirve la capa de assets
// y ni llegan aquí. Lo que sí llega son los MEDIOS que salen de R2 por rutas de la app:
// un reproductor pide el video en varios trozos (Range) al adelantarlo, así que van con su
// propio tope y no gastan el de la sesión. Anclado al prefijo (manual 3c): «termina en .mp4»
// dejaría pasar cualquier página.
const MEDIOS = /^\/(videos|voz)\//

// Topes por isolate cada 10 s. Un alumno real hace 1–8 peticiones en 10 s (medido:
// 7 en un recorrido de 6 pantallas); una escuela de 100 que entra junta hace ~2 por niño.
const VENTANA_MS = 10_000
// buscar: cada búsqueda son ~20 consultas que recorren tablas enteras (una página normal, ~3);
// sin tope propio, una sola sesión buscando sin parar ocuparía buena parte de la base.
// usuario / buscarUsuario: lo mismo sumando TODAS las cookies de un usuario. Cada login emite
// una cookie nueva, así que contar solo por cookie dejaba multiplicar el tope entrando N veces.
// Más alto que el de una cookie porque una clase entera puede compartir la cuenta demo.
// medios: un video de 2 min adelantado a saltos son ~10–20 trozos; 120 en 10 s por sesión
// sobra para ver y frena a un script que baja todo el R2.
// sesion: 80 y no 30 (medido 2026-11-02): el panel del docente hace 19 peticiones en 2.5 s solo al abrir
// (Next precarga cada enlace del menú); con 30, un clic más y el docente real recibía 429.
// Labs (medido 2026-11-03 en el piloto, navegación real con prisa): pico de peticiones que LLEGAN
// al worker en 10 s = 55 alumno, 46 docente sin grupos, 44 docente, 31 admin. 80 deja 1.45× sobre
// el alumno; 30 (NEM) lo frenaría. Ver docs/PERFIL-MIGRACION-D1.md §8.4.
const TOPE = { sesion: 80, usuario: 150, anonimo: 300, login: 150, medios: 120, mediosAnonimo: 300 } as const
const cuentas = new Map<string, { desde: number; n: number }>()

// La cookie de sesión solo cuenta como sesión si su firma es buena. Antes bastaba con que
// tuviera forma de cookie: un script con una cookie inventada distinta en cada petición
// caía siempre en un contador nuevo y se saltaba el tope anónimo por IP. Misma firma que
// src/lib/d1/cliente.ts (HMAC-SHA256 de la carga en base64url).
// Devuelve el id del usuario: los topes van por USUARIO, no por cookie (cada login emite una
// cookie nueva; contar por cookie dejaba multiplicar el tope entrando varias veces).
let llaveFirma: { secreto: string; llave: Promise<CryptoKey> } | null = null
async function usuarioDeSesion(token: string, secreto: string | undefined): Promise<string | null> {
  const [cuerpo, firma] = token.split('.')
  if (!secreto || !cuerpo || !firma) return null
  if (llaveFirma?.secreto !== secreto) {
    llaveFirma = { secreto, llave: crypto.subtle.importKey('raw', new TextEncoder().encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']) }
  }
  try {
    const bytes = Uint8Array.from(atob(firma.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))
    if (!(await crypto.subtle.verify('HMAC', await llaveFirma.llave, bytes, new TextEncoder().encode(cuerpo)))) return null
    const carga = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(cuerpo.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))))
    return typeof carga.u === 'string' && typeof carga.e === 'number' && carga.e > Date.now() / 1000 ? carga.u : null
  } catch {
    return null
  }
}

/** IPv6 por su /64: cambiar de dirección dentro de la propia red es gratis y no debe dar otro tope. */
function redDe(ip: string): string {
  if (!ip.includes(':')) return ip
  const partes = ip.split('::')[0].split(':')
  return ip.includes('::') && partes.length < 4 ? ip : partes.slice(0, 4).join(':') + '::/64'
}

function excede(llave: string, tope: number): boolean {
  const ahora = Date.now()
  let c = cuentas.get(llave)
  if (!c || ahora - c.desde >= VENTANA_MS) {
    if (cuentas.size > 5000) for (const [k, v] of cuentas) if (ahora - v.desde >= VENTANA_MS) cuentas.delete(k)
    c = { desde: ahora, n: 0 }
    cuentas.set(llave, c)
  }
  return ++c.n > tope
}

async function nativo(l: Limitador | undefined, llave: string): Promise<boolean> {
  if (!l) return false
  try {
    return !(await l.limit({ key: llave })).success
  } catch (e) {
    // Si el limitador falla, se deja pasar: un freno roto no debe tumbar la plataforma.
    console.error('[freno] limitador no disponible:', (e as Error).message)
    return false
  }
}

function demasiado(request: Request, motivo: string): Response {
  console.warn(`[freno] ${motivo} ${request.method} ${new URL(request.url).pathname}`)
  const esPagina = request.method === 'GET' && !request.headers.get('rsc') && (request.headers.get('accept') ?? '').includes('text/html')
  if (!esPagina) return new Response('Demasiadas solicitudes. Espera unos segundos.', { status: 429, headers: { 'Retry-After': '20' } })
  return new Response(
    `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="20"><title>Un momento</title>
<body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f4f7fb;color:#00153B">
<div style="max-width:28rem;padding:2rem;text-align:center"><h1 style="font-size:1.4rem">Vamos muy rápido</h1>
<p>Llegaron demasiadas solicitudes seguidas desde esta sesión. La página se vuelve a cargar sola en 20 segundos.</p></div></body></html>`,
    { status: 429, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '20', 'Cache-Control': 'no-store' } },
  )
}

async function frenar(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url)
  // Ningún formulario ni respuesta de alumno pesa esto: un envío gigante no llega a la base.
  if (request.method !== 'GET' && Number(request.headers.get('content-length') ?? 0) > MAX_CUERPO) {
    console.warn(`[freno] cuerpo de ${request.headers.get('content-length')} bytes en ${url.pathname}`)
    return new Response('Envío demasiado grande.', { status: 413 })
  }
  const ip = redDe(request.headers.get('cf-connecting-ip') ?? 'sin-ip')
  const token = /(?:^|;\s*)labs_sesion=([^;]+)/.exec(request.headers.get('cookie') ?? '')?.[1]
  const usuario = (token && (await usuarioDeSesion(token, env.SESION_SECRETO))) || undefined
  const sesion = usuario && token!.slice(-24)

  // Todo POST sin sesión cuenta como login, no solo el de /login: Next acepta una acción de
  // servidor enviada a cualquier ruta, así que frenar por la ruta se podía rodear.
  if (request.method === 'POST' && !sesion) {
    if (excede(`login:${ip}`, TOPE.login) || (await nativo(env.RL_LOGIN, `login:${ip}`))) return demasiado(request, 'logins por IP')
  }
  if (request.method === 'GET' && MEDIOS.test(url.pathname)) {
    if (sesion ? excede(`m:${sesion}`, TOPE.medios) : excede(`ma:${ip}`, TOPE.mediosAnonimo)) return demasiado(request, 'medios')
    return null
  }
  if (sesion && usuario) {
    if (excede(`s:${sesion}`, TOPE.sesion) || excede(`u:${usuario}`, TOPE.usuario) || (await nativo(env.RL_SESION, `s:${sesion}`)))
      return demasiado(request, 'sesión')
  } else if (excede(`a:${ip}`, TOPE.anonimo) || (await nativo(env.RL_ANONIMO, `a:${ip}`))) {
    return demasiado(request, 'anónimo por IP')
  }
  return null
}

// Al abrir /login, el navegador recibe un id propio (sin datos, solo azar). El
// login lo usa para que la pausa por claves equivocadas sea de ESE equipo y no de la cuenta
// entera: el alumno que juega con el correo de su maestro no lo deja a él sin entrar.
const DISPOSITIVO = /(?:^|;\s*)labs_disp=[a-f0-9]{16,40}(?:;|$)/

export default {
  async fetch(request: Request, env: Env, ctx: unknown) {
    const freno = await frenar(request, env)
    if (freno) return freno
    const respuesta: Response = await openNext.fetch(request, env, ctx)
    const { pathname } = new URL(request.url)
    if (request.method !== 'GET' || pathname !== '/login' || DISPOSITIVO.test(request.headers.get('cookie') ?? '')) return respuesta
    const conId = new Response(respuesta.body, respuesta)
    conId.headers.append('Set-Cookie', `labs_disp=${crypto.randomUUID().replace(/-/g, '')}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`)
    return conId
  },
}
