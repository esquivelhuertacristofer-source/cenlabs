import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Circuitos Eléctricos",
  titulo: "Transitorio RC: Mide la Constante de Tiempo τ en el Osciloscopio",
  duracion: "35 min",
  teoria: "Al conectar o desconectar una fuente de CD de un capacitor a través de un resistor, el voltaje no cambia instantáneamente: sigue una curva exponencial gobernada por τ = R·C, la constante de tiempo. Este laboratorio mide τ directamente en un osciloscopio simulado y la contrasta contra el cálculo de R·C.",
  estado: "activo",
  simuladorHtml: "/labs/transitorio-rc.html",
};

export default catalogo;
