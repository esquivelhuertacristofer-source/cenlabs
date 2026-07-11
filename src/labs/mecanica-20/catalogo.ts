import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Electrónica",
  titulo: "Conmutación de Carga Inductiva y Diodo de Marcha Libre",
  duracion: "35 min",
  teoria: "Al abrir el switch que alimenta una carga inductiva (relevador de 5 V, relevador/solenoide de 12 V o motor DC con rotor detenido), la energía almacenada en el campo magnético de la bobina (E=½·L·I²) exige una trayectoria de descarga. El simulador resuelve en forma cerrada tres topologías de protección — sin protección (cualitativo, sin física real), diodo de marcha libre (decaimiento exponencial, τ=L/R, con comparación explícita entre la energía disipada exacta y la aproximación de bolsillo ≈2·Vf/Vsupply) y clamp activo por zener (decaimiento lineal más rápido, Vclamp=Vz+Vf, a costa de un voltaje pico mayor sobre el switch) — y siempre declara el factor de cámara lenta con el que reproduce el transitorio real de microsegundos a milisegundos. Cuatro modos: Explora, Predicción, Medición/Barrido con verificación de τ, y Reto de diseño con solvabilidad garantizada.",
  estado: "activo",
  simuladorHtml: "/labs/diodomarchalibre.html",
};

export default catalogo;
