import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Balanceo dinámico: corregir un par de desequilibrio en dos planos",
  duracion: "40 min",
  teoria: "Dos desequilibrios opuestos no dejan una fuerza neta, pero sí un par oscilante. La corrección necesita dos pesos, uno en cada plano. Caso de par puro: U1=0,006 e^(j30°) kg·m; U2=−U1, planos a ±0,12 m y apoyos a ±0,35 m. Los contrapesos a radio 0,18 m se montan opuestos entre planos. Ures = U1 + mr e^(jα). La suma estática sigue siendo cero. Par = |Ures|ω²·0,24; reacción por apoyo = par/0,70. Rigidez por apoyo 200 kN/m para ilustrar la flexión amplificada. Sólo rotor rígido con par puro y fase ideal conocida. No calcula una medición por coeficientes de influencia ni corrige un caso general con fuerza y par simultáneos. El peso del plano B se mantiene opuesto automáticamente, por la simetría del problema. La deformación es cuasiestática ilustrativa: sin resonancia de los apoyos, giroscopía ni neumático flexible.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/balanceo-dinamico-dos-planos.html"
};
export default catalogo;
