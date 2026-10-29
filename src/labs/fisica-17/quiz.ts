import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "En equilibrio radiativo…",
    "opciones": [
      "La entrada iguala la salida neta.",
      "La temperatura es siempre cero.",
      "La potencia desaparece.",
      "La emisividad vale uno necesariamente."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "No cambia la energía interna."
  },
  {
    "pregunta": "La ley de Stefan–Boltzmann usa…",
    "opciones": [
      "Temperatura absoluta en kelvin.",
      "Celsius a la cuarta directamente.",
      "Grados de ángulo.",
      "Presión absoluta."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La potencia T⁴ requiere escala absoluta."
  },
  {
    "pregunta": "Este banco omite…",
    "opciones": [
      "Convección con el aire.",
      "Radiación térmica.",
      "Absorción solar.",
      "Balance energético."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "El modelo declara intercambio exclusivamente radiativo."
  }
];
export default quiz;
