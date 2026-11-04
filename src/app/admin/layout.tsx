import { redirect } from 'next/navigation';
import { usuarioConRol } from '@/lib/supabase-server';

// Labs sobre D1: sesión propia; el rol se lee del servidor (antes, con la llave de servicio).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const yo = await usuarioConRol();
  if (!yo) redirect('/login');
  if (yo.role !== 'admin') redirect('/login');

  return <>{children}</>;
}
