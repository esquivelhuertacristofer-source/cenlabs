import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "Subir pH aumenta…",
    "opciones": [
      "La concentración de OH⁻.",
      "Siempre la solubilidad de ambos hidróxidos.",
      "La constante de Faraday.",
      "El volumen sin añadir líquido."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "[OH⁻]=10^(pH−14)."
  },
  {
    "pregunta": "Recuperar más cobre garantiza pureza total…",
    "opciones": [
      "No, puede co-precipitar magnesio.",
      "Sí, por definición.",
      "Sí, porque los sólidos de magnesio no pueden coexistir con los de cobre.",
      "Sí, sin analizar sólidos."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Recuperación y selectividad son criterios distintos."
  },
  {
    "pregunta": "Ksp se expresa con…",
    "opciones": [
      "Las especies disueltas del equilibrio.",
      "La concentración del sólido puro como un reactivo disuelto.",
      "Sólo la concentración inicial total, aunque cambie el pH.",
      "La suma de concentraciones iónicas sin exponentes estequiométricos."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "El sólido puro no figura como concentración."
  }
];
export default quiz;
