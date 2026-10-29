import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "E=100% implica por ciclo…",
    "opciones": [
      "Duplicación ideal.",
      "Aumento de una sola copia.",
      "Disminución a la mitad.",
      "Cero síntesis."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "El factor es 1+E=2."
  },
  {
    "pregunta": "Un control sin plantilla que amplifica sugiere…",
    "opciones": [
      "Contaminación o señal inespecífica que debe investigarse.",
      "Un control ideal correcto.",
      "Que el ADN no existe.",
      "Que todos los resultados son válidos."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "El negativo ideal permanece sin producto."
  },
  {
    "pregunta": "La fase exponencial dura indefinidamente en una PCR real…",
    "opciones": [
      "No.",
      "Sí.",
      "Sí, sin reactivos.",
      "Sí, si el tubo es transparente."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Reactivos y otros factores limitan el crecimiento."
  }
];
export default quiz;
