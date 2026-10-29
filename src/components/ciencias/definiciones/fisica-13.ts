import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {fotoelasticidad} from '@/domain/ciencias/fisica';
const definition:PracticaCiencia={...{
  "id": "fisica-13",
  "title": "Fotoelasticidad: esfuerzos vistos con polarizadores",
  "intro": "Una pieza cargada revela franjas; interpretar el estado óptico asociado a la diferencia de esfuerzos.",
  "mission": "Obtén el esfuerzo tangencial máximo alrededor del agujero en MPa a partir del modelo de Kirsch y el registro óptico.",
  "formula": "Placa infinita bajo tracción en x: σ∞=F/(wt), w=60 mm, agujero a=8 mm. En el borde σθ=σ∞(1−2cos2θ), máximo3σ∞. Ley fotoelástica: N=Ct(σ1−σ2)/λ, C=7,5·10⁻¹¹ Pa⁻¹, λ de referencia550 nm. Se representa luz blanca mediante tres bandas450/550/650 nm entre polarizadores circulares cruzados.",
  "limits": "Elasticidad lineal, placa infinita y tensión plana. La forma finita es una ventana del campo de Kirsch, no una solución FEM de sus mordazas y bordes. C sintético e independiente de temperatura; color RGB de tres bandas, no colorimetría CIE ni calibración de material comercial. No modela plasticidad o fractura.",
  "scale": "Campo de Kirsch · color fotoelástico RGB aproximado · deformación geométrica no amplificada",
  "controls": [
    {
      "key": "force",
      "label": "Fuerza de tracción",
      "min": 0.2,
      "max": 1.6,
      "step": 0.1,
      "unit": "kN",
      "initial": 0.8
    },
    {
      "key": "thickness",
      "label": "Espesor de placa",
      "min": 2,
      "max": 8,
      "step": 0.5,
      "unit": "mm",
      "initial": 4
    }
  ],
  "readings": [
    {
      "key": "force",
      "label": "Carga aplicada",
      "unit": "N",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "order",
      "label": "Orden óptico máximo",
      "unit": "franjas",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Esfuerzo tangencial máximo",
  "answerUnit": "MPa",
  "tolerance": 0.03,
  "source": [
    {
      "name": "Jönköping University · concentración de esfuerzos",
      "url": "https://mechanics.ju.se/SolidMechanics/StressConcentration.html"
    }
  ],
  "concepts": [
    {
      "title": "Concentración",
      "description": "Un agujero modifica el campo incluso bajo carga remota uniforme."
    },
    {
      "title": "Diferencia de esfuerzos",
      "description": "La birrefringencia depende de esfuerzos principales y espesor."
    },
    {
      "title": "Unidades",
      "description": "Carga, ancho y espesor deben expresarse en unidades compatibles."
    }
  ],
  "quiz": [
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
  ]
},model:fotoelasticidad};
export default definition;
