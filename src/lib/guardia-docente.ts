import 'server-only'
import { redirect } from 'next/navigation'
import { usuarioConRol, type Rol } from '@/lib/supabase-server'

// Labs sobre D1 (2026-11-03) · hueco H4: las pantallas de docente solo se defendían en el
// navegador (la página pedía el perfil y redirigía). Ahora el servidor decide antes de mandar
// nada, con el mismo destino que ya usaba la página: alumno → su panel, sin sesión o sin rol →
// acceso. Los datos ya los filtran las políticas; esto evita servir la pantalla.
export async function exigirDocente(permitidos: Rol[] = ['profesor', 'admin']): Promise<void> {
  const yo = await usuarioConRol()
  if (!yo || !yo.role) redirect('/login')
  if (permitidos.includes(yo.role)) return
  if (yo.role === 'alumno') redirect('/alumno/inicio')
  if (yo.role === 'admin') redirect('/admin/usuarios')
  redirect('/login')
}
