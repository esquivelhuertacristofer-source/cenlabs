import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Enzimas: velocidad e inhibición",
  "mision": "Obtén la velocidad inicial en µmol/L/min a partir del producto registrado y relaciona su cambio con la inhibición competitiva.",
  "ecuacion": "v=Vmax[S]/(Km(1+[I]/Ki)+[S]). Banco sintético: Vmax=80 µmol/L/min,Km=2,4 mmol/L,Ki=2 mmol/L. El sustrato se mantiene constante por un reservorio ideal; producto P(t)=vt, con t en minutos. Se registra6 s=0,1 min.",
  "formulaGfx": "v=Vmax[S]/(Km(1+[I]/Ki)+[S]). Banco sintético: Vmax=80 µmol/L/min,Km=2,4 mmol/L,Ki=2 mmol/L. El sustrato se mantiene constante por un reservorio ideal",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Región catalítica» y «Inhibidor competitivo» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Sustrato mantenido en el ensayo», «Inhibidor competitivo» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Obtén la velocidad inicial en µmol/L/min a partir del producto registrado y relaciona su cambio con la inhibición competitiva.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Saturación: La velocidad se aproxima a un límite al aumentar sustrato.",
      "Competencia: El inhibidor eleva Km aparente sin cambiar Vmax en este modelo.",
      "Registro: La pendiente de producto frente al tiempo da la velocidad inicial."
    ]
  },
  "conceptos": [
    {
      "titulo": "Saturación",
      "desc": "La velocidad se aproxima a un límite al aumentar sustrato."
    },
    {
      "titulo": "Competencia",
      "desc": "El inhibidor eleva Km aparente sin cambiar Vmax en este modelo."
    },
    {
      "titulo": "Registro",
      "desc": "La pendiente de producto frente al tiempo da la velocidad inicial."
    }
  ]
};
export default contenido;
