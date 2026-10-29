import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {electrolisis} from '@/domain/ciencias/procesos';
const definition:PracticaCiencia={...{
  "id": "quimica-16",
  "title": "Electrólisis del agua: materia y energía",
  "intro": "Burbujas y membrana de una celda; relacionar carga, producción y consumo energético.",
  "mission": "Calcula el consumo eléctrico específico de la celda ideal por kilogramo de hidrógeno producido.",
  "formula": "nH2=It/(2F), nO2=nH2/2. E=VIt; mH2=nH2·0,00201588 kg/mol. Consumo=E/mH2; 1 kWh=3,6·10⁶ J.",
  "limits": "Rendimiento farádico 100%; tensión impuesta incluye pérdidas sin descomponerlas. No eficiencia de planta, compresor, pureza de gas ni instrucciones de operación real.",
  "scale": "Celda con membrana · relación molar H2:O2=2:1 · 10 s físicos/s",
  "controls": [
    {
      "key": "current",
      "label": "Corriente de celda",
      "min": 1,
      "max": 10,
      "step": 1,
      "initial": 5,
      "unit": "A"
    },
    {
      "key": "voltage",
      "label": "Tensión de celda",
      "min": 1.6,
      "max": 2.4,
      "step": 0.05,
      "initial": 1.9,
      "unit": "V"
    }
  ],
  "readings": [
    {
      "key": "hydrogen",
      "label": "Hidrógeno producido",
      "unit": "mg",
      "scale": 1000000,
      "digits": 5
    },
    {
      "key": "energy",
      "label": "Energía suministrada",
      "unit": "J",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "seconds",
      "label": "Tiempo físico",
      "unit": "s",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Consumo eléctrico específico",
  "answerUnit": "kWh/kg",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · electrólisis",
      "url": "https://openstax.org/books/chemistry-2e/pages/17-7-electrolysis"
    }
  ],
  "concepts": [
    {
      "title": "Estequiometría",
      "description": "Dos electrones forman una molécula de H2."
    },
    {
      "title": "Energía",
      "description": "VIt permite contrastar producción y consumo."
    },
    {
      "title": "Separación",
      "description": "La membrana mantiene los gases separados en el esquema."
    }
  ],
  "quiz": [
    {
      "pregunta": "La relación molar H2:O2 ideal es…",
      "opciones": [
        "2:1.",
        "1:2.",
        "1:1.",
        "4:3."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La reacción global forma dos H2 por O2."
    },
    {
      "pregunta": "A tensión fija, duplicar I idealmente…",
      "opciones": [
        "Duplica producción y energía en el mismo tiempo.",
        "Duplica sólo la energía.",
        "Reduce la producción a la mitad.",
        "Cambia la masa molar."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Ambas cantidades son proporcionales a la carga."
    },
    {
      "pregunta": "El consumo específico de este modelo depende de…",
      "opciones": [
        "La tensión de celda.",
        "La corriente por sí sola, aun con tensión fija y rendimiento ideal.",
        "La escala visual.",
        "El tamaño de la ventana."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "El cociente E/m cancela I y t."
    }
  ]
},model:electrolisis};
export default definition;
