import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "Una solución que gana más pero viola un recurso…",
    "opciones": [
      "No es factible.",
      "Siempre es óptima.",
      "Debe aceptarse.",
      "Elimina la restricción."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La optimización respeta todas las restricciones."
  },
  {
    "pregunta": "En este polígono acotado basta evaluar…",
    "opciones": [
      "Los vértices para hallar un óptimo.",
      "Sólo el origen.",
      "Sólo puntos fuera del polígono.",
      "Sólo x=y=1."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Un objetivo lineal alcanza un óptimo en un vértice."
  },
  {
    "pregunta": "Si las unidades fueran indivisibles se requeriría…",
    "opciones": [
      "Programación entera.",
      "Ignorar restricciones.",
      "Redondear la solución continua sin volver a comprobar los recursos.",
      "Una integral indefinida."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La relajación continua puede dar fracciones."
  }
];
export default quiz;
