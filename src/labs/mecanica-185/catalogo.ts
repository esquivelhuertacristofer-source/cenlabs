import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Calibración de una bomba peristáltica: caudal, presión y esfuerzo del fluido",
  duracion: "40 min",
  teoria: "OT-185 · Una dosificadora debe entregar entre40 y60 mL/min a un circuito viscoso. Selecciona tubo y giro, comprueba el punto de operación y registra el ajuste. Caudalímetro, manómetro y registro virtual de dosificación. Radio de pista40 mm, área interior A=πd²/4, volumen ideal por vuelta A2πR. Caudal medio Q=0,85 Vrev n/60. Circuito equivalente laminar de2 m y viscosidad0,08 Pa·s: Δp=128μLQ/(πd⁴), esfuerzo de pared32μQ/(πd³). Par ideal de bombeo ΔpVrev/(2πηm), ηm=0,8. La ganancia volumétrica0,85 es sintética; un aforo real debe medirla. Los rodillos se muestran como oclusiones geométricas, no como un modelo de pared de goma. Sin pulsación instantánea de caudal, reología no newtoniana, deformación elástica, retorno de líquido, fatiga de tubo, presión de oclusión ni control real de dosificación. Hagen–Poiseuille sólo representa el circuito equivalente, no el paso por el cabezal aplastado. Los puntos de fluido señalan bolsillos arrastrados; no son CFD ni medición volumétrica.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/calibracion-bomba-peristaltica.html"
};
export default catalogo;
