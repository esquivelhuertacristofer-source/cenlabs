import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "Al retirar material a la derecha del centro original, el centroide neto se desplaza…",
    "opciones": [
      "Hacia la izquierda.",
      "Hacia la derecha.",
      "Siempre hacia el barreno.",
      "No cambia aunque el barreno sea excéntrico."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Se resta un momento de área situado a la derecha del centro original."
  },
  {
    "pregunta": "El momento del barreno respecto al eje Y se resta como…",
    "opciones": [
      "πr²xh.",
      "πr² solamente.",
      "2πr por el espesor.",
      "El radio dividido entre la densidad."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Área por coordenada de su centroide: ∫círculo x dA=Acírculo xh."
  },
  {
    "pregunta": "Con espesor uniforme, el centroide X del volumen y el del área…",
    "opciones": [
      "Coinciden.",
      "Difieren siempre en el espesor.",
      "Se relacionan multiplicando X por e.",
      "Coinciden sólo si no hay barreno."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "El factor e se cancela en el cociente de momento volumétrico y volumen."
  }
];
export default quiz;
