import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Doble rendija: interferencia y difracción",
  "mision": "Obtén la separación entre franjas brillantes centrales en la pantalla situada a 1,50 m.",
  "ecuacion": "Δy≈λL/d. I/I0=sinc²(πa sinθ/λ) cos²(πd sinθ/λ), a=0,060 mm, θ=atan(y/L). sinc(u)=sin(u)/u.",
  "formulaGfx": "Δy≈λL/d. I/I0=sinc²(πa sinθ/λ) cos²(πd sinθ/λ), a=0,060 mm, θ=atan(y/L). sinc(u)=sin(u)/u.",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Doble rendija» y «Pantalla de observación» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Longitud de onda», «Separación de rendijas» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Obtén la separación entre franjas brillantes centrales en la pantalla situada a 1,50 m.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Interferencia: La diferencia de camino decide máximos y mínimos.",
      "Difracción: La rendija finita modula la envolvente.",
      "Escala: La separación aumenta con λ y L."
    ]
  },
  "conceptos": [
    {
      "titulo": "Interferencia",
      "desc": "La diferencia de camino decide máximos y mínimos."
    },
    {
      "titulo": "Difracción",
      "desc": "La rendija finita modula la envolvente."
    },
    {
      "titulo": "Escala",
      "desc": "La separación aumenta con λ y L."
    }
  ]
};
export default contenido;
