import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Motor de Combustión Interna",
  titulo: "El Circuito de Carga: Alternador, Regulador y Balance Eléctrico",
  duracion: "50 min",
  teoria: "Un alternador de 120 A no da 120 A: esa cifra es la corriente a régimen infinito, y al ralentí da entre el 43 % y el 51 % de ella. Por eso un coche SANO se come la batería en un atasco con todo encendido, y bastarían 793 rpm de ralentí en vez de 720 para que no lo hiciera. De las 180 casillas del censo, en 73 la batería se está vaciando con el motor en marcha y el testigo del salpicadero se enciende en CERO: vigila si el alternador excita, no si alcanza.",
  estado: "activo",
  simuladorHtml: "/labs/carga-alternador-balance.html",
};

export default catalogo;
