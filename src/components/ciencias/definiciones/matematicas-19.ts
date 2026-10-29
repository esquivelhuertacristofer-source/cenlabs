import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {gradiente} from '@/domain/ciencias/decisiones';
const definition:PracticaCiencia={...{
  "id": "matematicas-19",
  "title": "Optimización no lineal: gradiente y mínimos locales",
  "intro": "Un diseño recorre un paisaje de costo; comparar puntos iniciales y restricciones.",
  "mission": "Obtén el costo alcanzado tras 120 pasos de descenso y compara distintos puntos iniciales.",
  "formula": "f(x,z)=0,15(x²+z²)+0,5[1−cos(3x)]+0,4[1−cos(3z)]. ∇f=(0,3x+1,5sin3x,0,3z+1,2sin3z). Descenso xk+1=xk−0,03∇f; 20 pasos/s visual, total 120.",
  "limits": "Función sintética no convexa y método determinista; el final puede ser mínimo local y no se certifica un óptimo global. No hay restricciones adicionales. Las curvas de nivel son una aproximación visual por interpolación lineal sobre una retícula de0,1 unidades; la trayectoria y el costo se calculan con el modelo analítico.",
  "scale": "Paisaje de costo · trayectoria determinada por gradiente",
  "controls": [
    {
      "key": "start",
      "label": "Inicio X",
      "min": -3,
      "max": 3,
      "step": 0.25,
      "initial": 2.5,
      "unit": ""
    },
    {
      "key": "z",
      "label": "Inicio Z",
      "min": -3,
      "max": 3,
      "step": 0.25,
      "initial": 1.5,
      "unit": ""
    }
  ],
  "readings": [
    {
      "key": "x",
      "label": "X actual",
      "unit": "",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "z",
      "label": "Z actual",
      "unit": "",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "steps",
      "label": "Iteraciones",
      "unit": "",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "gradient",
      "label": "Norma del gradiente",
      "unit": "",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Costo tras 120 pasos",
  "answerUnit": "",
  "tolerance": 0.03,
  "source": [
    {
      "name": "NIST · manual de estadística",
      "url": "https://www.itl.nist.gov/div898/handbook/"
    }
  ],
  "concepts": [
    {
      "title": "Gradiente",
      "description": "Indica dirección de máximo crecimiento local."
    },
    {
      "title": "Descenso",
      "description": "El paso avanza en la dirección contraria."
    },
    {
      "title": "Mínimo local",
      "description": "La no convexidad hace importante el inicio."
    }
  ],
  "quiz": [
    {
      "pregunta": "El descenso usa la dirección…",
      "opciones": [
        "Opuesta al gradiente.",
        "Del gradiente positivo.",
        "Aleatoria siempre.",
        "Del eje vertical exclusivamente."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Se busca disminuir f localmente."
    },
    {
      "pregunta": "Un gradiente pequeño garantiza óptimo global…",
      "opciones": [
        "No.",
        "Sí, para toda función.",
        "Sí, aunque haya varios valles.",
        "Sí, siempre que la última iteración tenga menor costo que la anterior."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Puede ser mínimo local o punto estacionario."
    },
    {
      "pregunta": "Cambiar el punto inicial en un paisaje no convexo…",
      "opciones": [
        "Puede llevar a otro mínimo.",
        "No influye nunca.",
        "Elimina todos los valles.",
        "Cambia automáticamente la función."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Las cuencas de atracción son distintas."
    }
  ]
},model:gradiente};
export default definition;
