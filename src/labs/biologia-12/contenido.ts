import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Mitocondria y ATP sintasa",
  "mision": "Calcula la fuerza protón-motriz mínima necesaria para sintetizar tres ATP por vuelta en un rotor mitocondrialc8 ideal.",
  "ecuacion": "Por vuelta se translocan8 H⁺ y se sintetizan3 ATP. Balance ideal:8FΔp=3ΔGATP, F=96485,33212 C/mol. Umbral Δpmin=3ΔGATP/(8F). Flujo cinético de banco JH=120·[1−exp(−(8FΔp−3ΔGATP)/(RT))] si la diferencia es positiva; si no, cero. T=310 K,ATP/s=3JH/8. Giro visual derivado de JH con tiempo×1/100.",
  "formulaGfx": "Por vuelta se translocan8 H⁺ y se sintetizan3 ATP. Balance ideal:8FΔp=3ΔGATP, F=96485,33212 C/mol. Umbral Δpmin=3ΔGATP/(8F). Flujo cinético de banco JH=120·[1−exp(−(8FΔp−3ΔGATP)/(RT))] si la diferencia es positiva",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Rotor c8» y «Cabeza catalítica F1» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Fuerza protón-motriz», «Energía libre de fosforilación» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula la fuerza protón-motriz mínima necesaria para sintetizar tres ATP por vuelta en un rotor mitocondrialc8 ideal.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Gradiente: La energía electroquímica puede impulsar trabajo rotacional.",
      "Estequiometría: Ocho protones por vuelta se acoplan a tres eventos de síntesis.",
      "Costo total: El transporte celular agrega costos no incluidos en el rotor ideal."
    ]
  },
  "conceptos": [
    {
      "titulo": "Gradiente",
      "desc": "La energía electroquímica puede impulsar trabajo rotacional."
    },
    {
      "titulo": "Estequiometría",
      "desc": "Ocho protones por vuelta se acoplan a tres eventos de síntesis."
    },
    {
      "titulo": "Costo total",
      "desc": "El transporte celular agrega costos no incluidos en el rotor ideal."
    }
  ]
};
export default contenido;
