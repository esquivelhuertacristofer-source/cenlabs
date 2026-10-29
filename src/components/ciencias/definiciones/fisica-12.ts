import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {interferencia} from '@/domain/ciencias/ondas';
const definition:PracticaCiencia={...{
  "id": "fisica-12",
  "title": "Doble rendija: interferencia y difracción",
  "intro": "Luz y detecciones que forman franjas; relacionar longitud de onda, separación y resolución.",
  "mission": "Obtén la separación entre franjas brillantes centrales en la pantalla situada a 1,50 m.",
  "formula": "Δy≈λL/d. I/I0=sinc²(πa sinθ/λ) cos²(πd sinθ/λ), a=0,060 mm, θ=atan(y/L). sinc(u)=sin(u)/u.",
  "limits": "Fraunhofer, rendijas idénticas y coherentes; polarización y dispersión espectral no incluidas. Δy usa la aproximación paraxial. El color visible es una aproximación RGB de la longitud de onda; no representa una calibración espectral del monitor. La iluminación cónica es una guía de montaje, no una solución electromagnética del haz.",
  "scale": "Patrón de Fraunhofer · coordenada de pantalla en mm",
  "controls": [
    {
      "key": "wavelength",
      "label": "Longitud de onda",
      "min": 420,
      "max": 680,
      "step": 10,
      "initial": 550,
      "unit": "nm"
    },
    {
      "key": "slits",
      "label": "Separación de rendijas",
      "min": 0.15,
      "max": 0.6,
      "step": 0.025,
      "initial": 0.3,
      "unit": "mm"
    }
  ],
  "readings": [
    {
      "key": "position",
      "label": "Posición de barrido",
      "unit": "mm",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "intensity",
      "label": "Intensidad relativa",
      "unit": "",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Separación de franjas",
  "answerUnit": "mm",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · doble rendija",
      "url": "https://openstax.org/books/university-physics-volume-3/pages/3-3-youngs-double-slit-experiment"
    }
  ],
  "concepts": [
    {
      "title": "Interferencia",
      "description": "La diferencia de camino decide máximos y mínimos."
    },
    {
      "title": "Difracción",
      "description": "La rendija finita modula la envolvente."
    },
    {
      "title": "Escala",
      "description": "La separación aumenta con λ y L."
    }
  ],
  "quiz": [
    {
      "pregunta": "Al duplicar d, las franjas centrales…",
      "opciones": [
        "Reducen su separación a la mitad.",
        "Duplican su separación.",
        "Desaparecen siempre.",
        "Conservan la separación."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Δy es inversa a d."
    },
    {
      "pregunta": "La envolvente ancha proviene de…",
      "opciones": [
        "La anchura finita de cada rendija.",
        "Un cambio de gravedad.",
        "La separación de las rendijas, sin influencia de su anchura individual.",
        "La corriente del láser."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "El factor sinc² corresponde a una rendija."
    },
    {
      "pregunta": "¿Qué se mantiene para observar un patrón estable?",
      "opciones": [
        "Coherencia entre las dos ondas.",
        "Temperatura cero.",
        "Frecuencia distinta en cada rendija.",
        "Ausencia de luz."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La relación de fase debe mantenerse."
    }
  ],
  "plotX": "position",
  "plotKey": "intensity",
  "sampleEvery": 0.02
},model:interferencia};
export default definition;
