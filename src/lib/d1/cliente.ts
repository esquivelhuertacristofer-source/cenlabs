import 'server-only'
import bcrypt from 'bcryptjs'
import { Consulta, type Contexto } from '@/lib/d1/consulta'
import { memoIsolate, olvidar } from '@/lib/d1/memo'
import { llamarRpc } from '@/lib/d1/rpc'

// =============================================================================
// Labs sobre D1 — cliente con la forma de supabase-js: `from()`, `rpc()` y `auth`.
// Es el de financiera-d1 (en producción desde 2026-11-02; antes nem-d1, 2026-10-31) con
// el alta y el perfil de Labs (2026-11-03).
//
// Sesión: cookie `labs_sesion` = base64url({u, v, e}).firma, con HMAC-SHA256 y el
// secreto SESION_SECRETO. `v` es auth_users.sesion_version: cerrar sesión o cambiar
// la contraseña la incrementa y deja inválidas todas las cookies anteriores (lo que
// hacía el signOut global de Supabase). La misma consulta que valida la versión
// trae el rol para las políticas: UNA lectura de D1 por petición.
//
// Contraseñas: los hashes bcrypt de auth.users se migraron tal cual; bcryptjs los
// verifica sin pedir contraseña nueva.
//
// Lo que Labs NO tiene (decisión del usuario, 2026-11-03): registro público y
// recuperación por correo. Las cuentas las da el admin; la clave la cambia CEN.
// =============================================================================

export const COOKIE_SESION = 'labs_sesion'
/** Identificador del navegador (lo pone worker.ts al abrir /login): separa las pausas por dispositivo. */
export const COOKIE_DISPOSITIVO = 'labs_disp'
const DURACION_S = 60 * 60 * 24 * 14
// Pausas del login (2026-10-29). Antes era una sola por cuenta: 10 claves malas desde
// CUALQUIER lado la pausaban, así que un alumno podía dejar a su maestro sin entrar. Ahora:
//  · por cuenta y dispositivo, 10 intentos en 15 min (frena a quien adivina desde un equipo);
//  · por cuenta, 50 en 15 min desde donde sea (frena a quien reparte entre muchos equipos);
//  · en toda la plataforma, 1,200 intentos por minuto: el login es lo único caro en CPU
//    (bcrypt) y la CPU se cobra; 1,000 alumnos entrando en 2 min son ~500 por minuto.
// Se cuentan INTENTOS antes de bcrypt, con un solo upsert atómico: ya no hay ventana en la
// que una ráfaga en paralelo pase toda antes de que el contador se mueva.
const FALLOS_MAX = 10
const FALLOS_CUENTA_MAX = 50
const FALLOS_VENTANA_MS = 15 * 60_000
const LOGINS_POR_MINUTO = 1200
// (Los topes de altas públicas de Financiera no aplican: Labs no tiene registro público.)

// Lo que se guarda tiene tope: sin él, cada login fallido guardaba el correo tal cual
// (hasta 1 MB) y se podía llenar la base sin cuenta. RFC 5321: 254 caracteres.
const CORREO = /^[^\s@]{1,64}@[^\s@]{1,189}\.[^\s@]{2,}$/
const correoValido = (c: string) => c.length <= 254 && CORREO.test(c)
const CLAVE_MAX = 200

/** Solo texto y números cortos en user_metadata (nombre, rol pedido, grupo). */
function metadatosDeUsuario(datos: Record<string, unknown> | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(datos ?? {}).slice(0, 8)) {
    if (typeof v === 'string') out[k.slice(0, 40)] = v.slice(0, 120)
    else if (typeof v === 'number' && Number.isFinite(v)) out[k.slice(0, 40)] = v
  }
  return out
}

type Galletas = {
  get(nombre: string): { value: string } | undefined
  set(nombre: string, valor: string, opciones: Record<string, unknown>): void
}

export type Usuario = {
  id: string
  email: string
  app_metadata: Record<string, unknown>
  user_metadata: Record<string, unknown>
  created_at: string
  identities: unknown[]
}

const b64u = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const desB64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))

async function llave(secreto: string) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}
async function firmar(secreto: string, carga: object): Promise<string> {
  const cuerpo = b64u(new TextEncoder().encode(JSON.stringify(carga)))
  const firma = new Uint8Array(await crypto.subtle.sign('HMAC', await llave(secreto), new TextEncoder().encode(cuerpo)))
  return `${cuerpo}.${b64u(firma)}`
}
async function leerFirmado(secreto: string, token: string): Promise<{ u: string; v: number; e: number } | null> {
  const [cuerpo, firma] = token.split('.')
  if (!cuerpo || !firma) return null
  try {
    const ok = await crypto.subtle.verify('HMAC', await llave(secreto), desB64u(firma), new TextEncoder().encode(cuerpo))
    if (!ok) return null
    const c = JSON.parse(new TextDecoder().decode(desB64u(cuerpo)))
    return typeof c.u === 'string' && c.e > Date.now() / 1000 ? c : null
  } catch {
    return null // firma o carga ilegible: equivale a no tener sesión
  }
}

type FilaSesion = {
  id: string; email: string; raw_app_meta_data: string; raw_user_meta_data: string; created_at: string
  sesion_version: number; banned_until: string | null
  role: string | null
}

const errAuth = (message: string, status: number, code: string) => ({ message, status, code, name: 'AuthApiError' })
const ahora = () => new Date().toISOString()

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Alta: lo que hace el trigger handle_new_user de Labs, con el hotfix del 2026-11-03: el rol
 * sale de user_metadata SOLO si es alumno o profesor (admin jamás por esta vía; un admin se
 * nombra por SQL), y si viene group_id (uuid de un grupo existente) se vincula al grupo.
 * Todo en un solo lote: o queda el usuario con su perfil y su grupo, o no queda nada.
 */
async function crearUsuario(db: D1Database, a: { email: string; password: string; app?: Record<string, unknown>; user?: Record<string, unknown> }) {
  const id = crypto.randomUUID()
  const hash = await bcrypt.hash(a.password, 10)
  const app = a.app ?? {}
  const user = a.user ?? {}
  const texto = (v: unknown) => (typeof v === 'string' && v ? v : null)
  const rol = user.role === 'profesor' ? 'profesor' : 'alumno'
  const grupo = typeof user.group_id === 'string' && UUID_RE.test(user.group_id) ? user.group_id : null
  const lote = [
    db.prepare(`INSERT INTO auth_users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data) VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(id, a.email, hash, ahora(), JSON.stringify(app), JSON.stringify(user)),
    db.prepare(`INSERT INTO profiles (id, email, full_name, role, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`)
      .bind(id, a.email, texto(user.full_name) ?? 'Usuario Nuevo', rol, ahora()),
  ]
  // Como el trigger: el grupo debe existir (la FK lo exige; en Postgres el alta fallaba entera).
  if (grupo) lote.push(db.prepare(`INSERT INTO alumnos_grupos (id_alumno, id_grupo) VALUES (?, ?) ON CONFLICT DO NOTHING`).bind(id, grupo))
  await db.batch(lote)
  return id
}

export type OpcionesCliente = { db: D1Database; secreto?: string; galletas?: Galletas; servicio?: boolean; ip?: string }

export function crearClienteD1({ db, secreto, galletas, servicio, ip }: OpcionesCliente) {
  let contexto: Promise<{ ctx: Contexto; usuario: Usuario | null }> | null = null
  const consultas = { n: 0 }

  async function resolver(): Promise<{ ctx: Contexto; usuario: Usuario | null }> {
    if (servicio) return { ctx: { servicio: true }, usuario: null }
    const anonimo = { ctx: { servicio: false, uid: null, role: null } as Contexto, usuario: null }
    const token = galletas?.get(COOKIE_SESION)?.value
    if (!token || !secreto) return anonimo
    // La firma se revisa ANTES de memorizar: una cookie inventada no ocupa memoria del isolate
    // (sin esto, mandar cookies basura distintas llenaba la memoria). Cuesta una HMAC (<0.1 ms).
    const carga = await leerFirmado(secreto, token)
    if (!carga) return anonimo
    // Una página llama a getSupabaseServer() ~5 veces; la sesión se valida una vez (30 s por isolate:
    // un cierre de sesión puede tardar hasta 30 s en verse en OTRO isolate; en el propio, al instante).
    return memoIsolate(`sesion:${token}`, 30_000, () => validar(carga, anonimo))
  }
  async function validar(carga: { u: string; v: number; e: number }, anonimo: { ctx: Contexto; usuario: null }): Promise<{ ctx: Contexto; usuario: Usuario | null }> {
    consultas.n++
    const f = await db.prepare(
      `SELECT u.id, u.email, u.raw_app_meta_data, u.raw_user_meta_data, u.created_at, u.sesion_version, u.banned_until,
              p.role
         FROM auth_users u LEFT JOIN profiles p ON p.id = u.id
        WHERE u.id = ?`).bind(carga.u).first<FilaSesion>()
    if (!f || f.sesion_version !== carga.v || (f.banned_until && f.banned_until > ahora())) return anonimo
    return {
      ctx: { servicio: false, uid: f.id, role: f.role },
      usuario: {
        id: f.id, email: f.email, created_at: f.created_at, identities: [{}],
        app_metadata: JSON.parse(f.raw_app_meta_data || '{}'), user_metadata: JSON.parse(f.raw_user_meta_data || '{}'),
      },
    }
  }
  const ctx = () => (contexto ??= resolver())

  async function emitirSesion(id: string, version: number) {
    if (!galletas || !secreto) throw new Error('[d1] sin cookies o sin SESION_SECRETO: no se puede iniciar sesión')
    const token = await firmar(secreto, { u: id, v: version, e: Math.floor(Date.now() / 1000) + DURACION_S })
    galletas.set(COOKIE_SESION, token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: DURACION_S })
    contexto = null
  }
  function borrarSesion() {
    const token = galletas?.get(COOKIE_SESION)?.value
    if (token) olvidar(`sesion:${token}`)
    try { galletas?.set(COOKIE_SESION, '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 }) } catch { /* render de Server Component */ }
    contexto = null
  }

  // `from()` es síncrono en supabase-js; el contexto del usuario se resuelve al ejecutar.
  function from(tabla: string) {
    const diferida = {
      _ops: [] as [string, unknown[]][],
    }
    const proxy: Record<string, unknown> = new Proxy(diferida, {
      get(obj, prop: string) {
        if (prop === 'then') {
          return (ok: (v: unknown) => unknown, ko: (e: unknown) => unknown) =>
            ctx().then(({ ctx: c }) => {
              const real = new Consulta(db, c, tabla, () => consultas.n++) as unknown as Record<string, (...a: unknown[]) => unknown>
              let q: unknown = real
              for (const [m, args] of obj._ops) q = (q as Record<string, (...a: unknown[]) => unknown>)[m](...args)
              return q as PromiseLike<unknown>
            }).then(ok, ko)
        }
        return (...args: unknown[]) => { obj._ops.push([prop, args]); return proxy }
      },
    }) as Record<string, unknown>
    // Valida la tabla en el momento, como haría el tipado de supabase-js en ejecución.
    new Consulta(db, { servicio: true }, tabla)
    return proxy
  }

  const auth = {
    async getUser() {
      const { usuario } = await ctx()
      return usuario
        ? { data: { user: usuario }, error: null }
        : { data: { user: null }, error: errAuth('Auth session missing!', 401, 'session_not_found') }
    },
    async getSession() {
      const { usuario } = await ctx()
      return { data: { session: usuario ? { user: usuario } : null }, error: null }
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const correo = email.trim().toLowerCase()
      const invalido = { data: { user: null, session: null }, error: errAuth('Invalid login credentials', 400, 'invalid_credentials') }
      // Un correo imposible no es de nadie: se rechaza sin bcrypt y sin escribir nada.
      if (!correoValido(correo) || password.length > CLAVE_MAX) return invalido
      const disp = galletas?.get(COOKIE_DISPOSITIVO)?.value
      const llaveDisp = `${correo}|${disp && /^[a-f0-9]{16,40}$/.test(disp) ? disp : 'sin'}`
      const ventana = new Date(Date.now() - FALLOS_VENTANA_MS).toISOString()
      const minuto = new Date(Date.now() - 60_000).toISOString()
      const contar = (llave: string, desde: string) => db.prepare(`INSERT INTO auth_fallos (email, fallos, desde) VALUES (?, 1, ?)
          ON CONFLICT (email) DO UPDATE SET fallos = CASE WHEN desde > ? THEN fallos + 1 ELSE 1 END,
                                            desde  = CASE WHEN desde > ? THEN desde ELSE excluded.desde END
          RETURNING fallos`).bind(llave, ahora(), desde, desde)
      consultas.n++
      // Un solo viaje: los tres contadores suben juntos ANTES de bcrypt (una transacción).
      const [g, d, c] = (await db.batch([contar('__todos__', minuto), contar(llaveDisp, ventana), contar(correo, ventana)]))
        .map((r) => (r.results?.[0] as { fallos: number } | undefined)?.fallos ?? 0)
      // De vez en cuando se barren las pausas vencidas: la tabla no crece sin fin.
      if (Math.random() < 0.02) db.prepare(`DELETE FROM auth_fallos WHERE desde < ? AND email <> '__todos__'`).bind(ventana).run().catch(() => {})
      if (g > LOGINS_POR_MINUTO) {
        console.error(`[auth] ALERTA: ${g} intentos de login en un minuto; login en pausa`)
        return { data: { user: null, session: null }, error: errAuth('Too many login attempts', 429, 'login_en_pausa') }
      }
      if (d > FALLOS_MAX || c > FALLOS_CUENTA_MAX)
        return { data: { user: null, session: null }, error: errAuth('Too many failed attempts', 429, 'cuenta_en_pausa') }
      consultas.n++
      const u = await db.prepare(`SELECT id, encrypted_password, email_confirmed_at, banned_until, sesion_version FROM auth_users WHERE lower(email) = lower(?)`)
        .bind(correo).first<{ id: string; encrypted_password: string | null; email_confirmed_at: string | null; banned_until: string | null; sesion_version: number }>()
      // Se compara contra un hash cualquiera si el correo no existe: mismo tiempo de respuesta, no se revela quién tiene cuenta.
      const ok = await bcrypt.compare(password, u?.encrypted_password ?? '$2b$10$qL7imXiWLt.eA/EA5bVcs.JjUuWEVtY.RAXPlP3Lttb2wwIDLJTU6')
      // El intento ya quedó contado (también para correos inexistentes: la pausa no revela si la cuenta existe).
      if (!u || !ok) return invalido
      await db.prepare(`DELETE FROM auth_fallos WHERE email IN (?, ?)`).bind(correo, llaveDisp).run()
      if (!u.email_confirmed_at) return { data: { user: null, session: null }, error: errAuth('Email not confirmed', 400, 'email_not_confirmed') }
      if (u.banned_until && u.banned_until > ahora()) return { data: { user: null, session: null }, error: errAuth('User is banned', 400, 'user_banned') }
      consultas.n++
      await db.prepare(`UPDATE auth_users SET last_sign_in_at = ? WHERE id = ?`).bind(ahora(), u.id).run()
      await emitirSesion(u.id, u.sesion_version)
      return { data: { user: { id: u.id }, session: {} }, error: null }
    },
    // Labs no tiene registro público (la app nunca lo usó; en Supabase estaba encendido y era la
    // puerta de la escalada a admin cerrada el 2026-11-03). Las cuentas las crea el admin con
    // auth.admin.createUser. Si algún día se abre, la implementación con sus topes por red y
    // global está en financiera-d1/src/lib/d1/cliente.ts.
    async signUp(_a: { email: string; password: string; options?: { data?: Record<string, unknown> } }) {
      void _a
      return { data: { user: null, session: null }, error: errAuth('Signups not allowed for this instance', 422, 'signup_disabled') }
    },
    async signOut() {
      const { usuario } = await ctx()
      if (usuario) await db.prepare(`UPDATE auth_users SET sesion_version = sesion_version + 1 WHERE id = ?`).bind(usuario.id).run()
      borrarSesion()
      return { error: null }
    },
    async updateUser({ password }: { password?: string }) {
      const { usuario } = await ctx()
      if (!usuario) return { data: { user: null }, error: errAuth('Auth session missing!', 401, 'session_not_found') }
      if (!password) return { data: { user: usuario }, error: null }
      if (password.length > CLAVE_MAX) return { data: { user: null }, error: errAuth('Password is too long', 422, 'weak_password') }
      const hash = await bcrypt.hash(password, 10)
      const r = await db.prepare(`UPDATE auth_users SET encrypted_password = ?, sesion_version = sesion_version + 1, updated_at = ? WHERE id = ? RETURNING sesion_version`)
        .bind(hash, ahora(), usuario.id).first<{ sesion_version: number }>()
      // La cookie vieja deja de servir YA en este isolate (en los demás, a lo más 30 s), igual que al cerrar sesión.
      const vieja = galletas?.get(COOKIE_SESION)?.value
      if (vieja) olvidar(`sesion:${vieja}`)
      await emitirSesion(usuario.id, r!.sesion_version)
      return { data: { user: usuario }, error: null }
    },
    // Labs no recupera claves por correo (decisión del usuario, 2026-11-03): la cambia CEN con
    // scripts/d1/cambiar-clave.mjs. Responde con error (antes Financiera decía «ok» sin enviar
    // nada, y la pantalla prometía un correo que nunca llegaba).
    async resetPasswordForEmail() {
      return { data: {}, error: errAuth('Password recovery by email is not available', 422, 'not_supported') }
    },
    async exchangeCodeForSession() {
      return { data: { session: null }, error: errAuth('Labs no usa enlaces por correo', 400, 'not_supported') }
    },
    admin: {
      /**
       * Lo que el panel usa para cambiar la contraseña de alguien (adminUserActions). Cambiarla
       * sube sesion_version: las sesiones abiertas de esa cuenta dejan de valer, como el
       * cambio de contraseña de Supabase cierra las del usuario.
       */
      async updateUserById(id: string, a: { password?: string; email?: string; user_metadata?: Record<string, unknown>; email_confirm?: boolean }) {
        if (!servicio) throw new Error('[d1] auth.admin solo con el cliente de servicio')
        if (a.password !== undefined && (a.password.length < 6 || a.password.length > CLAVE_MAX))
          return { data: { user: null }, error: errAuth('Password should be at least 6 characters', 422, 'weak_password') }
        if (a.email !== undefined && !correoValido(a.email.trim().toLowerCase()))
          return { data: { user: null }, error: errAuth('Unable to validate email address: invalid format', 400, 'validation_failed') }
        const sets: string[] = ['updated_at = ?']
        const vals: unknown[] = [ahora()]
        if (a.password !== undefined) { sets.push('encrypted_password = ?', 'sesion_version = sesion_version + 1'); vals.push(await bcrypt.hash(a.password, 10)) }
        if (a.email !== undefined) { sets.push('email = ?'); vals.push(a.email.trim().toLowerCase()) }
        if (a.user_metadata !== undefined) { sets.push('raw_user_meta_data = ?'); vals.push(JSON.stringify(a.user_metadata)) }
        if (a.email_confirm) sets.push(`email_confirmed_at = COALESCE(email_confirmed_at, '${ahora()}')`)
        try {
          const u = await db.prepare(`UPDATE auth_users SET ${sets.join(', ')} WHERE id = ? RETURNING id, email`).bind(...vals, id).first<{ id: string; email: string }>()
          if (!u) return { data: { user: null }, error: errAuth('User not found', 404, 'user_not_found') }
          return { data: { user: u }, error: null }
        } catch (e) {
          return { data: { user: null }, error: errAuth((e as Error).message, 422, 'email_exists') }
        }
      },
      async createUser(a: { email: string; password: string; email_confirm?: boolean; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }) {
        if (!servicio) throw new Error('[d1] auth.admin solo con el cliente de servicio')
        if (!correoValido(a.email.trim().toLowerCase())) return { data: { user: null }, error: errAuth('Unable to validate email address: invalid format', 400, 'validation_failed') }
        try {
          if (!a.password || a.password.length < 6 || a.password.length > CLAVE_MAX)
            return { data: { user: null }, error: errAuth('Password should be at least 6 characters', 422, 'weak_password') }
          const id = await crearUsuario(db, { email: a.email.trim().toLowerCase(), password: a.password, app: a.app_metadata, user: metadatosDeUsuario(a.user_metadata) })
          return { data: { user: { id, email: a.email } }, error: null }
        } catch (e) {
          return { data: { user: null }, error: errAuth((e as Error).message, 422, 'email_exists') }
        }
      },
    },
  }

  return {
    from,
    // Las funciones de Postgres que la app llama por RPC, reimplementadas en rpc.ts con el
    // mismo modo de seguridad que tenían (INVOKER = con las políticas de la sesión).
    rpc: async (nombre: string, args?: Record<string, unknown>) => llamarRpc(db, (await ctx()).ctx, nombre, args ?? {}, () => consultas.n++),
    auth,
    /** Consultas a D1 hechas por este cliente (para medir filas por visita). */
    _consultas: consultas,
  }
}
