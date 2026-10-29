import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "Euler es estable en este problema cuando…",
    "opciones": [
      "|1−0,8h|<1.",
      "h es cualquier número.",
      "h>100 siempre.",
      "La temperatura es azul."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La amplificación de θ debe ser menor que uno en módulo."
  },
  {
    "pregunta": "Una oscilación creciente con h grande indica…",
    "opciones": [
      "Inestabilidad numérica.",
      "Un calentamiento físico garantizado.",
      "Una fuente de energía real.",
      "Que la ecuación dejó de existir."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "El método puede crear comportamiento espurio."
  },
  {
    "pregunta": "Comparar métodos exige…",
    "opciones": [
      "El mismo tiempo físico.",
      "Sólo el mismo número de iteraciones, aunque los pasos sean diferentes.",
      "Ignorar el tamaño de paso.",
      "Usar escalas temporales distintas sin aclarar."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La referencia se evalúa en t* compartido."
  }
];
export default quiz;
