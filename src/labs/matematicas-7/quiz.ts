import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿Qué es el índice de refracción (n)?",
      opciones: ["La velocidad de la luz", "La relación entre la velocidad de la luz en el vacío y en el medio", "El ángulo de rebote", "La densidad del cristal"],
      respuestaCorrecta: 1,
      explicacion: "n = c / v. Indica cuánto se frena la luz al entrar en un material."
    },
    {
      pregunta: "Si la luz pasa de aire (n=1) a agua (n=1.33), el rayo:",
      opciones: ["Se aleja de la normal", "Se acerca a la normal", "No cambia de dirección", "Desaparece"],
      respuestaCorrecta: 1,
      explicacion: "Al entrar en un medio más denso (mayor n), la luz se frena y el ángulo disminuye, acercándose a la línea normal."
    },
    {
      pregunta: "¿Cuál es el valor máximo posible para el seno de un ángulo?",
      opciones: ["π", "Infinity", "1", "0"],
      respuestaCorrecta: 2,
      explicacion: "El rango de la función seno está estrictamente entre -1 y 1."
    },
    {
      pregunta: "La Ley de Snell relaciona:",
      opciones: ["Fuerza y aceleración", "Presión y volumen", "Índices de refracción y senos de los ángulos", "Masa y energía"],
      respuestaCorrecta: 2,
      explicacion: "Establece que n1 * sin(θ1) = n2 * sin(θ2)."
    },
    {
      pregunta: "¿Qué sucede en el 'Ángulo Crítico'?",
      opciones: ["La luz se absorbe", "Ocurre la reflexión total interna", "La luz cambia de color", "El cristal se rompe"],
      respuestaCorrecta: 1,
      explicacion: "Es el ángulo de incidencia para el cual el ángulo de refracción es 90°. Más allá de este punto, la luz no sale del medio."
    },
    {
      pregunta: "Si n2 es mayor que n1, ¿cómo es sin(θ2) comparado con sin(θ1)?",
      opciones: ["Igual", "Mayor", "Menor", "Cero"],
      respuestaCorrecta: 2,
      explicacion: "Por la Ley de Snell, si n aumenta, sin(θ) debe disminuir para mantener la igualdad."
    },
    {
      pregunta: "¿Cuál es el índice de refracción del vacío?",
      opciones: ["0", "1", "1.33", "1.5"],
      respuestaCorrecta: 1,
      explicacion: "En el vacío la luz viaja a su velocidad máxima 'c', por lo que n = c/c = 1."
    },
    {
      pregunta: "¿Qué le sucede a la longitud de onda de la luz al entrar en un medio con mayor n?",
      opciones: ["Aumenta", "Disminuye", "No cambia", "Desaparece"],
      respuestaCorrecta: 1,
      explicacion: "Como la frecuencia es constante y la velocidad baja, la longitud de onda debe disminuir."
    },
    {
      pregunta: "Si el ángulo de incidencia es 0° (luz perpendicular), ¿cuál es el ángulo de refracción?",
      opciones: ["90°", "45°", "0°", "Depende del material"],
      respuestaCorrecta: 2,
      explicacion: "La luz perpendicular no se desvía, aunque su velocidad sí cambie."
    },
    {
      pregunta: "¿Cuál es el fenómeno responsable del arcoíris?",
      opciones: ["Solo reflexión", "Difracción", "Dispersión (refracción variable según el color)", "Magnetismo"],
      respuestaCorrecta: 2,
      explicacion: "Cada color tiene un índice n ligeramente diferente en el agua, separándose al refractarse."
    },
    {
      pregunta: "¿Por qué un lápiz parece quebrado en un vaso con agua?",
      opciones: ["Por la presión del agua", "Por la refracción de la luz al cambiar de medio", "Por una ilusión óptica del cerebro", "Por la gravedad"],
      respuestaCorrecta: 1,
      explicacion: "La luz que viene del lápiz se dobla al salir del agua, haciendo que parezca estar en otra posición."
    },
    {
      pregunta: "En la fibra óptica, la luz se mantiene dentro del cable debido a:",
      opciones: ["Espejos internos", "Reflexión Total Interna", "Pintura oscura", "Electricidad"],
      respuestaCorrecta: 1,
      explicacion: "Al entrar con un ángulo mayor al crítico, la luz rebota internamente sin salir del núcleo."
    },
    {
      pregunta: "Si n = 2, ¿a qué velocidad viaja la luz en ese medio?",
      opciones: ["c", "c / 2 (150,000 km/s)", "2c", "c / 4"],
      respuestaCorrecta: 1,
      explicacion: "n = c/v, por lo tanto v = c/n = c/2."
    },
    {
      pregunta: "¿Cuál es el índice de refracción aproximado del diamante?",
      opciones: ["1.0", "1.33", "1.5", "2.42"],
      respuestaCorrecta: 3,
      explicacion: "Su alto índice de refracción es lo que le da su brillo característico al atrapar la luz."
    }
  ];

export default quiz;
