import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "A energía fija, aumentar B hace el radio…",
    "opciones": [
      "Menor.",
      "Mayor.",
      "Infinito.",
      "Siempre idéntico."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "r=√(2mV/q)/B."
  },
  {
    "pregunta": "La fuerza magnética ideal cambia…",
    "opciones": [
      "La dirección de la velocidad.",
      "La energía cinética directamente.",
      "La masa del ion.",
      "Su carga elemental."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Es perpendicular a v."
  },
  {
    "pregunta": "Sin conocer el estado de carga se determina…",
    "opciones": [
      "La relación masa/carga.",
      "La masa de forma única.",
      "El número de neutrones exacto.",
      "La composición química completa."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La trayectoria depende de m/q."
  }
];
export default quiz;
