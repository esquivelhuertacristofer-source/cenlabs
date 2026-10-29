import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "¿Qué aumenta al reducir λ a igual material?",
    "opciones": [
      "La energía máxima de los fotoelectrones.",
      "Sólo la masa del electrón.",
      "La función de trabajo del material por definición.",
      "El número de átomos del cátodo."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "hc/λ aumenta al reducir λ."
  },
  {
    "pregunta": "¿Qué relación define el potencial de frenado?",
    "opciones": [
      "eVs=Kmax.",
      "Vs=I²R para cualquier fotocátodo.",
      "Vs=λ/h.",
      "eVs=φ sin depender de la luz."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "El trabajo eléctrico compensa la energía cinética máxima."
  },
  {
    "pregunta": "¿Qué parte de la curva de corriente es específica de este banco?",
    "opciones": [
      "La distribución ideal de energías usada para I(V).",
      "La conservación de energía.",
      "El valor exacto de la carga elemental.",
      "La relación Eγ=hν."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La forma de I(V) no es universal aunque el umbral energético sí siga el balance."
  }
];
export default quiz;
