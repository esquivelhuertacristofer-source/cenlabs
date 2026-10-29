import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Electrodeposición: corriente, masa y espesor",
  "mision": "Obtén el espesor medio de cobre depositado sobre una superficie de 100 cm².",
  "ecuacion": "m=ηItM/(zF), MCu=63,546 g/mol, z=2, F=96485,33212 C/mol; δ=m/(ρA), ρCu=8,96 g/cm³, A=100 cm². El tiempo se convierte a segundos y δ a µm.",
  "formulaGfx": "m=ηItM/(zF), MCu=63,546 g/mol, z=2, F=96485,33212 C/mol",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Cátodo de depósito» y «Recubrimiento» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Corriente», «Tiempo de depósito», «Rendimiento de corriente» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Obtén el espesor medio de cobre depositado sobre una superficie de 100 cm².",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Carga: I por t cuantifica electrones transferidos.",
      "Rendimiento: No toda la corriente deposita metal.",
      "Espesor: Masa y área determinan el recubrimiento medio."
    ]
  },
  "conceptos": [
    {
      "titulo": "Carga",
      "desc": "I por t cuantifica electrones transferidos."
    },
    {
      "titulo": "Rendimiento",
      "desc": "No toda la corriente deposita metal."
    },
    {
      "titulo": "Espesor",
      "desc": "Masa y área determinan el recubrimiento medio."
    }
  ]
};
export default contenido;
