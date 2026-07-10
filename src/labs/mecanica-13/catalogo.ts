import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Circuitos Eléctricos",
  titulo: "Leyes de Kirchhoff: redes multimalla en vivo",
  duracion: "40 min",
  teoria: "Una red de 3 mallas (2 fuentes, 5 resistores) resuelta en vivo por análisis nodal modificado (MNA) — el mismo motor de los simuladores SPICE. El alumno verifica con números reales que ΣI = 0 en cada nodo (LCK) y ΣV = 0 en cada malla (LVK), y en el reto resuelve el sistema 2×2 para predecir V_A y V_B antes de que el esquema los revele. Esquema normalizado IEC 60617; resistores con código de colores de la serie E12.",
  estado: "activo",
  simuladorHtml: "/labs/kirchhoff.html",
};

export default catalogo;
