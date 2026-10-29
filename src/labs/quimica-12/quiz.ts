import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "Picos más anchos a retenciones iguales dan…",
    "opciones": [
      "Menor resolución.",
      "Mayor resolución.",
      "Resolución infinita.",
      "El mismo Rs siempre."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "El denominador aumenta."
  },
  {
    "pregunta": "En esta columna ideal, cambiar sólo Q…",
    "opciones": [
      "Escala tiempos y anchuras por igual.",
      "Cambia obligatoriamente la selectividad.",
      "Crea un tercer analito.",
      "No cambia tiempos."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Rs se conserva al mantener N y k."
  },
  {
    "pregunta": "El volumen muerto determina…",
    "opciones": [
      "El tiempo de un compuesto no retenido.",
      "El tiempo de elución del analito más retenido.",
      "El tiempo total de retención de cualquier compuesto, independientemente de k.",
      "La energía de enlace."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "t0=VM/Q."
  }
];
export default quiz;
