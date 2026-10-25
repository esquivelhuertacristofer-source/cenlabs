import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Plataforma Stewart: movimiento y reparto de carga entre seis actuadores",
  duracion: "40 min",
  teoria: "Las seis patas cambian de longitud a la vez. La altura y la inclinación modifican tanto el recorrido como el reparto del peso. Brazos de anclaje en radios 0,75 y 0,50 m. li = |T+Rpi−bi|, ui = (T+Rpi−bi)/li. Cada fila del jacobiano es [ui, (Rpi)×ui]. Equilibrio JT f = [0,mg,0,0,0,0], m=300 kg. Se resuelve un sistema de seis ecuaciones con pivoteo. R=Ry(cabeceo)Rx(balanceo); el cabeceo tiene 0,6 veces la amplitud del balanceo y va desfasado un cuarto de ciclo. Sólo cinemática inversa y equilibrio estático instantáneo. Sin inercia, flexión, pandeo, choques entre patas, límites de rótulas, fricción ni control hidráulico. Las fuerzas admiten tracción y compresión. Los extremos del ciclo se revisan en 121 posiciones; no es certificación de una plataforma para personas.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/plataforma-stewart-seis-actuadores.html"
};
export default catalogo;
