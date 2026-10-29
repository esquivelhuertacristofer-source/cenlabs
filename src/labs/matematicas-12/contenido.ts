import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Curvas Bézier y continuidad de trayectorias",
  "mision": "Calcula la longitud de la trayectoria cúbica entre los extremos, en metros, contrastando una integración numérica con el recorrido visible.",
  "ecuacion": "B(u)=(1−u)³P0+3(1−u)²uP1+3(1−u)u²P2+u³P3. P0=(−1,0),P1=(−0,5,h1),P2=(0,5,h2),P3=(1,0) m. Longitud L=∫0¹||B′(u)||du; referencia Simpson compuesto con512 intervalos. Curvatura κ=|x′y″−y′x″|/(x′²+y′²)^(3/2).",
  "formulaGfx": "B(u)=(1−u)³P0+3(1−u)²uP1+3(1−u)u²P2+u³P3. P0=(−1,0),P1=(−0,5,h1),P2=(0,5,h2),P3=(1,0) m. Longitud L=∫0¹||B′(u)||du",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Carro CNC» y «Punto de control P1» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Altura del primer punto de control», «Altura del segundo punto de control» y usa Revisar movimiento para comparar el fenómeno.",
      "icon": "target"
    },
    {
      "id": 3,
      "text": "Adquiere un registro completo de 6 s y calcula el resultado solicitado.",
      "icon": "activity"
    },
    {
      "id": 4,
      "text": "Valida tu respuesta y contrasta la interpretación en el quiz.",
      "icon": "check"
    }
  ],
  "guiaMaestro": {
    "objetivo": "Calcula la longitud de la trayectoria cúbica entre los extremos, en metros, contrastando una integración numérica con el recorrido visible.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Puntos de control: Los extremos se interpolan; los interiores gobiernan tangentes y forma.",
      "Longitud de arco: Integra la norma de la derivada respecto del parámetro.",
      "Continuidad: La dirección y la magnitud de las derivadas tienen papeles diferentes."
    ]
  },
  "conceptos": [
    {
      "titulo": "Puntos de control",
      "desc": "Los extremos se interpolan; los interiores gobiernan tangentes y forma."
    },
    {
      "titulo": "Longitud de arco",
      "desc": "Integra la norma de la derivada respecto del parámetro."
    },
    {
      "titulo": "Continuidad",
      "desc": "La dirección y la magnitud de las derivadas tienen papeles diferentes."
    }
  ]
};
export default contenido;
