import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "Reducir el radio a la mitad hace que h∞…",
    "opciones": [
      "Se duplique.",
      "Se reduzca a la mitad.",
      "Se vuelva cero.",
      "Sea siempre igual."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La altura es inversa al radio."
  },
  {
    "pregunta": "La viscosidad controla principalmente…",
    "opciones": [
      "La rapidez del ascenso.",
      "El signo de la carga eléctrica.",
      "La masa molar del vidrio.",
      "La gravedad local."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Aparece en el modelo transitorio."
  },
  {
    "pregunta": "Al aproximarse θ a 90°, el ascenso…",
    "opciones": [
      "Disminuye hacia cero.",
      "Crece sin límite.",
      "Permanece idéntico.",
      "Se vuelve siempre turbulento."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "cosθ tiende a cero."
  }
];
export default quiz;
