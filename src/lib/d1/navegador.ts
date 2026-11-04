import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
// Labs sobre D1 — lo que el NAVEGADOR puede pedir (POST /api/datos). Patrón de
// financiera-d1 (en producción desde 2026-11-02), con las formas de Labs.
//
// En Supabase, el navegador podía mandar CUALQUIER consulta con la llave anónima y RLS
// decidía. Aquí se aceptan solo las formas que la app usa de verdad, medidas en el código
// el 2026-11-03 (las 21 pantallas cliente, ver docs/PERFIL-MIGRACION-D1.md §5):
//   · leer: profiles, grupos, alumnos_grupos, intentos, asignaciones;
//   · escribir:
//       - intentos (upsert): SimuladorClient y MecanicaShellClient guardan el avance;
//       - asignaciones (insert): CalendarPanel planea una práctica;
//       - alumnos_grupos (upsert): AlumnosContent. En producción NO hay política de
//         INSERT y Supabase lo rechaza; aquí pasa por las mismas políticas y se rechaza
//         igual (equivalencia; ver el perfil).
// Cada una pasa por las políticas de la sesión, como antes, y además por topes de forma
// que Postgres no tenía (`validarIntento`). Lo que no está en la lista responde 42501 sin
// tocar la base. No hay RPC.
// =============================================================================

type Op = 'select' | 'upsert' | 'insert'
export const TABLAS_NAVEGADOR: Record<string, ReadonlySet<Op>> = {
  profiles: new Set<Op>(['select']),
  grupos: new Set<Op>(['select']),
  alumnos_grupos: new Set<Op>(['select', 'upsert']),
  intentos: new Set<Op>(['select', 'upsert']),
  asignaciones: new Set<Op>(['select', 'insert']),
}

const OPERACIONES = new Set(['insert', 'upsert', 'update', 'delete'])
const MODIFICADORES = new Set(['select', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'is', 'match', 'order', 'limit', 'range', 'single', 'maybeSingle'])
const MAX_PEDIDOS = 20
const MAX_OPS = 30
const MAX_FILAS_ESCRITAS = 50

type ErrorDatos = { message: string; code: string; details: string | null; hint: string | null }
export type Respuesta = { data: unknown; error: ErrorDatos | null; count: number | null; status: number; statusText: string }
export type Pedido =
  | { tipo: 'tabla'; tabla: string; ops: [string, unknown[]][] }
  | { tipo: 'rpc'; nombre: string; args: Record<string, unknown> }
  | { tipo: 'auth'; accion: 'getUser' | 'signOut' }

const rechazo = (message: string, code = '42501'): Respuesta => ({
  data: null, count: null, status: 403, statusText: 'Forbidden', error: { message, code, details: null, hint: null },
})

// ── Topes de forma de un intento (lo que Postgres no revisaba) ───────────────
// Medido en producción el 2026-11-03: notas 0–100, tiempo hasta 9,543 s, paso hasta 4,
// bitácora hasta 5.5 KB, sim_id tipo «quimica-3». Los topes dejan holgura sobre eso.
// Las FECHAS las pone el servidor: el navegador ya no puede fechar un intento en el pasado.
const COLS_INTENTO = new Set(['id_alumno', 'sim_id', 'status', 'score', 'total_time_seconds', 'last_step', 'bitacora_data', 'started_at', 'completed_at'])
const ESTADOS = new Set(['in_progress', 'completed', 'abandoned'])
const SIM_ID = /^[a-z0-9][a-z0-9_-]{0,79}$/i
const entero = (v: unknown, min: number, max: number) => v === undefined || v === null || (Number.isInteger(v) && (v as number) >= min && (v as number) <= max)

/** Devuelve el motivo del rechazo, o null si la fila es válida. Fija las fechas con la hora del servidor. */
export function validarIntento(f: Record<string, unknown>): string | null {
  for (const k of Object.keys(f)) if (!COLS_INTENTO.has(k)) return `columna no permitida: ${k.slice(0, 40)}`
  if (typeof f.sim_id !== 'string' || !SIM_ID.test(f.sim_id)) return 'sim_id inválido'
  if (f.status !== undefined && !ESTADOS.has(f.status as string)) return 'status inválido'
  if (!entero(f.score, 0, 100)) return 'score fuera de rango (0–100)'
  if (!entero(f.total_time_seconds, 0, 86_400)) return 'total_time_seconds fuera de rango'
  if (!entero(f.last_step, 0, 1_000)) return 'last_step fuera de rango'
  if (f.bitacora_data !== undefined && JSON.stringify(f.bitacora_data ?? null).length > 32 * 1024) return 'bitacora_data demasiado grande (32 KB)'
  const ahora = new Date().toISOString()
  if (f.started_at !== undefined) f.started_at = ahora
  if (f.completed_at !== undefined) f.completed_at = f.completed_at === null ? null : ahora
  return null
}

/**
 * Lo que vuelve al navegador nunca lleva SQL ni nombres internos de D1 (manual 3b, «errores que
 * filtran»): un error de la base sale con un mensaje genérico; los de permisos y los de Postgres
 * emulados (23505, 42501, PGRST116…) pasan tal cual, porque el código los revisa.
 */
function limpiar(r: Respuesta): Respuesta {
  if (!r.error) return r
  const interno = r.error.code === 'D1000' || /D1_ERROR|SQLITE|no such (table|column)|\[d1\]/i.test(r.error.message)
  if (!interno) return r
  console.error(`[datos] error interno: ${r.error.message.slice(0, 200)}`)
  return { ...r, error: { message: 'No se pudo completar la consulta.', code: 'D1000', details: null, hint: null } }
}

/** Valida y ejecuta UN pedido con el cliente de la sesión. No lanza: todo fallo es un Respuesta. */
async function uno(cliente: SupabaseClient, p: Pedido): Promise<Respuesta> {
  if (!p || typeof p !== 'object') return rechazo('Pedido inválido', '22023')
  if (p.tipo === 'auth') {
    if (p.accion === 'getUser') {
      const { data, error } = await cliente.auth.getUser()
      return { data: { user: data.user }, error: error ? { message: error.message, code: 'session_not_found', details: null, hint: null } : null, count: null, status: 200, statusText: 'OK' }
    }
    if (p.accion === 'signOut') {
      await cliente.auth.signOut()
      return { data: null, error: null, count: null, status: 200, statusText: 'OK' }
    }
    return rechazo('Acción de sesión no permitida')
  }
  if (p.tipo === 'rpc') return rechazo(`permission denied for function ${String((p as { nombre?: unknown }).nombre).slice(0, 60)}`)
  if (p.tipo !== 'tabla' || typeof p.tabla !== 'string') return rechazo('Pedido inválido', '22023')
  const permitidas = TABLAS_NAVEGADOR[p.tabla]
  if (!permitidas) return rechazo(`permission denied for table ${p.tabla.slice(0, 60)}`)
  if (!Array.isArray(p.ops) || p.ops.length > MAX_OPS) return rechazo('Consulta inválida', '22023')
  let operacion: Op = 'select'
  for (const op of p.ops) {
    if (!Array.isArray(op) || typeof op[0] !== 'string' || !Array.isArray(op[1])) return rechazo('Consulta inválida', '22023')
    if (OPERACIONES.has(op[0])) {
      if ((op[0] !== 'upsert' && op[0] !== 'insert') || !permitidas.has(op[0])) return rechazo(`permission denied for table ${p.tabla}`)
      if (operacion !== 'select') return rechazo('Una sola escritura por pedido', '22023')
      const filas = Array.isArray(op[1][0]) ? op[1][0] : [op[1][0]]
      if (!filas.length || filas.length > MAX_FILAS_ESCRITAS || filas.some((f) => !f || typeof f !== 'object' || Array.isArray(f))) return rechazo('Filas inválidas', '22023')
      if (p.tabla === 'intentos') {
        for (const f of filas as Record<string, unknown>[]) {
          const motivo = validarIntento(f)
          if (motivo) return rechazo(motivo, '22023')
        }
      }
      operacion = op[0]
    } else if (!MODIFICADORES.has(op[0])) {
      return rechazo(`Método no permitido: ${op[0].slice(0, 30)}`, '22023')
    }
  }
  try {
    let q = cliente.from(p.tabla) as unknown as Record<string, (...a: unknown[]) => unknown>
    for (const [m, a] of p.ops) q = (q[m] as (...x: unknown[]) => Record<string, (...a: unknown[]) => unknown>)(...a)
    return limpiar((await (q as unknown as PromiseLike<Respuesta>)) as Respuesta)
  } catch (e) {
    // Una columna o relación desconocida truena al armar la consulta: es un pedido inválido.
    return limpiar({ data: null, count: null, status: 400, statusText: 'Bad Request', error: { message: (e as Error).message, code: (e as { code?: string }).code ?? 'D1000', details: null, hint: null } })
  }
}

/** Un lote del navegador, en orden. Con tope de pedidos: un lote gigante no llega a la base. */
export async function atenderLote(cliente: SupabaseClient, lote: unknown): Promise<Respuesta[] | null> {
  if (!Array.isArray(lote) || !lote.length || lote.length > MAX_PEDIDOS) return null
  const salida: Respuesta[] = []
  // En orden y de uno en uno: D1 atiende una consulta a la vez por base, en paralelo no se gana.
  for (const p of lote) salida.push(await uno(cliente, p as Pedido))
  return salida
}
