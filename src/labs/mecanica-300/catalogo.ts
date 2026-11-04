import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Mantenimiento predictivo por vibración",
  duracion: "40 min",
  teoria: "Historial sintético de días 0 a 60 con degradación acelerada. Ajuste por mínimos cuadrados y=md+b sobre las muestras de la ventana. Tiempo hasta alarma = (4,5−b)/m−60 días. Residuo = raíz de la media de los errores cuadrados. 4,5 mm/s es un umbral de este caso didáctico. La extrapolación supone pendiente constante y estima tiempo hasta alarma. Los datos son sintéticos y no incluyen cambios de carga o temperatura.",
  estado: "activo",
  simuladorHtml: "/labs/mantenimiento-predictivo-vibracion-rul.html"
};
export default catalogo;
