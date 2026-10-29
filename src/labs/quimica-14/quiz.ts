import type {Question} from '@/components/LabQuiz';
const quiz:Question[]=[
  {
    "pregunta": "La pérdida uniforme se obtiene de…",
    "opciones": [
      "Carga, masa molar, valencia y densidad.",
      "Potencial aplicado, sin considerar corriente ni tiempo.",
      "Sólo longitud del cupón.",
      "Sólo el tiempo, sin masa molar ni estado de oxidación."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La ley de Faraday conecta electrones y masa."
  },
  {
    "pregunta": "La región pasiva del banco tiene…",
    "opciones": [
      "Corriente reducida.",
      "Corriente infinita.",
      "Ausencia de electrones en el metal.",
      "Una masa siempre creciente de hierro."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "La curva incluye una rama de baja corriente."
  },
  {
    "pregunta": "¿Permite predecir picaduras de un acero real?",
    "opciones": [
      "No.",
      "Sí, sin composición.",
      "Sí, con cualquier electrolito.",
      "Sí, porque toda corrosión localizada puede reemplazarse por una pérdida media."
    ],
    "respuestaCorrecta": 0,
    "explicacion": "No se incluye corrosión localizada ni calibración material."
  }
];
export default quiz;
