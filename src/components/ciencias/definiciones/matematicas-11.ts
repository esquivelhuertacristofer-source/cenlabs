import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {vectores} from '@/domain/ciencias/decisiones';
const definition:PracticaCiencia={...{
  "id": "matematicas-11",
  "title": "Geometría vectorial 3D: rectas, planos y distancias",
  "intro": "Una pieza y referencias de CAD; calcular proyecciones, normales y separaciones.",
  "mission": "Calcula la distancia perpendicular del punto P al plano x+2y+2z=4.",
  "formula": "P=(x,y,3), n=(1,2,2), |n|=3. d=|n·P−4|/|n|; H=P−[(n·P−4)/|n|²]n.",
  "limits": "Geometría euclídea exacta en unidades de dibujo; pieza y rejilla son referencias CAD esquemáticas, sin error de medición ni tolerancias de fabricación.",
  "scale": "Espacio CAD · normal y proyección perpendicular",
  "controls": [
    {
      "key": "x",
      "label": "Coordenada X de P",
      "min": -2,
      "max": 4,
      "step": 0.25,
      "initial": 2,
      "unit": "u"
    },
    {
      "key": "y",
      "label": "Coordenada Y de P",
      "min": -1,
      "max": 3,
      "step": 0.25,
      "initial": 1,
      "unit": "u"
    }
  ],
  "readings": [
    {
      "key": "x",
      "label": "P.x",
      "unit": "u",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "y",
      "label": "P.y",
      "unit": "u",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "z",
      "label": "P.z",
      "unit": "u",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "dot",
      "label": "n·P−4",
      "unit": "u",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Distancia perpendicular",
  "answerUnit": "u",
  "tolerance": 0.03,
  "source": [
    {
      "name": "NIST · manual de estadística",
      "url": "https://www.itl.nist.gov/div898/handbook/"
    }
  ],
  "concepts": [
    {
      "title": "Normal",
      "description": "El vector n es perpendicular al plano."
    },
    {
      "title": "Proyección",
      "description": "El pie H pertenece al plano."
    },
    {
      "title": "Distancia",
      "description": "La longitud perpendicular es la mínima."
    }
  ],
  "quiz": [
    {
      "pregunta": "Para calcular distancia se divide por…",
      "opciones": [
        "La norma de la normal.",
        "La norma al cubo.",
        "La suma de coordenadas de P.",
        "El cuadrado de la norma de la normal."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Se normaliza n."
    },
    {
      "pregunta": "El pie H satisface…",
      "opciones": [
        "La ecuación del plano.",
        "Siempre H=P.",
        "H=0 necesariamente.",
        "Una órbita circular."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "H es la proyección ortogonal."
    },
    {
      "pregunta": "Multiplicar toda la ecuación del plano por dos…",
      "opciones": [
        "Conserva el plano y la distancia.",
        "Duplica la distancia.",
        "Cambia el plano.",
        "Anula su normal."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Numerador y denominador escalan juntos."
    }
  ]
},model:vectores};
export default definition;
