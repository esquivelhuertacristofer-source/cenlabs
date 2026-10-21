import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Gestión Térmica de una Batería de VE: Placa Fría y Carga Rápida",
  duracion: "40 min",
  teoria: "Cargar un módulo de 12 celdas de 80 A·h de 10 a 80 % en 19,1 min exige 240 A por celda (3C): el módulo genera hasta 890 W de calor (I²R más calor entrópico, unos 72 W por celda) y, sin refrigerar, una celda que empieza a 35 °C llega a 47 °C y el sistema de gestión (BMS) recorta la corriente: la carga se alarga a 56 min. Con una placa fría y 8 L/min de agua-glicol entrando a 15 °C, la celda más caliente se queda en 38,5 °C y la carga dura los 19,1 min ideales; la bomba gasta 27 W y el enfriador 124 W. El flujo pasa de laminar a turbulento hacia Re ≈ 3 000, la convección de la placa se multiplica por más de 8 y por eso la bomba pasa de 5,8 W a 5 L/min a 49,7 W a 10 L/min: el óptimo está en el interior, no en los extremos. Modelo didáctico de un módulo con una temperatura por celda (ε-NTU, Gnielinski, balance de energía que cierra al redondeo); no es CFD ni certificación y la aceleración térmica no se modela.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/termica-bateria-placa-fria.html",
};

export default catalogo;
