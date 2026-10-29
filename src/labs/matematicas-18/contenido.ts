import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Acumulación de tolerancias por Monte Carlo",
  "mision": "Estima el porcentaje de ensambles con interferencia mediante 10.000 simulaciones reproducibles.",
  "ecuacion": "Holgura H=H0+ε1+ε2+ε3; εi independientes N(0,σ²). Interferencia si H<0. Monte Carlo con semilla 7319 y Box–Muller; 10.000 realizaciones. Referencia: σH=√3σ.",
  "formulaGfx": "Holgura H=H0+ε1+ε2+ε3",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Pieza central» y «Separación de montaje» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Holgura nominal», «Desviación de cada cota» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Estima el porcentaje de ensambles con interferencia mediante 10.000 simulaciones reproducibles.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Propagación: Las varianzas independientes se suman.",
      "Monte Carlo: La frecuencia estima una probabilidad.",
      "Reproducibilidad: Una semilla fija permite revisar el cálculo."
    ]
  },
  "conceptos": [
    {
      "titulo": "Propagación",
      "desc": "Las varianzas independientes se suman."
    },
    {
      "titulo": "Monte Carlo",
      "desc": "La frecuencia estima una probabilidad."
    },
    {
      "titulo": "Reproducibilidad",
      "desc": "Una semilla fija permite revisar el cálculo."
    }
  ]
};
export default contenido;
