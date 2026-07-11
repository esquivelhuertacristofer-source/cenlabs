import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Electrónica",
  titulo: "MOSFET de Canal N en Fuente Común: Regiones de Operación y Driver de Compuerta",
  duracion: "35 min",
  teoria: "Un MOSFET de canal N se controla por voltaje de compuerta (VGS), no por corriente de base como el BJT: la compuerta es capacitiva y no consume corriente DC en régimen permanente. El simulador resuelve las tres regiones de operación en forma cerrada y autoconsistente con la recta de carga — corte (VGS≤Vth), saturación (ID=k·(VGS−Vth)² por ley cuadrática de canal largo) y óhmica/triodo (solución cuadrática exacta, no una aproximación lineal por RDS(on)) — verificado por el autor contra un barrido numérico de fuerza bruta independiente. El umbral Vth se trata como un rango real de fábrica, nunca un valor 'típico' inventado, explorable con slider, sorteo y barrido animado. Un sub-laboratorio de dimensionamiento estima el tiempo de encendido ton≈Qg/Idriver sobre cuatro niveles de corriente de driver, declarando explícitamente cuando Qg no está disponible en la hoja de datos (2N7000) en vez de aproximarlo. Tres dispositivos con parámetros de hoja de datos verificados (IRF540N, IRLZ44N, 2N7000); RDS(on) se muestra solo como referencia de catálogo, sin participar en el cálculo — su uso real para pérdidas de conducción es el eje de la práctica siguiente (PWM). Cuatro modos: Explora, Predicción, Barrido de Vth de fábrica, y Reto de diseño robusto a ambos extremos de esa dispersión.",
  estado: "activo",
  simuladorHtml: "/labs/mosfet.html",
};

export default catalogo;
