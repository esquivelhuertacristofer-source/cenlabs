import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Tomografía industrial: proyecciones y poros",
  duracion: "40 min",
  teoria: "OT-214 · Obtén paso periférico ≤0,4 mm, ruido relativo central ≤6 % y exposición relativa ≤1,5 M unidades. Gantry, fantoma, detector y reconstrucción por retroproyección filtrada. Fantoma circular R=16 mm con tres poros. Proyecciones paralelas: I=N·exp(−µL), µ=0,10 mm⁻¹ sintético. Longitud de cada cuerda por intersección analítica con círculos. Ruido gaussiano de varianza I como aproximación de conteo Poisson; semilla fija. Logaritmo, filtro rampa discreto Ram-Lak y retroproyección interpolada 64×64 con paso 0,625 mm. Paso periférico=πR/vistas; ruido central≈1/√(N exp(−3,2)); exposición relativa=N·vistas/10⁶. Reconstrucción 2D paralela ideal, no tomografía cónica completa. Sin dispersión, endurecimiento del haz, respuesta de detector o datos reales. La exposición es un índice relativo, no dosis radiológica. El aspecto interior 3D muestra el fantoma de referencia, no una reconstrucción volumétrica. Rayos en falso color; µ es sintético. No sirve para certificar defectos.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/tomografia-industrial-proyecciones.html"
};
export default catalogo;
