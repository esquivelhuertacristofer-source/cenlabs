import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {bayes} from '@/domain/ciencias/decisiones';
const definition:PracticaCiencia={...{
  "id": "matematicas-22",
  "title": "Bayes en inspección: defectos y falsas alarmas",
  "intro": "Lotes atraviesan un detector; distinguir sensibilidad, tasa base y probabilidad posterior.",
  "mission": "Calcula la probabilidad de defecto entre las piezas que activan la alarma.",
  "formula": "P(D)=prevalencia, sensibilidad P(+|D)=0,95, falsa alarma P(+|¬D)=f. P(D|+)=0,95p/[0,95p+f(1−p)]. Conteos esperados sobre 10.000 piezas.",
  "limits": "Clasificación industrial binaria con tasas conocidas y estables; conteos esperados, no diagnóstico médico ni predicción de un detector real.",
  "scale": "Inspección industrial · flujo de positivos verdaderos y falsos",
  "controls": [
    {
      "key": "prevalence",
      "label": "Tasa base de defectos",
      "min": 0.5,
      "max": 15,
      "step": 0.5,
      "initial": 2,
      "unit": "%"
    },
    {
      "key": "falsePositive",
      "label": "Falsa alarma sobre piezas conformes",
      "min": 0.5,
      "max": 10,
      "step": 0.5,
      "initial": 5,
      "unit": "%"
    }
  ],
  "readings": [
    {
      "key": "TP",
      "label": "Positivos verdaderos esperados",
      "unit": "",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "FP",
      "label": "Falsos positivos esperados",
      "unit": "",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "sensitivity",
      "label": "Sensibilidad",
      "unit": "",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Defecto dado alarma",
  "answerUnit": "%",
  "tolerance": 0.03,
  "source": [
    {
      "name": "NIST · manual de estadística",
      "url": "https://www.itl.nist.gov/div898/handbook/"
    }
  ],
  "concepts": [
    {
      "title": "Condicional",
      "description": "P(D|+) difiere de P(+|D)."
    },
    {
      "title": "Tasa base",
      "description": "Los defectos raros pueden producir baja precisión positiva."
    },
    {
      "title": "Falsa alarma",
      "description": "Muchos conformes pueden dominar las alarmas."
    }
  ],
  "quiz": [
    {
      "pregunta": "Sensibilidad significa…",
      "opciones": [
        "P(alarma|defecto).",
        "P(defecto|alarma) siempre.",
        "P(defecto) sin condición.",
        "P(alarma|conforme)."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La condición son piezas defectuosas."
    },
    {
      "pregunta": "Con defectos muy raros, las alarmas pueden ser…",
      "opciones": [
        "Mayormente falsas aunque la sensibilidad sea alta.",
        "Siempre verdaderas.",
        "Imposibles.",
        "Independientes de la tasa base."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Hay muchos más conformes disponibles para falsas alarmas."
    },
    {
      "pregunta": "El denominador de Bayes cuenta…",
      "opciones": [
        "Todas las alarmas.",
        "Sólo defectos.",
        "Sólo piezas rechazadas por tamaño.",
        "Sólo conformes sin alarma."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Incluye positivos verdaderos y falsos."
    }
  ]
},model:bayes};
export default definition;
