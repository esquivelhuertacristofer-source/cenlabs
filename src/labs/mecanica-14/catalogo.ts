import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Electrónica",
  titulo: "Curva I-V del diodo: trazador y ajuste exponencial",
  duracion: "40 min",
  teoria: "Un circuito fuente–resistor–diodo resuelto en vivo con la ecuación de Shockley (I = Is·(e^(V/(n·VT)) − 1)) y la ley de temperatura de SPICE2 para Is(T), de la que emerge el coeficiente térmico del silicio (≈ −2 mV/K) sin estar programado a mano. El punto de operación Q se calcula exactamente por bisección sobre la recta de carga; el trazador impone corrientes fijas para levantar la curva en escala lineal y semilogarítmica, y el modo Ajuste extrae n e Is por el método de 2 puntos. El reto pide predecir Vd e Id de un dispositivo desconocido antes de revelar la curva.",
  estado: "activo",
  simuladorHtml: "/labs/diodo.html",
};

export default catalogo;
