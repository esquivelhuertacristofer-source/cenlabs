import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Máquinas Eléctricas",
  titulo: "Motor Monofásico: Fase Partida y Capacitor — Diagnóstico",
  duracion: "40 min",
  teoria:
    'Un motor monofásico de jaula de ardilla no puede arrancar solo con su devanado principal: una sola fase de corriente alterna produce un campo pulsante, no giratorio, así que en reposo el par neto es cero. Para arrancar, el motor añade un devanado auxiliar —de calibre más delgado y mayor resistencia, a veces en serie con un capacitor— que desfasa su corriente respecto a la del devanado principal y crea, mientras dura el arranque, un campo giratorio suficiente para poner al rotor en movimiento. Según qué tan grande sea ese desfase y si el motor conserva o no el capacitor durante la marcha, existen cuatro arquitecturas típicas (fase partida, capacitor de arranque, capacitor permanente, capacitor de arranque y marcha) con pares de arranque muy distintos. El laboratorio arma primero el motor pieza por pieza y solo después desbloquea los modos de comparación de tipos y de diagnóstico de fallas por lectura de resistencia en los terminales C-S-R.',
  estado: "activo",
  simuladorHtml: "/labs/diagnostico-motor-monofasico-capacitor.html",
};

export default catalogo;
