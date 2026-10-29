import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Estabilidad de métodos numéricos: Euler frente a RK4",
  "mision": "Calcula el error absoluto de Euler al final del registro, como porcentaje de la diferencia térmica inicial.",
  "ecuacion": "dθ/dt=−0,8θ, θ0=1; T=20+60θ. Euler: θk+1=(1−0,8h)θk. RK4: factor 1+r+r²/2+r³/6+r⁴/24, r=−0,8h. Exacta θ=e^(−0,8t). Se comparan sólo tiempos completos t*=floor(6/h)h. Error solicitado=100|θEuler(t*)−θexacta(t*)|.",
  "formulaGfx": "dθ/dt=−0,8θ, θ0=1",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Aproximación de Euler» y «Aproximación RK4» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Paso de integración» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula el error absoluto de Euler al final del registro, como porcentaje de la diferencia térmica inicial.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Discretización: El paso cambia el error y la estabilidad.",
      "Referencia: La solución cerrada permite contrastar métodos.",
      "Estabilidad: Una solución numérica puede oscilar aunque la física decaiga."
    ]
  },
  "conceptos": [
    {
      "titulo": "Discretización",
      "desc": "El paso cambia el error y la estabilidad."
    },
    {
      "titulo": "Referencia",
      "desc": "La solución cerrada permite contrastar métodos."
    },
    {
      "titulo": "Estabilidad",
      "desc": "Una solución numérica puede oscilar aunque la física decaiga."
    }
  ]
};
export default contenido;
