import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {integral} from '@/domain/ciencias/decisiones';
const definition:PracticaCiencia={...{
  "id": "matematicas-20",
  "title": "Integrales dobles: volumen y centroide de una pieza",
  "intro": "Una pieza irregular se divide en elementos; contrastar aproximaciones y referencia analítica.",
  "mission": "Calcula el centroide X de una placa rectangular con un barreno excéntrico mediante integrales de área y momentos.",
  "formula": "Placa ideal L=3 m, H=2 m, espesor e=0,12 m y densidad uniforme. Barreno circular de radio r, centro (xh,H/2). A=LH−πr²; V=∬e dA=eA. Mx=∬x dA=LH·L/2−πr²xh; x̄=Mx/A. La referencia X=0 está en el borde izquierdo.",
  "limits": "Placa prismática ideal con un único barreno pasante; se omiten material de biseles, rugosidad y carga de la sujeción. El barreno permanece dentro de los bordes. La retícula es una aproximación de integración y el centroide sólo se revela después de validar.",
  "scale": "Placa perforada CAD · retícula de integración · centroide tras validar",
  "controls": [
    {
      "key": "holeX",
      "label": "Centro X del barreno",
      "min": 0.7,
      "max": 2.3,
      "step": 0.1,
      "initial": 2,
      "unit": "m"
    },
    {
      "key": "radius",
      "label": "Radio del barreno",
      "min": 0.2,
      "max": 0.6,
      "step": 0.05,
      "initial": 0.4,
      "unit": "m"
    }
  ],
  "readings": [
    {
      "key": "L",
      "label": "Longitud de placa",
      "unit": "m"
    },
    {
      "key": "H",
      "label": "Altura de placa",
      "unit": "m"
    },
    {
      "key": "area",
      "label": "Área neta",
      "unit": "m²"
    },
    {
      "key": "volume",
      "label": "Volumen",
      "unit": "m³"
    }
  ],
  "answerLabel": "Coordenada X del centroide",
  "answerUnit": "m",
  "tolerance": 0.03,
  "source": [
    {
      "name": "NIST · manual de estadística",
      "url": "https://www.itl.nist.gov/div898/handbook/"
    }
  ],
  "concepts": [
    {
      "title": "Dominio perforado",
      "description": "El círculo se excluye de la región de integración."
    },
    {
      "title": "Momento de área",
      "description": "El vacío se resta con su propia posición de centroide."
    },
    {
      "title": "Volumen",
      "description": "El espesor constante permite integrar e sobre el área neta."
    }
  ],
  "quiz": [
    {
      "pregunta": "Al retirar material a la derecha del centro original, el centroide neto se desplaza…",
      "opciones": [
        "Hacia la izquierda.",
        "Hacia la derecha.",
        "Siempre hacia el barreno.",
        "No cambia aunque el barreno sea excéntrico."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Se resta un momento de área situado a la derecha del centro original."
    },
    {
      "pregunta": "El momento del barreno respecto al eje Y se resta como…",
      "opciones": [
        "πr²xh.",
        "πr² solamente.",
        "2πr por el espesor.",
        "El radio dividido entre la densidad."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Área por coordenada de su centroide: ∫círculo x dA=Acírculo xh."
    },
    {
      "pregunta": "Con espesor uniforme, el centroide X del volumen y el del área…",
      "opciones": [
        "Coinciden.",
        "Difieren siempre en el espesor.",
        "Se relacionan multiplicando X por e.",
        "Coinciden sólo si no hay barreno."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "El factor e se cancela en el cociente de momento volumétrico y volumen."
    }
  ]
},model:integral};
export default definition;
