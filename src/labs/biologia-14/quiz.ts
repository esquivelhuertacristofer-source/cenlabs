import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "Un fragmento menor migra en este banco…",
    "opciones": [
      "Más lejos a igual tiempo.",
      "Menos lejos siempre.",
      "Sin relación con tamaño.",
      "Hacia arriba por gravedad."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La movilidad decrece con log10L."
  },
  {
    "pregunta": "El patrón sirve para…",
    "opciones": [
      "Relacionar distancia con tamaños conocidos.",
      "Cambiar la masa del gel.",
      "Eliminar la necesidad de tiempo.",
      "Demostrar una secuencia completa."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Es una referencia de calibración."
  },
  {
    "pregunta": "Una banda estima la secuencia exacta…",
    "opciones": [
      "No, sólo un tamaño aproximado en este ensayo.",
      "Sí.",
      "Sí, por el brillo.",
      "Sí, con cualquier patrón."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Tamaño y secuencia son propiedades distintas."
  }
];
export default quiz;
