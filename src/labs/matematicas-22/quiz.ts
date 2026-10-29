import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "Sensibilidad significa…",
    "opciones": [
      "P(alarma|defecto).",
      "P(defecto|alarma) siempre.",
      "P(defecto) sin condición.",
      "P(alarma|conforme)."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La condición son piezas defectuosas."
  },
  {
    "pregunta": "Con defectos muy raros, las alarmas pueden ser…",
    "opciones": [
      "Mayormente falsas aunque la sensibilidad sea alta.",
      "Siempre verdaderas.",
      "Imposibles.",
      "Independientes de la tasa base."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Hay muchos más conformes disponibles para falsas alarmas."
  },
  {
    "pregunta": "El denominador de Bayes cuenta…",
    "opciones": [
      "Todas las alarmas.",
      "Sólo defectos.",
      "Sólo piezas rechazadas por tamaño.",
      "Sólo conformes sin alarma."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Incluye positivos verdaderos y falsos."
  }
];
export default quiz;
