'use server'

import { getAdminClient } from '@/lib/supabase';

/**
 * Asegura que el perfil del usuario exista en la tabla 'profiles'.
 * Esta función corre en el servidor y usa el SERVICE_ROLE_KEY para bypass de RLS.
 */
export async function ensureProfileServer(userId: string, email: string, metadata: any) {
  try {
    const adminClient = getAdminClient();
    const role = metadata.role || 'alumno';
    const fullName = metadata.full_name || 'Usuario';

    const { data, error } = await adminClient
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        full_name: fullName,
        role: role
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('[Server Action] Error en ensureProfile:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, profile: data };
  } catch (err: any) {
    console.error('[Server Action] Error fatal:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sincroniza el progreso de un intento (Autosave) desde el servidor.
 */
export async function syncIntentoServer(intento: any) {
  try {
    const adminClient = getAdminClient();
    
    const { data, error } = await adminClient
      .from('intentos')
      .upsert(intento, { 
        onConflict: 'id_alumno, sim_id, status',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('[Server Action] Error en syncIntento:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
