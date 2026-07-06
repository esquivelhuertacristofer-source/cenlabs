import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿Qué indica un discriminante (Δ) mayor a cero en una función cuadrática?",
      opciones: ["Que la parábola no toca el eje X", "Que existen dos raíces reales y distintas", "Que el vértice está en el origen", "Que la función es una línea recta"],
      respuestaCorrecta: 1,
      explicacion: "Si Δ > 0, la fórmula general produce dos valores reales distintos, lo que geométricamente significa que la parábola corta el eje X en dos puntos."
    },
    {
      pregunta: "Si el coeficiente 'a' es negativo, la parábola...",
      opciones: ["Es cóncava hacia arriba", "Se desplaza a la derecha", "Es cóncava hacia abajo", "No tiene vértice"],
      respuestaCorrecta: 2,
      explicacion: "El signo de 'a' determina la concavidad. Un valor negativo indica que las ramas de la parábola se abren hacia abajo (punto máximo)."
    },
    {
      pregunta: "¿Cómo se calcula la coordenada 'h' del vértice de la parábola?",
      opciones: ["h = -b / 2a", "h = b² - 4ac", "h = c / a", "h = √(a² + b²)"],
      respuestaCorrecta: 0,
      explicacion: "La fórmula h = -b/2a permite localizar el eje de simetría de la parábola, donde se encuentra el vértice."
    },
    {
      pregunta: "¿Qué sucede con la parábola si el coeficiente 'c' aumenta?",
      opciones: ["Se vuelve más angosta", "Se desplaza verticalmente hacia arriba", "Cambia de concavidad", "Se desplaza horizontalmente"],
      respuestaCorrecta: 1,
      explicacion: "El coeficiente 'c' representa la ordenada al origen f(0). Al aumentarlo, toda la gráfica sube por el eje Y."
    },
    {
      pregunta: "En una trayectoria balística modelada por y = -0.5x² + 2x, ¿cuál es la altura máxima?",
      opciones: ["2 unidades", "4 unidades", "1 unidad", "0 unidades"],
      respuestaCorrecta: 0,
      explicacion: "El vértice está en x = -2/(2*-0.5) = 2. Evaluando f(2) = -0.5(4) + 2(2) = -2 + 4 = 2."
    },
    {
      pregunta: "Si el discriminante Δ es exactamente igual a cero...",
      opciones: ["Hay dos raíces complejas", "No hay solución", "Hay una única raíz real (raíz doble)", "La parábola es cóncava"],
      respuestaCorrecta: 2,
      explicacion: "Δ = 0 significa que la parábola es tangente al eje X en un solo punto, lo que se conoce como raíz doble."
    },
    {
      pregunta: "La forma vértice de una cuadrática es a(x-h)² + k. ¿Qué representa 'k'?",
      opciones: ["La pendiente inicial", "La altura (ordenada) del vértice", "La intersección con X", "El foco de la parábola"],
      respuestaCorrecta: 1,
      explicacion: "En la forma vértice, el par (h, k) indica las coordenadas exactas del punto máximo o mínimo de la función."
    },
    {
      pregunta: "¿Qué sucede con la parábola si el coeficiente 'a' se acerca a cero?",
      opciones: ["Se vuelve más angosta", "Se vuelve más ancha y plana", "Se desplaza a la derecha", "Desaparece"],
      respuestaCorrecta: 1,
      explicacion: "Al disminuir 'a', la curvatura se reduce, haciendo que la parábola se abra más."
    },
    {
      pregunta: "¿Cuál es la suma de las raíces de x² + 7x + 10 según el teorema de Vieta?",
      opciones: ["7", "-7", "10", "-10"],
      respuestaCorrecta: 1,
      explicacion: "La suma de las raíces es -b/a. En este caso -7/1 = -7."
    },
    {
      pregunta: "¿Cuál es el producto de las raíces de 2x² - 4x + 8?",
      opciones: ["4", "-4", "8", "-8"],
      respuestaCorrecta: 0,
      explicacion: "El producto de las raíces es c/a. En este caso 8/2 = 4."
    },
    {
      pregunta: "Si Δ = -16, ¿qué tipo de raíces tiene la ecuación?",
      opciones: ["Dos reales distintas", "Una real doble", "Dos complejas conjugadas", "No tiene raíces"],
      respuestaCorrecta: 2,
      explicacion: "Un discriminante negativo implica que la solución requiere la raíz cuadrada de un número negativo, resultando en números complejos."
    },
    {
      pregunta: "¿En qué punto corta al eje Y la función f(x) = 3x² - 5x + 12?",
      opciones: ["(0, 3)", "(0, -5)", "(0, 12)", "(12, 0)"],
      respuestaCorrecta: 2,
      explicacion: "La intersección con el eje Y ocurre cuando x=0, lo que deja f(0) = c = 12."
    },
    {
      pregunta: "¿Cuál es el eje de simetría de la función f(x) = x² + 10x - 5?",
      opciones: ["x = 5", "x = -5", "x = 10", "x = -10"],
      respuestaCorrecta: 1,
      explicacion: "El eje de simetría es x = -b/2a = -10/(2*1) = -5."
    },
    {
      pregunta: "Si una parábola tiene raíces en x=2 y x=4, ¿cuál es su eje de simetría?",
      opciones: ["x = 2", "x = 4", "x = 3", "x = 6"],
      respuestaCorrecta: 2,
      explicacion: "El eje de simetría siempre se encuentra en el punto medio de las raíces: (2+4)/2 = 3."
    }
  ];

export default quiz;
