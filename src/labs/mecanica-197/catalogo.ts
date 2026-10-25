import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Ensayo de estanqueidad por caída de presión",
  duracion: "40 min",
  teoria: "OT-197 · Mide con error≤5 %, caída≥20 Pa y ciclo total≤130 s. Recipiente, válvulas, presión diferencial y fuga patrón. Recipiente1 L, presión absoluta300 kPa, T=298,15 K, fuga patrón0,8 cm³/min referida a101325 Pa. Caída isoterma por fuga: Pamb Q/V. Transitorio térmico añadidoP0·0,5/T·exp(−t/15). EstimaciónQ=ΔP V/(Pamb Δt). Fuga constante referida al ambiente y perturbación térmica linealizada. Sin elasticidad del recipiente, variación de caudal con presión ni temperatura espacial. El ensayo se reproduce en6 s de demostración y muestra en la orden sus segundos físicos. Las partículas representan puntos de gas ideal con reflexión geométrica en un recinto interior; velocidades térmicas de298,15 K ralentizadas×10000, sin dinámica molecular ni acoplamiento a la fuga.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/estanqueidad-caida-presion.html"
};
export default catalogo;
