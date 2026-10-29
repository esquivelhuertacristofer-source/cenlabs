import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Ajuste de modelos y análisis de residuos",
  "mision": "Ajusta por mínimos cuadrados una recta a los nueve datos y calcula su pendiente.",
  "ecuacion": "xi=0…8; yi=2+1,7xi+a(xi−4)²+δi7 b. β1=Σ(x−x̄)(y−ȳ)/Σ(x−x̄)²; β0=ȳ−β1x̄. Los datos son sintéticos y están disponibles en el registro.",
  "formulaGfx": "xi=0…8",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Probeta de ensayo» y «Extensómetro» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Curvatura oculta al ajuste», «Desviación del dato 7» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Ajusta por mínimos cuadrados una recta a los nueve datos y calcula su pendiente.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Ajuste: Minimiza la suma de cuadrados de residuos.",
      "Residuos: Un patrón curvo sugiere error de modelo.",
      "Atípico: Un dato extremo puede cambiar la pendiente."
    ]
  },
  "conceptos": [
    {
      "titulo": "Ajuste",
      "desc": "Minimiza la suma de cuadrados de residuos."
    },
    {
      "titulo": "Residuos",
      "desc": "Un patrón curvo sugiere error de modelo."
    },
    {
      "titulo": "Atípico",
      "desc": "Un dato extremo puede cambiar la pendiente."
    }
  ]
};
export default contenido;
