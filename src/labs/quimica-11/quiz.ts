import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "¿Qué ocurre con la absorbancia ideal si duplicas el paso óptico?",
    "opciones": [
      "Se duplica.",
      "Se reduce a la mitad.",
      "Permanece igual.",
      "La transmitancia se duplica siempre."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "A=εbc es proporcional al paso b para la misma muestra."
  },
  {
    "pregunta": "¿Cómo recuperas la concentración original después de una dilución?",
    "opciones": [
      "Multiplicando la concentración medida por el factor de dilución.",
      "Dividiendo siempre entre cien.",
      "Sumando el paso óptico.",
      "Usando la intensidad incidente como concentración."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "El balance de soluto conserva la cantidad de sustancia al diluir."
  },
  {
    "pregunta": "¿Qué permite establecer el blanco?",
    "opciones": [
      "La intensidad de referencia del medio y la cubeta.",
      "La concentración secreta de la muestra.",
      "El número de electrones del soluto.",
      "La longitud de la mesa óptica."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La referencia I₀ permite separar la atenuación del medio de la debida al analito en el modelo."
  }
];
export default quiz;
