import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "Para calcular distancia se divide por…",
    "opciones": [
      "La norma de la normal.",
      "La norma al cubo.",
      "La suma de coordenadas de P.",
      "El cuadrado de la norma de la normal."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Se normaliza n."
  },
  {
    "pregunta": "El pie H satisface…",
    "opciones": [
      "La ecuación del plano.",
      "Siempre H=P.",
      "H=0 necesariamente.",
      "Una órbita circular."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "H es la proyección ortogonal."
  },
  {
    "pregunta": "Multiplicar toda la ecuación del plano por dos…",
    "opciones": [
      "Conserva el plano y la distancia.",
      "Duplica la distancia.",
      "Cambia el plano.",
      "Anula su normal."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Numerador y denominador escalan juntos."
  }
];
export default quiz;
