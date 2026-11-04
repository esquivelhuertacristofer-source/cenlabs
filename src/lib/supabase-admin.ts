/**
 * supabase-admin.ts — Labs sobre D1.
 * Antes: cliente de Supabase con SERVICE_ROLE_KEY. Ahora: el cliente de SERVICIO de D1
 * (no aplica políticas). Solo para Server Actions, después de comprobar quién llama.
 * NUNCA importar en componentes de cliente ('use client'). Ya no hay ninguna llave.
 */
import 'server-only'
export { getSupabaseAdmin as getAdminClient } from '@/lib/supabase-server'
