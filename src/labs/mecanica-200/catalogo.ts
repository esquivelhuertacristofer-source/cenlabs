import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Robot AMR: calibración y regreso al muelle",
  duracion: "40 min",
  teoria: "OT-200 · Vuelve tras un cuadrado con error≤50 mm, orientación≤2° y escala de distancia dentro de1 %. AMR, encoders, muelle, plano de almacén y escáner de distancias. Robot diferencial: v=r(ωR+ωL)/2, Ω=r(ωR−ωL)/b. Radio real100 mm y vía real500 mm. Órdenes calculadas con geometría declarada: cuatro rectas nominales2 m y cuatro giros de90°. Rectas3 s, giros1 s; integración exacta por segmento. LiDAR visual usa intersección geométrica con estantes. Sin deslizamiento, ruido de encoder, obstáculos dinámicos, SLAM, planificación ni control de seguridad. Trayectoria abierta para calibración, no navegación autónoma de un fabricante. El ciclo se reinicia después de18 s; no es una maniobra física instantánea.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/robot-amr-calibracion-odometria.html"
};
export default catalogo;
