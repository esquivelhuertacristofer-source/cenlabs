import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {aleacion} from '@/domain/ciencias/procesos';
const definition:PracticaCiencia={...{
  "id": "quimica-24",
  "title": "Diagramas de fases y solidificación de aleaciones",
  "intro": "Una muestra cambia de fases al enfriarse; aplicar balances y regla de la palanca.",
  "mission": "Aplica la regla de la palanca y calcula la fracción másica sólida de la aleación.",
  "formula": "Diagrama binario isomorfo sintético: Tsolidus=1000−4C, Tliquidus=1000−2C, T en °C y C en %B. A T fija: Cα=(1000−T)/4 y CL=(1000−T)/2. fs=(CL−C0)/(CL−Cα), limitada a [0,1].",
  "limits": "Sistema docente, no diagrama medido de una aleación comercial. Equilibrio local, densidades iguales para representar volúmenes, sin segregación, sobreenfriamiento ni cinética de granos. Los poliedros representan la fase sólida de forma esquemática; no hay un modelo de nucleación ni una microestructura resuelta.",
  "scale": "Muestra metalográfica ampliada · diagrama binario sintético",
  "controls": [
    {
      "key": "temperature",
      "label": "Temperatura de equilibrio",
      "min": 760,
      "max": 920,
      "step": 10,
      "initial": 840,
      "unit": "°C"
    },
    {
      "key": "composition",
      "label": "Composición global de B",
      "min": 20,
      "max": 60,
      "step": 5,
      "initial": 50,
      "unit": "%"
    }
  ],
  "readings": [
    {
      "key": "solid",
      "label": "Composición de fase sólida",
      "unit": "%B",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "liquid",
      "label": "Composición de fase líquida",
      "unit": "%B",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "composition",
      "label": "Composición global",
      "unit": "%B",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Fracción sólida",
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
      "title": "Equilibrio",
      "description": "Una isoterma une las composiciones coexistentes."
    },
    {
      "title": "Palanca",
      "description": "Las fracciones salen del balance global."
    },
    {
      "title": "Microestructura",
      "description": "Una imagen representa fracciones, no cinética real."
    }
  ],
  "quiz": [
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
  ]
},model:aleacion};
export default definition;
