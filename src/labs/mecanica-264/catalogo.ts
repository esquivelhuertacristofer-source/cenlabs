import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Elementos de Máquina",
  titulo: "Planetario: bloqueos y tabla de velocidades",
  duracion: "40 min",
  teoria: "OT-264 · Selecciona el bloqueo de un reductor y entrega la tabla de velocidades absolutas. Sol zs=24, tres planetas zp=24 y corona zr=72; módulo 3 mm, ángulo de presión de 20°. Geometría: zr=zs+2zp y (zs+zr)/3=32 entero. Willis: zs ns+zr nr=(zs+zr) nc. Portador fijo: nc=0, entra ns; corona fija: nr=0, entra ns; sol fijo: ns=0, entra nr. Planeta: np=nc−(zs/zp)(ns−nc). Órbita de radio m(zs+zp)/2. Fase absoluta del planeta i: θp+(zs+zp)φi/zp+π/zp, φi=2πi/3. La corona tiene involuta interna; sol y planetas, externa. Rodillos exteriores: θrod=−Rexterior θcorona/Rrod. Cinemática ideal sin juego dinámico, inercia, par, pérdidas ni análisis de resistencia. Giro mostrado ×1/100; los valores en rpm son reales. Pie de diente simplificado, sin trocoide; juego geométrico transversal de 0,05 mm para separar flancos. Cada cambio de mando reinicia la demostración; no simula un cambio de marcha con embragues bajo carga. Apoyos y jaula son didácticos, sin diseño de tolerancias ni certificación. Los rodillos exteriores ruedan idealmente sin deslizamiento.",
  estado: "activo",
  simuladorHtml: "/labs/planetario-tabla-velocidades.html"
};
export default catalogo;
