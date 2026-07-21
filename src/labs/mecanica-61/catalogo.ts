import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Circuitos Eléctricos",
  titulo: "Divisores de Tensión y Corriente: Diseño con Efecto de Carga",
  duracion: "35 min",
  teoria: "Un divisor de tensión (V, R1, R2) resuelto en vivo por el mismo motor de análisis nodal modificado (MNA) de Kirchhoff (mecanica-13): el alumno primero observa el caso ideal sin carga, luego conecta una resistencia RL y cuantifica cómo Vo cae por debajo del valor de libro (efecto de carga), y contrasta el resultado contra la equivalencia de Thévenin del propio divisor. Un segundo circuito con una fuente de corriente ideal introduce el divisor de corriente (I1, I2). En el reto, el alumno no predice: diseña — propone valores de R1 y R2 que alcancen un voltaje objetivo respetando un presupuesto de error de carga (≤5 %) y de corriente de reposo (≤25 mA), la misma disyuntiva rigidez-vs-consumo de un divisor real. Esquema IEC 60617; resistores con código de colores E12.",
  estado: "activo",
  simuladorHtml: "/labs/divisor-tension-corriente.html",
};

export default catalogo;
