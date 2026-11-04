import { exigirDocente } from '@/lib/guardia-docente';
import InicioDocente from '@/components/InicioDocente';

// Tablero raíz: solo profesores (el admin va a su panel y el alumno al suyo), decidido en el
// servidor (hueco H4). La parte de cliente es la misma de antes.
export default async function Home() {
  await exigirDocente(['profesor']);
  return <InicioDocente />;
}
