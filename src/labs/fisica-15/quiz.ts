import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "RT60 corresponde a una caída de…",
    "opciones": [
      "60 dB.",
      "6 dB.",
      "60 Pa.",
      "60 Hz."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Se define por una reducción energética de 10⁶."
  },
  {
    "pregunta": "Añadir absorción reduce RT60 porque…",
    "opciones": [
      "A está en el denominador.",
      "El volumen se vuelve negativo.",
      "La frecuencia deja de existir.",
      "La fuente gana potencia."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Sabine predice RT inverso al área absorbente."
  },
  {
    "pregunta": "¿Qué limita este banco?",
    "opciones": [
      "Supone un campo difuso.",
      "Resuelve cada modo arquitectónico real.",
      "Certifica cualquier sala.",
      "Mide aislamiento entre edificios."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La hipótesis difusa no resuelve geometría ondulatoria completa."
  }
];
export default quiz;
