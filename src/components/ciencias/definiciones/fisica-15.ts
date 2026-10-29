import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {acustica} from '@/domain/ciencias/ondas';
const definition:PracticaCiencia={previewTime:0,previewPaused:true,...{
  "id": "fisica-15",
  "title": "Acústica de una sala: absorción y reverberación",
  "intro": "Un pulso atraviesa una sala con paneles; medir decaimiento y evaluar acondicionamiento.",
  "mission": "Estima el tiempo de reverberación RT60 de la sala y contrástalo con el decaimiento registrado.",
  "formula": "Sabine: RT60=0,161V/A, V=120 m³, A=148α+8 m² sabin. E/E0=10^(−6t/RT60). Registro: 6 s visuales equivalen a 3 s de decaimiento.",
  "limits": "Campo difuso ideal con absorción media independiente de frecuencia; no modos de sala, transmisión a recintos vecinos ni predicción arquitectónica certificada. Los puntos representan la energía relativa de un campo difuso uniforme, no frentes de onda ni trayectorias de sonido. Su opacidad se escala linealmente entre0 y−60dB para hacer visible el decaimiento. Emitir pulso repite la demostración sin registrar datos.",
  "scale": "Campo preparado · Emitir pulso inicia el decaimiento · energía difusa logarítmica · tiempo ×1/2",
  "controls": [
    {
      "key": "absorption",
      "label": "Absorción media de superficies",
      "min": 0.05,
      "max": 0.65,
      "step": 0.025,
      "initial": 0.2,
      "unit": ""
    }
  ],
  "readings": [
    {
      "key": "physical",
      "label": "Tiempo acústico",
      "unit": "s",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "decibels",
      "label": "Decaimiento energético",
      "unit": "dB",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "absorption",
      "label": "Área de absorción equivalente",
      "unit": "m²",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "RT60",
  "answerUnit": "s",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · ondas y materia",
      "url": "https://openstax.org/books/university-physics-volume-3/pages/1-introduction"
    }
  ],
  "concepts": [
    {
      "title": "Reverberación",
      "description": "Es el decaimiento posterior al cese de la fuente."
    },
    {
      "title": "Absorción",
      "description": "Área y coeficiente producen sabines."
    },
    {
      "title": "Decibel",
      "description": "Una escala logarítmica describe grandes razones de energía."
    }
  ],
  "quiz": [
    {
      "pregunta": "RT60 corresponde a una caída de…",
      "opciones": [
        "60 dB.",
        "6 dB.",
        "60 Pa.",
        "60 Hz."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Se define por una reducción energética de 10⁶."
    },
    {
      "pregunta": "Añadir absorción reduce RT60 porque…",
      "opciones": [
        "A está en el denominador.",
        "El volumen se vuelve negativo.",
        "La frecuencia deja de existir.",
        "La fuente gana potencia."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Sabine predice RT inverso al área absorbente."
    },
    {
      "pregunta": "¿Qué limita este banco?",
      "opciones": [
        "Supone un campo difuso.",
        "Resuelve cada modo arquitectónico real.",
        "Certifica cualquier sala.",
        "Mide aislamiento entre edificios."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La hipótesis difusa no resuelve geometría ondulatoria completa."
    }
  ]
},model:acustica};
export default definition;
