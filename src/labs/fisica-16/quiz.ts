import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "En serie, las resistencias térmicas…",
    "opciones": [
      "Se suman.",
      "Se restan siempre.",
      "Se multiplican por el tiempo.",
      "Desaparecen en la interfaz."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "El mismo flujo atraviesa las capas."
  },
  {
    "pregunta": "En régimen estacionario, el flujo de cada capa…",
    "opciones": [
      "Es el mismo.",
      "Se duplica en la segunda.",
      "Debe ser cero.",
      "La capa más conductora transporta mayor flujo que la otra, aun estando en serie."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "No se acumula energía en la interfaz."
  },
  {
    "pregunta": "L/k tiene unidades de…",
    "opciones": [
      "m²·K/W.",
      "W/K.",
      "kg/m³.",
      "s⁻¹."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Son resistencias normalizadas por área."
  }
];
export default quiz;
