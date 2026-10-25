import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Montaje robotizado con compensación RCC",
  duracion: "40 min",
  teoria: "OT-203 · Inserta con residual ≤0,11 mm, fuerza axial ≤60 N, flecha por carga ≤0,1 mm y reserva lateral suficiente. Muñeca complaciente, chaflán, sensor de fuerza y útil de inserción. Error lateral inicial 0,8 mm y holgura radial 0,1 mm. Corrección requerida 0,7 mm. Chaflán 45° y µ=0,15: fuerza lateral disponible=Fz(1−µ)/(1+µ). Muñeca lineal con rigidez k: corrección=min(0,7 mm,Flat/k). Carga de referencia 3 N: flecha=3/k. Modelo cuasiestático de corrección lateral, no simula inclinación, torsión, impacto, contacto distribuido ni todas las libertades de un RCC real. El movimiento de aproximación es una trayectoria impuesta; sólo inserta si hay reserva. No es un programa de robot comercial. Holgura, desalineación y chaflán se amplían en la representación; no es un plano de fabricación.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/montaje-robotizado-compliance.html"
};
export default catalogo;
