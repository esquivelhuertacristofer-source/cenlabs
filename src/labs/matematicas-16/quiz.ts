import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "Con c=2 se acepta una muestra con…",
    "opciones": [
      "Dos defectos o menos.",
      "Exactamente tres.",
      "Cualquier cantidad.",
      "Sólo cero siempre."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La regla usa X≤c."
  },
  {
    "pregunta": "Aceptar un lote demuestra que está libre de defectos…",
    "opciones": [
      "No.",
      "Sí.",
      "Sí, por ser aleatorio.",
      "Sí, si n es par."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Siempre existe riesgo estadístico."
  },
  {
    "pregunta": "Para un lote pequeño sin reemplazo conviene…",
    "opciones": [
      "La distribución hipergeométrica.",
      "Suponer infinitas piezas.",
      "La ley de Ohm.",
      "Una masa negativa."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Las extracciones dejan de ser independientes."
  }
];
export default quiz;
