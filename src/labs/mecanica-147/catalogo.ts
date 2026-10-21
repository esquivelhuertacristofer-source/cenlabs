import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Dinámica del Vehículo",
  titulo: "El Neumático: Curva de Pacejka, Círculo de Fricción y Límite de Adherencia",
  duracion: "40 min",
  teoria: "Una llanta toca el suelo con una huella de unos 146 cm² (7,1 × 20,5 cm con 3,5 kN y 2,4 bar), y ahí se juega todo. La fórmula mágica de Pacejka da, en seco, un pico de 3,5 kN al frenar con 11 % de resbalamiento y de 3,22 kN al girar con 8,5° de desvío; pasado el pico la fuerza cae (con la llanta bloqueada, 2,3 kN). En mojado el límite baja a 2,38 kN (μ = 0,68) y en hielo a 0,35 kN. Frenar y girar comparten un solo agarre, la elipse de fricción: con el 60 % del frenado máximo sólo queda el 80 % de la fuerza lateral. Doblar la carga de 3,5 a 7 kN eleva el pico lateral apenas ×1,68 (sensibilidad de carga), y la huella sigue a A = carga/presión. Es un modelo didáctico con parámetros de libro, sin aquaplaning, temperatura ni transferencia de carga.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/neumatico-pacejka-friccion.html",
};

export default catalogo;
