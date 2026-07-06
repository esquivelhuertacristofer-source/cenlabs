import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿De qué factor NO depende el periodo de un péndulo simple (para ángulos pequeños)?",
      opciones: ["Longitud de la cuerda", "Gravedad", "Masa de la lenteja", "Amplitud inicial"],
      respuestaCorrecta: 2,
      explicacion: "En el modelo ideal, la masa no afecta el tiempo que tarda en oscilar. Todos los péndulos de igual longitud tienen el mismo periodo."
    },
    {
      pregunta: "Si cuadruplicamos la longitud de la cuerda (L), el periodo (T):",
      opciones: ["Se cuadruplica", "Se duplica", "Se reduce a la mitad", "No cambia"],
      respuestaCorrecta: 1,
      explicacion: "T es proporcional a √L. Si L aumenta por 4, T aumenta por √4 = 2."
    },
    {
      pregunta: "¿Dónde tiene el péndulo su máxima velocidad?",
      opciones: ["En los extremos", "En el punto más bajo (equilibrio)", "A mitad de camino", "Es constante"],
      respuestaCorrecta: 1,
      explicacion: "En el punto más bajo, toda la energía potencial se ha convertido en energía cinética."
    },
    {
      pregunta: "A mayor gravedad (g), el periodo de oscilación es:",
      opciones: ["Mayor (más lento)", "Menor (más rápido)", "Igual", "Cero"],
      respuestaCorrecta: 1,
      explicacion: "La gravedad tira con más fuerza, haciendo que el péndulo regrese más rápido al centro (T ∝ 1/√g)."
    },
    {
      pregunta: "¿Qué tipo de movimiento describe el péndulo?",
      opciones: ["Movimiento Rectilíneo Uniforme", "Movimiento Armónico Simple (MAS)", "Movimiento Parabólico", "Caída Libre"],
      respuestaCorrecta: 1,
      explicacion: "Es un movimiento periódico de vaivén donde la fuerza es proporcional al desplazamiento."
    },
    {
      pregunta: "En los extremos de la oscilación, la energía es puramente:",
      opciones: ["Cinética", "Potencial gravitatoria", "Térmica", "Eléctrica"],
      respuestaCorrecta: 1,
      explicacion: "En el extremo, el péndulo se detiene instantáneamente (V=0), por lo que solo tiene energía debida a su altura."
    },
    {
      pregunta: "La aproximación de 'ángulos pequeños' se usa porque:",
      opciones: ["Se ve mejor", "Permite usar sin(θ) ≈ θ (en radianes)", "La cuerda no se rompe", "Evita el viento"],
      respuestaCorrecta: 1,
      explicacion: "Esta simplificación matemática convierte la ecuación diferencial en una lineal fácil de resolver."
    },
    {
      pregunta: "¿Qué sucede con el periodo si llevamos el péndulo a la Luna (menor gravedad)?",
      opciones: ["Oscila más rápido (T disminuye)", "Oscila más lento (T aumenta)", "No cambia", "Se detiene"],
      respuestaCorrecta: 1,
      explicacion: "Como T ∝ 1/√g, una gravedad menor hace que el periodo sea mayor (el péndulo es más 'perezoso')."
    },
    {
      pregunta: "La frecuencia (f) de un péndulo es:",
      opciones: ["Igual al periodo", "El inverso del periodo (1/T)", "Masa por gravedad", "Longitud por tiempo"],
      respuestaCorrecta: 1,
      explicacion: "La frecuencia mide cuántas oscilaciones ocurren en un segundo (Hertz)."
    },
    {
      pregunta: "En el punto de máxima amplitud (extremo), la aceleración es:",
      opciones: ["Cero", "Máxima", "9.8 m/s² constante", "Depende de la masa"],
      respuestaCorrecta: 1,
      explicacion: "En el extremo, la fuerza restauradora es máxima, por lo que la aceleración también lo es."
    },
    {
      pregunta: "Si un péndulo tiene un periodo de 2 segundos, su frecuencia es:",
      opciones: ["2 Hz", "1 Hz", "0.5 Hz", "4 Hz"],
      respuestaCorrecta: 2,
      explicacion: "f = 1 / T = 1 / 2 = 0.5 Hertz."
    },
    {
      pregunta: "¿Qué componente del peso actúa como fuerza restauradora?",
      opciones: ["m*g*cos(θ)", "m*g*sin(θ)", "m*g", "La tensión de la cuerda"],
      respuestaCorrecta: 1,
      explicacion: "Es la componente tangencial la que empuja al péndulo de vuelta a su posición de equilibrio."
    },
    {
      pregunta: "Un péndulo de Foucault se usa para demostrar:",
      opciones: ["La gravedad de Newton", "La rotación de la Tierra", "La velocidad del sonido", "La elasticidad del aire"],
      respuestaCorrecta: 1,
      explicacion: "El plano de oscilación parece rotar debido al movimiento de rotación terrestre bajo el péndulo."
    },
    {
      pregunta: "¿Qué le sucede a la energía total del sistema si hay fricción?",
      opciones: ["Aumenta", "Se mantiene constante", "Disminuye (se disipa como calor)", "Se vuelve potencial"],
      respuestaCorrecta: 2,
      explicacion: "La fricción convierte la energía mecánica en energía térmica, reduciendo la amplitud de la oscilación."
    }
  ];

export default quiz;
