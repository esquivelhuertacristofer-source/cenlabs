import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {reynolds} from '@/domain/ciencias/fisica';
const definition:PracticaCiencia={...{
  "id": "fisica-18",
  "title": "Túnel de agua: Reynolds y desprendimiento de vórtices",
  "intro": "Flujo alrededor de un obstáculo; medir velocidades y frecuencia con un modelo de flujo validado.",
  "mission": "Determina el número de Reynolds del agua y relaciona su valor con el campo de flujo calculado alrededor del cilindro.",
  "formula": "Re=UD/ν, ν=1,0·10⁻⁶ m²/s. Campo2D por Lattice Boltzmann D2Q9/BGK con rebote no-slip en el cilindro, entrada de equilibrio y salida extrapolada. Red128×64, diámetro12 celdas, Ured=0,045 celda/paso, νred=Ured·12/Re. Relajaciónτ=1/2+3νred. dx=D/12; dt=dx·Ured/U.",
  "limits": "Agua newtoniana incompresible aproximada, régimen de bajo Mach, cilindro2D confinado y paredes horizontales deslizantes. Se limita10≤Re≤120; no representa turbulencia3D ni fuerzas de diseño certificadas. Campo inicial preparado durante 30.000 pasos en Re10/40/80/120; cada cambio usa el estado más cercano y transita con el nuevo Re, sin asumir equilibrio instantáneo; trazadores pasivos, no moléculas individuales. La frecuencia de desprendimiento no se impone como animación. La tinta representa trazadores pasivos sin difusión molecular ni retroacción sobre el flujo. Los vectores muestran la velocidad local.",
  "scale": "Flujo 2D D2Q9 · capas de campo y trazadores pasivos · banco esquemático · tiempo equivalente por dx y dt",
  "controls": [
    {
      "key": "velocity",
      "label": "Velocidad media de entrada",
      "min": 0.005,
      "max": 0.03,
      "step": 0.001,
      "unit": "m/s",
      "initial": 0.02
    },
    {
      "key": "diameter",
      "label": "Diámetro del obstáculo",
      "min": 2,
      "max": 6,
      "step": 0.5,
      "unit": "mm",
      "initial": 4
    }
  ],
  "readings": [
    {
      "key": "velocity",
      "label": "Velocidad de entrada",
      "unit": "m/s",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "diameter",
      "label": "Diámetro del cilindro",
      "unit": "mm",
      "scale": 1000,
      "digits": 5
    }
  ],
  "answerLabel": "Número de Reynolds",
  "answerUnit": "",
  "tolerance": 0.03,
  "source": [
    {
      "name": "Weber State University · simulación Lattice Boltzmann",
      "url": "https://physics.weber.edu/schroeder/fluids/default.html"
    },
    {
      "name": "NVIDIA · D2Q9 y fronteras",
      "url": "https://developer.nvidia.com/gpugems/gpugems2/part-vi-simulation-and-numerical-algorithms/chapter-47-flow-simulation-complex"
    }
  ],
  "concepts": [
    {
      "title": "Reynolds",
      "description": "Compara transporte inercial y difusión viscosa."
    },
    {
      "title": "No-slip",
      "description": "La velocidad del fluido se anula en la superficie del obstáculo."
    },
    {
      "title": "Modelo2D",
      "description": "Las estructuras observadas pertenecen a un dominio y unas fronteras específicos."
    }
  ],
  "quiz": [
    {
      "pregunta": "¿Qué ocurre con Re al duplicar U a igual D yν?",
      "opciones": [
        "Se duplica.",
        "Se divide entre dos.",
        "Se eleva al cuadrado.",
        "Permanece fijo."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Re es proporcional a U."
    },
    {
      "pregunta": "¿Qué representa un trazador en la escena?",
      "opciones": [
        "Una partícula pasiva que sigue la velocidad calculada.",
        "Una molécula de agua representada a escala atómica.",
        "Un vector de fuerza sobre el soporte.",
        "Un vórtice dibujado con frecuencia arbitraria."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Su trayectoria se integra a partir del campo del solver."
    },
    {
      "pregunta": "¿Se pueden interpretar los vórtices2D de este banco como turbulencia industrial completa?",
      "opciones": [
        "No: el dominio y el régimen del modelo están limitados.",
        "Sí, cualquier remolino es turbulencia3D.",
        "Sí, porque Re tiene unidades de presión.",
        "Sí, siempre que coincida Reynolds, aunque cambien la dimensionalidad y las fronteras."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Se declaran dimensiones, fronteras y rango de Reynolds."
    }
  ]
},model:reynolds};
export default definition;
