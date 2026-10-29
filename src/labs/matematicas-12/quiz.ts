import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "¿Qué interpola una curva Bézier cúbica general?",
    "opciones": [
      "El primer y el último punto de control.",
      "Los cuatro puntos siempre.",
      "Sólo el promedio de los cuatro puntos.",
      "Ningún punto."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "B(0)=P0 yB(1)=P3."
  },
  {
    "pregunta": "¿Qué se integra para obtener longitud?",
    "opciones": [
      "La norma de B′(u).",
      "Sólo la coordenada y.",
      "El número de puntos multiplicado por el tiempo.",
      "La norma del punto final."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La longitud acumula desplazamientos diferenciales."
  },
  {
    "pregunta": "¿u uniforme garantiza rapidez constante?",
    "opciones": [
      "No: depende de la norma de B′(u).",
      "Sí, en toda curva.",
      "Sí, porque siempre hay cuatro puntos.",
      "Sólo si la curva está dibujada en verde."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La parametrización y la longitud recorrida no son la misma magnitud."
  }
];
export default quiz;
