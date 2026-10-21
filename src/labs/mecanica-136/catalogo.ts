import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Dimensiona y Diagnostica una Pila de Combustible de Hidrógeno de 100 kW (PEMFC)",
  duracion: "45 min",
  teoria: "Pila PEM con la tensión de celda V = E_Nernst − V_act − V_óhm − V_conc (E_N ≈ 1,18 V a 80 °C y 2 bar, OCV ≈ 0,98 V, ≈ 0,63 V a 1,4 A/cm²), membrana de Nafion con λ y σ de Springer, consumo de H₂ y agua por Faraday (≈ 1,8 g/s de H₂ a 100 kW), calor Q = N·I·(1,2532 − V) y compresor de aire: 100 kW netos con η neto ≈ 44–46 % piden entre 356 y 511 celdas según el área, y la presión óptima queda en el interior del rango (≈ 2 bar).",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/pila-combustible-hidrogeno.html",
};

export default catalogo;
