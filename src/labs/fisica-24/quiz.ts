import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "Duplicar rpm en el modelo hace Ω…",
    "opciones": [
      "La mitad.",
      "El doble.",
      "Cuatro veces mayor.",
      "Cero necesariamente."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Ω=τ/(Iω)."
  },
  {
    "pregunta": "La dirección del momento angular cambia por…",
    "opciones": [
      "El torque externo.",
      "Un torque paralelo a L que sólo aumenta su magnitud.",
      "Conservación de la dirección de L en ausencia de torque externo.",
      "La ausencia de gravedad."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "dL/dt=τ."
  },
  {
    "pregunta": "¿Qué comportamiento no se resuelve aquí?",
    "opciones": [
      "Nutación transitoria.",
      "Precesión lenta.",
      "Momento de un disco.",
      "Conversión rpm a rad/s."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La aproximación es estacionaria."
  }
];
export default quiz;
