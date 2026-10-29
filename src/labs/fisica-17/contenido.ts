import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Radiación térmica: horno solar y equilibrio energético",
  "mision": "Obtén la temperatura de equilibrio radiativo de una placa expuesta a irradiancia solar.",
  "ecuacion": "α=0,85; T0=Tamb=293,15 K, σ=5,670374419·10⁻⁸ W/(m²K⁴). αG=εσ(Teq⁴−Tamb⁴). Transitorio: 5000 dT/dt=αG−εσ(T⁴−Tamb⁴); RK4 Δt=0,5 s, 120 s físicos/s visual.",
  "formulaGfx": "α=0,85",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Fuente de irradiación» y «Placa absorbente» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Irradiancia», «Emisividad térmica» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Obtén la temperatura de equilibrio radiativo de una placa expuesta a irradiancia solar.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Absorción: Sólo una fracción de G calienta la placa.",
      "Radiación: La emisión depende de T a la cuarta.",
      "Balance: El equilibrio iguala potencia absorbida y emitida."
    ]
  },
  "conceptos": [
    {
      "titulo": "Absorción",
      "desc": "Sólo una fracción de G calienta la placa."
    },
    {
      "titulo": "Radiación",
      "desc": "La emisión depende de T a la cuarta."
    },
    {
      "titulo": "Balance",
      "desc": "El equilibrio iguala potencia absorbida y emitida."
    }
  ]
};
export default contenido;
