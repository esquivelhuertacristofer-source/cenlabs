import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Golpe de ariete: una válvula genera una onda de presión",
  "mision": "Estima la sobrepresión causada por el cierre de una válvula y distingue cierre rápido de lento.",
  "ecuacion": "ρ=998 kg/m³, a=1200 m/s, L=80 m. tc=2L/a. ΔP=ρaU min(1,tc/tcierre). Para cierre lento es la aproximación lineal de Michaud; para rápido, Joukowsky.",
  "formulaGfx": "ρ=998 kg/m³, a=1200 m/s, L=80 m. tc=2L/a. ΔP=ρaU min(1,tc/tcierre). Para cierre lento es la aproximación lineal de Michaud",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Válvula de cierre» y «Frente de presión» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Velocidad inicial», «Tiempo de cierre» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Estima la sobrepresión causada por el cierre de una válvula y distingue cierre rápido de lento.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Cierre rápido: Activa el límite de Joukowsky.",
      "Tiempo característico: La onda recorre dos veces la longitud.",
      "Diseño: Una estimación no reemplaza el cálculo de una red."
    ]
  },
  "conceptos": [
    {
      "titulo": "Cierre rápido",
      "desc": "Activa el límite de Joukowsky."
    },
    {
      "titulo": "Tiempo característico",
      "desc": "La onda recorre dos veces la longitud."
    },
    {
      "titulo": "Diseño",
      "desc": "Una estimación no reemplaza el cálculo de una red."
    }
  ]
};
export default contenido;
