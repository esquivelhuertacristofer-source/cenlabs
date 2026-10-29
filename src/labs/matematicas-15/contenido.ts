import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Control estadístico y capacidad de proceso",
  "mision": "Comprueba estabilidad y calcula Cpk del proceso sintético con límites19,8 y20,2 mm. Un proceso con deriva debe estabilizarse antes de aceptar capacidad.",
  "ecuacion": "μ=20+descentrado mm. Cp=(USL−LSL)/(6σ). Cpk=min(USL−μ,μ−LSL)/(3σ), USL=20,2 yLSL=19,8 mm. σ es un parámetro poblacional conocido del banco. Media temporal=μ+deriva·(2t/6−1). Se acepta la interpretación de capacidad sólo sin deriva.",
  "formulaGfx": "μ=20+descentrado mm. Cp=(USL−LSL)/(6σ). Cpk=min(USL−μ,μ−LSL)/(3σ), USL=20,2 yLSL=19,8 mm. σ es un parámetro poblacional conocido del banco. Media temporal=μ+deriva·(2t/6−1). Se acepta la interpretación de capacidad sólo sin deriva.",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Pieza de producción» y «Sensor de medida» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Descentrado de la media», «Desviación estándar del proceso», «Deriva durante el registro» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Comprueba estabilidad y calcula Cpk del proceso sintético con límites19,8 y20,2 mm. Un proceso con deriva debe estabilizarse antes de aceptar capacidad.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Estabilidad: Un comportamiento que cambia en el tiempo no sostiene la misma predicción de capacidad.",
      "Cp y Cpk: La variación y el descentrado afectan indicadores diferentes.",
      "Tolerancias: Las especificaciones no son límites de control estadístico."
    ]
  },
  "conceptos": [
    {
      "titulo": "Estabilidad",
      "desc": "Un comportamiento que cambia en el tiempo no sostiene la misma predicción de capacidad."
    },
    {
      "titulo": "Cp y Cpk",
      "desc": "La variación y el descentrado afectan indicadores diferentes."
    },
    {
      "titulo": "Tolerancias",
      "desc": "Las especificaciones no son límites de control estadístico."
    }
  ]
};
export default contenido;
