import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {weibull} from '@/domain/ciencias/decisiones';
const definition:PracticaCiencia={...{
  "id": "matematicas-17",
  "title": "Confiabilidad Weibull y datos censurados",
  "intro": "Componentes envejecen en un banco virtual; estimar supervivencia y reconocer observaciones incompletas.",
  "mission": "Calcula la supervivencia al finalizar el ensayo y distingue supervivientes de fallas observadas.",
  "formula": "R(t)=exp[−(t/η)^β], η=1200 h; h(t)=(β/η)(t/η)^(β−1). Los componentes se ilustran con cuantiles deterministas de la Weibull; los que sobreviven al corte son censurados por la derecha.",
  "limits": "Distribución de banco con parámetros conocidos, sin estimación MLE ni mecanismos competitivos. Censurar no equivale a fallar ni a demostrar vida infinita.",
  "scale": "Banco de vida acelerada virtual · corte de observación",
  "controls": [
    {
      "key": "shape",
      "label": "Parámetro de forma β",
      "min": 0.7,
      "max": 3.5,
      "step": 0.1,
      "initial": 2,
      "unit": ""
    },
    {
      "key": "hours",
      "label": "Duración del ensayo",
      "min": 200,
      "max": 2400,
      "step": 100,
      "initial": 1000,
      "unit": "h"
    }
  ],
  "readings": [
    {
      "key": "time",
      "label": "Tiempo de corte",
      "unit": "h",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "hazard",
      "label": "Tasa de riesgo instantánea",
      "unit": "h⁻¹",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Supervivencia al corte",
  "answerUnit": "%",
  "tolerance": 0.03,
  "source": [
    {
      "name": "NIST · censura",
      "url": "https://itl.nist.gov/div898/handbook/apr/section1/apr131.htm"
    }
  ],
  "concepts": [
    {
      "title": "Forma",
      "description": "β distingue riesgo creciente o decreciente."
    },
    {
      "title": "Escala",
      "description": "η es el tiempo de supervivencia e⁻¹."
    },
    {
      "title": "Censura",
      "description": "Un superviviente sólo informa que su vida excede el corte."
    }
  ],
  "quiz": [
    {
      "pregunta": "Un equipo censurado por la derecha…",
      "opciones": [
        "Sigue vivo al terminar la observación.",
        "Falló exactamente en el corte.",
        "Nunca fallará.",
        "Debe eliminarse sin registrar."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Se conoce una cota inferior de su vida."
    },
    {
      "pregunta": "Si β>1, la tasa de riesgo…",
      "opciones": [
        "Crece con el tiempo.",
        "Es siempre cero.",
        "Disminuye siempre.",
        "Es negativa."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "h∝t^(β−1)."
    },
    {
      "pregunta": "En t=η, R(t) vale…",
      "opciones": [
        "e⁻¹.",
        "1.",
        "0.",
        "η."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "El exponente es −1."
    }
  ]
},model:weibull};
export default definition;
