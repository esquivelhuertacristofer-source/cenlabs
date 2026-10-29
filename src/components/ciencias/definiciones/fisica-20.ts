import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {capilaridad} from '@/domain/ciencias/ondas';
const definition:PracticaCiencia={...{
  "id": "fisica-20",
  "title": "Capilaridad y mojabilidad en microcanales",
  "intro": "Meniscos, gotas y frentes de llenado; medir ángulo de contacto y ascenso capilar.",
  "mission": "Determina la altura de ascenso de equilibrio en un tubo capilar con agua.",
  "formula": "h∞=2γ cosθ/(ρgr), γ=0,0728 N/m, ρ=998 kg/m³, μ=0,001 Pa·s, g=9,80665 m/s². Ascenso viscoso: dh/dt=r²ρg(h∞/h−1)/(8μ). Solución implícita −u−ln(1−u)=t/τ, u=h/h∞, τ=8μh∞/(r²ρg).",
  "limits": "Tubo circular ideal, contacto constante y fluido newtoniano; se omite inercia inicial, evaporación e histéresis. La superficie del menisco es ilustrativa. El menisco se muestra con una ampliación local que conserva el ángulo de contacto. La altura global está amplificada15 veces; radios y alturas del banco no comparten una escala métrica única.",
  "scale": "Capilar ampliado · 1 s visual = 0,25 s físicos",
  "controls": [
    {
      "key": "radius",
      "label": "Radio interior",
      "min": 0.15,
      "max": 1,
      "step": 0.05,
      "initial": 0.4,
      "unit": "mm"
    },
    {
      "key": "angle",
      "label": "Ángulo de contacto",
      "min": 10,
      "max": 75,
      "step": 5,
      "initial": 30,
      "unit": "°"
    }
  ],
  "readings": [
    {
      "key": "gamma",
      "label": "Tensión superficial",
      "unit": "N/m",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "rho",
      "label": "Densidad",
      "unit": "kg/m³",
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
  "answerLabel": "Altura de equilibrio",
  "answerUnit": "mm",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · ondas y materia",
      "url": "https://openstax.org/books/university-physics-volume-3/pages/1-introduction"
    }
  ],
  "concepts": [
    {
      "title": "Mojado",
      "description": "El ángulo de contacto modifica cosθ."
    },
    {
      "title": "Equilibrio",
      "description": "La presión capilar equilibra la hidrostática."
    },
    {
      "title": "Viscosidad",
      "description": "Modifica el tiempo de ascenso, no la altura final."
    }
  ],
  "quiz": [
    {
      "pregunta": "Reducir el radio a la mitad hace que h∞…",
      "opciones": [
        "Se duplique.",
        "Se reduzca a la mitad.",
        "Se vuelva cero.",
        "Sea siempre igual."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La altura es inversa al radio."
    },
    {
      "pregunta": "La viscosidad controla principalmente…",
      "opciones": [
        "La rapidez del ascenso.",
        "El signo de la carga eléctrica.",
        "La masa molar del vidrio.",
        "La gravedad local."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Aparece en el modelo transitorio."
    },
    {
      "pregunta": "Al aproximarse θ a 90°, el ascenso…",
      "opciones": [
        "Disminuye hacia cero.",
        "Crece sin límite.",
        "Permanece idéntico.",
        "Se vuelve siempre turbulento."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "cosθ tiende a cero."
    }
  ]
},model:capilaridad};
export default definition;
