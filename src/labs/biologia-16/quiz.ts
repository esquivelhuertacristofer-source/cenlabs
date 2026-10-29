import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "La constante temporal es…",
    "opciones": [
      "R por C.",
      "R más C sin unidades.",
      "C dividida entre temperatura.",
      "El número de alvéolos dibujados."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "El producto tiene unidades de segundos."
  },
  {
    "pregunta": "Aumentar R a igual C hace el llenado…",
    "opciones": [
      "Más lento.",
      "Más rápido siempre.",
      "Instantáneo.",
      "Independiente del tiempo."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Aumenta RC."
  },
  {
    "pregunta": "Este simulador permite ajustar un ventilador de un paciente…",
    "opciones": [
      "No: es un modelo educativo.",
      "Sí, sin mediciones.",
      "Sí, sólo con su imagen.",
      "Sí, para toda edad."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "No representa evaluación clínica."
  }
];
export default quiz;
