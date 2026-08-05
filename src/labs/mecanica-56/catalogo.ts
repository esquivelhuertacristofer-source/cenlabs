import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Máquinas Eléctricas",
  titulo: "Variador V/f del Motor de Inducción",
  duracion: "35 min",
  teoria:
    'Un variador de frecuencia (VFD) cambia la velocidad de un motor de inducción cambiando la frecuencia de la tensión que le entrega, pero para no perder par debe mantener la relación entre tensión y frecuencia (V/f) constante hasta la frecuencia nominal del motor: así conserva el flujo del entrehierro y, con él, el par máximo disponible en toda la región de "par constante". Por encima de esa frecuencia base, la tensión ya no puede seguir creciendo (queda topada al 100%), el flujo disminuye y el par máximo cae — la región de "debilitamiento de campo". El laboratorio permite explorar cómo cambia la velocidad estable del motor al mover la frecuencia comandada y la carga mecánica, comparar las curvas par-velocidad de cuatro frecuencias de referencia, correr dos demostraciones guiadas que contrastan un arranque directo a la red contra un arranque en rampa desde baja frecuencia, y en modo Reto encontrar —a mano o por tanteo— la frecuencia mínima a la que el motor sostiene una carga dada antes de calarse.',
  estado: "activo",
  simuladorHtml: "/labs/variador-vf-motor-induccion.html",
};

export default catalogo;
