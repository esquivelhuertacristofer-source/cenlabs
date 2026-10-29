import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {espectrometro} from '@/domain/ciencias/ondas';
const definition:PracticaCiencia={...{
  "id": "fisica-21",
  "title": "Espectrómetro de masas: separar por carga y masa",
  "intro": "Iones recorren trayectorias curvas; identificar relaciones masa/carga mediante campos conocidos.",
  "mission": "Deduce la masa del ion monovalente a partir del radio de su trayectoria.",
  "formula": "qV=mv²/2; qvB=mv²/r; m=qB²r²/(2V). q=e=1,602176634·10⁻¹⁹ C; 1 u=1,66053906892·10⁻²⁷ kg.",
  "limits": "Ion positivo con una sola carga, entrada perpendicular a B y energía inicial despreciable. Sin dispersión energética, colisiones ni resolución instrumental finita. La trayectoria se amplía uniformemente y el polo superior se muestra transparente para inspección. Los marcadores de iones avanzan con velocidad angular v/r a una escala temporal de10⁻⁶; no se representan colisiones ni conteos absolutos.",
  "scale": "Iones: cámara lenta ×1/10⁶ · polo superior transparente · radio físico en la bitácora",
  "controls": [
    {
      "key": "voltage",
      "label": "Potencial acelerador",
      "min": 500,
      "max": 2500,
      "step": 100,
      "initial": 1200,
      "unit": "V"
    },
    {
      "key": "field",
      "label": "Campo magnético",
      "min": 0.1,
      "max": 0.35,
      "step": 0.025,
      "initial": 0.2,
      "unit": "T"
    }
  ],
  "readings": [
    {
      "key": "radius",
      "label": "Radio medido",
      "unit": "m",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "voltage",
      "label": "Potencial",
      "unit": "V",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "field",
      "label": "Campo",
      "unit": "T",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Masa del ion",
  "answerUnit": "u",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · ondas y materia",
      "url": "https://openstax.org/books/university-physics-volume-3/pages/1-introduction"
    }
  ],
  "concepts": [
    {
      "title": "Aceleración",
      "description": "El potencial fija la energía cinética."
    },
    {
      "title": "Lorentz",
      "description": "B curva la trayectoria sin realizar trabajo."
    },
    {
      "title": "Identificación",
      "description": "La curva depende de m/q."
    }
  ],
  "quiz": [
    {
      "pregunta": "A energía fija, aumentar B hace el radio…",
      "opciones": [
        "Menor.",
        "Mayor.",
        "Infinito.",
        "Siempre idéntico."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "r=√(2mV/q)/B."
    },
    {
      "pregunta": "La fuerza magnética ideal cambia…",
      "opciones": [
        "La dirección de la velocidad.",
        "La energía cinética directamente.",
        "La masa del ion.",
        "Su carga elemental."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Es perpendicular a v."
    },
    {
      "pregunta": "Sin conocer el estado de carga se determina…",
      "opciones": [
        "La relación masa/carga.",
        "La masa de forma única.",
        "El número de neutrones exacto.",
        "La composición química completa."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La trayectoria depende de m/q."
    }
  ]
},model:espectrometro};
export default definition;
