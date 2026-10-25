import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Calibración del TCP de un robot",
  duracion: "40 min",
  teoria: "OT-187 · Calibra la herramienta con error≤0,5 mm y dispersión entre orientaciones≤0,7 mm. Punta patrón, referencia fija y comprobación de orientaciones. El vector real del TCP se determina frente a la punta patrón; sus componentes se revelan después de validar. La posición de brida es pF=P−Ry(φ)tdeclarado; punta real=P+Ry(φ)(treal−tdeclarado). φ=0,65 sin(0,8t). Dos eslabones de700 y650 mm sitúan la brida por cinemática inversa plana. Error=norma de la diferencia; dispersión extrema=2 error sin(0,65). Calibración sintética plana de dos componentes; no estima seis parámetros por mínimos cuadrados, no compensa flexión ni holgura. Un robot articulado planar con muñeca representa el banco, sin modelo de fabricante ni seguridad funcional.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/calibracion-tcp-robot.html"
};
export default catalogo;
