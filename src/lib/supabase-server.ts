import 'server-only'
import { cookies, headers } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import { crearClienteD1 } from '@/lib/d1/cliente'
import { getD1 } from '@/lib/d1/binding'
import { getServerSecret } from '@/lib/d1/secreto'

/**
 * Labs sobre D1 (de financiera-d1): cliente con la SESIÓN del usuario (cookie labs_sesion,
 * firmada). Misma forma que el de @supabase/ssr para no tocar a quien lo usa; las políticas
 * que en Supabase hacía RLS las aplica src/lib/d1/consulta.ts. Aquí no hay ninguna llave de
 * Supabase.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()
  const cliente = crearClienteD1({
    db: await getD1(),
    secreto: await getServerSecret('SESION_SECRETO'),
    ip: (await headers()).get('cf-connecting-ip') ?? undefined,
    galletas: {
      get: (n) => cookieStore.get(n),
      set: (n, v, o) => {
        // En un Server Component cookieStore.set() lanza; ahí solo se lee la sesión.
        try { cookieStore.set(n, v, o) } catch { /* render de Server Component */ }
      },
    },
  })
  return cliente as unknown as SupabaseClient
}

/**
 * Cliente de SERVICIO (lo que era la service_role): NO aplica políticas. Solo en el servidor,
 * y solo después de comprobar quién llama.
 */
export async function getSupabaseAdmin(): Promise<SupabaseClient> {
  return crearClienteD1({ db: await getD1(), servicio: true }) as unknown as SupabaseClient
}

export type Rol = 'alumno' | 'profesor' | 'admin'

/**
 * Quién llama, con su rol leído del servidor (nunca del navegador). null = sin sesión válida.
 * Es la comprobación que faltaba en ensureProfileServer (hueco H1 del 2026-11-03).
 */
export async function usuarioConRol(): Promise<{ id: string; email: string; role: Rol | null; user_metadata: Record<string, unknown> } | null> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: perfil } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = (perfil as { role?: string } | null)?.role
  return {
    id: user.id,
    email: user.email ?? '',
    role: role === 'alumno' || role === 'profesor' || role === 'admin' ? role : null,
    user_metadata: (user.user_metadata ?? {}) as Record<string, unknown>,
  }
}
