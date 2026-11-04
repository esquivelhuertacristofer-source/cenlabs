import { exigirDocente } from '@/lib/guardia-docente';

// Pantalla de docente: el servidor revisa el rol antes de servirla (hueco H4).
export default async function DocenteLayout({ children }: { children: React.ReactNode }) {
  await exigirDocente();
  return <>{children}</>;
}
