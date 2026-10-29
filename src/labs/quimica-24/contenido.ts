import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Diagramas de fases y solidificación de aleaciones",
  "mision": "Aplica la regla de la palanca y calcula la fracción másica sólida de la aleación.",
  "ecuacion": "Diagrama binario isomorfo sintético: Tsolidus=1000−4C, Tliquidus=1000−2C, T en °C y C en %B. A T fija: Cα=(1000−T)/4 y CL=(1000−T)/2. fs=(CL−C0)/(CL−Cα), limitada a [0,1].",
  "formulaGfx": "Diagrama binario isomorfo sintético: Tsolidus=1000−4C, Tliquidus=1000−2C, T en °C y C en %B. A T fija: Cα=(1000−T)/4 y CL=(1000−T)/2. fs=(CL−C0)/(CL−Cα), limitada a [0,1].",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Fase líquida» y «Granos de fase sólida» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Temperatura de equilibrio», «Composición global de B» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Aplica la regla de la palanca y calcula la fracción másica sólida de la aleación.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Equilibrio: Una isoterma une las composiciones coexistentes.",
      "Palanca: Las fracciones salen del balance global.",
      "Microestructura: Una imagen representa fracciones, no cinética real."
    ]
  },
  "conceptos": [
    {
      "titulo": "Equilibrio",
      "desc": "Una isoterma une las composiciones coexistentes."
    },
    {
      "titulo": "Palanca",
      "desc": "Las fracciones salen del balance global."
    },
    {
      "titulo": "Microestructura",
      "desc": "Una imagen representa fracciones, no cinética real."
    }
  ]
};
export default contenido;
