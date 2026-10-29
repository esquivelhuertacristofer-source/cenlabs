import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {golpe} from '@/domain/ciencias/ondas';
const definition:PracticaCiencia={...{
  "id": "fisica-19",
  "title": "Golpe de ariete: una válvula genera una onda de presión",
  "intro": "Una onda recorre una conducción; relacionar cierre, propagación y sobrepresión.",
  "mission": "Estima la sobrepresión causada por el cierre de una válvula y distingue cierre rápido de lento.",
  "formula": "ρ=998 kg/m³, a=1200 m/s, L=80 m. tc=2L/a. ΔP=ρaU min(1,tc/tcierre). Para cierre lento es la aproximación lineal de Michaud; para rápido, Joukowsky.",
  "limits": "Tubería uniforme y cierre idealizado. La escena muestra frentes característicos; no resuelve MOC completo, cavitación, pérdidas ni interacciones de una red.",
  "scale": "Frente de presión 1D · onda ralentizada",
  "controls": [
    {
      "key": "velocity",
      "label": "Velocidad inicial",
      "min": 0.2,
      "max": 2,
      "step": 0.1,
      "initial": 1,
      "unit": "m/s"
    },
    {
      "key": "closing",
      "label": "Tiempo de cierre",
      "min": 0.02,
      "max": 0.6,
      "step": 0.02,
      "initial": 0.08,
      "unit": "s"
    }
  ],
  "readings": [
    {
      "key": "critical",
      "label": "Tiempo de ida y vuelta",
      "unit": "s",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "a",
      "label": "Velocidad de onda",
      "unit": "m/s",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "rho",
      "label": "Densidad",
      "unit": "kg/m³",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Sobrepresión estimada",
  "answerUnit": "MPa",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · ondas y materia",
      "url": "https://openstax.org/books/university-physics-volume-3/pages/1-introduction"
    }
  ],
  "concepts": [
    {
      "title": "Cierre rápido",
      "description": "Activa el límite de Joukowsky."
    },
    {
      "title": "Tiempo característico",
      "description": "La onda recorre dos veces la longitud."
    },
    {
      "title": "Diseño",
      "description": "Una estimación no reemplaza el cálculo de una red."
    }
  ],
  "quiz": [
    {
      "pregunta": "Joukowsky predice ΔP proporcional a…",
      "opciones": [
        "La variación de velocidad.",
        "El cuadrado del área siempre.",
        "La inversa de la variación de velocidad.",
        "El tiempo de cierre al cuadrado en el límite de cierre rápido."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "ΔP=ρaΔU."
    },
    {
      "pregunta": "Un cierre lento frente a 2L/a…",
      "opciones": [
        "Reduce la sobrepresión del modelo.",
        "La hace infinita.",
        "No influye nunca.",
        "Crea un vacío absoluto obligatorio."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La corrección tc/tcierre reduce el salto."
    },
    {
      "pregunta": "¿Qué fenómeno exige un análisis adicional?",
      "opciones": [
        "Cavitación.",
        "Conversión de Pa a MPa.",
        "Medición de L.",
        "Conversión de segundos."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "El modelo lineal no representa cavitación."
    }
  ]
},model:golpe};
export default definition;
