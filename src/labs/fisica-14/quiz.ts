import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
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
];
export default quiz;
