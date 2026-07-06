import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿Qué distribución de probabilidad se observa en la Máquina de Galton?",
      opciones: ["Uniforme", "Binomial (que tiende a Normal)", "Exponencial", "Poisson"],
      respuestaCorrecta: 1,
      explicacion: "Cada choque es un evento de Bernoulli (50/50). La suma de muchos eventos independientes resulta en una distribución binomial."
    },
    {
      pregunta: "A medida que aumenta el número de bolitas, el histograma se asemeja a:",
      opciones: ["Una línea recta", "Una Campana de Gauss", "Un círculo", "Un triángulo equilátero"],
      respuestaCorrecta: 1,
      explicacion: "Este es el Teorema del Límite Central: la suma de variables aleatorias tiende a una distribución normal."
    },
    {
      pregunta: "¿Dónde es más probable que caiga una bolita si p=0.5?",
      opciones: ["En los extremos", "En el centro", "Es igual en todos lados", "Depende de la gravedad"],
      respuestaCorrecta: 1,
      explicacion: "Hay muchos más caminos posibles para llegar a los contenedores centrales que a los extremos."
    },
    {
      pregunta: "¿Qué sucede si inclinamos la máquina (cambiamos p)?",
      opciones: ["La campana se vuelve plana", "La campana se desplaza hacia un lado (sesgo)", "La campana no cambia", "Las bolitas no caen"],
      respuestaCorrecta: 1,
      explicacion: "Si p ≠ 0.5, la media de la distribución cambia, moviendo el pico de la campana."
    },
    {
      pregunta: "La probabilidad de que una bolita caiga exactamente en un contenedor extremo es:",
      opciones: ["Muy alta", "Muy baja", "50%", "100%"],
      respuestaCorrecta: 1,
      explicacion: "Para llegar al extremo, la bolita debe rebotar hacia el mismo lado en cada fila, lo cual es estadísticamente improbable."
    },
    {
      pregunta: "Sir Francis Galton inventó esta máquina para demostrar:",
      opciones: ["La gravedad", "La herencia y la variación estadística", "La velocidad de la luz", "El magnetismo"],
      respuestaCorrecta: 1,
      explicacion: "Buscaba ilustrar cómo el orden surge del caos aparente del azar."
    },
    {
      pregunta: "¿Cuántas capas de clavos tiene un tablero estándar de Galton?",
      opciones: ["1", "Generalmente entre 8 y 12", "100", "0"],
      respuestaCorrecta: 1,
      explicacion: "Suficientes para crear una distribución visible pero manejable."
    },
    {
      pregunta: "¿Qué es la 'Media' en estadística?",
      opciones: ["El valor que más se repite", "El promedio aritmético", "El valor central", "La diferencia entre el mayor y el menor"],
      respuestaCorrecta: 1,
      explicacion: "Se obtiene sumando todos los valores y dividiendo entre el total."
    },
    {
      pregunta: "¿Qué representa la 'Desviación Estándar'?",
      opciones: ["El promedio", "La dispersión de los datos respecto a la media", "El valor máximo", "El número de datos"],
      respuestaCorrecta: 1,
      explicacion: "Indica qué tan 'extendida' o 'agrupada' está la campana de datos."
    },
    {
      pregunta: "En una distribución normal, ¿qué porcentaje de datos cae dentro de ±1 desviación estándar?",
      opciones: ["50%", "68%", "95%", "99%"],
      respuestaCorrecta: 1,
      explicacion: "Es una propiedad fundamental de la campana de Gauss (Regla 68-95-99.7)."
    },
    {
      pregunta: "¿Qué es un 'Espacio Muestral'?",
      opciones: ["Un lugar físico", "El conjunto de todos los resultados posibles de un experimento", "La media de los datos", "Un error de medición"],
      respuestaCorrecta: 1,
      explicacion: "Contiene todas las opciones posibles (ej: {Cara, Cruz} en una moneda)."
    },
    {
      pregunta: "La probabilidad de un evento imposible es:",
      opciones: ["1", "0", "0.5", "-1"],
      respuestaCorrecta: 1,
      explicacion: "Los valores de probabilidad van de 0 (imposible) a 1 (seguro)."
    },
    {
      pregunta: "¿Qué es la 'Moda'?",
      opciones: ["El valor más grande", "El valor que aparece con mayor frecuencia", "El promedio", "La mitad"],
      respuestaCorrecta: 1,
      explicacion: "Es el dato que más se repite en la muestra."
    },
    {
      pregunta: "Si lanzas dos monedas, ¿cuál es la probabilidad de obtener dos caras?",
      opciones: ["1/2", "1/4", "1/8", "1"],
      respuestaCorrecta: 1,
      explicacion: "Los casos posibles son {CC, CX, XC, XX}. Solo uno es CC. 1/4 = 25%."
    }
  ];

export default quiz;
