import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {uvvis} from '@/domain/ciencias/quimica';
const definition:PracticaCiencia={...{
  "id": "quimica-11",
  "title": "Espectrofotometría UV–Vis: concentración y blanco",
  "intro": "Un haz atraviesa una cubeta y pierde intensidad al interactuar con una solución coloreada.",
  "mission": "Determina la concentración de la muestra original en µmol/L a partir de la absorbancia, el paso óptico y la dilución.",
  "formula": "A=−log10(I/I₀)=εbc; ε=12000 L·mol⁻¹·cm⁻¹. c_original=c_diluida·factor de dilución. El blanco fija I₀=1. Paso b en cm y concentración c en mol/L.",
  "limits": "Muestra sintética monocomponente, luz monocromática y blanco ideal. Sin dispersión, fluorescencia, luz parásita, incertidumbre instrumental o cambio de ε con la matriz. La concentración del patrón se reserva como incógnita; los parámetros del modelo no son datos de una sustancia comercial.",
  "scale": "Banco óptico seccionado · intensidad por Beer–Lambert · geometría esquemática",
  "controls": [
    {
      "key": "dilution",
      "label": "Factor de dilución",
      "min": 1,
      "max": 5,
      "step": 0.25,
      "unit": "",
      "initial": 2
    },
    {
      "key": "path",
      "label": "Paso óptico de la cubeta",
      "min": 0.5,
      "max": 2,
      "step": 0.1,
      "unit": "cm",
      "initial": 1
    }
  ],
  "readings": [
    {
      "key": "absorbance",
      "label": "Absorbancia",
      "unit": "",
      "digits": 5
    },
    {
      "key": "transmission",
      "label": "Transmitancia",
      "unit": "%",
      "scale": 100,
      "digits": 4
    }
  ],
  "answerLabel": "Concentración original",
  "answerUnit": "µmol/L",
  "tolerance": 0.03,
  "source": [
    {
      "name": "Royal Society of Chemistry · ley de Beer–Lambert",
      "url": "https://www.rsc.org/cpd/teachers/content/filerepository/frg/pdf/Beerlambertlaw.pdf"
    }
  ],
  "concepts": [
    {
      "title": "Absorbancia",
      "description": "Magnitud logarítmica que relaciona intensidades incidente y transmitida."
    },
    {
      "title": "Calibración y blanco",
      "description": "El blanco establece la referencia óptica del medio."
    },
    {
      "title": "Dilución",
      "description": "El factor de preparación vincula la cubeta con la muestra original."
    }
  ],
  "quiz": [
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
  ]
},model:uvvis};
export default definition;
