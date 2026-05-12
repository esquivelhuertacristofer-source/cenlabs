/**
 * supabase-helpers.ts
 * Helpers de dominio y tipos que usan el cliente SSR (supabase-browser).
 * Reemplaza los helpers que estaban en lib/supabase.ts (cliente vanilla — eliminado).
 * Todos los componentes de navegador importan de aquí, no del cliente directo.
 */

import { supabase } from '@/lib/supabase-browser';

// ── Tipos ────────────────────────────────────────────────────────────────────

export type UserRole = 'alumno' | 'profesor' | 'admin';
export type IntentoStatus = 'in_progress' | 'completed' | 'abandoned';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
}

export interface Intento {
  id: string;
  id_alumno: string;
  sim_id: string;
  status: IntentoStatus;
  score: number;
  total_time_seconds: number;
  last_step: number;
  started_at: string;
  completed_at?: string;
  bitacora_data?: Record<string, unknown>;
}

export interface Asignacion {
  id: string;
  id_profesor: string;
  id_grupo: string;
  sim_id: string;
  planned_date: string;
  notes?: string;
  created_at: string;
}

export interface BitacoraEntry {
  id: string;
  id_intento: string;
  variable_key: string;
  value: unknown;
  created_at: string;
}

// ── Guards ───────────────────────────────────────────────────────────────────

export const isSupabaseConfigured = (): boolean =>
  !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// ── getCurrentProfile ────────────────────────────────────────────────────────

export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.warn('[supabase-helpers] Perfil no encontrado:', error.message);
      return null;
    }

    return data as Profile;
  } catch (err) {
    console.error('[supabase-helpers] Error en getCurrentProfile:', err);
    return null;
  }
}

// ── syncIntento ──────────────────────────────────────────────────────────────

export async function syncIntento(intento: Partial<Intento>) {
  if (!intento.id_alumno || !intento.sim_id) {
    return { error: 'Faltan datos de identificación' };
  }

  const { data, error } = await supabase
    .from('intentos')
    .upsert(intento, { onConflict: 'id_alumno, sim_id, status' })
    .select();

  return { data, error };
}

// ── guardarResultado ─────────────────────────────────────────────────────────

export async function guardarResultado(resultado: Partial<Intento>) {
  return syncIntento(resultado);
}

// ── ensureProfile ────────────────────────────────────────────────────────────

/**
 * @deprecated Usa `ensureProfileServer` (server action en @/app/actions/auth.ts).
 * Esta versión usa la anon key y falla si RLS impide el upsert desde el cliente.
 * Solo se mantiene por compatibilidad con el flujo de login.
 */
export async function ensureProfile(
  userId: string,
  email: string,
  metadata: { role?: string; full_name?: string }
): Promise<Profile | null> {
  console.warn('[supabase-helpers] ensureProfile (anon key) está deprecado. Usa ensureProfileServer.');
  const role = metadata.role ?? 'alumno';
  const fullName = metadata.full_name ?? 'Usuario';

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, email, full_name: fullName, role })
    .select()
    .single();

  if (error) {
    console.error('[supabase-helpers] Error en ensureProfile:', error.message);
    return null;
  }

  return data as Profile;
}
