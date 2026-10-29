import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {corrosion} from '@/domain/ciencias/procesos';
const definition:PracticaCiencia={...{
  "id": "quimica-14",
  "title": "Corrosión y pasivación de metales",
  "intro": "Superficies expuestas cambian con el medio; interpretar curvas y pérdida de material con alcance declarado.",
  "mission": "Calcula la pérdida uniforme de espesor de hierro a partir de la corriente de corrosión registrada.",
  "formula": "i activo=0,001·10^(E/0,12) mA/cm². Fracción pasiva f=1/[1+exp(−(E−0,36)/0,018)]; i=(1−f)i activo+f·0,02 mA/cm². Fe→Fe²⁺+2e⁻; δ=i t M/(2Fρ), M=55,845 g/mol, ρ=7,87 g/cm³. Convertir mA a A.",
  "limits": "Curva activa-pasiva sintética para enseñanza; no parámetros medidos de un acero real. Corrosión uniforme, rendimiento farádico 100%, sin picaduras, productos adheridos ni certificación de vida.",
  "scale": "Cupón en corte · pérdida amplificada · curva sintética",
  "controls": [
    {
      "key": "potential",
      "label": "Potencial del banco",
      "min": 0.05,
      "max": 0.7,
      "step": 0.025,
      "initial": 0.3,
      "unit": "V"
    },
    {
      "key": "hours",
      "label": "Exposición",
      "min": 1,
      "max": 100,
      "step": 1,
      "initial": 24,
      "unit": "h"
    }
  ],
  "readings": [
    {
      "key": "current",
      "label": "Densidad de corriente",
      "unit": "mA/cm²",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "seconds",
      "label": "Tiempo de exposición",
      "unit": "s",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Pérdida uniforme de espesor",
  "answerUnit": "mm",
  "tolerance": 0.03,
  "absoluteTolerance": 1e-10,
  "source": [
    {
      "name": "OpenStax · química y balances",
      "url": "https://openstax.org/books/chemistry-2e/pages/1-introduction"
    }
  ],
  "concepts": [
    {
      "title": "Cinética",
      "description": "La corriente mide transferencia de carga por área."
    },
    {
      "title": "Pasivación",
      "description": "Un estado superficial puede reducir la corriente."
    },
    {
      "title": "Faraday",
      "description": "La carga se convierte en cantidad de hierro disuelto."
    }
  ],
  "quiz": [
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
  ]
},model:corrosion};
export default definition;
