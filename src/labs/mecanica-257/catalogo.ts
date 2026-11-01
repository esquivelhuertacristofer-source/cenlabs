import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecánica de Sólidos",
  titulo: "Torsión: selecciona el diámetro del eje",
  duracion: "40 min",
  teoria: "OT-257 · Transmite ≥350 N·m con giro ≤1,5°, cortante ≤80 MPa y masa ≤11 kg. Eje circular macizo L=1 m, G=80 GPa, ρ=7850 kg/m³. J=πd⁴/32; φ(x)=Tx/(GJ); τ(r)=Tr/J; τmax=16T/(πd³). m=ρπd²L/4. Torsión de Saint-Venant elástica uniforme, sin chavetas, concentraciones, fatiga ni flexión. Giro visible ×8; diámetro visual ×3; líneas de fibra siguen φ(x), no son resortes ni corrientes.",
  estado: "activo",
  simuladorHtml: "/labs/torsion-eje-dimensionado.html"
};
export default catalogo;
