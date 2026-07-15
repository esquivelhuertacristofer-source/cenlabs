import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Instrumentación",
  titulo: "Micrómetro y Comparador de Carátula: Resolución 0.01 mm",
  duracion: "50 min",
  teoria:
    'El micrómetro convierte el giro del tambor en desplazamiento lineal del husillo mediante un tornillo de paso 0.5 mm/vuelta; el tambor tiene 50 divisiones, así que cada división vale 0.01 mm y la lectura se forma sumando los milímetros enteros del manguito, la media vuelta si la marca intermedia está descubierta, y la división del tambor alineada con la línea de referencia. Como todo instrumento real, tiene un error de cero propio que debe restarse (con su signo) de la lectura cruda; en el instrumento físico esa corrección se hace mecánicamente con la llave de ajuste, aquí se resuelve aritméticamente por comparación con el vernier. El comparador de carátula, en cambio, no mide una dimensión absoluta: registra el desplazamiento relativo de un émbolo (tipo plunger) respecto a una referencia, y se usa para dos evaluaciones geométricas — runout (TIR = lectura máxima − lectura mínima al girar la pieza) y planitud (máxima − mínima entre varios puntos palpados sobre una superficie), ambas comparadas contra una tolerancia de aceptación.',
  estado: "activo",
  simuladorHtml: "/labs/micrometro-comparador.html",
};

export default catalogo;
