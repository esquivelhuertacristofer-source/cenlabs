import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "¿Qué efecto tiene descentrar la media a igualσ?",
    "opciones": [
      "Cp permanece y Cpk disminuye.",
      "Aumentan ambos siempre.",
      "Cpk permanece yCp disminuye.",
      "No cambia ninguno."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Cp mide amplitud relativa; Cpk incluye la distancia al límite más próximo."
  },
  {
    "pregunta": "¿Cuándo tiene sentido la comparación de capacidad de este banco?",
    "opciones": [
      "Después de comprobar estabilidad.",
      "Sólo cuando el promedio coincide con cualquier lectura individual.",
      "Aunque la media derive sin límite.",
      "Antes de definir tolerancias."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La comparación requiere una distribución de proceso estable."
  },
  {
    "pregunta": "¿Qué diferencia hay entre especificaciones y límites de control?",
    "opciones": [
      "Los primeros expresan requisitos; los segundos describen el comportamiento del proceso.",
      "Son siempre idénticos.",
      "Los límites de control se obtienen siempre dividiendo las especificaciones entre dos.",
      "Las especificaciones se calculan sólo a partir de la muestra."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Cumplimiento y estabilidad son preguntas distintas."
  }
];
export default quiz;
