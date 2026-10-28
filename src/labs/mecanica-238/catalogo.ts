import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Cojinete aerostático: película y restrictor",
  duracion: "40 min",
  teoria: "OT-238 · Soporta ≥400 N con película8–16 µm, consumo ≤2 L/min y rigidez ≥70 N/µm. Cojinete de aire seccionado, disco flotante y red de restricción. Receso Ri30 mm, exterior Ro40 mm, eje10 mm; presión de suministro300 kPa manométricos. Área efectiva integra presión uniforme de receso y descenso logarítmico de la pista. Pr=W/Aef. Restrictor Cr=2·10⁻¹¹(d/0,3)⁴; C=π/[6µln(Ro/Ri)], µ=1,8·10⁻⁵ Pa·s. Q=Cr(Ps−Pr)=Ch³Pr. K=3W(1−Pr/Ps)/h. Q se refiere a presión del receso; aire libre se obtiene por relación de presiones absolutas. Red equivalente linealizada de gas con coeficientes sintéticos; no resuelve Reynolds compresible, distribución 3D, estabilidad neumática o arranque. La presión logarítmica es la aproximación de película lineal usada para el área efectiva. Sin caudal real de fabricante. Película visual×1000; giro×1/200.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/cojinete-aerostatico-restrictor.html"
};
export default catalogo;
