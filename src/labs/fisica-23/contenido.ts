import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Efecto fotoeléctrico: frecuencia, umbral y potencial de frenado",
  "mision": "Calcula el potencial de frenado que anula la fotocorriente para la luz elegida y una función de trabajo2,15 eV.",
  "ecuacion": "Eγ=hc/λ. Kmax=Eγ−φ, φ=2,15 eV; eVs=Kmax. h=6,62607015·10⁻³⁴ J·s, e=1,602176634·10⁻¹⁹ C, c=299792458 m/s. Corriente sintética: I=18 nA·max(0,1−V/Vs), equivalente a energías normales uniformes entre0 yKmax. En el tubo: x=v0τ−eVτ²/(2mL), L=0,10 m.",
  "formulaGfx": "Eγ=hc/λ. Kmax=Eγ−φ, φ=2,15 eV",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Fotocátodo» y «Electrodo colector» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Longitud de onda», «Potencial de frenado» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula el potencial de frenado que anula la fotocorriente para la luz elegida y una función de trabajo2,15 eV.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Fotón: Su energía depende de la frecuencia.",
      "Función de trabajo: Energía necesaria para liberar el electrón del material.",
      "Frenado: El potencial detiene incluso los electrones de energía máxima."
    ]
  },
  "conceptos": [
    {
      "titulo": "Fotón",
      "desc": "Su energía depende de la frecuencia."
    },
    {
      "titulo": "Función de trabajo",
      "desc": "Energía necesaria para liberar el electrón del material."
    },
    {
      "titulo": "Frenado",
      "desc": "El potencial detiene incluso los electrones de energía máxima."
    }
  ]
};
export default contenido;
