import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {calorimetria} from '@/domain/ciencias/procesos';
const definition:PracticaCiencia={...{
  "id": "quimica-18",
  "title": "Calorimetría de reacción",
  "intro": "Un recipiente intercambia calor; estimar energía de reacción y separar pérdidas del calor medido.",
  "mission": "Recupera la entalpía molar de la reacción usando el salto térmico y la pérdida declarada.",
  "formula": "Dos volúmenes iguales V se mezclan, densidad 1 g/mL y cp=4,184 J/(g·K); n=C V/1000 mol. qsol=2V cp ΔT. qreacción=−qsol/(1−f), ΔHm=qreacción/n. El salto final ΔT∞ se estima en el instrumento; la relajación térmica visual es exponencial.",
  "limits": "Reacción sintética completa 1:1, soluciones con propiedades del agua y pérdida fraccional conocida. Capacidad del recipiente despreciada; no se identifica un reactivo comercial.",
  "scale": "Calorímetro aislado en corte · relajación visual del sensor",
  "controls": [
    {
      "key": "concentration",
      "label": "Concentración de cada solución",
      "min": 0.5,
      "max": 1.5,
      "step": 0.1,
      "initial": 1,
      "unit": "mol/L"
    },
    {
      "key": "volume",
      "label": "Volumen de cada solución",
      "min": 50,
      "max": 150,
      "step": 10,
      "initial": 100,
      "unit": "mL"
    },
    {
      "key": "loss",
      "label": "Pérdida térmica declarada",
      "min": 0,
      "max": 15,
      "step": 1,
      "initial": 5,
      "unit": "%"
    }
  ],
  "readings": [
    {
      "key": "deltaT",
      "label": "Salto térmico asintótico",
      "unit": "K",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "mass",
      "label": "Masa de solución",
      "unit": "g",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "n",
      "label": "Cantidad limitante",
      "unit": "mol",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Entalpía molar de reacción",
  "answerUnit": "kJ/mol",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · química y balances",
      "url": "https://openstax.org/books/chemistry-2e/pages/1-introduction"
    }
  ],
  "concepts": [
    {
      "title": "Signo",
      "description": "Una reacción exotérmica tiene ΔH negativa."
    },
    {
      "title": "Balance",
      "description": "El calor de la solución tiene signo opuesto al de reacción."
    },
    {
      "title": "Corrección",
      "description": "Las pérdidas hacen subestimar el calor liberado."
    }
  ],
  "quiz": [
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
  ]
},model:calorimetria};
export default definition;
