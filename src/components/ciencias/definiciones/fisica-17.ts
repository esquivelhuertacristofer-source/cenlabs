import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {solar} from '@/domain/ciencias/ondas';
const definition:PracticaCiencia={...{
  "id": "fisica-17",
  "title": "Radiación térmica: horno solar y equilibrio energético",
  "intro": "Un concentrador ilumina un receptor; relacionar absorción, emisión y temperatura de equilibrio.",
  "mission": "Obtén la temperatura de equilibrio radiativo de una placa expuesta a irradiancia solar.",
  "formula": "α=0,85; T0=Tamb=293,15 K, σ=5,670374419·10⁻⁸ W/(m²K⁴). αG=εσ(Teq⁴−Tamb⁴). Transitorio: 5000 dT/dt=αG−εσ(T⁴−Tamb⁴); RK4 Δt=0,5 s, 120 s físicos/s visual.",
  "limits": "Placa isoterma por unidad de área, cielo equivalente al entorno; sólo radiación, sin convección ni viento. No representa un panel fotovoltaico ni un modelo climático.",
  "scale": "Placa radiativa · 1 s visual = 120 s físicos",
  "controls": [
    {
      "key": "irradiance",
      "label": "Irradiancia",
      "min": 300,
      "max": 1100,
      "step": 50,
      "initial": 850,
      "unit": "W/m²"
    },
    {
      "key": "emissivity",
      "label": "Emisividad térmica",
      "min": 0.2,
      "max": 0.95,
      "step": 0.05,
      "initial": 0.8,
      "unit": ""
    }
  ],
  "readings": [
    {
      "key": "Qin",
      "label": "Absorción solar",
      "unit": "W/m²",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "seconds",
      "label": "Tiempo físico",
      "unit": "s",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "loss",
      "label": "Radiación neta actual",
      "unit": "W/m²",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Temperatura de equilibrio",
  "answerUnit": "°C",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · ondas y materia",
      "url": "https://openstax.org/books/university-physics-volume-3/pages/1-introduction"
    }
  ],
  "concepts": [
    {
      "title": "Absorción",
      "description": "Sólo una fracción de G calienta la placa."
    },
    {
      "title": "Radiación",
      "description": "La emisión depende de T a la cuarta."
    },
    {
      "title": "Balance",
      "description": "El equilibrio iguala potencia absorbida y emitida."
    }
  ],
  "quiz": [
    {
      "pregunta": "En equilibrio radiativo…",
      "opciones": [
        "La entrada iguala la salida neta.",
        "La temperatura es siempre cero.",
        "La potencia desaparece.",
        "La emisividad vale uno necesariamente."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "No cambia la energía interna."
    },
    {
      "pregunta": "La ley de Stefan–Boltzmann usa…",
      "opciones": [
        "Temperatura absoluta en kelvin.",
        "Celsius a la cuarta directamente.",
        "Grados de ángulo.",
        "Presión absoluta."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La potencia T⁴ requiere escala absoluta."
    },
    {
      "pregunta": "Este banco omite…",
      "opciones": [
        "Convección con el aire.",
        "Radiación térmica.",
        "Absorción solar.",
        "Balance energético."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "El modelo declara intercambio exclusivamente radiativo."
    }
  ]
},model:solar};
export default definition;
