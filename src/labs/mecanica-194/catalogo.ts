import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Inspección por corrientes inducidas",
  duracion: "40 min",
  teoria: "OT-194 · Obtén sensibilidad≥0,15 con separación≤0,4 mm y profundidad de piel0,4–1,2 mm. Sonda, cupón con ranura y plano de impedancia. δ=√(2/(ωµσ)), µ=µ0 y σ=35 MS/m. Modelo sintético de señal para discontinuidad de0,5 mm: S=(d/δ) exp(−(d+2h)/δ). Canales complejos con fase d/δ y envolvente gaussiana del barrido. La profundidad de piel es física; la respuesta de grieta es una función didáctica sintética, no soluciónMaxwell/FEM ni criterioNDT real. No estima tamaño de grieta real ni reproduce un equipo comercial.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/corrientes-inducidas-inspeccion.html"
};
export default catalogo;
