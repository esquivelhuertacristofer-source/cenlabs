import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Geometría vectorial 3D: rectas, planos y distancias",
  "mision": "Calcula la distancia perpendicular del punto P al plano x+2y+2z=4.",
  "ecuacion": "P=(x,y,3), n=(1,2,2), |n|=3. d=|n·P−4|/|n|; H=P−[(n·P−4)/|n|²]n.",
  "formulaGfx": "P=(x,y,3), n=(1,2,2), |n|=3. d=|n·P−4|/|n|",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Punto exterior» y «Proyección ortogonal» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Coordenada X de P», «Coordenada Y de P» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula la distancia perpendicular del punto P al plano x+2y+2z=4.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Normal: El vector n es perpendicular al plano.",
      "Proyección: El pie H pertenece al plano.",
      "Distancia: La longitud perpendicular es la mínima."
    ]
  },
  "conceptos": [
    {
      "titulo": "Normal",
      "desc": "El vector n es perpendicular al plano."
    },
    {
      "titulo": "Proyección",
      "desc": "El pie H pertenece al plano."
    },
    {
      "titulo": "Distancia",
      "desc": "La longitud perpendicular es la mínima."
    }
  ]
};
export default contenido;
