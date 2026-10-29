import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {giroscopio} from '@/domain/ciencias/ondas';
const definition:PracticaCiencia={...{
  "id": "fisica-24",
  "title": "Giroscopio: momento angular y precesión",
  "intro": "Un rotor responde a un par; medir precesión y reconocer los límites del régimen estacionario.",
  "mission": "Calcula la velocidad angular de precesión lenta del giroscopio sostenido por un extremo.",
  "formula": "Disco uniforme m=0,40 kg, r=0,10 m; I=mr²/2; ω=2πrpm/60; τ=mgℓ; Ω=τ/(Iω).",
  "limits": "Precesión estacionaria lenta con eje casi horizontal; omite nutación, fricción y desequilibrio. La rotación del disco se ralentiza ×1/20; la precesión mantiene su reloj.",
  "scale": "Giroscopio cardánico · giro ×1/20 · precesión real",
  "controls": [
    {
      "key": "rpm",
      "label": "Régimen del rotor",
      "min": 600,
      "max": 3000,
      "step": 100,
      "initial": 1800,
      "unit": "rpm"
    },
    {
      "key": "arm",
      "label": "Brazo del centro de masa",
      "min": 2,
      "max": 8,
      "step": 0.5,
      "initial": 5,
      "unit": "cm"
    }
  ],
  "readings": [
    {
      "key": "I",
      "label": "Inercia axial",
      "unit": "kg·m²",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "torque",
      "label": "Momento gravitatorio",
      "unit": "N·m",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "omega",
      "label": "Giro físico",
      "unit": "rad/s",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Velocidad de precesión",
  "answerUnit": "rad/s",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · ondas y materia",
      "url": "https://openstax.org/books/university-physics-volume-3/pages/1-introduction"
    }
  ],
  "concepts": [
    {
      "title": "Momento angular",
      "description": "El rotor almacena Iω."
    },
    {
      "title": "Torque",
      "description": "La gravedad cambia la dirección del momento angular."
    },
    {
      "title": "Precesión",
      "description": "Su rapidez es inversa al giro en el límite lento."
    }
  ],
  "quiz": [
    {
      "pregunta": "Duplicar rpm en el modelo hace Ω…",
      "opciones": [
        "La mitad.",
        "El doble.",
        "Cuatro veces mayor.",
        "Cero necesariamente."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Ω=τ/(Iω)."
    },
    {
      "pregunta": "La dirección del momento angular cambia por…",
      "opciones": [
        "El torque externo.",
        "Un torque paralelo a L que sólo aumenta su magnitud.",
        "Conservación de la dirección de L en ausencia de torque externo.",
        "La ausencia de gravedad."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "dL/dt=τ."
    },
    {
      "pregunta": "¿Qué comportamiento no se resuelve aquí?",
      "opciones": [
        "Nutación transitoria.",
        "Precesión lenta.",
        "Momento de un disco.",
        "Conversión rpm a rad/s."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La aproximación es estacionaria."
    }
  ]
},model:giroscopio};
export default definition;
