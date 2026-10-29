import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Fibra óptica: apertura, acoplamiento y pérdidas",
  "mision": "Calcula el semiángulo máximo de aceptación desde aire y decide si el rayo se guía.",
  "ecuacion": "n1=1,48; NA=√(n1²−n2²); θacept=asin(NA), n0=1. Snell: θinterno=asin(sinθentrada/n1). TIR si π/2−θinterno≥asin(n2/n1).",
  "formulaGfx": "n1=1,48",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Revestimiento» y «Núcleo óptico» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Índice del revestimiento», «Ángulo de entrada» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula el semiángulo máximo de aceptación desde aire y decide si el rayo se guía.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Reflexión total: Requiere incidencia por encima del ángulo crítico.",
      "Apertura numérica: Relaciona índices y cono de entrada.",
      "Refracción: El ángulo dentro del núcleo obedece a Snell."
    ]
  },
  "conceptos": [
    {
      "titulo": "Reflexión total",
      "desc": "Requiere incidencia por encima del ángulo crítico."
    },
    {
      "titulo": "Apertura numérica",
      "desc": "Relaciona índices y cono de entrada."
    },
    {
      "titulo": "Refracción",
      "desc": "El ángulo dentro del núcleo obedece a Snell."
    }
  ]
};
export default contenido;
