import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Hemodinámica y válvulas cardíacas",
  "mision": "Calcula el caudal máximo a través de la válvula ideal usando el gradiente registrado y su resistencia.",
  "ecuacion": "Q=max(Pvent−Paorta,0)/R. Fase φ=(t mod periodo)/periodo, periodo=60/FC. En sístole φ<0,35: Pvent=8+Pamp sin(πφ/0,35); resto 8 mmHg. Paorta=80+(Pamp−80)e^(−3φ). La válvula sólo deja pasar flujo positivo.",
  "formulaGfx": "Q=max(Pvent−Paorta,0)/R. Fase φ=(t mod periodo)/periodo, periodo=60/FC. En sístole φ<0,35: Pvent=8+Pamp sin(πφ/0,35)",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Valva aórtica» y «Flujo sanguíneo» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Frecuencia de ciclos», «Amplitud ventricular», «Resistencia valvular del banco» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula el caudal máximo a través de la válvula ideal usando el gradiente registrado y su resistencia.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Gradiente: La diferencia de presión impulsa el flujo.",
      "Válvula: Impide flujo inverso en el modelo.",
      "Resistencia: A igual gradiente, R mayor reduce Q."
    ]
  },
  "conceptos": [
    {
      "titulo": "Gradiente",
      "desc": "La diferencia de presión impulsa el flujo."
    },
    {
      "titulo": "Válvula",
      "desc": "Impide flujo inverso en el modelo."
    },
    {
      "titulo": "Resistencia",
      "desc": "A igual gradiente, R mayor reduce Q."
    }
  ]
};
export default contenido;
