import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Regulador centrífugo: realimentación mecánica",
  duracion: "40 min",
  teoria: "OT-237 · Mantén190–215 rpm finales, caída por escalón ≤12 rpm y establecimiento ≤3 s. Regulador de Watt, válvula enlazada y registro de respuesta a carga. Brazos l=0,2 m, relación de giro0,4. cosθ=clamp(g/(lωg²)); corredera y=0,5−0,4cosθ. Apertura u=clamp(u0−k(y−0,22)). Motor ideal: Jω̇=2u−Tcarga−0,015ω; J=0,15 kg·m². Carga0,6→0,9 N·m a3 s. RK4, paso0,002 s; establecimiento a2 % del cambio de régimen. Masas en equilibrio instantáneo: no incluye inercia de bolas, fricción de articulaciones, elasticidad, vapor ni hunting. Transitorio del eje sí integrado. El giro del regulador se ralentiza×1/10, pero la respuesta de velocidad se presenta en segundos físicos. Ensayos de12 s con reinicio de condiciones; no sintoniza un regulador real. La transmisión de la corredera a la válvula se representa esquemáticamente.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/regulador-centrifugo-watt.html"
};
export default catalogo;
