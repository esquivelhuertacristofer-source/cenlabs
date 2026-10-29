import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {regresion} from '@/domain/ciencias/decisiones';
const definition:PracticaCiencia={...{
  "id": "matematicas-14",
  "title": "Ajuste de modelos y análisis de residuos",
  "intro": "Datos de un banco de ensayo; elegir un modelo y detectar sesgo, ruido y valores atípicos.",
  "mission": "Ajusta por mínimos cuadrados una recta a los nueve datos y calcula su pendiente.",
  "formula": "xi=0…8; yi=2+1,7xi+a(xi−4)²+δi7 b. β1=Σ(x−x̄)(y−ȳ)/Σ(x−x̄)²; β0=ȳ−β1x̄. Los datos son sintéticos y están disponibles en el registro.",
  "limits": "Ajuste lineal no ponderado con variables X exactas; la curvatura y el atípico son perturbaciones explícitas. Un buen ajuste numérico no prueba causalidad.",
  "scale": "Banco de ajuste · nube de datos sin recta teórica previa",
  "controls": [
    {
      "key": "curvature",
      "label": "Curvatura oculta al ajuste",
      "min": 0,
      "max": 0.3,
      "step": 0.025,
      "initial": 0.1,
      "unit": ""
    },
    {
      "key": "outlier",
      "label": "Desviación del dato 7",
      "min": 0,
      "max": 6,
      "step": 0.5,
      "initial": 2,
      "unit": "u"
    }
  ],
  "readings": [
    {
      "key": "x",
      "label": "Entrada x",
      "unit": "u",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "y",
      "label": "Respuesta y",
      "unit": "u",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Pendiente de mínimos cuadrados",
  "answerUnit": "u/u",
  "tolerance": 0.03,
  "source": [
    {
      "name": "NIST · manual de estadística",
      "url": "https://www.itl.nist.gov/div898/handbook/"
    }
  ],
  "concepts": [
    {
      "title": "Ajuste",
      "description": "Minimiza la suma de cuadrados de residuos."
    },
    {
      "title": "Residuos",
      "description": "Un patrón curvo sugiere error de modelo."
    },
    {
      "title": "Atípico",
      "description": "Un dato extremo puede cambiar la pendiente."
    }
  ],
  "quiz": [
    {
      "pregunta": "Un patrón curvo en residuos sugiere…",
      "opciones": [
        "Falta de adecuación de la recta.",
        "Linealidad garantizada.",
        "Ausencia de sesgo siempre.",
        "Que todos los puntos son iguales."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La estructura queda sin explicar."
    },
    {
      "pregunta": "Mínimos cuadrados minimiza…",
      "opciones": [
        "La suma de residuos al cuadrado.",
        "El número de datos.",
        "La longitud del eje X.",
        "La suma de residuos sin elevarlos al cuadrado."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La función objetivo es Σei²."
    },
    {
      "pregunta": "Correlación prueba causalidad…",
      "opciones": [
        "No.",
        "Sí, siempre.",
        "Sí, con nueve puntos.",
        "Sí, si la línea es azul."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Puede haber factores omitidos."
    }
  ],
  "plotX": "x",
  "plotKey": "y",
  "sampleEvery": 0.02
},model:regresion};
export default definition;
