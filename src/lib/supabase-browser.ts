// =============================================================================
// Labs sobre D1 (de financiera-d1, 2026-11-03) — el cliente del NAVEGADOR.
//
// Antes era el supabase-js de verdad: el navegador consultaba la base directamente con
// la llave anónima y RLS decidía qué veía cada quien. Ya no hay base a la que llegar
// desde aquí. Este objeto tiene la misma forma (`from().select().eq()…`, `rpc()`,
// `auth.getUser()`…) para no tocar las pantallas, pero cada consulta viaja al servidor
// (`POST /api/datos`), que la ejecuta con la sesión del usuario y con las mismas
// políticas que aplicaba Supabase, y SOLO si es una de las que la app usa de verdad
// (lista en src/lib/d1/navegador.ts). No hay llave en el paquete del navegador.
//
// Las consultas que se piden en el mismo instante (una pantalla del docente lanza
// varias a la vez) viajan juntas en UN envío: menos peticiones al Worker y ninguna
// pantalla rozando el freno por sesión.
// =============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'

type ErrorDatos = { message: string; code: string; details: string | null; hint: string | null }
type Respuesta = { data: unknown; error: ErrorDatos | null; count: number | null; status: number; statusText: string }
type Pedido =
  | { tipo: 'tabla'; tabla: string; ops: [string, unknown[]][] }
  | { tipo: 'rpc'; nombre: string; args: Record<string, unknown> }
  | { tipo: 'auth'; accion: 'getUser' | 'signOut' }

const RUTA = '/api/datos'
const errorDeRed = (message: string): Respuesta => ({
  data: null, count: null, status: 0, statusText: '',
  error: { message, code: 'RED', details: null, hint: null },
})

// ── El lote: lo que se pide en el mismo instante viaja junto ─────────────────
let cola: { pedido: Pedido; resolver: (r: Respuesta) => void; senal?: AbortSignal }[] = []
let programado = false

function enviar(pedido: Pedido, senal?: AbortSignal): Promise<Respuesta> {
  return new Promise((resolver) => {
    if (senal?.aborted) return resolver(errorDeRed('AbortError'))
    // Cancelar resuelve YA, aunque el lote ya haya salido (los demás del lote siguen su curso).
    senal?.addEventListener('abort', () => resolver(errorDeRed('AbortError')), { once: true })
    cola.push({ pedido, resolver, senal })
    if (programado) return
    programado = true
    setTimeout(despachar, 0)
  })
}

async function despachar() {
  const lote = cola.filter((x) => !x.senal?.aborted)
  for (const x of cola) if (x.senal?.aborted) x.resolver(errorDeRed('AbortError'))
  cola = []
  programado = false
  if (!lote.length) return
  try {
    const r = await fetch(RUTA, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lote: lote.map((x) => x.pedido) }),
    })
    if (r.status === 429) return lote.forEach((x) => x.resolver(errorDeRed('Demasiadas solicitudes')))
    const cuerpo = (await r.json()) as { resultados?: Respuesta[] }
    lote.forEach((x, i) => x.resolver(cuerpo.resultados?.[i] ?? errorDeRed(`HTTP ${r.status}`)))
  } catch (e) {
    lote.forEach((x) => x.resolver(errorDeRed((e as Error).message || 'Failed to fetch')))
  }
}

// ── `from()`: anota la cadena y la manda al resolverse ───────────────────────
const METODOS = ['select', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'is', 'match', 'order', 'limit', 'range',
  'single', 'maybeSingle', 'insert', 'upsert', 'update', 'delete'] as const

class ConsultaRemota implements PromiseLike<Respuesta> {
  private ops: [string, unknown[]][] = []
  private senal?: AbortSignal
  constructor(private tabla: string) {
    for (const m of METODOS) {
      (this as unknown as Record<string, (...a: unknown[]) => ConsultaRemota>)[m] = (...a: unknown[]) => {
        this.ops.push([m, a])
        return this
      }
    }
  }
  abortSignal(s: AbortSignal) { this.senal = s; return this }
  then<A = Respuesta, B = never>(ok?: ((v: Respuesta) => A | PromiseLike<A>) | null, ko?: ((e: unknown) => B | PromiseLike<B>) | null): PromiseLike<A | B> {
    return enviar({ tipo: 'tabla', tabla: this.tabla, ops: this.ops }, this.senal).then(ok, ko)
  }
}

// ── auth: la sesión vive en una cookie HttpOnly que JavaScript no puede leer ─
// getUser/getSession preguntan al servidor. Las preguntas SIMULTÁNEAS (varios componentes al
// cargar) comparten una sola; la respuesta no se guarda: justo después de iniciar sesión, la
// pantalla de login vuelve a preguntar y tiene que ver la sesión nueva. signOut la cierra allá.
let usuarioEnVuelo: Promise<Respuesta> | null = null
function usuarioActual(): Promise<Respuesta> {
  if (usuarioEnVuelo) return usuarioEnVuelo
  usuarioEnVuelo = enviar({ tipo: 'auth', accion: 'getUser' }).finally(() => { usuarioEnVuelo = null })
  return usuarioEnVuelo
}

type UsuarioNavegador = { id: string; email: string; app_metadata: Record<string, unknown>; user_metadata: Record<string, unknown>; created_at: string }

const cliente = {
  from: (tabla: string) => new ConsultaRemota(tabla),
  rpc: (nombre: string, args?: Record<string, unknown>) => enviar({ tipo: 'rpc', nombre, args: args ?? {} }),
  auth: {
    async getUser() {
      const r = await usuarioActual()
      const user = (r.data as { user?: UsuarioNavegador } | null)?.user ?? null
      return { data: { user }, error: user ? null : r.error }
    },
    async getSession() {
      const r = await usuarioActual()
      const user = (r.data as { user?: UsuarioNavegador } | null)?.user ?? null
      return { data: { session: user ? { user } : null }, error: null }
    },
    async signOut() {
      usuarioEnVuelo = null
      const r = await enviar({ tipo: 'auth', accion: 'signOut' })
      usuarioEnVuelo = null
      return { error: r.error }
    },
  },
}

/** Con los tipos de supabase-js (solo tipos: nada de supabase-js viaja al navegador). */
export const supabase = cliente as unknown as SupabaseClient
