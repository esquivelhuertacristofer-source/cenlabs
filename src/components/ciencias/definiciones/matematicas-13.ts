import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {programacion} from '@/domain/ciencias/decisiones';
const definition:PracticaCiencia={...{
  "id": "matematicas-13",
  "title": "Programación lineal: optimizar una mezcla de producción",
  "intro": "Tanques y restricciones de suministro; identificar región factible y solución económica.",
  "mission": "Calcula la ganancia máxima factible de dos productos bajo las restricciones de recursos.",
  "formula": "x,y≥0; 2x+y≤R; x+2y≤R. Ganancia G=cx+30y. Evaluar vértices (0,0),(R/2,0),(R/3,R/3),(0,R/2).",
  "limits": "Variables continuas, producción divisible y coeficientes deterministas; no programación entera, tiempos de cambio, incertidumbre ni un plan real de fábrica.",
  "scale": "Mezcla de producción · región factible sin cifras 3D",
  "controls": [
    {
      "key": "resource",
      "label": "Disponibilidad de cada recurso",
      "min": 30,
      "max": 120,
      "step": 10,
      "initial": 60,
      "unit": "u"
    },
    {
      "key": "profit",
      "label": "Ganancia por producto X",
      "min": 20,
      "max": 80,
      "step": 5,
      "initial": 40,
      "unit": "$/u"
    }
  ],
  "readings": [
    {
      "key": "resource",
      "label": "Límite de recursos",
      "unit": "u",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "coefficient",
      "label": "Ganancia unitaria X",
      "unit": "$/u",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Ganancia máxima",
  "answerUnit": " $",
  "tolerance": 0.03,
  "source": [
    {
      "name": "NIST · manual de estadística",
      "url": "https://www.itl.nist.gov/div898/handbook/"
    }
  ],
  "concepts": [
    {
      "title": "Restricción",
      "description": "Sólo los puntos factibles son admisibles."
    },
    {
      "title": "Objetivo",
      "description": "La ganancia define rectas de nivel."
    },
    {
      "title": "Vértice",
      "description": "Un óptimo lineal existe en un vértice si es acotado."
    }
  ],
  "quiz": [
    {
      "pregunta": "Una solución que gana más pero viola un recurso…",
      "opciones": [
        "No es factible.",
        "Siempre es óptima.",
        "Debe aceptarse.",
        "Elimina la restricción."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La optimización respeta todas las restricciones."
    },
    {
      "pregunta": "En este polígono acotado basta evaluar…",
      "opciones": [
        "Los vértices para hallar un óptimo.",
        "Sólo el origen.",
        "Sólo puntos fuera del polígono.",
        "Sólo x=y=1."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Un objetivo lineal alcanza un óptimo en un vértice."
    },
    {
      "pregunta": "Si las unidades fueran indivisibles se requeriría…",
      "opciones": [
        "Programación entera.",
        "Ignorar restricciones.",
        "Redondear la solución continua sin volver a comprobar los recursos.",
        "Una integral indefinida."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La relajación continua puede dar fracciones."
    }
  ]
},previewTime:4,model:programacion};
export default definition;
