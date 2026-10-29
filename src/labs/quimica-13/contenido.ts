import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Espectroscopía FTIR: identificar grupos funcionales",
  "mision": "Calcula el número de onda de estiramiento del enlace C–O idealizado y localiza su banda.",
  "ecuacion": "ν̃=(1/2πc)√(k/μ); μ=mC mO/(mC+mO), mC=12 u, 1 u=1,66053906892·10⁻²⁷ kg, c=2,99792458·10¹⁰ cm/s. Banda gaussiana de FWHM 35 cm⁻¹, altura A=0,85.",
  "formulaGfx": "ν̃=(1/2πc)√(k/μ)",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Enlace molecular» y «Isótopo del oxígeno» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Constante de fuerza», «Masa isotópica del oxígeno» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula el número de onda de estiramiento del enlace C–O idealizado y localiza su banda.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Masa reducida: Ambos átomos participan en la vibración.",
      "Rigidez: Una fuerza de enlace mayor eleva la frecuencia.",
      "Isótopos: Una masa mayor desplaza la banda a menor frecuencia."
    ]
  },
  "conceptos": [
    {
      "titulo": "Masa reducida",
      "desc": "Ambos átomos participan en la vibración."
    },
    {
      "titulo": "Rigidez",
      "desc": "Una fuerza de enlace mayor eleva la frecuencia."
    },
    {
      "titulo": "Isótopos",
      "desc": "Una masa mayor desplaza la banda a menor frecuencia."
    }
  ]
};
export default contenido;
