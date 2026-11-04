import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Termofluidos y Energía",
  titulo: "Intercambiador a contracorriente por NTU",
  duracion: "40 min",
  teoria: "ε=(1−e^(−NTU(1−Cr)))/(1−Cr·e^(−NTU(1−Cr))); a Cr=1, ε=NTU/(1+NTU). Cmin corresponde al flujo caliente. Entradas 80 y 20 °C. Balance sin pérdidas. Corrientes monofásicas y propiedades constantes.",
  estado: "activo",
  simuladorHtml: "/labs/intercambiador-contracorriente-ntu.html"
};
export default catalogo;
