/**
 * ============================================
 * SUPABASE CLIENT - CEN LABS (EXPERIMENTAL)
 * ============================================
 * Implementación optimizada para 'Escala Real' (1000+ alumnos).
 * Basado en el esquema de Bitácora JSONB y Resultados Agregados.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wbvcclpxxwzkuddjxqig.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_WgQiBEqBJiTFNfms4xzw1Q_HpvRxcYt';

export const isSupabaseConfigured = (): boolean => !!(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// Tipos del Esquema Experimental (Real Scale v9)
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
  sim_id: string; // ej: 'quimica-1'
  status: IntentoStatus;
  score: number;
  total_time_seconds: number;
  last_step: number;
  started_at: string;
  completed_at?: string;
  bitacora_data?: Record<string, any>; // JSONB de respaldo directo
}

export interface BitacoraEntry {
  id: string;
  id_intento: string;
  variable_key: string;
  value: any;
  created_at: string;
}

/**
 * Helper: Obtener perfil del usuario actual
 * Manejo robusto de errores para entornos Enterprise
 */
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
      console.warn('[Supabase] Perfil no encontrado o error:', error.message);
      return null;
    }
    
    return data as Profile;
  } catch (err) {
    console.error('[Supabase] Error crítico en getCurrentProfile:', err);
    return null;
  }
}

/**
 * Helper: Asegurar que el perfil exista (Auto-reparación)
 * Si el perfil no existe, intenta crearlo usando la metadata del usuario.
 */
export async function ensureProfile(userId: string, email: string, metadata: any): Promise<Profile | null> {
  const role = metadata.role || 'alumno';
  const fullName = metadata.full_name || 'Usuario';

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: email,
      full_name: fullName,
      role: role
    })
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error en ensureProfile:', error.message);
    return null;
  }

  return data as Profile;
}

/**
 * Helper: Sincronizar un intento (Upsert)
 */
export async function syncIntento(intento: Partial<Intento>) {
  if (!intento.id_alumno || !intento.sim_id) return { error: 'Faltan datos de identificación' };

  const { data, error } = await supabase
    .from('intentos')
    .upsert(intento, { onConflict: 'id_alumno, sim_id, status' })
    .select();

  return { data, error };
}

/**
 * Helper: Guardar entrada de bitácora
 */
export async function syncBitacoraEntry(entry: Omit<BitacoraEntry, 'id' | 'created_at'>) {
  const { error } = await supabase
    .from('bitacora_entries')
    .insert(entry);

  return { error };
}

// Alias para compatibilidad con tests
export async function guardarResultado(resultado: Partial<Intento>) {
  return syncIntento(resultado);
}

/**
 * Admin Client (Solo Servidor)
 * Creado con SERVICE_ROLE_KEY para operaciones maestras.
 * NUNCA importar esto en componentes de cliente ('use client').
 */
export const getAdminClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada en el servidor.');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};
