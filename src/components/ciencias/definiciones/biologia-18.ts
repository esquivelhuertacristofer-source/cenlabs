import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {sarcomero} from '@/domain/ciencias/vida';
const definition:PracticaCiencia={...{
  "id": "biologia-18",
  "title": "Contracción muscular y sarcómeros",
  "intro": "Filamentos se deslizan; interpretar fuerza, longitud y consumo de energía.",
  "mission": "Calcula la fuerza isométrica del sarcómero para su longitud y activación dadas.",
  "formula": "Solapamiento relativo s=max[0,min(1,(3,6−L)/1,4,(L−1,2)/0,8)], L en µm. Fuerza F=120 s·a nN, activación a=%/100. Marcadores de puentes oscilan con el mismo reloj; la longitud isométrica no cambia.",
  "limits": "Curva longitud-tensión trapezoidal sintética, sin cinética de puentes detallada, elasticidad en serie, fatiga ni relación fuerza-velocidad. No es una medición de músculo humano.",
  "scale": "Filamentos ampliados · longitud isométrica fija",
  "controls": [
    {
      "key": "length",
      "label": "Longitud del sarcómero",
      "min": 1.2,
      "max": 3.6,
      "step": 0.1,
      "initial": 2.2,
      "unit": "µm"
    },
    {
      "key": "activation",
      "label": "Activación",
      "min": 10,
      "max": 100,
      "step": 5,
      "initial": 80,
      "unit": "%"
    }
  ],
  "readings": [
    {
      "key": "overlap",
      "label": "Solapamiento relativo",
      "unit": "",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "activation",
      "label": "Activación fraccional",
      "unit": "",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Fuerza isométrica",
  "answerUnit": "nN",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · contracción muscular",
      "url": "https://openstax.org/books/anatomy-and-physiology-2e/pages/10-3-muscle-fiber-contraction-and-relaxation"
    }
  ],
  "concepts": [
    {
      "title": "Filamentos",
      "description": "Actina y miosina mantienen sus longitudes."
    },
    {
      "title": "Solapamiento",
      "description": "El número de puentes posibles depende de L."
    },
    {
      "title": "Isometría",
      "description": "Se produce fuerza sin cambio de longitud global."
    }
  ],
  "quiz": [
    {
      "pregunta": "Durante deslizamiento, los filamentos…",
      "opciones": [
        "Conservan su longitud.",
        "Se consumen por completo.",
        "Se duplican cada ciclo.",
        "Se vuelven siempre más largos."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Cambia el solapamiento."
    },
    {
      "pregunta": "Isométrico significa…",
      "opciones": [
        "Longitud global constante.",
        "Fuerza siempre cero.",
        "Ausencia de ATP.",
        "Músculo sin filamentos."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Puede desarrollarse fuerza sin acortamiento."
    },
    {
      "pregunta": "Fuera del solapamiento útil, la fuerza activa…",
      "opciones": [
        "Disminuye.",
        "Aumenta sin límite.",
        "Es siempre máxima.",
        "Permanece máxima aunque los filamentos dejen de solaparse."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Hay menos puentes disponibles."
    }
  ]
},model:sarcomero};
export default definition;
