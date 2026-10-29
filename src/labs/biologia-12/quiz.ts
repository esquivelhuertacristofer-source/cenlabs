import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "¿Cuántos protones por ATP requiere el rotor c8 ideal?",
    "opciones": [
      "8/3.",
      "3/8.",
      "Siempre exactamente1.",
      "Siempre exactamente10."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Ocho protones se acoplan a tres ATP por vuelta."
  },
  {
    "pregunta": "¿Qué ocurre por debajo del umbral energético en el banco?",
    "opciones": [
      "La síntesis se detiene.",
      "La energía se crea en el rotor.",
      "El modelo duplica automáticamente la temperatura.",
      "El rotor produce ATP sin flujo."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La ley cinética impuesta no permite síntesis con balance desfavorable."
  },
  {
    "pregunta": "¿8/3 expresa el costo completo de ATP exportado por la mitocondria?",
    "opciones": [
      "No: faltan costos de transporte.",
      "Sí, incluye cualquier fuga y todos los transportadores.",
      "Sí, porque el ATP no debe cruzar membranas.",
      "Sí, porque el transporte de ADP y fosfato no agrega costo energético."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La ficha separa rotor y provisión de ATP al citoplasma."
  }
];
export default quiz;
