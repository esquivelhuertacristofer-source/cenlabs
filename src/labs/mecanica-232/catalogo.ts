import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Partículas magnéticas: orientación del campo",
  duracion: "40 min",
  teoria: "OT-232 · Obtén campo perpendicular ≥2500 A/m para ambas orientaciones, campo combinado ≤10000 A/m y potencia ≤600 W. Banco magnético, solenoide, conductor central y dos discontinuidades patrón. Solenoide largo ideal N=200,L=0,4 m: Ha=500Icoil A/m. Conductor central en r=25 mm: Hc=Ibar/(2πr). Dos discontinuidades patrón, axial y circunferencial: indicadores normalizados clamp(Hperp/2500). Campo resultante=√(Ha²+Hc²). Resistencias equivalentes0,4 Ω y0,0006 Ω. Medio lineal ideal: no calcula histéresis, saturación B(H), profundidad o tamaño de grieta ni una técnica MT certificada. Densidad de partículas como indicador esquemático de excitación transversal, no predicción de fuga magnética ni transporte real de polvo. Líneas helicoidales representan el campo ideal; campo continuo, sin velocidad material del flujo.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/particulas-magneticas-orientacion.html"
};
export default catalogo;
