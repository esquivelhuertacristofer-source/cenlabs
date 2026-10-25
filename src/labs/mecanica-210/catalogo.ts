import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Banco de cuadricóptero: mezcla de motores",
  duracion: "40 min",
  teoria: "OT-210 · Obtén 17–20 N, manda al menos 0,08 N·m de guiñada, mantén cada solicitud entre 0,5 y 8 N y potencia≤250 W. Cuatro motores, hélices, banco con anillos, matriz de mezcla y fuente. Configuración+ con brazos 0,22 m, órdenes fijas de alabeo 0,25 y cabeceo 0,15 N·m. Mezcla lineal por equilibrio de fuerzas y momentos; relación par/empuje 0,018 m. Cada motor aplica saturación 0–8 N. T=1,8e−5ω²; potencia inducida idealT^(3/2)/(√(2ρA)·0,65),ρ=1,225,R=0,12 m. Banco angular J=0,08,c=0,25,k=4 con respuesta a escalón. Banco sujeto, no vuelo libre ni controlador de un vehículo real. Sin interacción de estelas, viento, retardo eléctrico, batería dinámica, flexión ni datos experimentales de hélice. Los coeficientes son sintéticos; no exporta órdenes de vuelo.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/banco-cuadricoptero-mezcla.html"
};
export default catalogo;
