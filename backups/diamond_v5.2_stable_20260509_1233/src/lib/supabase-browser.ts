import { createBrowserClient } from '@supabase/ssr';

// Cliente para componentes del navegador.
// Usa createBrowserClient de @supabase/ssr para sincronizar la sesión
// tanto en localStorage como en cookies httpOnly — esto permite que
// el middleware del servidor verifique la autenticación sin JS del cliente.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
