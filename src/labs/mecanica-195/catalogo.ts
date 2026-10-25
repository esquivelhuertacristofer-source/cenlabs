import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Apriete controlado por par y ángulo",
  duracion: "40 min",
  teoria: "OT-195 · Consigue12–16 kN con esfuerzo≤300 MPa y par entre10 y20 N·m. Atornillador, transductor de par y unión seccionada. Paso1,5 mm; avance=pθ/(2π). Rigidez equivalente tornillo+unión50 MN/m; F=keq avance. Área resistente58 mm². Par ideal=T=F[p/(2π)+µreff], reff=6 mm. Unión elástica lineal ya asentada, sin plastificación, dispersión de fricción, fluencia ni geometría detallada de rosca. keq representa al conjunto; el avance no es elongación sólo del tornillo. No usa datos de un tornillo certificado.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/apriete-control-par-angulo.html"
};
export default catalogo;
