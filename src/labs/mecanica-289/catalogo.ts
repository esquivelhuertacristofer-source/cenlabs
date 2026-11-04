import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Termofluidos y Energía",
  titulo: "Radio crítico de aislamiento",
  duracion: "40 min",
  teoria: "Tubo de 8 mm de radio, aislamiento k=0,045 W/(m·K) y ΔT=58 K. Resistencia por metro R=ln(r₂/r₁)/(2πk)+1/(2πr₂h), con rcr=k/h. Se omiten radiación y resistencias interiores. Convección constante y flujo radial unidimensional, sin radiación.",
  estado: "activo",
  simuladorHtml: "/labs/radio-critico-aislamiento-tuberia.html"
};
export default catalogo;
