import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "La válvula ideal abre cuando…",
    "opciones": [
      "La presión ventricular supera la aórtica.",
      "La presión aórtica siempre es mayor.",
      "No hay gradiente.",
      "La frecuencia vale cero."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "El diodo hidráulico permite sólo gradiente positivo."
  },
  {
    "pregunta": "A igual gradiente, duplicar R hace Q…",
    "opciones": [
      "La mitad.",
      "El doble.",
      "Cuatro veces mayor.",
      "Idéntico."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Q=ΔP/R."
  },
  {
    "pregunta": "Este banco calcula gasto cardíaco clínico completo…",
    "opciones": [
      "No.",
      "Sí.",
      "Sí, sin integrar flujo.",
      "Sí, porque la presión máxima determina por sí sola el volumen eyectado."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Faltan acoplamiento y calibración fisiológica."
  }
];
export default quiz;
