/**
 * ============================================
 * SUPABASE CLIENT - CEN LABS
 * ============================================
 * Cliente preparado para conexión a Supabase.
 * La URL y KEY se configurarán mediante variables de entorno.
 * 
 * USO:
 * 1. Crear archivo .env.local con:
 *    NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
 * 
 * 2. En producción, agregar SUPABASE_SERVICE_ROLE_KEY en variables de servidor
 * 
 * 3. Descomentar la línea de import cuando Supabase esté configurado
 */

// import { createClient } from '@supabase/supabase-js';

// Tipos para resultados de prácticas
export interface ResultadoPractica {
    id?: string;
    user_id: string;
    practica_id: string; // ej: "quimica-1", "fisica-3", "biologia-7"
    materia: 'quimica' | 'fisica' | 'matematicas' | 'biologia';
    score: number;
    tiempo_segundos: number;
    checkpoints_completados: number;
    fecha_inicio: string;
    fecha_fin: string;
    seeds_utilizadas: Record<string, number>; // Semillas de aleatoriedad por práctica
    validation_server_ts?: string; // Timestamp del servidor para anti-cheat
    ip_hash?: string; // Hash de IP para rate limiting
}

export interface UserProgress {
    id?: string;
    user_id: string;
    practica_id: string;
    mejor_score: number;
    tiempo_promedio: number;
    intentos_totales: number;
    ultimo_intento: string;
    completado: boolean;
}

// Cliente Supabase preparado (descomentar cuando se configuren las variables)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/*
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
*/

// Función helper para verificar si Supabase está configurado
export const isSupabaseConfigured = (): boolean => {
    return Boolean(supabaseUrl && supabaseAnonKey);
};

// Función genérica para guardar resultados
export async function guardarResultado(resultado: ResultadoPractica): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
        console.warn('[Supabase] No configurado. Guardando en localStorage como fallback.');
        // Fallback a localStorage
        const resultados = JSON.parse(localStorage.getItem('cen_results') || '[]');
        resultados.push({ ...resultado, local_timestamp: new Date().toISOString() });
        localStorage.setItem('cen_results', JSON.stringify(resultados));
        return { success: true };
    }

    try {
        // Descomentar cuando Supabase esté configurado:
        // const { error } = await supabase.from('resultados_practicas').insert(resultado);
        // if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('[Supabase] Error al guardar resultado:', error);
        return { success: false, error: String(error) };
    }
}

// Función para obtener progreso de usuario
export async function obtenerProgreso(userId: string, practicaId?: string): Promise<UserProgress[]> {
    if (!isSupabaseConfigured()) {
        return [];
    }

    try {
        // Descomentar cuando Supabase esté configurado:
        /*
        let query = supabase.from('progreso_usuario').select('*').eq('user_id', userId);
        if (practicaId) {
          query = query.eq('practica_id', practicaId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
        */
        return [];
    } catch (error) {
        console.error('[Supabase] Error al obtener progreso:', error);
        return [];
    }
}
