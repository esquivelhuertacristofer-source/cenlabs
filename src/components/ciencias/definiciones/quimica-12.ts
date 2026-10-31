import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {hplc} from '@/domain/ciencias/procesos';
const definition:PracticaCiencia={...{
  "id": "quimica-12",
  "previewPaused": true,
  "title": "Cromatografía HPLC: separar una mezcla",
  "intro": "Bandas avanzan por una columna; interpretar retención, resolución y cuantificación.",
  "mission": "Calcula la resolución entre los dos picos y juzga si la separación es suficiente.",
  "formula": "t0=1/Q min para una columna de volumen muerto 1 mL; k1=2, k2=2s; tRi=t0(1+ki). N=4000, σi=tRi/√N, anchura basal wi=4σi. Rs=2(tR2−tR1)/(w1+w2).",
  "limits": "Columna ideal isocrática y picos gaussianos sin sobrecarga; s es un control de selectividad sintético, no una composición comercial de disolvente.",
  "scale": "Columna en corte · bandas gaussianas · 1 s visual = 2 min",
  "controls": [
    {
      "key": "flow",
      "label": "Caudal",
      "min": 0.6,
      "max": 1.5,
      "step": 0.1,
      "initial": 1,
      "unit": "mL/min"
    },
    {
      "key": "selectivity",
      "label": "Factor relativo de retención",
      "min": 1.02,
      "max": 1.5,
      "step": 0.02,
      "initial": 1.2,
      "unit": ""
    }
  ],
  "readings": [
    {
      "key": "minutes",
      "label": "Tiempo de elución",
      "unit": "min",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "intensity",
      "label": "Señal de detector",
      "unit": "",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "tr1",
      "label": "Retención del primer pico",
      "unit": "min",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "tr2",
      "label": "Retención del segundo pico",
      "unit": "min",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "w1",
      "label": "Anchura basal 1",
      "unit": "min",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "w2",
      "label": "Anchura basal 2",
      "unit": "min",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Resolución entre picos",
  "answerUnit": "",
  "tolerance": 0.03,
  "source": [
    {
      "name": "Sheffield Hallam · teoría cromatográfica",
      "url": "https://teaching.shu.ac.uk/hwb/chemistry/tutorials/chrom/chrom1.htm"
    }
  ],
  "concepts": [
    {
      "title": "Retención",
      "description": "Los analitos avanzan con velocidades medias distintas."
    },
    {
      "title": "Eficiencia",
      "description": "El número de platos relaciona retención y anchura."
    },
    {
      "title": "Resolución",
      "description": "Combina separación temporal y dispersión."
    }
  ],
  "quiz": [
    {
      "pregunta": "Picos más anchos a retenciones iguales dan…",
      "opciones": [
        "Menor resolución.",
        "Mayor resolución.",
        "Resolución infinita.",
        "El mismo Rs siempre."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "El denominador aumenta."
    },
    {
      "pregunta": "En esta columna ideal, cambiar sólo Q…",
      "opciones": [
        "Escala tiempos y anchuras por igual.",
        "Cambia obligatoriamente la selectividad.",
        "Crea un tercer analito.",
        "No cambia tiempos."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Rs se conserva al mantener N y k."
    },
    {
      "pregunta": "El volumen muerto determina…",
      "opciones": [
        "El tiempo de un compuesto no retenido.",
        "El tiempo de elución del analito más retenido.",
        "El tiempo total de retención de cualquier compuesto, independientemente de k.",
        "La energía de enlace."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "t0=VM/Q."
    }
  ],
  "plotX": "minutes",
  "plotKey": "intensity",
  "sampleEvery": 0.02
},model:hplc};
export default definition;
