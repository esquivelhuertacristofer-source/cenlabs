import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Conducción térmica multicapa y resistencias de contacto",
  "mision": "Calcula el flujo térmico por unidad de área a través de las dos capas en serie.",
  "ecuacion": "q″=(80−20)/(L1/k1+L2/k2); L2=0,040 m, k2=0,12 W/(m·K). Tinterfaz=80−q″L1/k1.",
  "formulaGfx": "q″=(80−20)/(L1/k1+L2/k2)",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Primera capa» y «Segunda capa» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Espesor de primera capa», «Conductividad de primera capa» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula el flujo térmico por unidad de área a través de las dos capas en serie.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Resistencia: Las resistencias por unidad de área se suman.",
      "Continuidad: El flujo estacionario es igual en ambas capas.",
      "Espesor: Una capa más gruesa aumenta resistencia."
    ]
  },
  "conceptos": [
    {
      "titulo": "Resistencia",
      "desc": "Las resistencias por unidad de área se suman."
    },
    {
      "titulo": "Continuidad",
      "desc": "El flujo estacionario es igual en ambas capas."
    },
    {
      "titulo": "Espesor",
      "desc": "Una capa más gruesa aumenta resistencia."
    }
  ]
};
export default contenido;
