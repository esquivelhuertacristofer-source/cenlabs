import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Motor de Combustión Interna",
  titulo: "Eficiencia del Catalizador y Sondas de Oxígeno",
  duracion: "45 min",
  teoria: "Un P0420 no dice que el catalizador esté malo: dice que el ordenador midió poco almacenamiento de oxígeno y dedujo el resto. De 45 celdas se equivoca en 20. Una sonda anterior desviada saca P0420 con 37 ppm de HC; el fósforo hunde la conversión a 539 ppm sin encender nada; y el umbral está calibrado a 1,5 veces la NOM-041, así que hay 40 000 km en que el coche reprueba con el tablero limpio.",
  estado: "activo",
  simuladorHtml: "/labs/catalizador-sondas.html",
};

export default catalogo;
