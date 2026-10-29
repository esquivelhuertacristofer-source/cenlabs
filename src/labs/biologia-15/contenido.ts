import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Levadura en un biorreactor",
  "mision": "Calcula la biomasa proyectada al cabo de 24 h bajo alimentación mantenida y oxígeno disponible.",
  "ecuacion": "μ=0,20·S/(0,5+S)·fO2 h⁻¹. X(t)=0,5 exp(μt) g/L; S en g/L y fO2=oxígeno/100. Depósitos externos mantienen S y O2 constantes.",
  "formulaGfx": "μ=0,20·S/(0,5+S)·fO2 h⁻¹. X(t)=0,5 exp(μt) g/L",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Biomasa» y «Aireación» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Sustrato mantenido», «Disponibilidad relativa de oxígeno» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula la biomasa proyectada al cabo de 24 h bajo alimentación mantenida y oxígeno disponible.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Monod: La saturación limita la respuesta al sustrato.",
      "Oxígeno: Su disponibilidad modula el crecimiento.",
      "Operación: Reservas externas distinguen el banco de un lote cerrado."
    ]
  },
  "conceptos": [
    {
      "titulo": "Monod",
      "desc": "La saturación limita la respuesta al sustrato."
    },
    {
      "titulo": "Oxígeno",
      "desc": "Su disponibilidad modula el crecimiento."
    },
    {
      "titulo": "Operación",
      "desc": "Reservas externas distinguen el banco de un lote cerrado."
    }
  ]
};
export default contenido;
