import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "Joukowsky predice ΔP proporcional a…",
    "opciones": [
      "La variación de velocidad.",
      "El cuadrado del área siempre.",
      "La inversa de la variación de velocidad.",
      "El tiempo de cierre al cuadrado en el límite de cierre rápido."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "ΔP=ρaΔU."
  },
  {
    "pregunta": "Un cierre lento frente a 2L/a…",
    "opciones": [
      "Reduce la sobrepresión del modelo.",
      "La hace infinita.",
      "No influye nunca.",
      "Crea un vacío absoluto obligatorio."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La corrección tc/tcierre reduce el salto."
  },
  {
    "pregunta": "¿Qué fenómeno exige un análisis adicional?",
    "opciones": [
      "Cavitación.",
      "Conversión de Pa a MPa.",
      "Medición de L.",
      "Conversión de segundos."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "El modelo lineal no representa cavitación."
  }
];
export default quiz;
