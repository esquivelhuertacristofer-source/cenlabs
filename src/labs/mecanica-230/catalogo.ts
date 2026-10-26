import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Inyección de plástico: llenado, cierre y enfriamiento",
  duracion: "40 min",
  teoria: "OT-230 · Llena en ≤4 s sin superar 400 kN de apertura ni1600 W; expulsa a ≤70 °C y completa el ciclo en ≤28 s. Inyectora seccionada, molde móvil, circuito frío y pieza con taladros. Placa82×50×10 mm con esquinas R3 y cuatro taladros R3; área=82·50−(4−π)·9−4π·9 mm². Volumen=área·10. Q=1,5·10⁻¹³P m³/s; llenado=V/Q, apertura=P·área proyectada; potencia=PQ/0,75. T=40+180exp(−tc/8) °C. Ciclo=llenado+2 s mantenimiento+enfriamiento+2 s apertura. Frente por integral del área transversal, volumen conservado. Tornillo D25 mm: avance=V/Atornillo. Presión de cavidad impuesta y conductancia sintética, sin CFD, viscosidad real, compactación, contracción o FEM. Enfriamiento concentrado exponencial. Taladros y frente son geometría nominal; pequeños biseles son cosméticos. Colores indican temperatura media. Reloj ×3. Si T>70 °C el interbloqueo mantiene cerrado; ciclos reiniciados independientes.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/inyeccion-plastico-llenado-molde.html"
};
export default catalogo;
