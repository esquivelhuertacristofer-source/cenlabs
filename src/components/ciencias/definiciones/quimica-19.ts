import type {PracticaCiencia} from '@/domain/ciencias/tipos';
import {xrd} from '@/domain/ciencias/quimica';
const definition:PracticaCiencia={...{
  "id": "quimica-19",
  "title": "Difracción de rayos X: reconocer una estructura cristalina",
  "intro": "Una red cristalina interactúa con el haz; interpretar distancias y patrones de difracción.",
  "mission": "Identifica el primer pico111 del patrón FCC y calcula el parámetro de red cúbica en ångströms.",
  "formula": "Bragg:2d sinθ=λ, con d_hkl=a/√(h²+k²+l²). Red FCC ideal con reflexiones111,200,220,311,222,400. Ensanchamiento gaussiano: FWHM=0,9λ/(Dcosθ), λ yD en la misma unidad. Barrido2θ de10 a90° en6 s; muestreo cada0,01 s. Intensidades relativas por multiplicidades simplificadas.",
  "limits": "Cristal sintético cúbico centrado en caras; a reservado como incógnita, no composición química de un metal comercial. Sin factor atómico dependiente de ángulo, polarización, textura, doblete Kα, microdeformación o fondo instrumental. Resolución angular de muestreo0,133°; el banco no acepta estimar con precisión el ancho de picos más estrechos que esa resolución. Conos de dispersión y planos son representaciones del principio. Los haces verdes son guías de trayectoria; no representan luz visible emitida por los rayos X.",
  "scale": "Red FCC sintética · barrido10–90° · intensidades relativas simplificadas",
  "controls": [
    {
      "key": "wavelength",
      "label": "Longitud de onda de rayos X",
      "min": 1,
      "max": 1.8,
      "step": 0.02,
      "unit": "Å",
      "initial": 1.54
    },
    {
      "key": "size",
      "label": "Tamaño coherente de cristalito",
      "min": 20,
      "max": 100,
      "step": 5,
      "unit": "nm",
      "initial": 40
    }
  ],
  "readings": [
    {
      "key": "intensity",
      "label": "Señal del detector",
      "unit": "u.a.",
      "scale": 1,
      "digits": 5
    },
    {
      "key": "scan",
      "label": "Ángulo de barrido2θ",
      "unit": "°",
      "scale": 1,
      "digits": 5
    }
  ],
  "answerLabel": "Parámetro de red",
  "answerUnit": "Å",
  "tolerance": 0.03,
  "source": [
    {
      "name": "IUCr · ley de Bragg",
      "url": "https://dictionary.iucr.org/Bragg%27s_law"
    }
  ],
  "concepts": [
    {
      "title": "Planos cristalinos",
      "description": "Cada familia tiene una separación geométrica característica."
    },
    {
      "title": "Bragg",
      "description": "El detector registra2θ mientras la condición usaθ."
    },
    {
      "title": "Resolución",
      "description": "El muestreo y el ancho del pico limitan la lectura."
    }
  ],
  "quiz": [
    {
      "pregunta": "¿Qué ángulo se usa dentro del seno de Bragg si el detector indica2θ?",
      "opciones": [
        "La mitad del ángulo del detector.",
        "El doble del ángulo del detector.",
        "Siempre90°.",
        "El doble adicional de la lectura 2θ."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "La geometría del equipo informa2θ."
    },
    {
      "pregunta": "¿Cómo relacionas d111 y el parámetro de red FCC cúbica?",
      "opciones": [
        "a=√3·d111.",
        "a=d111/3.",
        "a=2θ·λ.",
        "a depende sólo del tamaño de cristalito."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "d_hkl=a/√(h²+k²+l²)."
    },
    {
      "pregunta": "¿Qué hace disminuir D en el modelo de Scherrer?",
      "opciones": [
        "Ensancha los picos.",
        "Cambia necesariamente la composición química.",
        "Elimina la longitud de onda incidente.",
        "Hace que el ángulo del detector sea siempre cero."
      ],
      "respuestaCorrecta": 0,
      "explicacion": "El ancho es inversamente proporcional al tamaño coherente."
    }
  ],
  "sampleEvery": 0.01,
  "plotKey": "intensity",
  "plotX": "scan"
},model:xrd};
export default definition;
