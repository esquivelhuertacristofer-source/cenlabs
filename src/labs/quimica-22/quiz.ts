import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "Duplicar radio en Stokes multiplica v por…",
    "opciones": [
      "Cuatro.",
      "Dos.",
      "Ocho.",
      "Un medio."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "v∝r²."
  },
  {
    "pregunta": "Aumentar dosis sin límite garantiza mejor agua…",
    "opciones": [
      "No: el banco incluye sobredosificación.",
      "Sí, siempre.",
      "Sí, sin mediciones.",
      "Sí, independientemente de la mezcla."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La eficiencia es una curva con máximo."
  },
  {
    "pregunta": "Un agua visualmente clara garantiza potabilidad…",
    "opciones": [
      "No.",
      "Sí.",
      "Sí, si no tiene burbujas.",
      "Sí, por sedimentación únicamente."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "No se evalúan todos los contaminantes."
  }
];
export default quiz;
