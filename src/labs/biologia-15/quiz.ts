import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "A sustrato alto, μ se aproxima a…",
    "opciones": [
      "Un límite dependiente del oxígeno.",
      "Infinito.",
      "Cero siempre.",
      "La masa del agitador."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La fracción S/(Ks+S) tiende a uno."
  },
  {
    "pregunta": "Con μ constante, el crecimiento es…",
    "opciones": [
      "Exponencial.",
      "Siempre lineal.",
      "Siempre negativo.",
      "Independiente de X inicial."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "dX/dt=μX."
  },
  {
    "pregunta": "El banco conserva S constante porque…",
    "opciones": [
      "Declara una alimentación que lo repone.",
      "El consumo de sustrato no existe en seres vivos.",
      "La biomasa no necesita materia.",
      "El tiempo se detiene."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "No modela un lote cerrado."
  }
];
export default quiz;
