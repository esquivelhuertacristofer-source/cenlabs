import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Instrumentación",
  titulo: "Calibrador Vernier: Lectura, Error de Cero y Repetibilidad",
  duracion: "50 min",
  teoria:
    'Un calibrador vernier combina una escala principal fija (en milímetros) con un cursor deslizante que porta una segunda escala, el nonio: si el nonio tiene N divisiones que abarcan exactamente (N−1) mm de la escala principal, cada división del nonio mide (N−1)/N mm, y la mínima lectura discernible (LC, "lowest count") es LC=1mm/N — 0.05 mm para N=20, 0.02 mm para N=50. La lectura se obtiene sumando los milímetros completos de la escala principal antes del cero del nonio, más la división del nonio que coincide exactamente con una línea de la escala principal, multiplicada por LC. Todo calibrador real tiene un error de cero propio (la lectura con las mordazas cerradas no es exactamente 0.000), que debe restarse (con su signo) de cada lectura cruda: Lectura corregida = Lectura cruda − Error de cero. Incluso con esta corrección, mediciones repetidas del mismo objeto por el mismo operador muestran una dispersión (repetibilidad) descrita por la media, el rango y la desviación estándar muestral s, que se compara —no se descarta— contra la incertidumbre de resolución del instrumento, ±LC/2.',
  estado: "activo",
  simuladorHtml: "/labs/calibrador-vernier.html",
};

export default catalogo;
