import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Máquinas Eléctricas",
  titulo: "Motor de CD: Par y Velocidad",
  duracion: "40 min",
  teoria:
    'Un motor de CD de excitación independiente alimenta por separado el circuito de campo (que crea el flujo Φ) y el circuito de armadura (que gira). El flujo relativo es KΦ=KM·(If/If_nominal); en estado estacionario, la corriente de armadura queda fijada por la carga y el campo, Ia=TL/KΦ —no por la tensión aplicada—; la fuerza contraelectromotriz es Ea=Va−Ia·Ra, y la velocidad angular resultante es ω=Ea/KΦ. El par electromagnético T=KΦ·Ia iguala al par de carga en régimen permanente. El laboratorio arma primero el motor pieza por pieza y solo después desbloquea los controles de simulación.',
  estado: "activo",
  simuladorHtml: "/labs/par-velocidad-motor-cd.html",
};

export default catalogo;
