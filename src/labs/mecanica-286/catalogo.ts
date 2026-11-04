import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Termofluidos y Energía",
  titulo: "Moody y pérdidas en una tubería",
  duracion: "40 min",
  teoria: "Agua ν=10⁻⁶ m²/s, D=40 mm, L=25 m y ΣK=3. Re=vD/ν. En régimen laminar f=64/Re. En turbulento se usa Swamee–Jain. Pérdida (fL/D+ΣK)v²/(2g). Interpolación didáctica entre Re=2300 y 4000. Accesorios agrupados en un único coeficiente.",
  estado: "activo",
  simuladorHtml: "/labs/moody-perdidas-carga-tuberia.html"
};
export default catalogo;
