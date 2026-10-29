import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {pcr} from '@/domain/ciencias/vida';
const definition:PracticaCiencia={...{
  "id": "biologia-13",
  "title": "PCR con ADN patrón",
  "intro": "Un termociclador y una vista molecular; comprender amplificación y evaluar controles.",
  "mission": "Calcula el mínimo de ciclos necesarios para alcanzar 10⁷ copias y contrasta si el registro alcanza esa meta.",
  "formula": "Nn=N0(1+E)^n, N0=100 copias, E=eficiencia/100. Cada ciclo ilustra desnaturalización 95 °C, alineamiento 60 °C y extensión 72 °C; el reloj comprime todos los ciclos en 6 s. Control negativo ideal sin plantilla: cero copias.",
  "limits": "ADN patrón virtual sin secuencia ni organismo, eficiencia constante y fase exponencial sin agotamiento. No es protocolo de laboratorio ni interpretación diagnóstica. Las temperaturas son un esquema educativo.",
  "scale": "Termociclador y ADN patrón · ciclo completo comprimido",
  "controls": [
    {
      "key": "cycles",
      "label": "Número de ciclos",
      "min": 5,
      "max": 25,
      "step": 1,
      "initial": 15,
      "unit": ""
    },
    {
      "key": "efficiency",
      "label": "Eficiencia por ciclo",
      "min": 60,
      "max": 100,
      "step": 5,
      "initial": 90,
      "unit": "%"
    }
  ],
  "readings": [
    {
      "key": "copies",
      "label": "Copias al ciclo actual",
      "unit": "",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "step",
      "label": "Ciclos completados",
      "unit": "",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "initial",
      "label": "Copias iniciales",
      "unit": "",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Ciclos mínimos para 10⁷ copias",
  "answerUnit": "ciclos",
  "tolerance": 0.03,
  "source": [
    {
      "name": "NHGRI · PCR",
      "url": "https://www.genome.gov/about-genomics/fact-sheets/Polymerase-Chain-Reaction-Fact-Sheet"
    }
  ],
  "concepts": [
    {
      "title": "Amplificación",
      "description": "La cantidad crece multiplicativamente por ciclo."
    },
    {
      "title": "Control",
      "description": "Sin plantilla no hay amplificación ideal."
    },
    {
      "title": "Eficiencia",
      "description": "Un valor menor de uno reduce el crecimiento respecto a duplicación."
    }
  ],
  "quiz": [
    {
      "pregunta": "E=100% implica por ciclo…",
      "opciones": [
        "Duplicación ideal.",
        "Aumento de una sola copia.",
        "Disminución a la mitad.",
        "Cero síntesis."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "El factor es 1+E=2."
    },
    {
      "pregunta": "Un control sin plantilla que amplifica sugiere…",
      "opciones": [
        "Contaminación o señal inespecífica que debe investigarse.",
        "Un control ideal correcto.",
        "Que el ADN no existe.",
        "Que todos los resultados son válidos."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "El negativo ideal permanece sin producto."
    },
    {
      "pregunta": "La fase exponencial dura indefinidamente en una PCR real…",
      "opciones": [
        "No.",
        "Sí.",
        "Sí, sin reactivos.",
        "Sí, si el tubo es transparente."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Reactivos y otros factores limitan el crecimiento."
    }
  ]
},model:pcr};
export default definition;
