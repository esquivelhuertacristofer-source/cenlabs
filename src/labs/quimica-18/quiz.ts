import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "Si la solución se calienta, la reacción es…",
    "opciones": [
      "Exotérmica.",
      "Endotérmica necesariamente.",
      "Sin intercambio energético.",
      "De entalpía positiva obligatoria."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La reacción entrega calor a la solución."
  },
  {
    "pregunta": "Omitir una pérdida térmica positiva hace |ΔH|…",
    "opciones": [
      "Menor que el valor corregido.",
      "Mayor siempre.",
      "Infinita.",
      "Exactamente igual."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "Sólo se observa una fracción del calor."
  },
  {
    "pregunta": "Para obtener energía molar se divide por…",
    "opciones": [
      "Los moles del reactivo limitante.",
      "La masa total de solución, manteniendo el resultado en kJ/mol.",
      "La temperatura absoluta del aire.",
      "La temperatura final absoluta, sin considerar los moles reaccionados."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "ΔHm=q/n."
  }
];
export default quiz;
