import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿Cuál es el método más directo para resolver el sistema si una variable está despejada?",
      opciones: ["Reducción", "Sustitución", "Igualación", "Determinantes"],
      respuestaCorrecta: 1,
      explicacion: "La sustitución permite reemplazar la expresión de la variable despejada en la otra ecuación, reduciéndola a una sola variable."
    },
    {
      pregunta: "Geométricamente, la solución de un sistema 2x2 representa:",
      opciones: ["El área entre las rectas", "La pendiente promedio", "El punto de intersección de las dos rectas", "La suma de las ordenadas"],
      respuestaCorrecta: 2,
      explicacion: "Cada ecuación representa una línea en el plano; el par ordenado que satisface ambas es donde las líneas se cruzan."
    },
    {
      pregunta: "Si las rectas son paralelas y no coinciden, el sistema es:",
      opciones: ["Compatible determinado", "Compatible indeterminado", "Inconsistente (sin solución)", "Lineal simple"],
      respuestaCorrecta: 2,
      explicacion: "Rectas paralelas nunca se cruzan, por lo que no existe ningún punto (x,y) que satisfaga ambas ecuaciones simultáneamente."
    },
    {
      pregunta: "En el método de reducción, el objetivo es:",
      opciones: ["Graficar las funciones", "Eliminar una variable sumando o restando ecuaciones", "Multiplicar por cero", "Despejar 'y'"],
      respuestaCorrecta: 1,
      explicacion: "Al igualar coeficientes y sumar/restar, una variable desaparece, permitiendo resolver la ecuación resultante fácilmente."
    },
    {
      pregunta: "¿Qué sucede si al resolver obtenemos una identidad como 0 = 0?",
      opciones: ["No hay solución", "La solución es x=0", "Hay infinitas soluciones (rectas coincidentes)", "El sistema está mal planteado"],
      respuestaCorrecta: 2,
      explicacion: "Una identidad significa que ambas ecuaciones representan la misma recta, por lo que todos sus puntos son soluciones."
    },
    {
      pregunta: "Si la pendiente m1 es igual a m2, pero b1 es diferente de b2:",
      opciones: ["Se cruzan en el origen", "Son la misma recta", "Son paralelas", "Son perpendiculares"],
      respuestaCorrecta: 2,
      explicacion: "Pendientes iguales indican la misma inclinación. Al tener diferentes interceptos (b), son líneas distintas pero paralelas."
    },
    {
      pregunta: "¿Cuál es la pendiente de la recta x + y = 5?",
      opciones: ["1", "-1", "5", "0"],
      respuestaCorrecta: 1,
      explicacion: "Despejando y: y = -x + 5. El coeficiente de x es -1."
    },
    {
      pregunta: "Si un sistema tiene infinitas soluciones, las rectas son:",
      opciones: ["Paralelas", "Perpendiculares", "Coincidentes (la misma recta)", "Secantes"],
      respuestaCorrecta: 2,
      explicacion: "Cuando ambas ecuaciones representan la misma línea, todos los puntos de la recta satisfacen el sistema."
    },
    {
      pregunta: "¿Qué indica un determinante (D) igual a cero en el método de Cramer?",
      opciones: ["Solución única", "El sistema no tiene solución única (es inconsistente o dependiente)", "La solución es (0,0)", "Hay que sumar las ecuaciones"],
      respuestaCorrecta: 1,
      explicacion: "Si el determinante principal es cero, el sistema no tiene una intersección única definida."
    },
    {
      pregunta: "¿Cuál es el valor de 'y' si x=2 en el sistema: x+y=5, 2x-y=1?",
      opciones: ["3", "2", "1", "4"],
      respuestaCorrecta: 0,
      explicacion: "Sustituyendo x=2 en la primera ecuación: 2+y=5 => y=3. Verificando en la segunda: 2(2)-3 = 4-3 = 1."
    },
    {
      pregunta: "¿Cómo se llaman las rectas que se cruzan formando un ángulo de 90 grados?",
      opciones: ["Paralelas", "Oblicuas", "Perpendiculares", "Asintóticas"],
      respuestaCorrecta: 2,
      explicacion: "Las rectas perpendiculares tienen pendientes cuyo producto es -1."
    },
    {
      pregunta: "Si m1 = 2, ¿cuál debe ser la pendiente m2 para que las rectas sean paralelas?",
      opciones: ["2", "-2", "0.5", "-0.5"],
      respuestaCorrecta: 0,
      explicacion: "Rectas paralelas tienen exactamente la misma pendiente."
    },
    {
      pregunta: "En un sistema 2x2, si m1 * m2 = -1, las rectas son:",
      opciones: ["Paralelas", "Coincidentes", "Perpendiculares", "Horizontales"],
      respuestaCorrecta: 2,
      explicacion: "Esta es la condición matemática para la perpendicularidad entre dos rectas."
    },
    {
      pregunta: "¿Cuál es el primer paso recomendado en el método de igualación?",
      opciones: ["Sumar las ecuaciones", "Despejar la misma variable en ambas ecuaciones", "Graficar", "Multiplicar por -1"],
      respuestaCorrecta: 1,
      explicacion: "Al despejar la misma variable, podemos igualar las expresiones resultantes para encontrar la otra incógnita."
    }
  ];

export default quiz;
