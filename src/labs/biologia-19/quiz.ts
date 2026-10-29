import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "Cuando C=EC50, E vale…",
    "opciones": [
      "50%.",
      "0%.",
      "100%.",
      "EC50%."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Numerador y término EC50 del denominador coinciden."
  },
  {
    "pregunta": "Aumentar h modifica…",
    "opciones": [
      "La pendiente alrededor de EC50.",
      "La unidad de concentración.",
      "El número atómico del agua.",
      "Siempre EC50."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "h controla la transición."
  },
  {
    "pregunta": "Se puede usar esta curva como límite ambiental legal…",
    "opciones": [
      "No.",
      "Sí, para cualquier especie.",
      "Sí, sin fuentes normativas.",
      "Sí, por ser visual."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Es una simulación sintética, sin validación ecológica."
  }
];
export default quiz;
