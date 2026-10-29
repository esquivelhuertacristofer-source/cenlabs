import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {hemodinamica} from '@/domain/ciencias/vida';
const definition:PracticaCiencia={...{
  "id": "biologia-17",
  "title": "Hemodinámica y válvulas cardíacas",
  "intro": "Válvulas y flujo pulsátil; relacionar diferencias de presión, caudal y trabajo mecánico.",
  "mission": "Calcula el caudal máximo a través de la válvula ideal usando el gradiente registrado y su resistencia.",
  "formula": "Q=max(Pvent−Paorta,0)/R. Fase φ=(t mod periodo)/periodo, periodo=60/FC. En sístole φ<0,35: Pvent=8+Pamp sin(πφ/0,35); resto 8 mmHg. Paorta=80+(Pamp−80)e^(−3φ). La válvula sólo deja pasar flujo positivo.",
  "limits": "Circuito de presiones impuestas, válvula tipo diodo y resistencia lineal; no acopla volúmenes ni resuelve Navier–Stokes. No calcula gasto cardíaco clínico ni diagnostica enfermedad.",
  "scale": "Válvula aórtica esquemática · flujo pulsátil educativo",
  "controls": [
    {
      "key": "rate",
      "label": "Frecuencia de ciclos",
      "min": 50,
      "max": 100,
      "step": 5,
      "initial": 70,
      "unit": "min⁻¹"
    },
    {
      "key": "pressure",
      "label": "Amplitud ventricular",
      "min": 100,
      "max": 150,
      "step": 5,
      "initial": 125,
      "unit": "mmHg"
    },
    {
      "key": "resistance",
      "label": "Resistencia valvular del banco",
      "min": 0.1,
      "max": 0.5,
      "step": 0.025,
      "initial": 0.2,
      "unit": "mmHg·s/mL"
    }
  ],
  "readings": [
    {
      "key": "peakGradient",
      "label": "Máximo gradiente positivo",
      "unit": "mmHg",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "ventricular",
      "label": "Presión ventricular actual",
      "unit": "mmHg",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "aortic",
      "label": "Presión aórtica actual",
      "unit": "mmHg",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Caudal máximo del banco",
  "answerUnit": "mL/s",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · biología",
      "url": "https://openstax.org/books/biology-2e/pages/1-introduction"
    }
  ],
  "concepts": [
    {
      "title": "Gradiente",
      "description": "La diferencia de presión impulsa el flujo."
    },
    {
      "title": "Válvula",
      "description": "Impide flujo inverso en el modelo."
    },
    {
      "title": "Resistencia",
      "description": "A igual gradiente, R mayor reduce Q."
    }
  ],
  "quiz": [
    {
      "pregunta": "La válvula ideal abre cuando…",
      "opciones": [
        "La presión ventricular supera la aórtica.",
        "La presión aórtica siempre es mayor.",
        "No hay gradiente.",
        "La frecuencia vale cero."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "El diodo hidráulico permite sólo gradiente positivo."
    },
    {
      "pregunta": "A igual gradiente, duplicar R hace Q…",
      "opciones": [
        "La mitad.",
        "El doble.",
        "Cuatro veces mayor.",
        "Idéntico."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Q=ΔP/R."
    },
    {
      "pregunta": "Este banco calcula gasto cardíaco clínico completo…",
      "opciones": [
        "No.",
        "Sí.",
        "Sí, sin integrar flujo.",
        "Sí, porque la presión máxima determina por sí sola el volumen eyectado."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Faltan acoplamiento y calibración fisiológica."
    }
  ]
},model:hemodinamica};
export default definition;
