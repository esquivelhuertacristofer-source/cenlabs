import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "¿Qué ángulo se usa dentro del seno de Bragg si el detector indica2θ?",
    "opciones": [
      "La mitad del ángulo del detector.",
      "El doble del ángulo del detector.",
      "Siempre90°.",
      "El doble adicional de la lectura 2θ."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La geometría del equipo informa2θ."
  },
  {
    "pregunta": "¿Cómo relacionas d111 y el parámetro de red FCC cúbica?",
    "opciones": [
      "a=√3·d111.",
      "a=d111/3.",
      "a=2θ·λ.",
      "a depende sólo del tamaño de cristalito."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "d_hkl=a/√(h²+k²+l²)."
  },
  {
    "pregunta": "¿Qué hace disminuir D en el modelo de Scherrer?",
    "opciones": [
      "Ensancha los picos.",
      "Cambia necesariamente la composición química.",
      "Elimina la longitud de onda incidente.",
      "Hace que el ángulo del detector sea siempre cero."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "El ancho es inversamente proporcional al tamaño coherente."
  }
];
export default quiz;
