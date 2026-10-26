import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Sensor de fuerza y par: calibración de seis ejes",
  duracion: "40 min",
  teoria: "OT-222 · Calibra doce cargas patrón: RMS normalizado ≤0,3 % y error máximo ≤0,5 %. Sensor seccionado, patrones de fuerza/par e inversa matricial. Canales normalizados con escalas 100 N y 10 N·m. s=g(I+cC)w; C desplaza cíclicamente seis canales. Se reconstruye w con inversa 6×6 de la matriz estimada. Doce patrones ±unitarios. Fuerza dinámica prescrita; desplazamiento elástico F/(0,5 MN/m), ampliado ×200. Rigidez torsional ilustrativa 20000 N·m/rad; giro elástico ampliado ×200. El informe conserva las doce filas de señales normalizadas de entrada. Sólo dos parámetros globales de una matriz sintética; no estima 36 constantes independientes ni temperatura, histéresis o dinámica estructural. Las flexuras son esquemáticas, sin FEM. Cargas patrón independientes y datos sin ruido. No controla un sensor ATI ni usa su calibración.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/sensor-fuerza-par-matriz.html"
};
export default catalogo;
