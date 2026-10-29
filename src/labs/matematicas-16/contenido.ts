import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Muestreo de aceptación de lotes",
  "mision": "Calcula la probabilidad de aceptar un lote con el plan n,c=2 y tasa de defectos indicada.",
  "ecuacion": "X~Binomial(n,p), c=2. Pac=Σk=0…2 C(n,k)p^k(1−p)^(n−k). Se acepta si hay como máximo dos defectos en la muestra.",
  "formulaGfx": "X~Binomial(n,p), c=2. Pac=Σk=0…2 C(n,k)p^k(1−p)^(n−k). Se acepta si hay como máximo dos defectos en la muestra.",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Estación de inspección» y «Lote y muestra» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Tamaño de muestra», «Tasa de defectos del lote» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula la probabilidad de aceptar un lote con el plan n,c=2 y tasa de defectos indicada.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Plan: n y c definen la regla de decisión.",
      "Riesgo: Un lote malo puede aceptarse por azar.",
      "Modelo: La independencia permite la binomial."
    ]
  },
  "conceptos": [
    {
      "titulo": "Plan",
      "desc": "n y c definen la regla de decisión."
    },
    {
      "titulo": "Riesgo",
      "desc": "Un lote malo puede aceptarse por azar."
    },
    {
      "titulo": "Modelo",
      "desc": "La independencia permite la binomial."
    }
  ]
};
export default contenido;
