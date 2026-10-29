import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {reactor} from '@/domain/ciencias/procesos';
const definition:PracticaCiencia={...{
  "id": "quimica-17",
  "title": "Reactor continuo: cinética y tiempo de residencia",
  "intro": "Un reactor mezclado convierte reactivos; medir conversión y respuesta a cambios de operación.",
  "mission": "Determina la conversión de estado estacionario de un reactor continuo perfectamente mezclado.",
  "formula": "V=2 L; reacción A→B de primer orden k=0,20 min⁻¹. τ=V/Q; C∞=Centrada/(1+kτ); X∞=kτ/(1+kτ). Desde C(0)=0: C(t)=C∞[1−exp(−(Q/V+k)t)].",
  "limits": "Reactor isotermo ideal de volumen constante; concentración uniforme, cinética conocida y sin cambios de densidad ni tiempos muertos. La conversión solicitada es estacionaria aunque el registro muestre arranque.",
  "scale": "CSTR en corte · 1 s visual = 2 min",
  "controls": [
    {
      "key": "flow",
      "label": "Caudal de alimentación",
      "min": 0.1,
      "max": 1.5,
      "step": 0.1,
      "initial": 0.5,
      "unit": "L/min"
    },
    {
      "key": "feed",
      "label": "Concentración de alimentación",
      "min": 0.5,
      "max": 2,
      "step": 0.25,
      "initial": 1,
      "unit": "mol/L"
    }
  ],
  "readings": [
    {
      "key": "minutes",
      "label": "Tiempo físico",
      "unit": "min",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "concentration",
      "label": "Reactivo en el tanque",
      "unit": "mol/L",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "tau",
      "label": "Tiempo de residencia",
      "unit": "min",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Conversión estacionaria",
  "answerUnit": "%",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · química y balances",
      "url": "https://openstax.org/books/chemistry-2e/pages/1-introduction"
    }
  ],
  "concepts": [
    {
      "title": "Mezcla",
      "description": "La salida comparte concentración con el tanque."
    },
    {
      "title": "Residencia",
      "description": "V/Q fija una escala de transformación."
    },
    {
      "title": "Arranque",
      "description": "El transitorio no equivale al estado estacionario."
    }
  ],
  "quiz": [
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
  ]
},model:reactor};
export default definition;
