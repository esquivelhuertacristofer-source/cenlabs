import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Electrónica",
  titulo: "LED, Schottky y TVS: Selección de Dispositivo y Protección",
  duracion: "35 min",
  teoria: "Compara dos topologías de diodo sobre la misma ecuación de Shockley. En conducción (lazo serie Vs–Rs–dispositivo), contrasta LED (Is=1e-14 A, n=2.6), Schottky tipo 1N5819 (Is=9.3e-8 A, n=1.373) y silicio tipo 1N4007 (Is=8.4e-10 A, n=1.85) para mostrar cómo la caída directa de cada familia obliga a decisiones de diseño distintas, incluyendo el cálculo del resistor limitador R=(Vs−Vf)/If. En protección (lazo shunt), contrasta un zener 1N4733A (modelo lineal por tramos VZ/IZT/ZZT/IZK/ZZK/IZM) contra un TVS SMAJ5.0A (modelo lineal por 2 tramos anclado a VBR(mín)=6.4 V y VC(máx)=9.2 V@43.5 A) para mostrar por qué el TVS clampea transitorios con una resistencia dinámica mucho menor. Ambas topologías se resuelven por bisección numérica exacta, en cuatro modos: Explora, Predicción, Barrido y Reto de diseño de protección.",
  estado: "activo",
  simuladorHtml: "/labs/protecciondiodo.html",
};

export default catalogo;
