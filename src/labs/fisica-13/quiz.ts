import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "¿Dónde aparece el máximo de esfuerzo tangencial de Kirsch bajo tracción en x?",
    "opciones": [
      "En los puntos del borde perpendiculares a la carga.",
      "En el centro vacío del agujero.",
      "Siempre sobre la dirección de carga.",
      "En todos los puntos del borde por igual."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "En θ=90° o270°, σθ=3σ∞."
  },
  {
    "pregunta": "¿Qué mide directamente el orden fotoelástico?",
    "opciones": [
      "La diferencia de esfuerzos principales integrada a través del espesor.",
      "La temperatura absoluta.",
      "La suma de todos los esfuerzos.",
      "La profundidad de cualquier grieta."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "N=Ct(σ1−σ2)/λ en este modelo uniforme."
  },
  {
    "pregunta": "¿Qué sucede al duplicar espesor a igual fuerza en este banco ideal?",
    "opciones": [
      "Se reduce el esfuerzo y el orden óptico máximo permanece igual.",
      "Se duplican ambos.",
      "El esfuerzo permanece igual y se duplican las franjas.",
      "El agujero desaparece."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "σ depende de1/t mientras el retardo óptico multiplica por t."
  }
];
export default quiz;
