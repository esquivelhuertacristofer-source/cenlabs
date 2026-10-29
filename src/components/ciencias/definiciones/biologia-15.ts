import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {bioreactor} from '@/domain/ciencias/vida';
const definition:PracticaCiencia={...{
  "id": "biologia-15",
  "title": "Levadura en un biorreactor",
  "intro": "Un tanque aireado sostiene crecimiento; relacionar sustrato, oxígeno y productividad.",
  "mission": "Calcula la biomasa proyectada al cabo de 24 h bajo alimentación mantenida y oxígeno disponible.",
  "formula": "μ=0,20·S/(0,5+S)·fO2 h⁻¹. X(t)=0,5 exp(μt) g/L; S en g/L y fO2=oxígeno/100. Depósitos externos mantienen S y O2 constantes.",
  "limits": "Cultivo sintético de levadura en fase exponencial, sin limitación por productos ni muerte celular. No es un lote cerrado: las reservas sostienen las concentraciones. No predice un cultivo comercial.",
  "scale": "Biorreactor aireado en corte · 1 s visual = 2 h",
  "controls": [
    {
      "key": "substrate",
      "label": "Sustrato mantenido",
      "min": 0.1,
      "max": 4,
      "step": 0.1,
      "initial": 1,
      "unit": "g/L"
    },
    {
      "key": "oxygen",
      "label": "Disponibilidad relativa de oxígeno",
      "min": 20,
      "max": 100,
      "step": 5,
      "initial": 80,
      "unit": "%"
    }
  ],
  "readings": [
    {
      "key": "mu",
      "label": "Tasa específica",
      "unit": "h⁻¹",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "hours",
      "label": "Tiempo físico",
      "unit": "h",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "X",
      "label": "Biomasa",
      "unit": "g/L",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Biomasa proyectada a 24 h",
  "answerUnit": "g/L",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · biología",
      "url": "https://openstax.org/books/biology-2e/pages/1-introduction"
    }
  ],
  "concepts": [
    {
      "title": "Monod",
      "description": "La saturación limita la respuesta al sustrato."
    },
    {
      "title": "Oxígeno",
      "description": "Su disponibilidad modula el crecimiento."
    },
    {
      "title": "Operación",
      "description": "Reservas externas distinguen el banco de un lote cerrado."
    }
  ],
  "quiz": [
    {
      "pregunta": "A sustrato alto, μ se aproxima a…",
      "opciones": [
        "Un límite dependiente del oxígeno.",
        "Infinito.",
        "Cero siempre.",
        "La masa del agitador."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La fracción S/(Ks+S) tiende a uno."
    },
    {
      "pregunta": "Con μ constante, el crecimiento es…",
      "opciones": [
        "Exponencial.",
        "Siempre lineal.",
        "Siempre negativo.",
        "Independiente de X inicial."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "dX/dt=μX."
    },
    {
      "pregunta": "El banco conserva S constante porque…",
      "opciones": [
        "Declara una alimentación que lo repone.",
        "El consumo de sustrato no existe en seres vivos.",
        "La biomasa no necesita materia.",
        "El tiempo se detiene."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "No modela un lote cerrado."
    }
  ]
},model:bioreactor};
export default definition;
