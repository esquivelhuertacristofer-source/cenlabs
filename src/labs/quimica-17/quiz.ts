import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "Aumentar Q a V fijo reduce…",
    "opciones": [
      "El tiempo de residencia.",
      "La constante k obligatoriamente.",
      "El volumen siempre.",
      "La concentración de entrada automáticamente."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "τ=V/Q."
  },
  {
    "pregunta": "Para primer orden en un CSTR ideal, X∞ es…",
    "opciones": [
      "kτ/(1+kτ).",
      "1+kτ.",
      "k/τ sin unidades.",
      "Siempre 100%."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Sale del balance estacionario."
  },
  {
    "pregunta": "Una lectura durante el arranque…",
    "opciones": [
      "Puede diferir del estado estacionario.",
      "Siempre ya es estacionaria.",
      "No tiene unidades.",
      "No depende del tiempo."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Hay acumulación en el tanque."
  }
];
export default quiz;
