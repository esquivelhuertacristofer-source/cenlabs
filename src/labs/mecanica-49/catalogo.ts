import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Máquinas Eléctricas",
  titulo: "Motor de Inducción: Deslizamiento y Curva Par-Velocidad",
  duracion: "40 min",
  teoria:
    'En un motor de inducción trifásico, el estátor genera un campo magnético giratorio a la velocidad síncrona ns=120·f/p; el rotor de jaula de ardilla nunca alcanza esa velocidad —gira más despacio, con un deslizamiento s=(ns−n)/ns— porque necesita ese atraso relativo para inducir la corriente que produce su propio par. La curva simplificada de Kloss, T(s)=2·Tmáx/(s/sm+sm/s), describe cómo ese par depende del deslizamiento: crece desde el arranque hasta un máximo (par de vuelco) y luego decae. Para cualquier par de carga TL≤Tmáx existe un único punto de operación estable; si TL supera a Tmáx, el motor se cala. El laboratorio arma primero el motor pieza por pieza y solo después desbloquea los controles de simulación.',
  estado: "activo",
  simuladorHtml: "/labs/par-velocidad-motor-induccion.html",
};

export default catalogo;
