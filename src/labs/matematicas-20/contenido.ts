import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Integrales dobles: volumen y centroide de una pieza",
  "mision": "Calcula el centroide X de una placa rectangular con un barreno excéntrico mediante integrales de área y momentos.",
  "ecuacion": "Placa ideal L=3 m, H=2 m, espesor e=0,12 m y densidad uniforme. Barreno circular de radio r, centro (xh,H/2). A=LH−πr²; V=∬e dA=eA. Mx=∬x dA=LH·L/2−πr²xh; x̄=Mx/A. La referencia X=0 está en el borde izquierdo.",
  "formulaGfx": "Placa ideal L=3 m, H=2 m, espesor e=0,12 m y densidad uniforme. Barreno circular de radio r, centro (xh,H/2). A=LH−πr²",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Placa perforada» y «Partición del dominio» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Centro X del barreno», «Radio del barreno» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula el centroide X de una placa rectangular con un barreno excéntrico mediante integrales de área y momentos.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Dominio perforado: El círculo se excluye de la región de integración.",
      "Momento de área: El vacío se resta con su propia posición de centroide.",
      "Volumen: El espesor constante permite integrar e sobre el área neta."
    ]
  },
  "conceptos": [
    {
      "titulo": "Dominio perforado",
      "desc": "El círculo se excluye de la región de integración."
    },
    {
      "titulo": "Momento de área",
      "desc": "El vacío se resta con su propia posición de centroide."
    },
    {
      "titulo": "Volumen",
      "desc": "El espesor constante permite integrar e sobre el área neta."
    }
  ]
};
export default contenido;
