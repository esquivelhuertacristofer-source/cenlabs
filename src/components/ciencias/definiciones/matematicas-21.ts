import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {numericos} from '@/domain/ciencias/decisiones';
const definition:PracticaCiencia={...{
  "id": "matematicas-21",
  "title": "Estabilidad de métodos numéricos: Euler frente a RK4",
  "intro": "Un sistema térmico se simula con pasos distintos; medir error y detectar soluciones numéricas inestables.",
  "mission": "Calcula el error absoluto de Euler al final del registro, como porcentaje de la diferencia térmica inicial.",
  "formula": "dθ/dt=−0,8θ, θ0=1; T=20+60θ. Euler: θk+1=(1−0,8h)θk. RK4: factor 1+r+r²/2+r³/6+r⁴/24, r=−0,8h. Exacta θ=e^(−0,8t). Se comparan sólo tiempos completos t*=floor(6/h)h. Error solicitado=100|θEuler(t*)−θexacta(t*)|.",
  "limits": "Sistema térmico lineal normalizado; las temperaturas imposibles de Euler son errores numéricos deliberados, no predicciones físicas. Estabilidad de Euler requiere h<2/0,8=2,5 s.",
  "scale": "Banco térmico · método numérico frente a referencia exacta",
  "controls": [
    {
      "key": "step",
      "label": "Paso de integración",
      "min": 0.25,
      "max": 3,
      "step": 0.25,
      "initial": 1,
      "unit": "s"
    }
  ],
  "readings": [
    {
      "key": "actualTime",
      "label": "Tiempo integrado",
      "unit": "s",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "euler",
      "label": "Temperatura Euler",
      "unit": "°C",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "rk",
      "label": "Temperatura RK4",
      "unit": "°C",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "exact",
      "label": "Temperatura exacta",
      "unit": "°C",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Error Euler normalizado",
  "answerUnit": "%",
  "tolerance": 0.03,
  "source": [
    {
      "name": "NIST · manual de estadística",
      "url": "https://www.itl.nist.gov/div898/handbook/"
    }
  ],
  "concepts": [
    {
      "title": "Discretización",
      "description": "El paso cambia el error y la estabilidad."
    },
    {
      "title": "Referencia",
      "description": "La solución cerrada permite contrastar métodos."
    },
    {
      "title": "Estabilidad",
      "description": "Una solución numérica puede oscilar aunque la física decaiga."
    }
  ],
  "quiz": [
    {
      "pregunta": "Euler es estable en este problema cuando…",
      "opciones": [
        "|1−0,8h|<1.",
        "h es cualquier número.",
        "h>100 siempre.",
        "La temperatura es azul."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La amplificación de θ debe ser menor que uno en módulo."
    },
    {
      "pregunta": "Una oscilación creciente con h grande indica…",
      "opciones": [
        "Inestabilidad numérica.",
        "Un calentamiento físico garantizado.",
        "Una fuente de energía real.",
        "Que la ecuación dejó de existir."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "El método puede crear comportamiento espurio."
    },
    {
      "pregunta": "Comparar métodos exige…",
      "opciones": [
        "El mismo tiempo físico.",
        "Sólo el mismo número de iteraciones, aunque los pasos sean diferentes.",
        "Ignorar el tamaño de paso.",
        "Usar escalas temporales distintas sin aclarar."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La referencia se evalúa en t* compartido."
    }
  ],
  "plotX": "actualTime",
  "plotKey": "euler",
  "sampleEvery": 0.02
},model:numericos};
export default definition;
