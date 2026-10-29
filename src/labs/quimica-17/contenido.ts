import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Reactor continuo: cinética y tiempo de residencia",
  "mision": "Determina la conversión de estado estacionario de un reactor continuo perfectamente mezclado.",
  "ecuacion": "V=2 L; reacción A→B de primer orden k=0,20 min⁻¹. τ=V/Q; C∞=Centrada/(1+kτ); X∞=kτ/(1+kτ). Desde C(0)=0: C(t)=C∞[1−exp(−(Q/V+k)t)].",
  "formulaGfx": "V=2 L",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Agitador y mezcla» y «Especie reactiva» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Caudal de alimentación», «Concentración de alimentación» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Determina la conversión de estado estacionario de un reactor continuo perfectamente mezclado.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Mezcla: La salida comparte concentración con el tanque.",
      "Residencia: V/Q fija una escala de transformación.",
      "Arranque: El transitorio no equivale al estado estacionario."
    ]
  },
  "conceptos": [
    {
      "titulo": "Mezcla",
      "desc": "La salida comparte concentración con el tanque."
    },
    {
      "titulo": "Residencia",
      "desc": "V/Q fija una escala de transformación."
    },
    {
      "titulo": "Arranque",
      "desc": "El transitorio no equivale al estado estacionario."
    }
  ]
};
export default contenido;
