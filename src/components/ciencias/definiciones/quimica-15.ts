import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {deposito} from '@/domain/ciencias/procesos';
const definition:PracticaCiencia={...{
  "id": "quimica-15",
  "title": "Electrodeposición: corriente, masa y espesor",
  "intro": "Un recubrimiento crece sobre una pieza; contrastar la ley de Faraday con rendimiento de corriente.",
  "mission": "Obtén el espesor medio de cobre depositado sobre una superficie de 100 cm².",
  "formula": "m=ηItM/(zF), MCu=63,546 g/mol, z=2, F=96485,33212 C/mol; δ=m/(ρA), ρCu=8,96 g/cm³, A=100 cm². El tiempo se convierte a segundos y δ a µm.",
  "limits": "Depósito uniforme y eficiencia constante impuesta; no distribución de corriente, difusión, aditivos, rugosidad ni acabado de un baño industrial específico.",
  "scale": "Celda en corte · espesor amplificado · carga conservada",
  "controls": [
    {
      "key": "current",
      "label": "Corriente",
      "min": 0.5,
      "max": 4,
      "step": 0.25,
      "initial": 2,
      "unit": "A"
    },
    {
      "key": "minutes",
      "label": "Tiempo de depósito",
      "min": 10,
      "max": 60,
      "step": 5,
      "initial": 30,
      "unit": "min"
    },
    {
      "key": "efficiency",
      "label": "Rendimiento de corriente",
      "min": 80,
      "max": 100,
      "step": 5,
      "initial": 90,
      "unit": "%"
    }
  ],
  "readings": [
    {
      "key": "mass",
      "label": "Cobre depositado",
      "unit": "g",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "charge",
      "label": "Carga transferida",
      "unit": "C",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "area",
      "label": "Superficie",
      "unit": "cm²",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Espesor medio",
  "answerUnit": "µm",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · electrólisis",
      "url": "https://openstax.org/books/chemistry-2e/pages/17-7-electrolysis"
    }
  ],
  "concepts": [
    {
      "title": "Carga",
      "description": "I por t cuantifica electrones transferidos."
    },
    {
      "title": "Rendimiento",
      "description": "No toda la corriente deposita metal."
    },
    {
      "title": "Espesor",
      "description": "Masa y área determinan el recubrimiento medio."
    }
  ],
  "quiz": [
    {
      "pregunta": "Duplicar el área a masa fija hace el espesor…",
      "opciones": [
        "La mitad.",
        "El doble.",
        "Cuatro veces mayor.",
        "Siempre cero."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "δ=m/(ρA)."
    },
    {
      "pregunta": "Rendimiento menor al 100% implica…",
      "opciones": [
        "Reacciones secundarias consumen parte de la carga.",
        "Creación de cobre sin carga.",
        "Densidad negativa.",
        "Ausencia de electrones."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "η representa la fracción útil de corriente."
    },
    {
      "pregunta": "Cu²⁺ requiere por átomo depositado…",
      "opciones": [
        "Dos electrones.",
        "Un protón.",
        "Cuatro electrones obligatoriamente.",
        "Ninguna transferencia."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "El número de oxidación es +2."
    }
  ]
},model:deposito};
export default definition;
