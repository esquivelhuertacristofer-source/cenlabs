import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Ajuste de una leva: carrera, contacto y ángulo de presión",
  duracion: "40 min",
  teoria: "OT-178 · Una alimentadora debe trabajar a450 ciclos/min o más. En el banco comprobarás si su ley de movimiento evita aceleraciones excesivas y separación del seguidor. Indicador de desplazamiento, traza de aceleración y fuerza axial virtuales. Carrera20 mm; subida cicloidal s=h[u−sin(2πu)/(2π)] durante β, reposo hasta180°, retorno de la misma duración y reposo inferior. ds/dθ=h(1−cos2πu)/β; d²s/dθ²=2πh sin2πu/β². Fuerza axial N=120+9000s+0,6a en N; sin gravedad en este balance axial. Curva de paso r=48 mm+s; rodillo8 mm, radio base40 mm. El perfil se obtiene desplazando la curva de paso a lo largo de su normal. tanα=|ds/dθ|/(48 mm+s). Mecanismo rígido y resorte lineal precargado. La trayectoria es impuesta incluso si N resulta negativa: se avisa que el seguimiento no es viable; no se simula vuelo o impacto del seguidor. Sin lubricación, resistencia de contacto Hertz, elasticidad, fabricación de leva ni dinámica completa del motor. El rodillo no tiene un modelo de giro por adherencia.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/banco-leva-seguidor.html"
};
export default catalogo;
