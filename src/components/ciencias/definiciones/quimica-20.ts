import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {curado} from '@/domain/ciencias/quimica';
const definition:PracticaCiencia={...{
  "id": "quimica-20",
  "title": "Polimerización y curado: de monómeros a una red",
  "intro": "Una red molecular se forma; relacionar conversión, tiempo y evolución térmica.",
  "mission": "Calcula el porcentaje de conversión al terminar el tratamiento isotérmico y contrástalo con los grupos reactivos restantes.",
  "formula": "Modelo de primer orden: dα/dt=k(1−α), α=1−exp(−kt), k=10⁷exp(−55000/(RT)) min⁻¹, R=8,314462618 J/mol/K. Masa0,1 kg yentalpía de curado300 kJ/kg: Q=30000α J. En baño isotérmico, potencia retirada=30000k(1−α)/60 W. Los6 s de visualización recorren el tiempo de tratamiento seleccionado.",
  "limits": "Constantes sintéticas; sin autocatalisis, vitrificación, difusión, gelificación por teoría de redes o propiedades mecánicas predictivas. El baño mantiene T yretira el calor; no se representa una subida adiabática de temperatura. Enlaces ymonómeros son una ilustración del avance de conversión, no dinámica molecular ni molécula comercial.",
  "scale": "Baño isotérmico · ventana física comprimida a6 s · red molecular ilustrativa",
  "controls": [
    {
      "key": "temperature",
      "label": "Temperatura de curado",
      "min": 40,
      "max": 90,
      "step": 2,
      "unit": "°C",
      "initial": 60
    },
    {
      "key": "minutes",
      "label": "Tiempo de tratamiento",
      "min": 5,
      "max": 60,
      "step": 1,
      "unit": "min",
      "initial": 25
    }
  ],
  "readings": [
    {
      "key": "remaining",
      "label": "Grupos reactivos restantes",
      "unit": "%",
      "scale": 100,
      "digits": 5
    },
    {
      "key": "physicalMinutes",
      "label": "Tiempo de tratamiento transcurrido",
      "unit": "min",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "power",
      "label": "Calor extraído por el baño",
      "unit": "W",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Conversión final",
  "answerUnit": "%",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · cinética integrada",
      "url": "https://openstax.org/books/chemistry/pages/12-4-integrated-rate-laws"
    },
    {
      "name": "OpenStax · Arrhenius",
      "url": "https://openstax.org/books/chemistry/pages/12-5-collision-theory"
    }
  ],
  "concepts": [
    {
      "title": "Conversión",
      "description": "Fracción de grupos iniciales que ha reaccionado."
    },
    {
      "title": "Temperatura",
      "description": "Cambia la constante cinética mediante Arrhenius."
    },
    {
      "title": "Balance térmico",
      "description": "Mantener T requiere retirar el calor liberado."
    }
  ],
  "quiz": [
    {
      "pregunta": "¿Qué fracción de grupos queda sin reaccionar en primer orden?",
      "opciones": [
        "exp(−kt).",
        "kt para cualquier tiempo.",
        "1+kt.",
        "Siempre exactamente0,5."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La solución integrada describe decaimiento exponencial."
    },
    {
      "pregunta": "¿Qué ocurre al aumentar T con Ea positiva?",
      "opciones": [
        "Aumenta k.",
        "Disminuye siempre k.",
        "La temperatura Celsius entra directamente en el exponente.",
        "El tiempo deja de importar."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Arrhenius utiliza temperatura absoluta en kelvin."
    },
    {
      "pregunta": "¿Por qué la muestra no se calienta adiabáticamente en este banco?",
      "opciones": [
        "El baño retira calor y mantiene la temperatura.",
        "Porque la reacción no libera energía.",
        "Porque Qes siempre cero.",
        "Porque el número de enlaces no cambia."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La condición isotérmica exige intercambio con el baño."
    }
  ]
},model:curado};
export default definition;
