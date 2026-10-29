import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {adsorcion} from '@/domain/ciencias/procesos';
const definition:PracticaCiencia={...{
  "id": "quimica-23",
  "title": "Adsorción en carbón activado: ruptura de un lecho",
  "intro": "Un frente avanza por una columna; interpretar saturación y concentración de salida.",
  "mission": "Estima el tiempo central de ruptura del lecho a partir de capacidad y carga de alimentación.",
  "formula": "Capacidad q=0,12 g soluto/g carbón; densidad aparente 0,5 g/mL; sección 0,002 m². mcarbón=ρaparente A L. Q=0,1 L/min; C0 se convierte a g/L. t50=q m/(Q C0). Curva logística Csal/C0=1/[1+exp(−(t−t50)/(0,12t50))].",
  "limits": "Curva de ruptura sintética con balance de capacidad; no resuelve dispersión, transferencia intrapartícula, temperatura ni competencia de una mezcla real. El tiempo t50 es una escala operativa ideal, no una vida certificada.",
  "scale": "Columna de carbón en corte · frente de ruptura",
  "controls": [
    {
      "key": "length",
      "label": "Altura del lecho",
      "min": 10,
      "max": 40,
      "step": 5,
      "initial": 20,
      "unit": "cm"
    },
    {
      "key": "feed",
      "label": "Concentración de entrada",
      "min": 50,
      "max": 300,
      "step": 25,
      "initial": 100,
      "unit": "mg/L"
    }
  ],
  "readings": [
    {
      "key": "mass",
      "label": "Masa de carbón",
      "unit": "g",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "minutes",
      "label": "Tiempo físico",
      "unit": "min",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "outlet",
      "label": "Concentración de salida",
      "unit": "mg/L",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "ratio",
      "label": "Fracción de ruptura",
      "unit": "",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Tiempo central t50",
  "answerUnit": "min",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · química y balances",
      "url": "https://openstax.org/books/chemistry-2e/pages/1-introduction"
    }
  ],
  "concepts": [
    {
      "title": "Capacidad",
      "description": "La masa del lecho fija su inventario adsorbible."
    },
    {
      "title": "Ruptura",
      "description": "La salida aumenta al avanzar la saturación."
    },
    {
      "title": "Carga",
      "description": "Más concentración o caudal agota antes el lecho."
    }
  ],
  "quiz": [
    {
      "pregunta": "En t50, Csal/C0 vale…",
      "opciones": [
        "0,5.",
        "0.",
        "1,5.",
        "50."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Es el centro de la logística."
    },
    {
      "pregunta": "Duplicar masa de carbón a igual alimentación…",
      "opciones": [
        "Duplica t50 en el banco.",
        "Reduce t50 a la mitad.",
        "No modifica t50.",
        "Anula la capacidad."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "t50 es proporcional a m."
    },
    {
      "pregunta": "La curva logística representa…",
      "opciones": [
        "Una aproximación de ruptura.",
        "Una solución molecular exacta.",
        "Una certificación de filtro comercial.",
        "Un equilibrio instantáneo en cada poro."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La transferencia real no se resuelve."
    }
  ],
  "plotX": "minutes",
  "plotKey": "ratio",
  "sampleEvery": 0.02
},model:adsorcion};
export default definition;
