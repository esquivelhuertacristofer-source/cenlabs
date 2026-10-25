import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Calibración de resolver de tracción",
  duracion: "40 min",
  teoria: "OT-192 · Reduce el error máximo a0,3° y deja la ganancia entre0,99 y1,01. Resolver seccionado, encoder patrón y canales seno/coseno. S=g sin(θ+δ), C=cos(θ+δ); θmed=atan2(S,C). Error envuelto a±π; barrido361 orientaciones por vuelta. Giro real0,9 rad/s. Los mandos representan errores residuales tras compensación. Señales ya demoduladas; sin portadora, ruido, armónicos de devanado, latenciaRDC ni prueba de un inversor real. La geometría del resolver es esquemática en sección.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/calibracion-resolver-traccion.html"
};
export default catalogo;
