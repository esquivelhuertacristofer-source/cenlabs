import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Termofluidos y Energía",
  titulo: "Refrigeración, COP y subenfriamiento",
  duracion: "40 min",
  teoria: "Tabla CoolProp HEOS para R134a. Condensación a 40 °C, succión saturada, compresor con ηs=0,80, válvula isoentálpica h₄=h₃. COP=(h₁−h₄)/(h₂−h₁). Ciclo estacionario, sin pérdidas de presión. Los estados se precalculan para los pasos de los mandos.",
  estado: "activo",
  simuladorHtml: "/labs/refrigeracion-cop-subenfriamiento.html"
};
export default catalogo;
