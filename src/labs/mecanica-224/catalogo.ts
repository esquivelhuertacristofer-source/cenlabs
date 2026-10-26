import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Caudalímetro Venturi: presión y continuidad",
  duracion: "40 min",
  teoria: "OT-224 · Entrega ≥3 L/s con diferencial 5–18 kPa, pérdida ≤2 kPa, presión absoluta ≥40 kPa y Re≥40000. Venturi seccionado, tomas de impulso y transmisor diferencial. Agua ρ=998 kg/m³, µ=0,001 Pa·s; D=50 mm. v=Q/A; Δp=ρ(v2²−v1²)/(2Cd²), Cd=0,98. p1=160 kPa absolutos. Pérdida permanente sintética=0,12Δp; Re=ρv2d/µ. Marcadores siguen volumen acumulado en el conducto de sección variable. Estacionario, incompresible; Cd y recuperación constantes sintéticos, sin CFD ni validación normativa. Si p2≤0 la hipótesis es inválida. No predice cavitación ni calibración real de un transmisor. Flujo ralentizado ×1/20; marcadores representan volumen, no moléculas.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/venturi-presion-diferencial.html"
};
export default catalogo;
