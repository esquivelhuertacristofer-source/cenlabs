import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {bezier} from '@/domain/ciencias/matematicas';
const definition:PracticaCiencia={...{
  "id": "matematicas-12",
  "title": "Curvas Bézier y continuidad de trayectorias",
  "intro": "Una trayectoria se deforma con puntos de control; comparar tangencia y curvatura.",
  "mission": "Calcula la longitud de la trayectoria cúbica entre los extremos, en metros, contrastando una integración numérica con el recorrido visible.",
  "formula": "B(u)=(1−u)³P0+3(1−u)²uP1+3(1−u)u²P2+u³P3. P0=(−1,0),P1=(−0,5,h1),P2=(0,5,h2),P3=(1,0) m. Longitud L=∫0¹||B′(u)||du; referencia Simpson compuesto con512 intervalos. Curvatura κ=|x′y″−y′x″|/(x′²+y′²)^(3/2).",
  "limits": "Curva plana embebida en3D, sin cinemática inversa de máquina, colisiones, velocidad máxima o planificación dinámica. La herramienta recorre u de forma uniforme; eso no implica velocidad espacial uniforme. Longitudes en metros del escenario, no código de máquina.",
  "scale": "Curva cúbica exacta · parámetro uniforme · recorrido6 s",
  "controls": [
    {
      "key": "h1",
      "label": "Altura del primer punto de control",
      "min": 0,
      "max": 1.5,
      "step": 0.05,
      "unit": "m",
      "initial": 1.1
    },
    {
      "key": "h2",
      "label": "Altura del segundo punto de control",
      "min": 0,
      "max": 1.5,
      "step": 0.05,
      "unit": "m",
      "initial": 0.6
    }
  ],
  "readings": [
    {
      "key": "x",
      "label": "Posición x de la herramienta",
      "unit": "m",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "y",
      "label": "Posición y de la herramienta",
      "unit": "m",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Longitud de trayectoria",
  "answerUnit": "m",
  "tolerance": 0.03,
  "source": [
    {
      "name": "MIT · definición y propiedades de Bézier",
      "url": "https://web.mit.edu/hyperbook/Patrikalakis-Maekawa-Cho/node12.html"
    }
  ],
  "concepts": [
    {
      "title": "Puntos de control",
      "description": "Los extremos se interpolan; los interiores gobiernan tangentes y forma."
    },
    {
      "title": "Longitud de arco",
      "description": "Integra la norma de la derivada respecto del parámetro."
    },
    {
      "title": "Continuidad",
      "description": "La dirección y la magnitud de las derivadas tienen papeles diferentes."
    }
  ],
  "quiz": [
    {
      "pregunta": "¿Qué interpola una curva Bézier cúbica general?",
      "opciones": [
        "El primer y el último punto de control.",
        "Los cuatro puntos siempre.",
        "Sólo el promedio de los cuatro puntos.",
        "Ningún punto."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "B(0)=P0 yB(1)=P3."
    },
    {
      "pregunta": "¿Qué se integra para obtener longitud?",
      "opciones": [
        "La norma de B′(u).",
        "Sólo la coordenada y.",
        "El número de puntos multiplicado por el tiempo.",
        "La norma del punto final."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La longitud acumula desplazamientos diferenciales."
    },
    {
      "pregunta": "¿u uniforme garantiza rapidez constante?",
      "opciones": [
        "No: depende de la norma de B′(u).",
        "Sí, en toda curva.",
        "Sí, porque siempre hay cuatro puntos.",
        "Sólo si la curva está dibujada en verde."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La parametrización y la longitud recorrida no son la misma magnitud."
    }
  ],
  "plotKey": "y",
  "plotX": "x"
},model:bezier};
export default definition;
