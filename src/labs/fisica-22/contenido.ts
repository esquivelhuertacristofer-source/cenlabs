import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Efecto Hall: medir un campo con portadores de carga",
  "mision": "Calcula la densidad de portadores del metal usando la magnitud de la tensión Hall.",
  "ecuacion": "|VH|=IB/(net), t=0,100 mm, e=1,602176634·10⁻¹⁹ C. n=IB/(e t |VH|).",
  "formulaGfx": "|VH|=IB/(net), t=0,100 mm, e=1,602176634·10⁻¹⁹ C. n=IB/(e t |VH|).",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Lámina conductora» y «Región magnética» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Corriente longitudinal», «Campo transversal» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula la densidad de portadores del metal usando la magnitud de la tensión Hall.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Desviación: La fuerza magnética redistribuye carga.",
      "Equilibrio transversal: La fuerza eléctrica compensa la magnética.",
      "Espesor: Una lámina fina amplifica VH."
    ]
  },
  "conceptos": [
    {
      "titulo": "Desviación",
      "desc": "La fuerza magnética redistribuye carga."
    },
    {
      "titulo": "Equilibrio transversal",
      "desc": "La fuerza eléctrica compensa la magnética."
    },
    {
      "titulo": "Espesor",
      "desc": "Una lámina fina amplifica VH."
    }
  ]
};
export default contenido;
