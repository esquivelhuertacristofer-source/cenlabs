import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Programación lineal: optimizar una mezcla de producción",
  "mision": "Calcula la ganancia máxima factible de dos productos bajo las restricciones de recursos.",
  "ecuacion": "x,y≥0; 2x+y≤R; x+2y≤R. Ganancia G=cx+30y. Evaluar vértices (0,0),(R/2,0),(R/3,R/3),(0,R/2).",
  "formulaGfx": "x,y≥0",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Producto A» y «Producto B» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Disponibilidad de cada recurso», «Ganancia por producto X» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula la ganancia máxima factible de dos productos bajo las restricciones de recursos.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Restricción: Sólo los puntos factibles son admisibles.",
      "Objetivo: La ganancia define rectas de nivel.",
      "Vértice: Un óptimo lineal existe en un vértice si es acotado."
    ]
  },
  "conceptos": [
    {
      "titulo": "Restricción",
      "desc": "Sólo los puntos factibles son admisibles."
    },
    {
      "titulo": "Objetivo",
      "desc": "La ganancia define rectas de nivel."
    },
    {
      "titulo": "Vértice",
      "desc": "Un óptimo lineal existe en un vértice si es acotado."
    }
  ]
};
export default contenido;
