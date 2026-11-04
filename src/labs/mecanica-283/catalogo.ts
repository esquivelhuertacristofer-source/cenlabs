import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Termofluidos y Energía",
  titulo: "Ciclo Rankine y sobrecalentamiento",
  duracion: "40 min",
  teoria: "Tabla CoolProp IF97 de agua. Condensador a 10 kPa, bomba ideal con vΔp, expansión isentrópica. x=(s₃−sf)/(sg−sf), h₄=hf+x(hg−hf). η=(h₃−h₄−h₂+h₁)/(h₃−h₂). Ciclo estacionario ideal. Los estados se precalculan para los pasos de los mandos.",
  estado: "activo",
  simuladorHtml: "/labs/ciclo-rankine-presion-sobrecalentamiento.html"
};
export default catalogo;
