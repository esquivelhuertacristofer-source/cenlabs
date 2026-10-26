import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Fabricación FDM: capas y límite de extrusión",
  duracion: "40 min",
  teoria: "OT-213 · Imprime capas ≤0,24 mm, demanda ≤8 mm³/s, entrega ≥99 % y tiempo físico ≤220 s. Impresora cartesiana, extrusor, pared por capas y balance volumétrico. Pared circular de radio 18 mm y alto 20 mm. N=ceil(20/h); la última capa se representa completa. Cordón ideal de ancho w=0,45 mm: A=h(w−h)+πh²/4. Q=A·v; Qentregado=min(Q,8). Longitud/capa=2π·18. Tiempo=N·longitud/v. Hilo de 1,75 mm: velocidad=Qentregado/(π·1,75²/4). Impresión de pared hueca ideal; sin soportes, relleno, aceleración, temperatura, presión del fundido, retracción ni adherencia. Cordones de sección ovalada ilustrativa; el balance usa sección de estadio. Tiempo de construcción acelerado 20 veces y sección de cordón ampliada para lectura. No genera G-code. La saturación de caudal es un límite sintético, no una impresora comercial. La cámara de inspección encuadra el volumen completo de movimiento del cabezal para evitar recortes durante la construcción.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/fabricacion-aditiva-fdm-flujo.html"
};
export default catalogo;
