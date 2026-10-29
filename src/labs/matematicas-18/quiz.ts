import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "Para errores independientes se suman…",
    "opciones": [
      "Las varianzas.",
      "Siempre las desviaciones directamente.",
      "Las medias al cuadrado sólo.",
      "Las probabilidades sin límite."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Var(ΣXi)=ΣVar(Xi)."
  },
  {
    "pregunta": "Aumentar simulaciones elimina todo error de modelo…",
    "opciones": [
      "No: sólo reduce error de muestreo.",
      "Sí.",
      "Sí, desde diez corridas.",
      "Sí, sin revisar distribuciones."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Las hipótesis pueden seguir siendo incorrectas."
  },
  {
    "pregunta": "H<0 representa…",
    "opciones": [
      "Interferencia geométrica.",
      "Holgura positiva.",
      "Ausencia de piezas.",
      "Desviación estándar nula."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La dimensión acumulada excede la separación disponible."
  }
];
export default quiz;
