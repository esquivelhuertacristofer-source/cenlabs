import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {fibra} from '@/domain/ciencias/ondas';
const definition:PracticaCiencia={...{
  "id": "fisica-14",
  "title": "Fibra óptica: apertura, acoplamiento y pérdidas",
  "intro": "Haces guiados por el núcleo; medir aceptación y potencia transmitida con un modelo de pérdidas declarado.",
  "mission": "Calcula el semiángulo máximo de aceptación desde aire y decide si el rayo se guía.",
  "formula": "n1=1,48; NA=√(n1²−n2²); θacept=asin(NA), n0=1. Snell: θinterno=asin(sinθentrada/n1). TIR si π/2−θinterno≥asin(n2/n1).",
  "limits": "Óptica geométrica meridional de fibra recta ideal; no modos de Maxwell, pérdidas por curvatura ni dispersión. El rayo que incumple TIR se representa escapando.",
  "scale": "Fibra de índice escalonado · diámetros ampliados",
  "controls": [
    {
      "key": "cladding",
      "label": "Índice del revestimiento",
      "min": 1.4,
      "max": 1.47,
      "step": 0.005,
      "initial": 1.44,
      "unit": ""
    },
    {
      "key": "angle",
      "label": "Ángulo de entrada",
      "min": 5,
      "max": 40,
      "step": 1,
      "initial": 18,
      "unit": "°"
    }
  ],
  "readings": [
    {
      "key": "n1",
      "label": "Índice del núcleo",
      "unit": "",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "n2",
      "label": "Índice del revestimiento",
      "unit": "",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Semiángulo de aceptación",
  "answerUnit": "°",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · ondas y materia",
      "url": "https://openstax.org/books/university-physics-volume-3/pages/1-introduction"
    }
  ],
  "concepts": [
    {
      "title": "Reflexión total",
      "description": "Requiere incidencia por encima del ángulo crítico."
    },
    {
      "title": "Apertura numérica",
      "description": "Relaciona índices y cono de entrada."
    },
    {
      "title": "Refracción",
      "description": "El ángulo dentro del núcleo obedece a Snell."
    }
  ],
  "quiz": [
    {
      "pregunta": "Para guiar por TIR se necesita…",
      "opciones": [
        "n del núcleo mayor que n del revestimiento.",
        "Índices siempre iguales.",
        "Núcleo opaco.",
        "Revestimiento metálico obligatorio."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "El ángulo crítico existe al pasar de mayor a menor índice."
    },
    {
      "pregunta": "Acercar n2 a n1 hace que la apertura…",
      "opciones": [
        "Disminuya.",
        "Aumente sin límite.",
        "Sea siempre uno.",
        "Cambie de signo."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "NA=√(n1²−n2²)."
    },
    {
      "pregunta": "Superar el cono de aceptación puede causar…",
      "opciones": [
        "Pérdida de guiado.",
        "Mayor TIR garantizada.",
        "Creación de energía.",
        "Cambio de masa del fotón."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La incidencia en la interfaz deja de cumplir TIR."
    }
  ]
},model:fibra};
export default definition;
