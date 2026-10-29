import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {gel} from '@/domain/ciencias/vida';
const definition:PracticaCiencia={...{
  "id": "biologia-14",
  "title": "Electroforesis en gel",
  "intro": "Fragmentos forman bandas; estimar tamaños con patrones y detectar resultados inconsistentes.",
  "mission": "Deduce el tamaño del fragmento desconocido usando la distancia recorrida y el patrón de tamaños.",
  "formula": "Banco semilogarítmico: v=[4−0,8log10(Lpb)]·V/100 mm/min; d=vt. Para estimar L: log10L=[4−d/(tV/100)]/0,8. Patrón: 100, 250, 500, 1000 y 2000 pb.",
  "limits": "Movilidad empírica sintética válida sólo en el intervalo del banco; gel, temperatura y tampón fijos, sin difusión, saturación ni conformaciones diferentes. No ensayo de una muestra real.",
  "scale": "Gel virtual · bandas ampliadas · tiempos comprimidos",
  "controls": [
    {
      "key": "voltage",
      "label": "Tensión aplicada",
      "min": 60,
      "max": 140,
      "step": 10,
      "initial": 100,
      "unit": "V"
    },
    {
      "key": "minutes",
      "label": "Tiempo de corrida",
      "min": 10,
      "max": 30,
      "step": 5,
      "initial": 20,
      "unit": "min"
    }
  ],
  "readings": [
    {
      "key": "position",
      "label": "Distancia del desconocido",
      "unit": "mm",
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
      "key": "voltage",
      "label": "Tensión",
      "unit": "V",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Tamaño del fragmento",
  "answerUnit": "pb",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · biología",
      "url": "https://openstax.org/books/biology-2e/pages/1-introduction"
    }
  ],
  "concepts": [
    {
      "title": "Separación",
      "description": "Los fragmentos pequeños avanzan más en el banco."
    },
    {
      "title": "Patrón",
      "description": "Una escala conocida permite inferir tamaños."
    },
    {
      "title": "Calibración",
      "description": "La relación no se extrapola fuera de su intervalo."
    }
  ],
  "quiz": [
    {
      "pregunta": "Un fragmento menor migra en este banco…",
      "opciones": [
        "Más lejos a igual tiempo.",
        "Menos lejos siempre.",
        "Sin relación con tamaño.",
        "Hacia arriba por gravedad."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La movilidad decrece con log10L."
    },
    {
      "pregunta": "El patrón sirve para…",
      "opciones": [
        "Relacionar distancia con tamaños conocidos.",
        "Cambiar la masa del gel.",
        "Eliminar la necesidad de tiempo.",
        "Demostrar una secuencia completa."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Es una referencia de calibración."
    },
    {
      "pregunta": "Una banda estima la secuencia exacta…",
      "opciones": [
        "No, sólo un tamaño aproximado en este ensayo.",
        "Sí.",
        "Sí, por el brillo.",
        "Sí, con cualquier patrón."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Tamaño y secuencia son propiedades distintas."
    }
  ],
  "previewTime": 5
},model:gel};
export default definition;
