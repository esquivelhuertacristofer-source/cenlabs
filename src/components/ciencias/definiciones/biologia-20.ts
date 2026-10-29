import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {asepsia} from '@/domain/ciencias/vida';
const definition:PracticaCiencia={...{
  "id": "biologia-20",
  "title": "Asepsia y contaminación cruzada",
  "intro": "Una estación virtual de pipeteo y trazadores; reconocer transferencias y evaluar controles de contaminación.",
  "mission": "Calcula el trazador que llega al segundo recipiente después de una limpieza entre transferencias.",
  "formula": "N0=10⁶ unidades de trazador; f=transferencia/100; Nprimero=N0f. Limpieza de L reducciones log10 deja fracción 10^(−L). Arrastre al segundo=N0f²10^(−L).",
  "limits": "Trazador virtual inerte y transferencia fraccional ideal; no microorganismos, esterilización real ni protocolo de bioseguridad. Los valores son didácticos y no certifican una técnica.",
  "scale": "Estación de pipeteo virtual · trazador inerte",
  "controls": [
    {
      "key": "transfer",
      "label": "Fracción transferida por contacto",
      "min": 1,
      "max": 20,
      "step": 1,
      "initial": 10,
      "unit": "%"
    },
    {
      "key": "cleaning",
      "label": "Reducciones log10 de limpieza",
      "min": 0,
      "max": 5,
      "step": 0.5,
      "initial": 2,
      "unit": "log10"
    }
  ],
  "readings": [
    {
      "key": "source",
      "label": "Trazador inicial",
      "unit": "u",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "first",
      "label": "Primera transferencia",
      "unit": "u",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "retention",
      "label": "Fracción tras limpieza",
      "unit": "",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Arrastre al segundo recipiente",
  "answerUnit": "u",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · biología",
      "url": "https://openstax.org/books/biology-2e/pages/1-introduction"
    }
  ],
  "concepts": [
    {
      "title": "Transferencia",
      "description": "Un contacto transporta una fracción del origen."
    },
    {
      "title": "Reducción logarítmica",
      "description": "Cada log10 divide por diez."
    },
    {
      "title": "Control",
      "description": "El blanco permite observar arrastre residual."
    }
  ],
  "quiz": [
    {
      "pregunta": "Una reducción de 3 log10 deja…",
      "opciones": [
        "Una milésima parte.",
        "Un tercio.",
        "Tres veces más.",
        "Cero exacto necesariamente."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "10⁻³=0,001."
    },
    {
      "pregunta": "Detectar trazador en el blanco indica…",
      "opciones": [
        "Transferencia o arrastre que se debe investigar.",
        "Ausencia de transferencia.",
        "Esterilidad demostrada.",
        "Un resultado que debe ignorarse."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "El blanco debería permanecer libre del trazador en el ideal."
    },
    {
      "pregunta": "Este modelo certifica esterilización real…",
      "opciones": [
        "No.",
        "Sí.",
        "Sí, con cualquier trazador.",
        "Sí, sin validar el método."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Sólo sigue un marcador virtual inerte."
    }
  ]
},model:asepsia};
export default definition;
