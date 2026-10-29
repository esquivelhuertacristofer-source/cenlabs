import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Contracción muscular y sarcómeros",
  "mision": "Calcula la fuerza isométrica del sarcómero para su longitud y activación dadas.",
  "ecuacion": "Solapamiento relativo s=max[0,min(1,(3,6−L)/1,4,(L−1,2)/0,8)], L en µm. Fuerza F=120 s·a nN, activación a=%/100. Marcadores de puentes oscilan con el mismo reloj; la longitud isométrica no cambia.",
  "formulaGfx": "Solapamiento relativo s=max[0,min(1,(3,6−L)/1,4,(L−1,2)/0,8)], L en µm. Fuerza F=120 s·a nN, activación a=%/100. Marcadores de puentes oscilan con el mismo reloj",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Filamentos de actina» y «Filamentos de miosina» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Longitud del sarcómero», «Activación» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula la fuerza isométrica del sarcómero para su longitud y activación dadas.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Filamentos: Actina y miosina mantienen sus longitudes.",
      "Solapamiento: El número de puentes posibles depende de L.",
      "Isometría: Se produce fuerza sin cambio de longitud global."
    ]
  },
  "conceptos": [
    {
      "titulo": "Filamentos",
      "desc": "Actina y miosina mantienen sus longitudes."
    },
    {
      "titulo": "Solapamiento",
      "desc": "El número de puentes posibles depende de L."
    },
    {
      "titulo": "Isometría",
      "desc": "Se produce fuerza sin cambio de longitud global."
    }
  ]
};
export default contenido;
