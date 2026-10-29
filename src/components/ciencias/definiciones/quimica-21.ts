import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {precipitacion} from '@/domain/ciencias/procesos';
const definition:PracticaCiencia={...{
  "id": "quimica-21",
  "title": "Recuperación de metales: precipitación selectiva",
  "intro": "Una mezcla produce sólidos que se separan; evaluar selectividad, recuperación y balance de masa.",
  "mission": "Calcula el porcentaje de cobre recuperado y analiza la co-precipitación de magnesio.",
  "formula": "Cu²⁺0=Mg²⁺0=0,010 mol/L. Kw=10⁻¹⁴; [OH⁻]=10^(pH−14). KspCu(OH)2=2,2·10⁻²⁰; KspMg(OH)2=5,61·10⁻¹². Concentración residual=min(C0,Ksp/[OH⁻]²); recuperación=(C0−Cres)/C0.",
  "limits": "Equilibrio ideal a 25 °C con actividades aproximadas por concentraciones; pH impuesto, sin complejantes, cinética, cambios de volumen o dependencia de temperatura. Los Ksp son valores docentes.",
  "scale": "Jarra de precipitación virtual · sólidos amplificados",
  "controls": [
    {
      "key": "pH",
      "label": "pH del medio",
      "min": 6,
      "max": 11,
      "step": 0.25,
      "initial": 8,
      "unit": ""
    },
    {
      "key": "volume",
      "label": "Volumen tratado",
      "min": 0.5,
      "max": 3,
      "step": 0.25,
      "initial": 1,
      "unit": "L"
    }
  ],
  "readings": [
    {
      "key": "cu",
      "label": "Cobre disuelto residual",
      "unit": "mol/L",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "mg",
      "label": "Magnesio disuelto residual",
      "unit": "mol/L",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "selectivity",
      "label": "Fracción de cobre entre moles precipitados",
      "unit": "",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Recuperación de cobre",
  "answerUnit": "%",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · química y balances",
      "url": "https://openstax.org/books/chemistry-2e/pages/1-introduction"
    }
  ],
  "concepts": [
    {
      "title": "Solubilidad",
      "description": "El producto iónico fija la precipitación."
    },
    {
      "title": "Selectividad",
      "description": "La recuperación alta no garantiza pureza."
    },
    {
      "title": "pH",
      "description": "OH⁻ cambia exponencialmente con pH."
    }
  ],
  "quiz": [
    {
      "pregunta": "Subir pH aumenta…",
      "opciones": [
        "La concentración de OH⁻.",
        "Siempre la solubilidad de ambos hidróxidos.",
        "La constante de Faraday.",
        "El volumen sin añadir líquido."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "[OH⁻]=10^(pH−14)."
    },
    {
      "pregunta": "Recuperar más cobre garantiza pureza total…",
      "opciones": [
        "No, puede co-precipitar magnesio.",
        "Sí, por definición.",
        "Sí, porque los sólidos de magnesio no pueden coexistir con los de cobre.",
        "Sí, sin analizar sólidos."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Recuperación y selectividad son criterios distintos."
    },
    {
      "pregunta": "Ksp se expresa con…",
      "opciones": [
        "Las especies disueltas del equilibrio.",
        "La concentración del sólido puro como un reactivo disuelto.",
        "Sólo la concentración inicial total, aunque cambie el pH.",
        "La suma de concentraciones iónicas sin exponentes estequiométricos."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "El sólido puro no figura como concentración."
    }
  ]
},model:precipitacion};
export default definition;
