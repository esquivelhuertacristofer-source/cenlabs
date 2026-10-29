import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Difracción de rayos X: reconocer una estructura cristalina",
  "mision": "Identifica el primer pico111 del patrón FCC y calcula el parámetro de red cúbica en ångströms.",
  "ecuacion": "Bragg:2d sinθ=λ, con d_hkl=a/√(h²+k²+l²). Red FCC ideal con reflexiones111,200,220,311,222,400. Ensanchamiento gaussiano: FWHM=0,9λ/(Dcosθ), λ yD en la misma unidad. Barrido2θ de10 a90° en6 s; muestreo cada0,01 s. Intensidades relativas por multiplicidades simplificadas.",
  "formulaGfx": "Bragg:2d sinθ=λ, con d_hkl=a/√(h²+k²+l²). Red FCC ideal con reflexiones111,200,220,311,222,400. Ensanchamiento gaussiano: FWHM=0,9λ/(Dcosθ), λ yD en la misma unidad. Barrido2θ de10 a90° en6 s",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Brazo detector» y «Cristal FCC» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Longitud de onda de rayos X», «Tamaño coherente de cristalito» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Identifica el primer pico111 del patrón FCC y calcula el parámetro de red cúbica en ångströms.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Planos cristalinos: Cada familia tiene una separación geométrica característica.",
      "Bragg: El detector registra2θ mientras la condición usaθ.",
      "Resolución: El muestreo y el ancho del pico limitan la lectura."
    ]
  },
  "conceptos": [
    {
      "titulo": "Planos cristalinos",
      "desc": "Cada familia tiene una separación geométrica característica."
    },
    {
      "titulo": "Bragg",
      "desc": "El detector registra2θ mientras la condición usaθ."
    },
    {
      "titulo": "Resolución",
      "desc": "El muestreo y el ancho del pico limitan la lectura."
    }
  ]
};
export default contenido;
