import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "¿Qué cambia en inhibición competitiva ideal?",
    "opciones": [
      "Aumenta Km aparente y Vmax permanece.",
      "Desaparece el sustrato instantáneamente.",
      "Vmax se duplica necesariamente.",
      "Se destruye la estructura de toda enzima."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "El factor1+[I]/Ki modifica el término de afinidad aparente."
  },
  {
    "pregunta": "¿Cómo obtienes v desde el registro lineal?",
    "opciones": [
      "Mediante ΔP/Δt con unidades compatibles.",
      "Dividiendo producto entre la masa del aparato.",
      "Tomando el producto final sin dividir por el intervalo de tiempo.",
      "Multiplicando concentración por un tiempo sin unidades."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La velocidad expresa producción por unidad de tiempo."
  },
  {
    "pregunta": "¿Las constantes del banco caracterizan experimentalmente a1LYZ?",
    "opciones": [
      "No: la geometría es estructural y la cinética del ensayo es sintética.",
      "Sí, cualquier coordenada determina por sí sola Km.",
      "Sí, porque todas las enzimas tienen el mismo Km.",
      "Sólo cuando se ocultan los átomos."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La ficha distingue estructura experimental y modelo de operación."
  }
];
export default quiz;
