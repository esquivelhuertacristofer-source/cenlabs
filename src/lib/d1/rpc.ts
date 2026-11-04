import 'server-only'
import type { Contexto } from '@/lib/d1/consulta'

// =============================================================================
// Labs sobre D1 — `.rpc()`.
//
// Labs no llama ninguna función de Postgres desde la app (medido en el código el
// 2026-11-03: 0 llamadas a `.rpc(`). Las 4 funciones de la base de producción son de
// triggers (handle_new_user, cen_proteger_perfil), de un evento (rls_auto_enable) o
// de una política (cen_es_docente), y su lógica vive aquí en cliente.ts y consulta.ts.
// En Supabase, PostgREST dejaba llamar por RPC a cen_es_docente con cualquier sesión;
// aquí no hay ninguna: responde PGRST202, como PostgREST con una función que no existe.
// Si mañana la app necesita una, se agrega a propósito (ver financiera-d1/src/lib/d1/rpc.ts).
// =============================================================================

type Resultado = { data: unknown; error: { message: string; code: string; details: string | null; hint: string | null } | null }

export async function llamarRpc(_db: D1Database, _ctx: Contexto, nombre: string, _args: Record<string, unknown>, _onQuery?: () => void): Promise<Resultado> {
  void _db; void _ctx; void _args; void _onQuery
  return {
    data: null,
    error: { message: `Could not find the function public.${String(nombre).slice(0, 60)} in the schema cache`, code: 'PGRST202', details: null, hint: null },
  }
}
