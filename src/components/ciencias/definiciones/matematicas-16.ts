import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {muestreo} from '@/domain/ciencias/decisiones';
const definition:PracticaCiencia={...{
  "id": "matematicas-16",
  "title": "Muestreo de aceptación de lotes",
  "intro": "Se inspecciona una muestra de piezas; calcular riesgos de aceptación y rechazo.",
  "mission": "Calcula la probabilidad de aceptar un lote con el plan n,c=2 y tasa de defectos indicada.",
  "formula": "X~Binomial(n,p), c=2. Pac=Σk=0…2 C(n,k)p^k(1−p)^(n−k). Se acepta si hay como máximo dos defectos en la muestra.",
  "limits": "Lote grande con muestreo aproximadamente independiente y p conocida del banco. Para lotes pequeños sin reemplazo corresponde una hipergeométrica. No garantiza ausencia de defectos en un lote aceptado.",
  "scale": "Lote virtual · muestra aleatoria ideal · c=2",
  "controls": [
    {
      "key": "sample",
      "label": "Tamaño de muestra",
      "min": 10,
      "max": 100,
      "step": 5,
      "initial": 40,
      "unit": "piezas"
    },
    {
      "key": "defects",
      "label": "Tasa de defectos del lote",
      "min": 0.5,
      "max": 15,
      "step": 0.5,
      "initial": 5,
      "unit": "%"
    }
  ],
  "readings": [
    {
      "key": "n",
      "label": "Tamaño de muestra",
      "unit": "",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "p",
      "label": "Probabilidad de defecto",
      "unit": "",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "c",
      "label": "Máximo aceptado",
      "unit": "",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Probabilidad de aceptación",
  "answerUnit": "%",
  "tolerance": 0.03,
  "source": [
    {
      "name": "NIST · muestreo de aceptación",
      "url": "https://www.itl.nist.gov/div898/handbook/pmc/section2/pmc21.htm"
    }
  ],
  "concepts": [
    {
      "title": "Plan",
      "description": "n y c definen la regla de decisión."
    },
    {
      "title": "Riesgo",
      "description": "Un lote malo puede aceptarse por azar."
    },
    {
      "title": "Modelo",
      "description": "La independencia permite la binomial."
    }
  ],
  "quiz": [
    {
      "pregunta": "Con c=2 se acepta una muestra con…",
      "opciones": [
        "Dos defectos o menos.",
        "Exactamente tres.",
        "Cualquier cantidad.",
        "Sólo cero siempre."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La regla usa X≤c."
    },
    {
      "pregunta": "Aceptar un lote demuestra que está libre de defectos…",
      "opciones": [
        "No.",
        "Sí.",
        "Sí, por ser aleatorio.",
        "Sí, si n es par."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Siempre existe riesgo estadístico."
    },
    {
      "pregunta": "Para un lote pequeño sin reemplazo conviene…",
      "opciones": [
        "La distribución hipergeométrica.",
        "Suponer infinitas piezas.",
        "La ley de Ohm.",
        "Una masa negativa."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Las extracciones dejan de ser independientes."
    }
  ]
},model:muestreo};
export default definition;
