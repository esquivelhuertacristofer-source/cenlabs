import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "Al duplicar d, las franjas centrales…",
    "opciones": [
      "Reducen su separación a la mitad.",
      "Duplican su separación.",
      "Desaparecen siempre.",
      "Conservan la separación."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Δy es inversa a d."
  },
  {
    "pregunta": "La envolvente ancha proviene de…",
    "opciones": [
      "La anchura finita de cada rendija.",
      "Un cambio de gravedad.",
      "La separación de las rendijas, sin influencia de su anchura individual.",
      "La corriente del láser."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "El factor sinc² corresponde a una rendija."
  },
  {
    "pregunta": "¿Qué se mantiene para observar un patrón estable?",
    "opciones": [
      "Coherencia entre las dos ondas.",
      "Temperatura cero.",
      "Frecuencia distinta en cada rendija.",
      "Ausencia de luz."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La relación de fase debe mantenerse."
  }
];
export default quiz;
