import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {pulmon} from '@/domain/ciencias/vida';
const definition:PracticaCiencia={...{
  "id": "biologia-16",
  "title": "Mecánica pulmonar y ventilación",
  "intro": "Un pulmón se expande; relacionar presión, volumen, resistencia y distensibilidad en un modelo educativo.",
  "mission": "Calcula la constante temporal RC del compartimento y relaciona su valor con el llenado y vaciado registrados.",
  "formula": "Modelo lineal R·dV/dt+V/C=P, P=10 cmH2O en inspiración y 0 en espiración; ambas duran 2 s. a=exp[−2/(RC)]; Vpico=CP/(1+a). Inicio inspiratorio V0=aVpico. C se convierte de mL a L por cmH2O; R en cmH2O·s/L. Constante temporal τ=RC en segundos.",
  "limits": "Un compartimento pasivo educativo con presión impuesta y sin esfuerzo muscular, histéresis, gasometría ni decisiones clínicas. La geometría pulmonar es esquemática y el volumen se amplifica.",
  "scale": "Pulmón educativo RC · inspiración/espiración de 2 s",
  "controls": [
    {
      "key": "compliance",
      "label": "Distensibilidad",
      "min": 20,
      "max": 80,
      "step": 5,
      "initial": 50,
      "unit": "mL/cmH2O"
    },
    {
      "key": "resistance",
      "label": "Resistencia de vía aérea",
      "min": 5,
      "max": 30,
      "step": 1,
      "initial": 10,
      "unit": "cmH2O·s/L"
    }
  ],
  "readings": [
    {
      "key": "phase",
      "label": "Fase del ciclo",
      "unit": "s"
    },
    {
      "key": "volume",
      "label": "Volumen sobre referencia",
      "unit": "mL",
      "scale": 1000,
      "digits": 5
    },
    {
      "key": "flow",
      "label": "Flujo",
      "unit": "L/s",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "pressure",
      "label": "Presión inspiratoria impuesta",
      "unit": "cmH2O",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Constante temporal RC",
  "answerUnit": "s",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · mecánica respiratoria",
      "url": "https://openstax.org/books/biology/pages/39-3-breathing"
    }
  ],
  "concepts": [
    {
      "title": "Distensibilidad",
      "description": "C relaciona volumen y presión elástica."
    },
    {
      "title": "Resistencia",
      "description": "R limita la rapidez del llenado."
    },
    {
      "title": "Tiempo",
      "description": "RC determina la constante temporal."
    }
  ],
  "quiz": [
    {
      "pregunta": "La constante temporal es…",
      "opciones": [
        "R por C.",
        "R más C sin unidades.",
        "C dividida entre temperatura.",
        "El número de alvéolos dibujados."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "El producto tiene unidades de segundos."
    },
    {
      "pregunta": "Aumentar R a igual C hace el llenado…",
      "opciones": [
        "Más lento.",
        "Más rápido siempre.",
        "Instantáneo.",
        "Independiente del tiempo."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Aumenta RC."
    },
    {
      "pregunta": "Este simulador permite ajustar un ventilador de un paciente…",
      "opciones": [
        "No: es un modelo educativo.",
        "Sí, sin mediciones.",
        "Sí, sólo con su imagen.",
        "Sí, para toda edad."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "No representa evaluación clínica."
    }
  ],
  "plotX": "phase",
  "plotKey": "volume",
  "sampleEvery": 0.02
},model:pulmon};
export default definition;
