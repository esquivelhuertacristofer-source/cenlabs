import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Ondas en una cuerda: reflexión y transmisión",
  "mision": "Calcula el porcentaje de energía reflejada en la unión de dos cuerdas bajo la misma tensión.",
  "ecuacion": "μ1=0,003 kg/m, μ2=razón·μ1; ci=√(T/μi), Zi=√(Tμi). r=(Z1−Z2)/(Z1+Z2), tA=1+r. R=r² y Tenergía=1−R. Pulsos gaussianos de desplazamiento; el ancho transmitido escala c2/c1 para conservar duración.",
  "formulaGfx": "μ1=0,003 kg/m, μ2=razón·μ1",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Tramos de cuerda» y «Unión entre medios» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Tensión común», «Razón μ2/μ1» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula el porcentaje de energía reflejada en la unión de dos cuerdas bajo la misma tensión.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Impedancia: La unión de impedancias distintas refleja parte del pulso.",
      "Inversión: Un destino más denso invierte el pulso reflejado.",
      "Conservación: R más T suma uno en ausencia de pérdidas."
    ]
  },
  "conceptos": [
    {
      "titulo": "Impedancia",
      "desc": "La unión de impedancias distintas refleja parte del pulso."
    },
    {
      "titulo": "Inversión",
      "desc": "Un destino más denso invierte el pulso reflejado."
    },
    {
      "titulo": "Conservación",
      "desc": "R más T suma uno en ausencia de pérdidas."
    }
  ]
};
export default contenido;
