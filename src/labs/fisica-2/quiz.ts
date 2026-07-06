import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿Qué fuerza es responsable de que el bloque deslice por la rampa?",
      opciones: ["La Normal", "La componente tangencial del peso (Wx)", "La fricción", "La masa"],
      respuestaCorrecta: 1,
      explicacion: "Wx = m*g*sin(θ) es la fuerza que tira del bloque hacia abajo paralelamente a la superficie."
    },
    {
      pregunta: "La fuerza Normal (N) es siempre:",
      opciones: ["Vertical", "Horizontal", "Perpendicular a la superficie de contacto", "Igual al peso"],
      respuestaCorrecta: 2,
      explicacion: "La Normal es la reacción de la superficie contra el objeto y siempre actúa a 90° de dicha superficie."
    },
    {
      pregunta: "¿Qué sucede con la fuerza de fricción si aumentamos el ángulo de inclinación?",
      opciones: ["Aumenta", "Disminuye", "Se mantiene igual", "Se vuelve cero instantáneamente"],
      respuestaCorrecta: 1,
      explicacion: "Al aumentar el ángulo, la fuerza Normal (m*g*cosθ) disminuye, y como Fricción = μ*N, la fricción máxima también disminuye."
    },
    {
      pregunta: "La Segunda Ley de Newton establece que F = m * a. En la rampa, F es:",
      opciones: ["Wx + Fricción", "Wx - Fricción", "Solo el peso", "La Normal"],
      respuestaCorrecta: 1,
      explicacion: "La fuerza neta es la diferencia entre la fuerza que empuja hacia abajo (Wx) y la que se opone (Fricción)."
    },
    {
      pregunta: "Si el bloque está en reposo sobre la rampa, significa que:",
      opciones: ["No hay gravedad", "Wx es igual a la fricción estática", "No hay Normal", "La aceleración es 9.8"],
      respuestaCorrecta: 1,
      explicacion: "El equilibrio de fuerzas impide el movimiento; la fricción estática compensa exactamente la fuerza de deslizamiento."
    },
    {
      pregunta: "¿Cómo afecta la masa a la aceleración en un plano inclinado SIN fricción?",
      opciones: ["A mayor masa, mayor aceleración", "A mayor masa, menor aceleración", "No la afecta en absoluto", "La masa duplica la velocidad"],
      respuestaCorrecta: 2,
      explicacion: "Sin fricción, a = g*sin(θ). La masa se cancela en la ecuación, por lo que todos los objetos caen con la misma aceleración."
    },
    {
      pregunta: "¿Qué representa el coeficiente de fricción μ?",
      opciones: ["El peso del objeto", "La rugosidad entre las superficies", "El área de contacto", "La velocidad máxima"],
      respuestaCorrecta: 1,
      explicacion: "μ es un valor adimensional que mide qué tan 'difícil' es deslizar un material sobre otro."
    },
    {
      pregunta: "Si la superficie es totalmente lisa (μ=0), ¿qué fuerza se anula?",
      opciones: ["El peso", "La Normal", "La fricción", "La gravedad"],
      respuestaCorrecta: 2,
      explicacion: "Sin coeficiente de fricción no hay fuerza de oposición al deslizamiento."
    },
    {
      pregunta: "¿Hacia dónde apunta siempre la fuerza de fricción?",
      opciones: ["Hacia abajo de la rampa", "En dirección opuesta al movimiento", "Perpendicular a la rampa", "Hacia el centro de la tierra"],
      respuestaCorrecta: 1,
      explicacion: "La fricción es una fuerza de resistencia que siempre intenta detener el movimiento relativo."
    },
    {
      pregunta: "¿Cuál es el valor de la aceleración si el bloque baja con velocidad constante?",
      opciones: ["9.8 m/s²", "0 m/s²", "μ * g", "g * sin(θ)"],
      respuestaCorrecta: 1,
      explicacion: "Velocidad constante implica equilibrio de fuerzas (F_neta = 0), por lo tanto la aceleración es nula."
    },
    {
      pregunta: "La componente del peso perpendicular al plano es:",
      opciones: ["m*g*sin(θ)", "m*g*cos(θ)", "m*g", "μ*m*g"],
      respuestaCorrecta: 1,
      explicacion: "Wy = m*g*cos(θ) es la fuerza que presiona el bloque contra la superficie."
    },
    {
      pregunta: "Si duplicamos la masa del bloque, ¿qué sucede con la fuerza Normal?",
      opciones: ["Se reduce a la mitad", "Se mantiene igual", "Se duplica", "Se cuadriplica"],
      respuestaCorrecta: 2,
      explicacion: "N = m*g*cos(θ). Al ser proporcional a m, si la masa se duplica, la Normal también."
    },
    {
      pregunta: "¿Qué es la fricción estática?",
      opciones: ["La fricción cuando el objeto ya se mueve", "La fuerza que impide que el objeto empiece a moverse", "La fricción en el vacío", "La gravedad de la rampa"],
      respuestaCorrecta: 1,
      explicacion: "Es la fuerza necesaria de vencer para que un objeto en reposo inicie su movimiento."
    },
    {
      pregunta: "Un ángulo de 0° (plano horizontal) implica que:",
      opciones: ["N = m*g", "N = 0", "La fricción es máxima", "El objeto cae"],
      respuestaCorrecta: 0,
      explicacion: "En un plano horizontal, toda la fuerza del peso presiona perpendicularmente, por lo que cos(0°)=1 y N=P."
    }
  ];

export default quiz;
