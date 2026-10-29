import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {cuerda} from '@/domain/ciencias/ondas';
const definition:PracticaCiencia={...{
  "id": "fisica-11",
  "title": "Ondas en una cuerda: reflexión y transmisión",
  "intro": "Pulsos que se reflejan al cambiar de medio; medir velocidades y reparto de energía.",
  "mission": "Calcula el porcentaje de energía reflejada en la unión de dos cuerdas bajo la misma tensión.",
  "formula": "μ1=0,003 kg/m, μ2=razón·μ1; ci=√(T/μi), Zi=√(Tμi). r=(Z1−Z2)/(Z1+Z2), tA=1+r. R=r² y Tenergía=1−R. Pulsos gaussianos de desplazamiento; el ancho transmitido escala c2/c1 para conservar duración.",
  "limits": "Cuerdas ideales semiinfinitas con unión puntual, pequeña amplitud, sin pérdidas ni rigidez. Se muestra una ventana espacial y un tren de pulsos sin reflejos en sus límites externos.",
  "scale": "Pulsos en unión · tiempo ×1/220 · amplitud ampliada",
  "controls": [
    {
      "key": "tension",
      "label": "Tensión común",
      "min": 3,
      "max": 24,
      "step": 1,
      "initial": 12,
      "unit": "N"
    },
    {
      "key": "ratio",
      "label": "Razón μ2/μ1",
      "min": 0.25,
      "max": 4,
      "step": 0.25,
      "initial": 2,
      "unit": ""
    }
  ],
  "readings": [
    {
      "key": "speed",
      "label": "Velocidad en cuerda 1",
      "unit": "m/s",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "speed2",
      "label": "Velocidad en cuerda 2",
      "unit": "m/s",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "mu1",
      "label": "Densidad lineal 1",
      "unit": "kg/m",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "mu2",
      "label": "Densidad lineal 2",
      "unit": "kg/m",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Energía reflejada",
  "answerUnit": "%",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · ondas y materia",
      "url": "https://openstax.org/books/university-physics-volume-3/pages/1-introduction"
    }
  ],
  "concepts": [
    {
      "title": "Impedancia",
      "description": "La unión de impedancias distintas refleja parte del pulso."
    },
    {
      "title": "Inversión",
      "description": "Un destino más denso invierte el pulso reflejado."
    },
    {
      "title": "Conservación",
      "description": "R más T suma uno en ausencia de pérdidas."
    }
  ],
  "quiz": [
    {
      "pregunta": "Si μ1=μ2, la reflexión es…",
      "opciones": [
        "Cero.",
        "Total.",
        "Siempre 50%.",
        "Negativa en energía."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "No hay contraste de impedancia."
    },
    {
      "pregunta": "Al pasar a una cuerda más densa, el pulso reflejado…",
      "opciones": [
        "Se invierte.",
        "Siempre conserva signo.",
        "Tiene energía negativa.",
        "Se vuelve una onda electromagnética."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "r es negativo cuando Z2>Z1."
    },
    {
      "pregunta": "La suma de fracciones de energía R y T idealmente es…",
      "opciones": [
        "Uno.",
        "Dos.",
        "Cero.",
        "La tensión en newtons."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Se conserva el flujo de energía."
    }
  ]
},model:cuerda};
export default definition;
