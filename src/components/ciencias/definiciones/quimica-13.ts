import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {ftir} from '@/domain/ciencias/procesos';
const definition:PracticaCiencia={...{
  "id": "quimica-13",
  "title": "Espectroscopía FTIR: identificar grupos funcionales",
  "intro": "Enlaces vibran al absorber radiación; relacionar estructura y bandas espectrales.",
  "mission": "Calcula el número de onda de estiramiento del enlace C–O idealizado y localiza su banda.",
  "formula": "ν̃=(1/2πc)√(k/μ); μ=mC mO/(mC+mO), mC=12 u, 1 u=1,66053906892·10⁻²⁷ kg, c=2,99792458·10¹⁰ cm/s. Banda gaussiana de FWHM 35 cm⁻¹, altura A=0,85.",
  "limits": "Oscilador armónico diatómico ilustrativo de un grupo carbonilo; no espectro de una molécula completa, acoplamientos, anharmonicidad ni biblioteca de identificación.",
  "scale": "Enlace vibracional · desplazamiento ampliado · banda sintética",
  "controls": [
    {
      "key": "stiffness",
      "label": "Constante de fuerza",
      "min": 800,
      "max": 1500,
      "step": 50,
      "initial": 1200,
      "unit": "N/m"
    },
    {
      "key": "isotope",
      "label": "Masa isotópica del oxígeno",
      "min": 16,
      "max": 18,
      "step": 1,
      "initial": 16,
      "unit": "u"
    }
  ],
  "readings": [
    {
      "key": "scan",
      "label": "Número de onda barrido",
      "unit": "cm⁻¹",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "absorbance",
      "label": "Absorbancia",
      "unit": "",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Número de onda del modo",
  "answerUnit": "cm⁻¹",
  "tolerance": 0.03,
  "source": [
    {
      "name": "OpenStax · química y balances",
      "url": "https://openstax.org/books/chemistry-2e/pages/1-introduction"
    }
  ],
  "concepts": [
    {
      "title": "Masa reducida",
      "description": "Ambos átomos participan en la vibración."
    },
    {
      "title": "Rigidez",
      "description": "Una fuerza de enlace mayor eleva la frecuencia."
    },
    {
      "title": "Isótopos",
      "description": "Una masa mayor desplaza la banda a menor frecuencia."
    }
  ],
  "quiz": [
    {
      "pregunta": "Sustituir O16 por O18 desplaza la banda…",
      "opciones": [
        "Hacia menor número de onda.",
        "Hacia mayor número de onda.",
        "Siempre a cero.",
        "Sin ningún cambio."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La masa reducida aumenta."
    },
    {
      "pregunta": "El número de onda se expresa en…",
      "opciones": [
        "cm⁻¹.",
        "cm.",
        "kg.",
        "A."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Es el inverso de la longitud de onda."
    },
    {
      "pregunta": "Una banda de este banco permite identificar una sustancia completa…",
      "opciones": [
        "No, sólo representa un modo idealizado.",
        "Sí, sin ninguna otra señal.",
        "Sí, por la masa del equipo.",
        "Sí, independientemente de mezclas."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "Faltan otros modos y una biblioteca experimental."
    }
  ],
  "plotX": "scan",
  "plotKey": "absorbance",
  "sampleEvery": 0.02
},model:ftir};
export default definition;
