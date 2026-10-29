import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {hall} from '@/domain/ciencias/ondas';
const definition:PracticaCiencia={...{
  "id": "fisica-22",
  "title": "Efecto Hall: medir un campo con portadores de carga",
  "intro": "Las cargas se separan transversalmente; calibrar tensión Hall y distinguir signos de portador.",
  "mission": "Calcula la densidad de portadores del metal usando la magnitud de la tensión Hall.",
  "formula": "|VH|=IB/(net), t=0,100 mm, e=1,602176634·10⁻¹⁹ C. n=IB/(e t |VH|).",
  "limits": "Modelo de Drude de un solo tipo de portador y coeficiente Hall ideal; sin efectos de bandas ni magnetorresistencia. Se pide magnitud, no signo del portador.",
  "scale": "Lámina Hall ampliada · acumulación de carga ilustrativa",
  "controls": [
    {
      "key": "current",
      "label": "Corriente longitudinal",
      "min": 1,
      "max": 12,
      "step": 1,
      "initial": 6,
      "unit": "A"
    },
    {
      "key": "field",
      "label": "Campo transversal",
      "min": 0.1,
      "max": 1,
      "step": 0.05,
      "initial": 0.5,
      "unit": "T"
    }
  ],
  "readings": [
    {
      "key": "voltage",
      "label": "Tensión Hall",
      "unit": "µV",
      "scale": 1000000,
      "digits": 5
    },
    {
      "key": "thickness",
      "label": "Espesor",
      "unit": "mm",
      "scale": 1000,
      "digits": 5
    }
  ],
  "answerLabel": "Densidad de portadores",
  "answerUnit": "×10²⁸ m⁻³",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · efecto Hall",
      "url": "https://openstax.org/books/university-physics-volume-2/pages/11-6-the-hall-effect"
    }
  ],
  "concepts": [
    {
      "title": "Desviación",
      "description": "La fuerza magnética redistribuye carga."
    },
    {
      "title": "Equilibrio transversal",
      "description": "La fuerza eléctrica compensa la magnética."
    },
    {
      "title": "Espesor",
      "description": "Una lámina fina amplifica VH."
    }
  ],
  "quiz": [
    {
      "pregunta": "Duplicar I a igual B y t produce…",
      "opciones": [
        "El doble de |VH|.",
        "La mitad de |VH|.",
        "El mismo |VH|.",
        "Tensión Hall nula siempre."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La ley es lineal en I."
    },
    {
      "pregunta": "Una tensión Hall menor puede indicar…",
      "opciones": [
        "Mayor densidad de portadores, a igual I, B y t.",
        "Menor densidad necesariamente.",
        "Ausencia de átomos.",
        "Mayor espesor, aun manteniendo fijo el espesor especificado del ensayo."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "|VH| es inversa a n."
    },
    {
      "pregunta": "Este modelo identifica el signo del portador…",
      "opciones": [
        "No: aquí se usa sólo la magnitud.",
        "Sí, la magnitud positiva de |VH| implica siempre portadores positivos.",
        "Sí, por la temperatura ambiente.",
        "Sí, sin medir polaridad."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La polaridad se omitió explícitamente."
    }
  ]
},model:hall};
export default definition;
