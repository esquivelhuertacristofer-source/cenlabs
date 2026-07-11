import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Electrónica",
  titulo: "Rectificadores: Media Onda, Center-Tap y Puente",
  duracion: "40 min",
  teoria: "Compara media onda, center-tap y puente sobre el mismo motor de diodo Shockley de la práctica de la curva I-V, ahora con el transitorio exacto del capacitor de filtro integrado por Runge-Kutta 4 (C·dVc/dt = I_diodo(t) − Vc/R_L) en vez de la fórmula lineal de rizo. Calcula PIV específico por topología (Vm−VF en puente vs. 2Vm−VF en media onda con filtro y center-tap), la duplicación de la frecuencia de rizo en las topologías de onda completa, y verifica márgenes de seguridad de corriente y voltaje contra los ratings del diodo elegido (Si 1N4007, Schottky 1N5819 o puente integrado DB107) en cuatro modos: Explora, Predicción, Barrido de capacitancia y Reto de diseño.",
  estado: "activo",
  simuladorHtml: "/labs/rectificador.html",
};

export default catalogo;
