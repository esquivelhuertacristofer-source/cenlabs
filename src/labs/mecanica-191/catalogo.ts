import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Puesta en servicio de precarga HV",
  duracion: "40 min",
  teoria: "OT-191 · Limita el pico a8 A y2500 W; cierra en≤900 ms con diferencia≤20 V. Resistencia, condensadores, contactores en corte y registroV/I. V=400 V,C=2 mF; Vc=V(1−exp(−t/RC)), I=V/R exp(−t/RC). Calor enR=CV²/2(1−exp(−2tc/RC)). Diferencia al cierre=V exp(−tc/RC). El indicador del contactor sigue tc. RC ideal, fuente rígida y contactor lógico. Al cerrar no se integra el transitorio del camino principal; la tensión mostrada conserva el valor previo. Sin arco, rebote, capacidad parásita, batería dinámica ni norma de seguridad. Sólo banco virtual.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/puesta-servicio-precarga-hv.html"
};
export default catalogo;
