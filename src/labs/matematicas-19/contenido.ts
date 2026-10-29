import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Optimización no lineal: gradiente y mínimos locales",
  "mision": "Obtén el costo alcanzado tras 120 pasos de descenso y compara distintos puntos iniciales.",
  "ecuacion": "f(x,z)=0,15(x²+z²)+0,5[1−cos(3x)]+0,4[1−cos(3z)]. ∇f=(0,3x+1,5sin3x,0,3z+1,2sin3z). Descenso xk+1=xk−0,03∇f; 20 pasos/s visual, total 120.",
  "formulaGfx": "f(x,z)=0,15(x²+z²)+0,5[1−cos(3x)]+0,4[1−cos(3z)]. ∇f=(0,3x+1,5sin3x,0,3z+1,2sin3z). Descenso xk+1=xk−0,03∇f",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Superficie de costo» y «Punto de búsqueda» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Inicio X», «Inicio Z» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Obtén el costo alcanzado tras 120 pasos de descenso y compara distintos puntos iniciales.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Gradiente: Indica dirección de máximo crecimiento local.",
      "Descenso: El paso avanza en la dirección contraria.",
      "Mínimo local: La no convexidad hace importante el inicio."
    ]
  },
  "conceptos": [
    {
      "titulo": "Gradiente",
      "desc": "Indica dirección de máximo crecimiento local."
    },
    {
      "titulo": "Descenso",
      "desc": "El paso avanza en la dirección contraria."
    },
    {
      "titulo": "Mínimo local",
      "desc": "La no convexidad hace importante el inicio."
    }
  ]
};
export default contenido;
