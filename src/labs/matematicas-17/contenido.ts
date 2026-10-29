import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Confiabilidad Weibull y datos censurados",
  "mision": "Calcula la supervivencia al finalizar el ensayo y distingue supervivientes de fallas observadas.",
  "ecuacion": "R(t)=exp[−(t/η)^β], η=1200 h; h(t)=(β/η)(t/η)^(β−1). Los componentes se ilustran con cuantiles deterministas de la Weibull; los que sobreviven al corte son censurados por la derecha.",
  "formulaGfx": "R(t)=exp[−(t/η)^β], η=1200 h",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Rotor en ensayo» y «Muestra del banco» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Parámetro de forma β», «Duración del ensayo» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula la supervivencia al finalizar el ensayo y distingue supervivientes de fallas observadas.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Forma: β distingue riesgo creciente o decreciente.",
      "Escala: η es el tiempo de supervivencia e⁻¹.",
      "Censura: Un superviviente sólo informa que su vida excede el corte."
    ]
  },
  "conceptos": [
    {
      "titulo": "Forma",
      "desc": "β distingue riesgo creciente o decreciente."
    },
    {
      "titulo": "Escala",
      "desc": "η es el tiempo de supervivencia e⁻¹."
    },
    {
      "titulo": "Censura",
      "desc": "Un superviviente sólo informa que su vida excede el corte."
    }
  ]
};
export default contenido;
