import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "¿Qué ocurre con Re al duplicar U a igual D yν?",
    "opciones": [
      "Se duplica.",
      "Se divide entre dos.",
      "Se eleva al cuadrado.",
      "Permanece fijo."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Re es proporcional a U."
  },
  {
    "pregunta": "¿Qué representa un trazador en la escena?",
    "opciones": [
      "Una partícula pasiva que sigue la velocidad calculada.",
      "Una molécula de agua representada a escala atómica.",
      "Un vector de fuerza sobre el soporte.",
      "Un vórtice dibujado con frecuencia arbitraria."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Su trayectoria se integra a partir del campo del solver."
  },
  {
    "pregunta": "¿Se pueden interpretar los vórtices2D de este banco como turbulencia industrial completa?",
    "opciones": [
      "No: el dominio y el régimen del modelo están limitados.",
      "Sí, cualquier remolino es turbulencia3D.",
      "Sí, porque Re tiene unidades de presión.",
      "Sí, siempre que coincida Reynolds, aunque cambien la dimensionalidad y las fronteras."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Se declaran dimensiones, fronteras y rango de Reynolds."
  }
];
export default quiz;
