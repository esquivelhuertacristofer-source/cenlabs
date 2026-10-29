import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "Un patrón curvo en residuos sugiere…",
    "opciones": [
      "Falta de adecuación de la recta.",
      "Linealidad garantizada.",
      "Ausencia de sesgo siempre.",
      "Que todos los puntos son iguales."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La estructura queda sin explicar."
  },
  {
    "pregunta": "Mínimos cuadrados minimiza…",
    "opciones": [
      "La suma de residuos al cuadrado.",
      "El número de datos.",
      "La longitud del eje X.",
      "La suma de residuos sin elevarlos al cuadrado."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La función objetivo es Σei²."
  },
  {
    "pregunta": "Correlación prueba causalidad…",
    "opciones": [
      "No.",
      "Sí, siempre.",
      "Sí, con nueve puntos.",
      "Sí, si la línea es azul."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Puede haber factores omitidos."
  }
];
export default quiz;
