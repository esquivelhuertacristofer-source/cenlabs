import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "Un equipo censurado por la derecha…",
    "opciones": [
      "Sigue vivo al terminar la observación.",
      "Falló exactamente en el corte.",
      "Nunca fallará.",
      "Debe eliminarse sin registrar."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Se conoce una cota inferior de su vida."
  },
  {
    "pregunta": "Si β>1, la tasa de riesgo…",
    "opciones": [
      "Crece con el tiempo.",
      "Es siempre cero.",
      "Disminuye siempre.",
      "Es negativa."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "h∝t^(β−1)."
  },
  {
    "pregunta": "En t=η, R(t) vale…",
    "opciones": [
      "e⁻¹.",
      "1.",
      "0.",
      "η."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "El exponente es −1."
  }
];
export default quiz;
