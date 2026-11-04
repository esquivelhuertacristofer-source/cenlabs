import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Bode y márgenes de estabilidad",
  duracion: "40 min",
  teoria: "Planta 1/(1+s/4)³ y compensador K(1+s/4)/(1+s/(4a)). L(s)=K/[(1+s/4)²(1+s/(4a))]. En cruce de magnitud se cumple |L(jωc)|=1. Margen de fase=180°+arg L(jωc). El cruce de fase ocurre a 4√(1+2a) rad/s. Margen de ganancia=−20 log₁₀|L(jωfase)|. Respuesta sinusoidal estacionaria del lazo abierto ideal. La cancelación de un polo es exacta en este modelo. Los indicadores muestran entrada y salida normalizadas en el cruce, donde sus amplitudes coinciden. El equipo físico y su escala de desplazamiento son ilustrativos.",
  estado: "activo",
  simuladorHtml: "/labs/bode-margenes-estabilidad.html"
};
export default catalogo;
