import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Soplador Roots: lóbulos y compresión externa",
  duracion: "40 min",
  teoria: "OT-226 · Entrega ≥12 L/s con potencia ≤650 W, salida ≤50 °C y régimen ≤2100 rpm. Soplador abierto, rotores sincronizados y balance de aire. Volumen desplazado nominal=0,6 L/vuelta; Qideal=Vdn/60. Fuga sintética=10⁻⁵√Δp m³/s (Δp en Pa). Qneto=Qideal−fuga. Potencia eje=ΔpQideal/0,75. Calor al gas=ΔpQideal; T2=293,15+calor/(1,2Qneto·1005) K. Densidad de salida por gas ideal. Compresión externa idealizada. Perfiles bilobulares ilustrativos r=0,36+0,18cos2θ, no conjugados de mecanizado; el desplazamiento nominal se prescribe, no se deriva del dibujo. Fuga sintética, sin CFD ni curva comercial. Color del aire indica temperatura media; giro ×1/60.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/soplador-roots-lobulos.html"
};
export default catalogo;
