import type {SimuladorContenido} from '@/data/simuladoresData';
const contenido:SimuladorContenido={
  "titulo": "Electrólisis del agua: materia y energía",
  "mision": "Calcula el consumo eléctrico específico de la celda ideal por kilogramo de hidrógeno producido.",
  "ecuacion": "nH2=It/(2F), nO2=nH2/2. E=VIt; mH2=nH2·0,00201588 kg/mol. Consumo=E/mH2; 1 kWh=3,6·10⁶ J.",
  "formulaGfx": "nH2=It/(2F), nO2=nH2/2. E=VIt",
  "pasos": [
    {
      "id": 1,
      "text": "Inspecciona «Colector de hidrógeno» y «Colector de oxígeno» con Explorar en 3D.",
      "icon": "zap"
    },
    {
      "id": 2,
      "text": "Ajusta «Corriente de celda», «Tensión de celda» y usa Revisar movimiento para comparar el fenómeno.",
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
    "objetivo": "Calcula el consumo eléctrico específico de la celda ideal por kilogramo de hidrógeno producido.",
    "friccion": "Distinguir datos conocidos, lecturas adquiridas e incógnita; justificar las unidades y reconocer el alcance del modelo.",
    "puntosClave": [
      "Estequiometría: Dos electrones forman una molécula de H2.",
      "Energía: VIt permite contrastar producción y consumo.",
      "Separación: La membrana mantiene los gases separados en el esquema."
    ]
  },
  "conceptos": [
    {
      "titulo": "Estequiometría",
      "desc": "Dos electrones forman una molécula de H2."
    },
    {
      "titulo": "Energía",
      "desc": "VIt permite contrastar producción y consumo."
    },
    {
      "titulo": "Separación",
      "desc": "La membrana mantiene los gases separados en el esquema."
    }
  ]
};
export default contenido;
