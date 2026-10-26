import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Ultrasonido phased array: enfoque electrónico",
  duracion: "40 min",
  teoria: "OT-221 · Enfoca el reflector patrón (x=18 mm, z=40 mm) con error ≤0,8 mm y suma coherente ≥90 %. Sonda lineal, bloque patrón y visor de leyes focales. 16 elementos a paso 0,6 mm; frecuencia 4 MHz, c=5,9 mm/µs. Foco=(z tanθ,z). τi=max(di/c)−di/c. Amplitud normalizada=|Σexp[j2πf(τi+ri/c)]|/16. Distancias en mm; el reflector es una referencia conocida. Medio homogéneo longitudinal, sin cuña ni refracción, atenuación, respuesta de elemento o caracterización de defectos. Amplitud coherente monocromática; los arcos representan frentes, no una solución de onda transitoria. Tiempo de propagación ralentizado 200000 veces. No interpreta ensayos reales. El campo coloreado representa la amplitud monocromática calculada, no una temperatura.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/ultrasonido-arreglo-fases.html"
};
export default catalogo;
