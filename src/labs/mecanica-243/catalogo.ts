import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Compresor scroll: orbitar para comprimir",
  duracion: "40 min",
  teoria: "OT-243 · Entrega40–65 L/min con relación ≥2,5, salida ≤120 °C y potencia de eje ≤400 W. Compresor abierto, dos involutas y analizador de compresión. Aire ideal: p1=101325 Pa,T1=293,15 K,n=1,3; T2=T1 r^((n−1)/n). Desplazamiento nominal25 cm³/vuelta y ηv=0,9−0,03(r−1); Q=VdNηv/60. Potencia=[n/(n−1)]p1Q[r^((n−1)/n)−1]/0,8. Involuta rb[cos a+a sin a,sin a−a cos a]. Traslación orbital e=πrb−espesor, rb=0,09 y espesor0,09 unidades. Volumen conceptual V=25(1−0,65fase) cm³, pV^n=constante. Aire, no refrigerante real. Espirales ilustrativas sin simulación de sellado o contacto. El desplazamiento y volumen conceptual son nominales prescritos, no volúmenes calculados entre paredes. Sin fugas transitorias, Oldham dinámico o lubricación. Giro del excéntrico×1/120. El portador orbital no gira.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/compresor-scroll-orbita.html"
};
export default catalogo;
