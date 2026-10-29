import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {capacidad} from '@/domain/ciencias/matematicas';
const definition:PracticaCiencia={...{
  "id": "matematicas-15",
  "title": "Control estadístico y capacidad de proceso",
  "intro": "Una línea produce piezas variables; separar estabilidad de proceso y cumplimiento de tolerancias.",
  "mission": "Comprueba estabilidad y calcula Cpk del proceso sintético con límites19,8 y20,2 mm. Un proceso con deriva debe estabilizarse antes de aceptar capacidad.",
  "formula": "μ=20+descentrado mm. Cp=(USL−LSL)/(6σ). Cpk=min(USL−μ,μ−LSL)/(3σ), USL=20,2 yLSL=19,8 mm. σ es un parámetro poblacional conocido del banco. Media temporal=μ+deriva·(2t/6−1). Se acepta la interpretación de capacidad sólo sin deriva.",
  "limits": "Proceso normal sintético con σ conocida; no estima σ de subgrupos ni sustituye un estudio de estabilidad con series industriales. La señal de deriva es prescrita y se identifica como escenario inestable. Las piezas muestran realizaciones de una distribución, no incertidumbre de medición GUM.",
  "scale": "Población normal sintética · deriva prescrita · capacidad sólo estable",
  "controls": [
    {
      "key": "offset",
      "label": "Descentrado de la media",
      "min": -0.15,
      "max": 0.15,
      "step": 0.01,
      "unit": "mm",
      "initial": 0.06
    },
    {
      "key": "sigma",
      "label": "Desviación estándar del proceso",
      "min": 0.02,
      "max": 0.12,
      "step": 0.005,
      "unit": "mm",
      "initial": 0.05
    },
    {
      "key": "drift",
      "label": "Deriva durante el registro",
      "min": -0.1,
      "max": 0.1,
      "step": 0.01,
      "unit": "mm",
      "initial": 0
    }
  ],
  "readings": [
    {
      "key": "instantMean",
      "label": "Media instantánea del proceso",
      "unit": "mm",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "sigma",
      "label": "Desviación poblacional conocida",
      "unit": "mm",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Índice Cpk",
  "answerUnit": "",
  "tolerance": 0.03,
  "source": [
    {
      "name": "NIST · capacidad de proceso",
      "url": "https://itl.nist.gov/div898/handbook/pmc/section1/pmc16.htm"
    }
  ],
  "concepts": [
    {
      "title": "Estabilidad",
      "description": "Un comportamiento que cambia en el tiempo no sostiene la misma predicción de capacidad."
    },
    {
      "title": "Cp y Cpk",
      "description": "La variación y el descentrado afectan indicadores diferentes."
    },
    {
      "title": "Tolerancias",
      "description": "Las especificaciones no son límites de control estadístico."
    }
  ],
  "quiz": [
    {
      "pregunta": "¿Qué efecto tiene descentrar la media a igualσ?",
      "opciones": [
        "Cp permanece y Cpk disminuye.",
        "Aumentan ambos siempre.",
        "Cpk permanece yCp disminuye.",
        "No cambia ninguno."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Cp mide amplitud relativa; Cpk incluye la distancia al límite más próximo."
    },
    {
      "pregunta": "¿Cuándo tiene sentido la comparación de capacidad de este banco?",
      "opciones": [
        "Después de comprobar estabilidad.",
        "Sólo cuando el promedio coincide con cualquier lectura individual.",
        "Aunque la media derive sin límite.",
        "Antes de definir tolerancias."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La comparación requiere una distribución de proceso estable."
    },
    {
      "pregunta": "¿Qué diferencia hay entre especificaciones y límites de control?",
      "opciones": [
        "Los primeros expresan requisitos; los segundos describen el comportamiento del proceso.",
        "Son siempre idénticos.",
        "Los límites de control se obtienen siempre dividiendo las especificaciones entre dos.",
        "Las especificaciones se calculan sólo a partir de la muestra."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Cumplimiento y estabilidad son preguntas distintas."
    }
  ]
},model:capacidad};
export default definition;
