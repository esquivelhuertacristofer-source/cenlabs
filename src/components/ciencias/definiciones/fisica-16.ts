import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {conduccion} from '@/domain/ciencias/ondas';
const definition:PracticaCiencia={...{
  "id": "fisica-16",
  "title": "Conducción térmica multicapa y resistencias de contacto",
  "intro": "Un sándwich de materiales se calienta; comparar flujo y saltos de temperatura en interfaces.",
  "mission": "Calcula el flujo térmico por unidad de área a través de las dos capas en serie.",
  "formula": "q″=(80−20)/(L1/k1+L2/k2); L2=0,040 m, k2=0,12 W/(m·K). Tinterfaz=80−q″L1/k1.",
  "limits": "Régimen estacionario 1D; propiedades constantes, contacto perfecto y caras a temperatura impuesta. Sin convección lateral ni puentes térmicos.",
  "scale": "Pared multicapa en corte · temperaturas de 20 a 80 °C",
  "controls": [
    {
      "key": "thickness",
      "label": "Espesor de primera capa",
      "min": 10,
      "max": 80,
      "step": 5,
      "initial": 40,
      "unit": "mm"
    },
    {
      "key": "conductivity",
      "label": "Conductividad de primera capa",
      "min": 0.15,
      "max": 1.5,
      "step": 0.05,
      "initial": 0.6,
      "unit": "W/(m·K)"
    }
  ],
  "readings": [
    {
      "key": "hot",
      "label": "Cara caliente",
      "unit": "°C",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "cold",
      "label": "Cara fría",
      "unit": "°C",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "interfaceT",
      "label": "Interfaz",
      "unit": "°C",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Flujo térmico superficial",
  "answerUnit": "W/m²",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · ondas y materia",
      "url": "https://openstax.org/books/university-physics-volume-3/pages/1-introduction"
    }
  ],
  "concepts": [
    {
      "title": "Resistencia",
      "description": "Las resistencias por unidad de área se suman."
    },
    {
      "title": "Continuidad",
      "description": "El flujo estacionario es igual en ambas capas."
    },
    {
      "title": "Espesor",
      "description": "Una capa más gruesa aumenta resistencia."
    }
  ],
  "quiz": [
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
  ]
},model:conduccion};
export default definition;
