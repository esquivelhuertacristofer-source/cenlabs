import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿Qué representa la derivada de una función en un punto?",
      opciones: ["El área bajo la curva", "La pendiente de la recta tangente", "El valor promedio", "La intersección con Y"],
      respuestaCorrecta: 1,
      explicacion: "La derivada mide la tasa de cambio instantánea, que gráficamente es la inclinación de la tangente en ese punto."
    },
    {
      pregunta: "Si la derivada es positiva en un intervalo, la función es:",
      opciones: ["Constante", "Decreciente", "Creciente", "Vertical"],
      respuestaCorrecta: 2,
      explicacion: "Una derivada positiva indica que a medida que x aumenta, y también aumenta (pendiente positiva)."
    },
    {
      pregunta: "En un máximo o mínimo relativo, el valor de la derivada es:",
      opciones: ["1", "Infinito", "0", "Positivo"],
      respuestaCorrecta: 2,
      explicacion: "En los extremos, la recta tangente es horizontal, por lo que su pendiente (derivada) es nula."
    },
    {
      pregunta: "¿Cuál es la derivada de f(x) = x²?",
      opciones: ["x", "2x", "2", "x/2"],
      respuestaCorrecta: 1,
      explicacion: "Usando la regla de la potencia: d/dx(x^n) = n*x^(n-1)."
    },
    {
      pregunta: "Si f'(x) cambia de positivo a negativo en un punto c, hay un:",
      opciones: ["Mínimo", "Máximo", "Punto de inflexión", "Agujero"],
      respuestaCorrecta: 1,
      explicacion: "Si la función subía y luego baja, el punto de cambio es una cima o máximo."
    },
    {
      pregunta: "La derivada de una constante (como f(x) = 5) es:",
      opciones: ["5", "1", "0", "x"],
      respuestaCorrecta: 2,
      explicacion: "Una constante no cambia, por lo que su tasa de cambio es siempre cero."
    },
    {
      pregunta: "¿Qué estudia el Cálculo Diferencial?",
      opciones: ["Sumas acumuladas", "Cambios instantáneos y pendientes", "Volúmenes circulares", "Estadística"],
      respuestaCorrecta: 1,
      explicacion: "Se enfoca en analizar cómo varían las funciones de forma infinitesimal."
    },
    {
      pregunta: "¿Cuál es la derivada de f(x) = 3x² + 5x - 2?",
      opciones: ["6x + 5", "3x + 5", "6x", "x + 5"],
      respuestaCorrecta: 0,
      explicacion: "Derivando término a término: 2*3x + 1*5 - 0 = 6x + 5."
    },
    {
      pregunta: "Si f(x) = sin(x), ¿cuál es su derivada f'(x)?",
      opciones: ["-sin(x)", "cos(x)", "-cos(x)", "tan(x)"],
      respuestaCorrecta: 1,
      explicacion: "La derivada del seno es el coseno."
    },
    {
      pregunta: "Un 'Punto de Inflexión' es donde:",
      opciones: ["La función llega al máximo", "La curvatura (concavidad) cambia", "La función se corta", "La derivada es infinita"],
      respuestaCorrecta: 1,
      explicacion: "Es el punto donde la segunda derivada es cero y la función cambia de cóncava a convexa."
    },
    {
      pregunta: "¿Qué mide la SEGUNDA derivada f''(x)?",
      opciones: ["La pendiente", "La aceleración o concavidad", "El área", "La raíz"],
      respuestaCorrecta: 1,
      explicacion: "Mide qué tan rápido cambia la pendiente, lo que define la forma de la curva."
    },
    {
      pregunta: "En física, si la posición es s(t), ¿qué representa s'(t)?",
      opciones: ["La aceleración", "La velocidad", "La fuerza", "La masa"],
      respuestaCorrecta: 1,
      explicacion: "La derivada de la posición respecto al tiempo es la velocidad instantánea."
    },
    {
      pregunta: "¿Cuál es la derivada de la función exponencial f(x) = e^x?",
      opciones: ["xe^(x-1)", "e^x", "ln(x)", "1/x"],
      respuestaCorrecta: 1,
      explicacion: "Es la única función (no nula) que es su propia derivada."
    },
    {
      pregunta: "La 'Regla de la Cadena' se usa para derivar:",
      opciones: ["Sumas", "Productos", "Funciones compuestas (una dentro de otra)", "Constantes"],
      respuestaCorrecta: 2,
      explicacion: "Permite derivar f(g(x)) como f'(g(x)) * g'(x)."
    }
  ];

export default quiz;
