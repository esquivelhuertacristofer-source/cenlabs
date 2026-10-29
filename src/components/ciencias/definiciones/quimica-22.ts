import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {floculacion} from '@/domain/ciencias/procesos';
const definition:PracticaCiencia={...{
  "id": "quimica-22",
  "title": "Tratamiento de agua: coagulación, floculación y sedimentación",
  "intro": "Flóculos se forman en pruebas de jarras; comparar dosificación, mezcla y clarificación.",
  "mission": "Calcula la velocidad de sedimentación del flóculo equivalente y compara el agua clarificada.",
  "formula": "Banco sintético: η=exp[−((dosis−35)/22)²]·G/(G+20); radio=25+100η µm. Stokes: v=2Δρgr²/(9μ), Δρ=80 kg/m³, μ=0,001 Pa·s, H=0,25 m. Turbidez relativa=100[1−η min(1,vt/H)].",
  "limits": "Prueba de jarras virtual, dosis en mg/L y G como control de mezcla sintético; partículas esféricas aisladas, flujo lento. No prescribe dosificación real ni certifica potabilidad.",
  "scale": "Jarras transparentes · flóculos ampliados · 60 s físicos/s",
  "controls": [
    {
      "key": "dose",
      "label": "Dosis de coagulante del banco",
      "min": 5,
      "max": 70,
      "step": 5,
      "initial": 35,
      "unit": "mg/L"
    },
    {
      "key": "mixing",
      "label": "Gradiente de mezcla",
      "min": 10,
      "max": 100,
      "step": 5,
      "initial": 50,
      "unit": "s⁻¹"
    }
  ],
  "readings": [
    {
      "key": "radius",
      "label": "Radio equivalente del flóculo",
      "unit": "µm",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "remaining",
      "label": "Turbidez relativa",
      "unit": "%",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "seconds",
      "label": "Tiempo de sedimentación",
      "unit": "s",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Velocidad de sedimentación",
  "answerUnit": "mm/s",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · química y balances",
      "url": "https://openstax.org/books/chemistry-2e/pages/1-introduction"
    }
  ],
  "concepts": [
    {
      "title": "Coagulación",
      "description": "El banco tiene una dosis óptima sintética."
    },
    {
      "title": "Floculación",
      "description": "La mezcla favorece agregados equivalentes."
    },
    {
      "title": "Sedimentación",
      "description": "La velocidad depende del cuadrado del radio."
    }
  ],
  "quiz": [
    {
      "pregunta": "Duplicar radio en Stokes multiplica v por…",
      "opciones": [
        "Cuatro.",
        "Dos.",
        "Ocho.",
        "Un medio."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "v∝r²."
    },
    {
      "pregunta": "Aumentar dosis sin límite garantiza mejor agua…",
      "opciones": [
        "No: el banco incluye sobredosificación.",
        "Sí, siempre.",
        "Sí, sin mediciones.",
        "Sí, independientemente de la mezcla."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La eficiencia es una curva con máximo."
    },
    {
      "pregunta": "Un agua visualmente clara garantiza potabilidad…",
      "opciones": [
        "No.",
        "Sí.",
        "Sí, si no tiene burbujas.",
        "Sí, por sedimentación únicamente."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "No se evalúan todos los contaminantes."
    }
  ]
},model:floculacion};
export default definition;
