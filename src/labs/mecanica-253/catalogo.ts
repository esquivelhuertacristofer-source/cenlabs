import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecánica de Sólidos",
  titulo: "Pandeo de columnas: carga crítica y esbeltez",
  duracion: "40 min",
  teoria: "OT-253 · Sostén al menos 25 kN con reserva de Euler entre 2 y 4 y esbeltez ≥100. Columna circular biarticulada L=1,5 m, K=1, E=210 GPa. A=πd²/4; I=πd⁴/64; λ=KL/√(I/A)=4L/d; Pcr=π²EI/(KL)². Imperfección sinusoidal e0=1 mm: e=e0/(1−P/Pcr), exclusivamente para P<Pcr. Euler elástico ideal, sin excentricidad adicional, residual ni plasticidad. Si P≥Pcr se muestra inestabilidad sin inventar una deformada poscrítica. Exageración lateral ×8; diámetro visual ×3. Aproximación de amplificación de imperfección, no solución no lineal completa.",
  estado: "activo",
  simuladorHtml: "/labs/columna-pandeo-euler.html"
};
export default catalogo;
