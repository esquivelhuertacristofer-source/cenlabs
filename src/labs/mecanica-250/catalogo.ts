import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Robot hexápodo: marcha y polígono de apoyo",
  duracion: "40 min",
  teoria: "OT-250 · Camina a ≥0,096 m/s con margen mínimo ≥25 mm, par equivalente ≤6 N·m y todas las patas alcanzables. Robot hexápodo articulado, pista y evaluación del triángulo de apoyo. Marcha de trípodes a0,8 Hz, apoyo50 %. Caderas x=±200 y0 mm,z=±70 mm,y=150 mm; pies z=±200 mm. Zancada S: apoyo x=xc+S(0,5−s), retorno x=xc+S(−0,5+s), elevación45sin(πs) mm. Eslabones110/130 mm; rodilla por intersección de círculos. Centro de masa x=offset,z=0; margen firmado mínimo a bordes del triángulo de apoyo. Reacciones baricéntricas para8 kg; par equivalente=0,11·max|Ni|. Se muestrean241 fases. Locomoción cuasiestática prescrita sobre suelo plano. No resuelve dinámica multicuerpo, fricción, deslizamiento, motores, impactos o estabilidad dinámica. Par equivalente de un brazo fijo110 mm, no par exacto de todas las articulaciones. Trípode de apoyo en DOM, sin texto3D. Escala5 unidades/m; pista representa avance relativo con cuerpo fijo.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/robot-hexapodo-tripodes.html"
};
export default catalogo;
