import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Sincronizador de caja: igualar antes de engranar",
  duracion: "40 min",
  teoria: "OT-244 · Sincroniza en ≤1,2 s con par ≤4 N·m, fuerza axial ≤140 N y coeficiente ≥0,065. Sincronizador abierto, horquilla y registro de régimen relativo. Cono simple Rm=45 mm, semiángulo7°: T=µFaRm/sinα. Inercia referida0,02 kg·m², diferencia inicial1500 rpm, eje receptor1000 rpm. ts=JΔω/T, Q=½JΔω². Diferencia decrece linealmente hasta cero. Las fases iniciales se eligen para alinear los dientes al completar ts; después entra el manguito en0,5 s. Fricción constante y receptor de velocidad impuesta. Sin película de aceite, anillo bloqueador dinámico, elasticidad de dientes o choque de engrane. Alineación de dientes preparada al inicio; no reproduce una búsqueda de fase real. Giro×1/100, sincronía en segundos físicos. Se diferencia de DCT: sincronizador de cono, no dos embragues de potencia.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/sincronizador-cono-caja.html"
};
export default catalogo;
