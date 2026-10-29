import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Ecotoxicología con bioindicadores virtuales",
  "mision": "Calcula el porcentaje de respuesta de los bioindicadores virtuales a la exposición.",
  "ecuacion": "Curva de Hill: E=100 C^h/(EC50^h+C^h), EC50=8 mg/L. h controla la pendiente; supervivencia ilustrada=100−E.",
  "formulaGfx": "Curva de Hill: E=100 C^h/(EC50^h+C^h), EC50=8 mg/L. h controla la pendiente",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Cámara virtual de exposición» y «Bioindicadores virtuales» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Concentración virtual», «Pendiente de Hill» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula el porcentaje de respuesta de los bioindicadores virtuales a la exposición.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Dosis-respuesta: E crece de forma saturable.",
      "EC50: Es la concentración para 50% de respuesta.",
      "Incertidumbre: Un modelo virtual no establece un límite legal."
    ]
  },
  "conceptos": [
    {
      "titulo": "Dosis-respuesta",
      "desc": "E crece de forma saturable."
    },
    {
      "titulo": "EC50",
      "desc": "Es la concentración para 50% de respuesta."
    },
    {
      "titulo": "Incertidumbre",
      "desc": "Un modelo virtual no establece un límite legal."
    }
  ]
};
export default contenido;
