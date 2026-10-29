import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "La regla de la palanca se basa en…",
    "opciones": [
      "Balance de masa.",
      "Un torque gravitatorio real.",
      "Promediar directamente las temperaturas de solidus y liquidus.",
      "Suponer iguales las dos fracciones para cualquier composición global."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "C0=fsCα+(1−fs)CL."
  },
  {
    "pregunta": "Fuera de la región bifásica…",
    "opciones": [
      "Una de las fracciones vale cero.",
      "Siempre coexisten dos fases iguales.",
      "La masa deja de conservarse.",
      "No existe temperatura."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "El estado es monofásico."
  },
  {
    "pregunta": "Este diagrama permite certificar una aleación industrial…",
    "opciones": [
      "No: es sintético.",
      "Sí, para cualquier metal.",
      "Sí, sin composición.",
      "Sí, por su aspecto."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "No representa datos de una aleación específica."
  }
];
export default quiz;
