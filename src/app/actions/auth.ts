'use server'

import { createSupabaseServerClient, getSupabaseAdmin, usuarioConRol } from '@/lib/supabase-server';
import { validarIntento } from '@/lib/d1/navegador';

// =============================================================================
// Labs sobre D1 — acciones de sesión (2026-11-03).
//
// Antes, ensureProfileServer escribía con la llave de servicio el rol y el correo que mandara
// el navegador, para CUALQUIER id y sin revisar la sesión: cualquiera podía hacerse admin
// (hueco H1, cerrado también en Supabase ese día). Aquí:
//  · iniciarSesion: el login pasa al servidor (el navegador ya no habla con la base).
//  · ensureProfileServer: solo para la sesión que llama; los argumentos del navegador se
//    IGNORAN (se conserva la firma para no tocar a quien la usa). Solo CREA el perfil que
//    falta, con el rol de su alta (alumno/profesor); nunca modifica uno existente.
//  · syncIntentoServer: con las políticas de la sesión (ya no con la llave de servicio) y
//    con los mismos topes que /api/datos (validarIntento).
// =============================================================================

export type ResultadoLogin =
  | { ok: true; role: 'alumno' | 'profesor' | 'admin' }
  | { ok: false; error: 'credenciales' | 'pausa' | 'perfil' | 'error' }

/** Inicia sesión y dice a dónde mandar (por rol). No revela si el correo existe. */
export async function iniciarSesion(email: string, password: string): Promise<ResultadoLogin> {
  if (typeof email !== 'string' || typeof password !== 'string') return { ok: false, error: 'credenciales' }
  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, error: error.status === 429 ? 'pausa' : 'credenciales' }
    const yo = await ensureProfileServer()
    if (!yo.success || !yo.profile) return { ok: false, error: 'perfil' }
    return { ok: true, role: yo.profile.role }
  } catch (e) {
    console.error('[auth] iniciarSesion:', (e as Error).message?.slice(0, 200))
    return { ok: false, error: 'error' }
  }
}

type Perfil = { id: string; email: string; full_name: string | null; role: 'alumno' | 'profesor' | 'admin'; created_at: string }

/**
 * Asegura que exista el perfil de QUIEN LLAMA. Los argumentos se ignoran a propósito (antes
 * eran la puerta de la escalada a admin); se aceptan para no romper llamadas viejas.
 */
export async function ensureProfileServer(..._ignorados: unknown[]): Promise<{ success: boolean; profile?: Perfil; error?: string }> {
  void _ignorados
  try {
    const yo = await usuarioConRol()
    if (!yo) return { success: false, error: 'No autorizado' }
    const admin = await getSupabaseAdmin()
    const { data: existente } = await admin.from('profiles').select('*').eq('id', yo.id).maybeSingle()
    if (existente) return { success: true, profile: existente as Perfil }
    // Falta el perfil (en producción había 1 usuario así): se crea con el rol de su ALTA.
    const rolAlta = yo.user_metadata.role === 'profesor' ? 'profesor' : 'alumno'
    const nombre = typeof yo.user_metadata.full_name === 'string' ? yo.user_metadata.full_name.slice(0, 120) : 'Usuario Nuevo'
    const { data, error } = await admin.from('profiles')
      .upsert({ id: yo.id, email: yo.email, full_name: nombre, role: rolAlta }, { onConflict: 'id', ignoreDuplicates: true })
      .select().maybeSingle()
    if (error) return { success: false, error: 'No se pudo crear el perfil' }
    const perfil = data ?? (await admin.from('profiles').select('*').eq('id', yo.id).maybeSingle()).data
    return perfil ? { success: true, profile: perfil as Perfil } : { success: false, error: 'No se pudo crear el perfil' }
  } catch (err) {
    console.error('[Server Action] ensureProfile:', (err as Error).message?.slice(0, 200))
    return { success: false, error: 'Error interno' }
  }
}

/**
 * Sincroniza el progreso de un intento (Autosave). Siempre a nombre de quien llama, con las
 * políticas de su sesión y los topes de forma de validarIntento.
 */
export async function syncIntentoServer(intento: unknown) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autorizado' }
    if (!intento || typeof intento !== 'object' || Array.isArray(intento)) return { success: false, error: 'Intento inválido' }
    // id_alumno SIEMPRE de la sesión; las demás columnas, solo las de un intento y en rango.
    const fila: Record<string, unknown> = { ...(intento as Record<string, unknown>), id_alumno: user.id }
    delete fila.id
    const motivo = validarIntento(fila)
    if (motivo) return { success: false, error: motivo }
    const { data, error } = await supabase
      .from('intentos')
      .upsert(fila, { onConflict: 'id_alumno, sim_id, status', ignoreDuplicates: false })
      .select()
    if (error) {
      console.error('[Server Action] syncIntento:', error.message?.slice(0, 200))
      return { success: false, error: 'No se pudo guardar' }
    }
    return { success: true, data }
  } catch (err) {
    console.error('[Server Action] syncIntento:', (err as Error).message?.slice(0, 200))
    return { success: false, error: 'Error interno' }
  }
}
