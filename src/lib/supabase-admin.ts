/**
 * supabase-admin.ts
 * Cliente Supabase con SERVICE_ROLE_KEY — solo para Server Actions y scripts.
 * NUNCA importar en componentes de cliente ('use client').
 * Bypasea RLS — usar únicamente para operaciones administrativas autorizadas.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export const getAdminClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada en el servidor.');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
