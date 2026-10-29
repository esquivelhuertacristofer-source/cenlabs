import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {tolerancias} from '@/domain/ciencias/decisiones';
const definition:PracticaCiencia={...{
  "id": "matematicas-18",
  "title": "Acumulación de tolerancias por Monte Carlo",
  "intro": "Piezas de un ensamble varían; estimar ajuste y probabilidad de interferencia.",
  "mission": "Estima el porcentaje de ensambles con interferencia mediante 10.000 simulaciones reproducibles.",
  "formula": "Holgura H=H0+ε1+ε2+ε3; εi independientes N(0,σ²). Interferencia si H<0. Monte Carlo con semilla 7319 y Box–Muller; 10.000 realizaciones. Referencia: σH=√3σ.",
  "limits": "Variaciones normales independientes y sin sesgo; no cubre correlaciones, colas no normales ni deformación elástica. El resultado validado es la frecuencia del muestreo fijo del banco, con tolerancia 3%.",
  "scale": "Ensamble en corte · variaciones geométricas amplificadas",
  "controls": [
    {
      "key": "gap",
      "label": "Holgura nominal",
      "min": 0.02,
      "max": 0.3,
      "step": 0.02,
      "initial": 0.1,
      "unit": "mm"
    },
    {
      "key": "sigma",
      "label": "Desviación de cada cota",
      "min": 0.02,
      "max": 0.15,
      "step": 0.01,
      "initial": 0.08,
      "unit": "mm"
    }
  ],
  "readings": [
    {
      "key": "count",
      "label": "Realizaciones",
      "unit": "",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "mean",
      "label": "Holgura nominal",
      "unit": "mm",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "sigma",
      "label": "Desviación combinada",
      "unit": "mm",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "interferences",
      "label": "Ensambles con interferencia",
      "unit": "",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Interferencia estimada",
  "answerUnit": "%",
  "tolerance": 0.03,
  "source": [
    {
      "name": "NIST · manual de estadística",
      "url": "https://www.itl.nist.gov/div898/handbook/"
    }
  ],
  "concepts": [
    {
      "title": "Propagación",
      "description": "Las varianzas independientes se suman."
    },
    {
      "title": "Monte Carlo",
      "description": "La frecuencia estima una probabilidad."
    },
    {
      "title": "Reproducibilidad",
      "description": "Una semilla fija permite revisar el cálculo."
    }
  ],
  "quiz": [
    {
      "pregunta": "Para errores independientes se suman…",
      "opciones": [
        "Las varianzas.",
        "Siempre las desviaciones directamente.",
        "Las medias al cuadrado sólo.",
        "Las probabilidades sin límite."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Var(ΣXi)=ΣVar(Xi)."
    },
    {
      "pregunta": "Aumentar simulaciones elimina todo error de modelo…",
      "opciones": [
        "No: sólo reduce error de muestreo.",
        "Sí.",
        "Sí, desde diez corridas.",
        "Sí, sin revisar distribuciones."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Las hipótesis pueden seguir siendo incorrectas."
    },
    {
      "pregunta": "H<0 representa…",
      "opciones": [
        "Interferencia geométrica.",
        "Holgura positiva.",
        "Ausencia de piezas.",
        "Desviación estándar nula."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La dimensión acumulada excede la separación disponible."
    }
  ]
},model:tolerancias};
export default definition;
