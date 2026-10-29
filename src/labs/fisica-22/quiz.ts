import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "Duplicar I a igual B y t produce…",
    "opciones": [
      "El doble de |VH|.",
      "La mitad de |VH|.",
      "El mismo |VH|.",
      "Tensión Hall nula siempre."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La ley es lineal en I."
  },
  {
    "pregunta": "Una tensión Hall menor puede indicar…",
    "opciones": [
      "Mayor densidad de portadores, a igual I, B y t.",
      "Menor densidad necesariamente.",
      "Ausencia de átomos.",
      "Mayor espesor, aun manteniendo fijo el espesor especificado del ensayo."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "|VH| es inversa a n."
  },
  {
    "pregunta": "Este modelo identifica el signo del portador…",
    "opciones": [
      "No: aquí se usa sólo la magnitud.",
      "Sí, la magnitud positiva de |VH| implica siempre portadores positivos.",
      "Sí, por la temperatura ambiente.",
      "Sí, sin medir polaridad."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La polaridad se omitió explícitamente."
  }
];
export default quiz;
