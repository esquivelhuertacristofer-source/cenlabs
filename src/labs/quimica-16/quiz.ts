import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "La relación molar H2:O2 ideal es…",
    "opciones": [
      "2:1.",
      "1:2.",
      "1:1.",
      "4:3."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La reacción global forma dos H2 por O2."
  },
  {
    "pregunta": "A tensión fija, duplicar I idealmente…",
    "opciones": [
      "Duplica producción y energía en el mismo tiempo.",
      "Duplica sólo la energía.",
      "Reduce la producción a la mitad.",
      "Cambia la masa molar."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Ambas cantidades son proporcionales a la carga."
  },
  {
    "pregunta": "El consumo específico de este modelo depende de…",
    "opciones": [
      "La tensión de celda.",
      "La corriente por sí sola, aun con tensión fija y rendimiento ideal.",
      "La escala visual.",
      "El tamaño de la ventana."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "El cociente E/m cancela I y t."
  }
];
export default quiz;
