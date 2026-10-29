import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Mecánica pulmonar y ventilación",
  "mision": "Calcula la constante temporal RC del compartimento y relaciona su valor con el llenado y vaciado registrados.",
  "ecuacion": "Modelo lineal R·dV/dt+V/C=P, P=10 cmH2O en inspiración y 0 en espiración; ambas duran 2 s. a=exp[−2/(RC)]; Vpico=CP/(1+a). Inicio inspiratorio V0=aVpico. C se convierte de mL a L por cmH2O; R en cmH2O·s/L. Constante temporal τ=RC en segundos.",
  "formulaGfx": "Modelo lineal R·dV/dt+V/C=P, P=10 cmH2O en inspiración y 0 en espiración",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Pulmón y distensibilidad» y «Vías aéreas» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Distensibilidad», «Resistencia de vía aérea» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula la constante temporal RC del compartimento y relaciona su valor con el llenado y vaciado registrados.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Distensibilidad: C relaciona volumen y presión elástica.",
      "Resistencia: R limita la rapidez del llenado.",
      "Tiempo: RC determina la constante temporal."
    ]
  },
  "conceptos": [
    {
      "titulo": "Distensibilidad",
      "desc": "C relaciona volumen y presión elástica."
    },
    {
      "titulo": "Resistencia",
      "desc": "R limita la rapidez del llenado."
    },
    {
      "titulo": "Tiempo",
      "desc": "RC determina la constante temporal."
    }
  ]
};
export default contenido;
