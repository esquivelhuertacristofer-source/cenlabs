import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Bayes en inspección: defectos y falsas alarmas",
  "mision": "Calcula la probabilidad de defecto entre las piezas que activan la alarma.",
  "ecuacion": "P(D)=prevalencia, sensibilidad P(+|D)=0,95, falsa alarma P(+|¬D)=f. P(D|+)=0,95p/[0,95p+f(1−p)]. Conteos esperados sobre 10.000 piezas.",
  "formulaGfx": "P(D)=prevalencia, sensibilidad P(+|D)=0,95, falsa alarma P(+|¬D)=f. P(D|+)=0,95p/[0,95p+f(1−p)]. Conteos esperados sobre 10.000 piezas.",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Estación de detección» y «Flujo de inspección» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Tasa base de defectos», «Falsa alarma sobre piezas conformes» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula la probabilidad de defecto entre las piezas que activan la alarma.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Condicional: P(D|+) difiere de P(+|D).",
      "Tasa base: Los defectos raros pueden producir baja precisión positiva.",
      "Falsa alarma: Muchos conformes pueden dominar las alarmas."
    ]
  },
  "conceptos": [
    {
      "titulo": "Condicional",
      "desc": "P(D|+) difiere de P(+|D)."
    },
    {
      "titulo": "Tasa base",
      "desc": "Los defectos raros pueden producir baja precisión positiva."
    },
    {
      "titulo": "Falsa alarma",
      "desc": "Muchos conformes pueden dominar las alarmas."
    }
  ]
};
export default contenido;
