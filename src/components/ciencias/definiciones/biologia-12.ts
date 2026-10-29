import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {atp} from '@/domain/ciencias/biologia';
const definition:PracticaCiencia={...{
  "id": "biologia-12",
  "title": "Mitocondria y ATP sintasa",
  "intro": "Gradiente de protones y motor molecular; relacionar transporte, energía y producción de ATP.",
  "mission": "Calcula la fuerza protón-motriz mínima necesaria para sintetizar tres ATP por vuelta en un rotor mitocondrialc8 ideal.",
  "formula": "Por vuelta se translocan8 H⁺ y se sintetizan3 ATP. Balance ideal:8FΔp=3ΔGATP, F=96485,33212 C/mol. Umbral Δpmin=3ΔGATP/(8F). Flujo cinético de banco JH=120·[1−exp(−(8FΔp−3ΔGATP)/(RT))] si la diferencia es positiva; si no, cero. T=310 K,ATP/s=3JH/8. Giro visual derivado de JH con tiempo×1/100.",
  "limits": "Balance reversible y cinética sintética; sin fugas, elasticidad torsional, transporte ADP/ATP, entrada de fosfato o síntesis inversa. Por tanto8/3 H⁺/ATP corresponde al rotor, no al costo total de ATP exportado al citoplasma. Subcomplejo estructural bovino 2XND con envolventes Cα; el estator periférico y las rutas de protones faltantes son esquemáticos.",
  "scale": "PDB 2XND · rotor c8 · giro×1/100 · protones ilustrativos",
  "controls": [
    {
      "key": "gradient",
      "label": "Fuerza protón-motriz",
      "min": 120,
      "max": 240,
      "step": 5,
      "unit": "mV",
      "initial": 210
    },
    {
      "key": "energy",
      "label": "Energía libre de fosforilación",
      "min": 40,
      "max": 65,
      "step": 1,
      "unit": "kJ/mol",
      "initial": 50
    }
  ],
  "readings": [
    {
      "key": "flux",
      "label": "Flujo protónico del banco",
      "unit": "H⁺/s",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "rate",
      "label": "Producción de ATP",
      "unit": "ATP/s",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Umbral protón-motriz ideal",
  "answerUnit": "mV",
  "tolerance": 0.03,
  "source": [
    {
      "name": "Artículo estructural · costo bioenergético del ATP",
      "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC2947889/"
    },
    {
      "name": "RCSB PDB · subcomplejo F1-c8 bovino",
      "url": "https://www.rcsb.org/structure/2XND"
    }
  ],
  "concepts": [
    {
      "title": "Gradiente",
      "description": "La energía electroquímica puede impulsar trabajo rotacional."
    },
    {
      "title": "Estequiometría",
      "description": "Ocho protones por vuelta se acoplan a tres eventos de síntesis."
    },
    {
      "title": "Costo total",
      "description": "El transporte celular agrega costos no incluidos en el rotor ideal."
    }
  ],
  "quiz": [
    {
      "pregunta": "¿Cuántos protones por ATP requiere el rotor c8 ideal?",
      "opciones": [
        "8/3.",
        "3/8.",
        "Siempre exactamente1.",
        "Siempre exactamente10."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Ocho protones se acoplan a tres ATP por vuelta."
    },
    {
      "pregunta": "¿Qué ocurre por debajo del umbral energético en el banco?",
      "opciones": [
        "La síntesis se detiene.",
        "La energía se crea en el rotor.",
        "El modelo duplica automáticamente la temperatura.",
        "El rotor produce ATP sin flujo."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La ley cinética impuesta no permite síntesis con balance desfavorable."
    },
    {
      "pregunta": "¿8/3 expresa el costo completo de ATP exportado por la mitocondria?",
      "opciones": [
        "No: faltan costos de transporte.",
        "Sí, incluye cualquier fuga y todos los transportadores.",
        "Sí, porque el ATP no debe cruzar membranas.",
        "Sí, porque el transporte de ADP y fosfato no agrega costo energético."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La ficha separa rotor y provisión de ATP al citoplasma."
    }
  ]
},model:atp};
export default definition;
