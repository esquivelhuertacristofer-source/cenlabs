import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecánica de Sólidos",
  titulo: "Ensayo de tracción: curva y deformación permanente",
  duracion: "40 min",
  teoria: "OT-252 · Caracteriza bajo 5,0–5,7 kN, con extensión útil de 60–78 µm y sin deformación permanente. Probeta circular d=5 mm, longitud útil 50 mm. σy=300 MPa y endurecimiento H=2 GPa. ε=σ/E+max(0,(σ−σy)/H); F=σA; ΔL=εL0. Descarga elástica con pendiente E y residuo εp=max(0,(σmax−σy)/H). Ley uniaxial bilineal sintética, sin estricción, daño ni fractura. Diámetro contrae sólo elásticamente con ν=0,3 antes de fluencia; tras fluencia la contracción usa volumen plástico constante. Extensión visual ×4; ciclo carga-descarga de 8 s didácticos, sin velocidad normativa. Tras descargar conserva el alargamiento residual hasta repetir el ensayo.",
  estado: "activo",
  simuladorHtml: "/labs/traccion-curva-material.html"
};
export default catalogo;
