import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿Qué sucede entre dos cargas del mismo signo (ej: positiva y positiva)?",
      opciones: ["Se atraen", "Se repelen", "No interactúan", "Se anulan"],
      respuestaCorrecta: 1,
      explicacion: "Cargas iguales se repelen; cargas opuestas se atraen. Es el principio fundamental de la electrostática."
    },
    {
      pregunta: "La Ley de Coulomb establece que la fuerza es inversamente proporcional al:",
      opciones: ["Producto de las cargas", "Cuadrado de la distancia", "Tiempo", "Voltaje"],
      respuestaCorrecta: 1,
      explicacion: "Si duplicas la distancia, la fuerza se reduce a la cuarta parte (1/2²)."
    },
    {
      pregunta: "¿Cuál es la unidad de carga eléctrica en el SI?",
      opciones: ["Newton", "Faradio", "Coulomb (C)", "Amperio"],
      respuestaCorrecta: 2,
      explicacion: "Un Coulomb es una cantidad enorme de carga (aprox. 6.24 x 10^18 electrones)."
    },
    {
      pregunta: "Un objeto neutro tiene:",
      opciones: ["Solo neutrones", "Igual número de protones y electrones", "Ninguna partícula", "Solo electrones"],
      respuestaCorrecta: 1,
      explicacion: "La neutralidad eléctrica significa que las cargas positivas y negativas se cancelan exactamente."
    },
    {
      pregunta: "¿Qué partícula se mueve realmente cuando frotamos un globo para cargarlo?",
      opciones: ["Los Protones", "Los Neutrones", "Los Electrones", "Los Positrones"],
      respuestaCorrecta: 2,
      explicacion: "Los protones están atrapados en el núcleo. Solo los electrones periféricos pueden transferirse entre materiales."
    },
    {
      pregunta: "La constante de Coulomb (k) es aproximadamente:",
      opciones: ["9.8", "3 x 10^8", "9 x 10^9 N·m²/C²", "1.6 x 10^-19"],
      respuestaCorrecta: 2,
      explicacion: "Es una constante muy grande, lo que indica que las fuerzas eléctricas son mucho más fuertes que las gravitatorias."
    },
    {
      pregunta: "Si aumentamos el valor de una de las cargas al doble, la fuerza:",
      opciones: ["Se mantiene igual", "Se duplica", "Se reduce a la mitad", "Se cuadriplica"],
      respuestaCorrecta: 1,
      explicacion: "F es directamente proporcional al producto de las cargas (q1 * q2)."
    },
    {
      pregunta: "La unidad de carga en el SI es el:",
      opciones: ["Voltio", "Amperio", "Coulomb (C)", "Newton"],
      respuestaCorrecta: 2,
      explicacion: "Llamada así por Charles-Augustin de Coulomb."
    },
    {
      pregunta: "Un objeto con igual número de protones y electrones es:",
      opciones: ["Positivo", "Negativa", "Neutro", "Radiactivo"],
      respuestaCorrecta: 2,
      explicacion: "Las cargas se cancelan mutuamente, resultando en una carga neta cero."
    },
    {
      pregunta: "¿Qué partícula tiene carga positiva?",
      opciones: ["Electrón", "Neutrón", "Protón", "Fotón"],
      respuestaCorrecta: 2,
      explicacion: "Los protones se encuentran en el núcleo y definen la carga positiva del átomo."
    },
    {
      pregunta: "Un material dieléctrico es:",
      opciones: ["Un superconductor", "Un aislante que puede polarizarse", "Un metal líquido", "Un imán"],
      respuestaCorrecta: 1,
      explicacion: "Aunque no conduce, sus cargas internas se reorientan ante un campo externo."
    },
    {
      pregunta: "¿Qué sucede con la fuerza si duplicamos la distancia entre dos cargas?",
      opciones: ["Se duplica", "Se reduce a la mitad", "Se reduce a la cuarta parte", "No cambia"],
      respuestaCorrecta: 2,
      explicacion: "Por la ley del inverso del cuadrado: (1/2)² = 1/4."
    },
    {
      pregunta: "La carga eléctrica no se crea ni se destruye, solo se transfiere. Esto es:",
      opciones: ["Ley de Ohm", "Conservación de la Carga", "Efecto Joule", "Ley de Ampere"],
      respuestaCorrecta: 1,
      explicacion: "Principio fundamental de la física electromagnética."
    },
    {
      pregunta: "¿Cómo se llama el instrumento usado para detectar carga eléctrica?",
      opciones: ["Termómetro", "Electroscopio", "Barómetro", "Sismógrafo"],
      respuestaCorrecta: 1,
      explicacion: "Usa láminas metálicas que se separan cuando el dispositivo se carga."
    }
  ];

export default quiz;
