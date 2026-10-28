import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Motor neumático de paletas: par y consumo",
  duracion: "40 min",
  teoria: "OT-235 · Trabaja a900–1800 rpm con potencia ≥80 W, consumo ≤220 L/min y rendimiento respecto al máximo isotérmico ≥18 %. Motor de paletas abierto, freno de carga y analizador de consumo. Desplazamiento nominal20 cm³/vuelta, eficiencia de par0,7. Tm=0,7ΔpVd/(2π). Fricción viscosa b=0,002 N·m·s/rad: ω=max(0,(Tm−Tcarga)/b). Qin=Vdω/(2π)+10⁻¹⁰Δp; caudal referido a entrada. Aire libre=Qin(pentrada/101325). Potencia útil=Tcargaω; referencia isotérmica=pentradaQin ln(pentrada/101325). Paleta: r=−e cosθ+√(R²−e²sin²θ). Curva sintética estacionaria, sin expansión transitoria, compresibilidad de cada cámara o lubricación. Desplazamiento nominal prescrito; dibujo de paletas ilustrativo. Eficiencia respecto a trabajo isotérmico máximo, no dato de catálogo. Giro×1/120. No acciona una herramienta neumática real.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/motor-neumatico-paletas.html"
};
export default catalogo;
