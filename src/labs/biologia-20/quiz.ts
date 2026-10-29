import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "Una reducción de 3 log10 deja…",
    "opciones": [
      "Una milésima parte.",
      "Un tercio.",
      "Tres veces más.",
      "Cero exacto necesariamente."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "10⁻³=0,001."
  },
  {
    "pregunta": "Detectar trazador en el blanco indica…",
    "opciones": [
      "Transferencia o arrastre que se debe investigar.",
      "Ausencia de transferencia.",
      "Esterilidad demostrada.",
      "Un resultado que debe ignorarse."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "El blanco debería permanecer libre del trazador en el ideal."
  },
  {
    "pregunta": "Este modelo certifica esterilización real…",
    "opciones": [
      "No.",
      "Sí.",
      "Sí, con cualquier trazador.",
      "Sí, sin validar el método."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Sólo sigue un marcador virtual inerte."
  }
];
export default quiz;
