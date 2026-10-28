import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Amortiguador magnetorreológico: regular la disipación",
  duracion: "40 min",
  teoria: "OT-249 · Disipa50–100 W con fuerza ≤1000 N, semicarrera10–20 mm y corriente ≤1,5 A. Amortiguador en corte, bobina y lazo fuerza–velocidad. Bingham concentrado ideal: Fy=100+350I N,c=800 N·s/m. x=A sin(ωt),ω=2π·2 rad/s. Fuerza sobre el vástago F=−cẋ−Fy sign(ẋ). Energía por ciclo E=πcA²ω+4FyA; potencia media=2E. Fmax=cAω+Fy. Sin elasticidad o fuerza activa; −Fẋ≥0. Ley sintética de fuerza umbral, no calcula el campo magnético, reología real, histéresis preflujo, cavitación o temperatura. El signo se idealiza discontinuo en velocidad cero. Las cadenas de partículas son un indicador de corriente, no microestructura simulada. Movimiento físico a2 Hz y desplazamiento visual×15; no dimensiona una suspensión real.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/amortiguador-magnetorreologico.html"
};
export default catalogo;
