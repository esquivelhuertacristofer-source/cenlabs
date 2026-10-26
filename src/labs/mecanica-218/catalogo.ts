import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Diagnóstico CNC con ballbar",
  duracion: "40 min",
  teoria: "OT-218 · Obtén desviación circular ≤3 µm y error radial máximo ≤2 µm ajustando escala y escuadra. Centro CNC, barra extensible y registro de desviación circular. R=100 mm; x0=Rcosθ,y0=Rsinθ. x=(1+ex)x0+tan(ε)y0,y=y0. ex y ε son errores residuales después de compensar. Lectura radial=√(x²+y²)−R. Se muestrea una vuelta cada 1° y se calculan máximo y mínimo. Recorrido impuesto de 8 s; la prueba de regreso ideal reproduce la geometría. Modelo geométrico de dos errores; no reproduce el software Renishaw ni aplica compensaciones a una CNC. Sin holgura, inversión dinámica, servo, temperatura, montaje de rótulas o calibración del sensor. Errores de posición 3D amplificados 500 veces; números e instrumento conservan micrómetros físicos. Las constantes de referencia se revelan al validar.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/diagnostico-cnc-ballbar.html"
};
export default catalogo;
