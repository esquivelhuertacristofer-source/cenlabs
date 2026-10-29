import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Giroscopio: momento angular y precesión",
  "mision": "Calcula la velocidad angular de precesión lenta del giroscopio sostenido por un extremo.",
  "ecuacion": "Disco uniforme m=0,40 kg, r=0,10 m; I=mr²/2; ω=2πrpm/60; τ=mgℓ; Ω=τ/(Iω).",
  "formulaGfx": "Disco uniforme m=0,40 kg, r=0,10 m",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Brazo de carga» y «Volante de inercia» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Régimen del rotor», «Brazo del centro de masa» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula la velocidad angular de precesión lenta del giroscopio sostenido por un extremo.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Momento angular: El rotor almacena Iω.",
      "Torque: La gravedad cambia la dirección del momento angular.",
      "Precesión: Su rapidez es inversa al giro en el límite lento."
    ]
  },
  "conceptos": [
    {
      "titulo": "Momento angular",
      "desc": "El rotor almacena Iω."
    },
    {
      "titulo": "Torque",
      "desc": "La gravedad cambia la dirección del momento angular."
    },
    {
      "titulo": "Precesión",
      "desc": "Su rapidez es inversa al giro en el límite lento."
    }
  ]
};
export default contenido;
