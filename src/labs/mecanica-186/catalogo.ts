import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Preparación de fresado CNC: avance por diente, potencia y arranque de material",
  duracion: "40 min",
  teoria: "OT-186 · Prepara una pasada circular de2 mm con una fresa de4 dientes. La máquina admite250 W netos y0,45 N·m; justifica avance, viruta y producción. Panel de avance/husillo, registro de potencia y verificación de trayectoria virtuales. Fresa de10 mm y4 dientes; avance por diente fz=vf/(nz). Profundidad2 mm y anchura equivalente4 mm: Q=8vf mm³/min. Energía específica sintética1,8 J/mm³: Pc=1,8Q/60 y Mc=Pc/ω. Trayectoria circular de radio25 mm: φ=vf t/R en SI. Para conservar el volumen por arco, el sector de sobremetal tiene radio exterior30 mm e interior√(30²−2·4·25)=26,458 mm. El sector eliminado muestra el progreso angular, no una intersección CSG exacta del filo. Corte estacionario ideal y energía específica constante, no datos de un material comercial. Sin vibración de chatter, flexión, desgaste, temperatura, sujeción real, colisiones, refrigerante o G-code de un control comercial. Cada vuelta es una pasada independiente con pieza reiniciada. El husillo se muestra estroboscópico; no es el giro físico aparente de una cámara real.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/preparacion-fresado-cnc.html"
};
export default catalogo;
