'use server'

import { getAdminClient } from '@/lib/supabase-admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const VALID_ROLES = ['alumno', 'profesor', 'admin'] as const;
type ValidRole = typeof VALID_ROLES[number];

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Asegura que el perfil del usuario exista en la tabla 'profiles'.
 * Esta función corre en el servidor y usa el SERVICE_ROLE_KEY para bypass de RLS.
 */
export async function ensureProfileServer(userId: string, email: string, metadata: any) {
  try {
    const adminClient = getAdminClient();
    const roleFromMeta = metadata?.role;
    const role: ValidRole = VALID_ROLES.includes(roleFromMeta as ValidRole)
      ? (roleFromMeta as ValidRole)
      : 'alumno';
    const fullName = metadata?.full_name || 'Usuario';

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
 * Siempre usa el id del usuario autenticado — ignora cualquier id_alumno del cliente.
 */
export async function syncIntentoServer(intento: any) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const adminClient = getAdminClient();

    // id_alumno SIEMPRE del token verificado, nunca del cliente
    const intentoSeguro = {
      ...intento,
      id_alumno: user.id,
    };

    const { data, error } = await adminClient
      .from('intentos')
      .upsert(intentoSeguro, {
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
