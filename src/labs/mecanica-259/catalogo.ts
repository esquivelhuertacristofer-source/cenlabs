import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecánica de Sólidos",
  titulo: "Cercha: reacciones y fuerzas en las barras",
  duracion: "40 min",
  teoria: "OT-259 · Sostén ≥24 kN con esfuerzo ≤100 MPa, flecha ≤2 mm y altura ≤800 mm. Cercha triangular, base 2 m y nudo central a h. Barras A=300 mm², E=210 GPa; l=√(1+h²). RA=RB=P/2; Nd=−Pl/(2h); Nt=P/(2h). Castigliano: δ=P(l³+1)/(2EA h²). Un apoyo articulado y otro rodillo. Barras biarticuladas sólo axiales, sin peso propio, rigidez de nudos, flexión ni verificación de pandeo de diagonales. Deformada sólo del nudo por trabajo virtual, ×25; no apta para selección estructural real.",
  estado: "activo",
  simuladorHtml: "/labs/cercha-equilibrio-barras.html"
};
export default catalogo;
