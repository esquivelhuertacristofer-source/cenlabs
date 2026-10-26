import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Montaje de rodamiento: calentamiento por inducción",
  duracion: "40 min",
  teoria: "OT-215 · Consigue holgura de llegada ≥15 µm, temperatura máxima ≤110 °C y calentamiento ≤100 s. Calentador, pinza de traslado, rodamiento y eje con interferencia. Balance concentrado C dT/dt=ηP−H(T−20): C=2,8·460 J/K, η=0,72,H=6 W/K. En traslado de 4 s: enfriamiento con H=10 W/K. Diámetro interior 80 mm, α=11,5·10⁻⁶ K⁻¹. Eje a 20 °C, interferencia fría 0,040 mm; holgura=80α(Tllegada−20)−0,040. Modelo térmico uniforme con parámetros sintéticos, sin campo electromagnético, gradientes, lubricante ni tensiones de ajuste. El límite de 110 °C pertenece al escenario; un rodamiento real requiere especificación del fabricante. Se omite el ciclo de desmagnetización, declarado pendiente en un procedimiento real. Dilatación dibujada ×200; calentamiento y montaje se comprimen a 12 s de demostración. El cambio de color térmico es falso color, no incandescencia. El yugo se retira antes de elevar y trasladar el rodamiento; cada demostración es un ciclo independiente.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/montaje-rodamiento-induccion.html"
};
export default catalogo;
