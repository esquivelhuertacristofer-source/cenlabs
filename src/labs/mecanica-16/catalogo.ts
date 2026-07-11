import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Electrónica",
  titulo: "Diodo Zener: Regulador Shunt de Voltaje",
  duracion: "40 min",
  teoria: "Modela un diodo zener en avalancha controlada como regulador shunt (Rs serie + zener en paralelo con RL), resolviendo el punto de operación exacto por bisección numérica sobre el modelo lineal por tramos de hoja de datos (corte, codo, avalancha) para tres dispositivos reales (1N4728A, 1N4733A, 1N5231B). Verifica la ventana de corriente segura (Izk ≤ Iz ≤ Izm) y mide la regulación de línea contra la fórmula teórica de pequeña señal Rp/(Rp+Rs) en cuatro modos: Explora, Predicción, Barrido y Reto de diseño de Rs.",
  estado: "activo",
  simuladorHtml: "/labs/zener.html",
};

export default catalogo;
