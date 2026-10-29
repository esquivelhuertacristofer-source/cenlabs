import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {ecotoxicologia} from '@/domain/ciencias/vida';
const definition:PracticaCiencia={...{
  "id": "biologia-19",
  "title": "Ecotoxicología con bioindicadores virtuales",
  "intro": "Poblaciones responden a una exposición simulada; construir una curva dosis–respuesta e interpretar variabilidad.",
  "mission": "Calcula el porcentaje de respuesta de los bioindicadores virtuales a la exposición.",
  "formula": "Curva de Hill: E=100 C^h/(EC50^h+C^h), EC50=8 mg/L. h controla la pendiente; supervivencia ilustrada=100−E.",
  "limits": "Población enteramente virtual con parámetros sintéticos y respuesta agregada; no ensayos con seres vivos, extrapolación a especies reales ni umbral ambiental legal.",
  "scale": "Mesocosmo virtual · curva dosis-respuesta sintética",
  "controls": [
    {
      "key": "concentration",
      "label": "Concentración virtual",
      "min": 1,
      "max": 32,
      "step": 1,
      "initial": 8,
      "unit": "mg/L"
    },
    {
      "key": "slope",
      "label": "Pendiente de Hill",
      "min": 1,
      "max": 4,
      "step": 0.25,
      "initial": 2,
      "unit": ""
    }
  ],
  "readings": [
    {
      "key": "concentration",
      "label": "Concentración",
      "unit": "mg/L",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "EC50",
      "label": "EC50 del banco",
      "unit": "mg/L",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "slope",
      "label": "Coeficiente de Hill",
      "unit": "",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Respuesta agregada",
  "answerUnit": "%",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · biología",
      "url": "https://openstax.org/books/biology-2e/pages/1-introduction"
    }
  ],
  "concepts": [
    {
      "title": "Dosis-respuesta",
      "description": "E crece de forma saturable."
    },
    {
      "title": "EC50",
      "description": "Es la concentración para 50% de respuesta."
    },
    {
      "title": "Incertidumbre",
      "description": "Un modelo virtual no establece un límite legal."
    }
  ],
  "quiz": [
    {
      "pregunta": "Cuando C=EC50, E vale…",
      "opciones": [
        "50%.",
        "0%.",
        "100%.",
        "EC50%."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Numerador y término EC50 del denominador coinciden."
    },
    {
      "pregunta": "Aumentar h modifica…",
      "opciones": [
        "La pendiente alrededor de EC50.",
        "La unidad de concentración.",
        "El número atómico del agua.",
        "Siempre EC50."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "h controla la transición."
    },
    {
      "pregunta": "Se puede usar esta curva como límite ambiental legal…",
      "opciones": [
        "No.",
        "Sí, para cualquier especie.",
        "Sí, sin fuentes normativas.",
        "Sí, por ser visual."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Es una simulación sintética, sin validación ecológica."
    }
  ]
},model:ecotoxicologia};
export default definition;
