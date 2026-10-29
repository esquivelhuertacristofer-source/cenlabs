import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Acústica de una sala: absorción y reverberación",
  "mision": "Estima el tiempo de reverberación RT60 de la sala y contrástalo con el decaimiento registrado.",
  "ecuacion": "Sabine: RT60=0,161V/A, V=120 m³, A=148α+8 m² sabin. E/E0=10^(−6t/RT60). Registro: 6 s visuales equivalen a 3 s de decaimiento.",
  "formulaGfx": "Sabine: RT60=0,161V/A, V=120 m³, A=148α+8 m² sabin. E/E0=10^(−6t/RT60). Registro: 6 s visuales equivalen a 3 s de decaimiento.",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Sala y tratamiento» y «Altavoz de ensayo» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Absorción media de superficies» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Estima el tiempo de reverberación RT60 de la sala y contrástalo con el decaimiento registrado.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Reverberación: Es el decaimiento posterior al cese de la fuente.",
      "Absorción: Área y coeficiente producen sabines.",
      "Decibel: Una escala logarítmica describe grandes razones de energía."
    ]
  },
  "conceptos": [
    {
      "titulo": "Reverberación",
      "desc": "Es el decaimiento posterior al cese de la fuente."
    },
    {
      "titulo": "Absorción",
      "desc": "Área y coeficiente producen sabines."
    },
    {
      "titulo": "Decibel",
      "desc": "Una escala logarítmica describe grandes razones de energía."
    }
  ]
};
export default contenido;
