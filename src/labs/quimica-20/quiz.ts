import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "¿Qué fracción de grupos queda sin reaccionar en primer orden?",
    "opciones": [
      "exp(−kt).",
      "kt para cualquier tiempo.",
      "1+kt.",
      "Siempre exactamente0,5."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La solución integrada describe decaimiento exponencial."
  },
  {
    "pregunta": "¿Qué ocurre al aumentar T con Ea positiva?",
    "opciones": [
      "Aumenta k.",
      "Disminuye siempre k.",
      "La temperatura Celsius entra directamente en el exponente.",
      "El tiempo deja de importar."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Arrhenius utiliza temperatura absoluta en kelvin."
  },
  {
    "pregunta": "¿Por qué la muestra no se calienta adiabáticamente en este banco?",
    "opciones": [
      "El baño retira calor y mantiene la temperatura.",
      "Porque la reacción no libera energía.",
      "Porque Qes siempre cero.",
      "Porque el número de enlaces no cambia."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La condición isotérmica exige intercambio con el baño."
  }
];
export default quiz;
