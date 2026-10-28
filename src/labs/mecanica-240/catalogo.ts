import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Plegado de chapa: fuerza y recuperación elástica",
  duracion: "40 min",
  teoria: "OT-240 · Obtén ángulo descargado89–91°, fuerza ≤5,5 kN, material ≥280 MPa y carrera ≤10 mm. Plegadora abierta, punzón, matriz y chapa con recuperación elástica. Chapa100×80×1,5 mm; V18 mm, radio neutro R3,75 mm, E210000 MPa. Contactos geométricos: s=(V/2)tan a+R(1−sec a), β=2a. Curvatura elástica recuperada Δκ=3σy/(Et), aproximación de momento plástico. βlibre=β(1−RΔκ); Rlibre=R/(1−RΔκ), conserva longitud de arco. Fuerza equivalente F=1,42σy·80·1,5²/18. Desarrollo neutro=Rβ. Modelo reducido elástico perfectamente plástico, sin endurecimiento, fricción, anisotropía, espesor variable, fractura o tabla real de plegado. Coeficiente de fuerza del escenario; no se usa para ajustar una prensa real. Geometría neutra y longitud de100 mm conservadas. El retorno del punzón es prescrito; no hay FEM de contacto. Ciclo de8 s.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/plegado-chapa-recuperacion.html"
};
export default catalogo;
