import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Calorimetría de reacción",
  "mision": "Recupera la entalpía molar de la reacción usando el salto térmico y la pérdida declarada.",
  "ecuacion": "Dos volúmenes iguales V se mezclan, densidad 1 g/mL y cp=4,184 J/(g·K); n=C V/1000 mol. qsol=2V cp ΔT. qreacción=−qsol/(1−f), ΔHm=qreacción/n. El salto final ΔT∞ se estima en el instrumento; la relajación térmica visual es exponencial.",
  "formulaGfx": "Dos volúmenes iguales V se mezclan, densidad 1 g/mL y cp=4,184 J/(g·K)",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Calorímetro en sección» y «Sonda térmica» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Concentración de cada solución», «Volumen de cada solución», «Pérdida térmica declarada» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Recupera la entalpía molar de la reacción usando el salto térmico y la pérdida declarada.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Signo: Una reacción exotérmica tiene ΔH negativa.",
      "Balance: El calor de la solución tiene signo opuesto al de reacción.",
      "Corrección: Las pérdidas hacen subestimar el calor liberado."
    ]
  },
  "conceptos": [
    {
      "titulo": "Signo",
      "desc": "Una reacción exotérmica tiene ΔH negativa."
    },
    {
      "titulo": "Balance",
      "desc": "El calor de la solución tiene signo opuesto al de reacción."
    },
    {
      "titulo": "Corrección",
      "desc": "Las pérdidas hacen subestimar el calor liberado."
    }
  ]
};
export default contenido;
