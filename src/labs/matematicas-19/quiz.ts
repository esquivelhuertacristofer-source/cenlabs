import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "El descenso usa la dirección…",
    "opciones": [
      "Opuesta al gradiente.",
      "Del gradiente positivo.",
      "Aleatoria siempre.",
      "Del eje vertical exclusivamente."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Se busca disminuir f localmente."
  },
  {
    "pregunta": "Un gradiente pequeño garantiza óptimo global…",
    "opciones": [
      "No.",
      "Sí, para toda función.",
      "Sí, aunque haya varios valles.",
      "Sí, siempre que la última iteración tenga menor costo que la anterior."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Puede ser mínimo local o punto estacionario."
  },
  {
    "pregunta": "Cambiar el punto inicial en un paisaje no convexo…",
    "opciones": [
      "Puede llevar a otro mínimo.",
      "No influye nunca.",
      "Elimina todos los valles.",
      "Cambia automáticamente la función."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Las cuencas de atracción son distintas."
  }
];
export default quiz;
