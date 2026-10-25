import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Termografía de un cuadro eléctrico",
  duracion: "40 min",
  teoria: "OT-199 · Contrasta con patrón80 °C: error≤2 °C, reflejo25±2 °C y contraste≥45 °C. CámaraIR virtual, referencia térmica y cuadro con conexiones visibles. Balance gris de banda total: L/σ=εreal Th⁴+(1−εreal)Tr⁴, εreal se determina por comparación con el patrón, Th=353,15 K yTr=298,15 K. Tmed=[(L/σ−(1−εset)Trset⁴)/εset]^(1/4). Mapa térmico sintético con puntos de calor prescritos. Modelo de radiación total gris, no respuesta espectral real de una cámara8–14 µm. El mapa no resuelve transferencia térmica ni diagnostica contactos reales. No existe conexión eléctrica real.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/termografia-cuadro-electrico.html"
};
export default catalogo;
