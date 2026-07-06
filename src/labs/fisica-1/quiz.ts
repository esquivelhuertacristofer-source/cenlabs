import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "En el tiro parabólico, ¿qué componente de la velocidad permanece constante (ignorando el aire)?",
      opciones: ["La velocidad vertical (Vy)", "La velocidad horizontal (Vx)", "La velocidad total (V)", "La aceleración"],
      respuestaCorrecta: 1,
      explicacion: "Al no haber fuerzas horizontales actuando, la velocidad en el eje X se mantiene constante durante todo el vuelo (MRU)."
    },
    {
      pregunta: "¿Cuál es el ángulo de disparo óptimo para alcanzar la máxima distancia horizontal?",
      opciones: ["30 grados", "90 grados", "45 grados", "60 grados"],
      respuestaCorrecta: 2,
      explicacion: "Matemáticamente, el alcance máximo se logra a 45° debido a que el seno de 2θ es máximo (sin 90° = 1)."
    },
    {
      pregunta: "En el punto más alto de la trayectoria de un proyectil...",
      opciones: ["La velocidad es cero", "La aceleración es cero", "La velocidad vertical es cero", "La velocidad horizontal es cero"],
      respuestaCorrecta: 2,
      explicacion: "En el vértice de la parábola, el proyectil deja de subir para empezar a bajar; su componente vertical Vy es nula en ese instante."
    },
    {
      pregunta: "¿Cómo afecta la gravedad a la trayectoria horizontal del proyectil?",
      opciones: ["La acelera", "La frena progresivamente", "No la afecta en absoluto", "La desvía lateralmente"],
      respuestaCorrecta: 2,
      explicacion: "La gravedad es una fuerza puramente vertical. Por lo tanto, solo afecta a la componente vertical de la velocidad."
    },
    {
      pregunta: "Si duplicamos la velocidad inicial de un disparo, el alcance horizontal...",
      opciones: ["Se duplica", "Se mantiene igual", "Se cuadriplica", "Se reduce a la mitad"],
      respuestaCorrecta: 2,
      explicacion: "La fórmula del alcance depende de V₀². Si duplicas V₀, el alcance aumenta por un factor de 2² = 4."
    },
    {
      pregunta: "¿Qué forma geométrica describe la trayectoria de un proyectil?",
      opciones: ["Círculo", "Hipérbola", "Parábola", "Elipse"],
      respuestaCorrecta: 2,
      explicacion: "La combinación de un movimiento uniforme en X y uno uniformemente acelerado en Y resulta en una curva parabólica."
    },
    {
      pregunta: "El tiempo de vuelo de un proyectil depende principalmente de...",
      opciones: ["Su masa", "Su velocidad horizontal", "Su componente de velocidad vertical (Vy)", "El color del proyectil"],
      respuestaCorrecta: 2,
      explicacion: "El tiempo que el proyectil permanece en el aire está determinado por qué tan rápido 'sube' y la fuerza de gravedad que lo 'jala' hacia abajo."
    },
    {
      pregunta: "Si se lanza un proyectil en el vacío, ¿cuál es su aceleración horizontal?",
      opciones: ["9.8 m/s²", "Depende de la masa", "0 m/s²", "Igual a la vertical"],
      respuestaCorrecta: 2,
      explicacion: "En ausencia de fricción con el aire, no hay fuerzas horizontales, por lo que la aceleración en X es nula."
    },
    {
      pregunta: "¿Qué sucede con la velocidad total en el punto más alto de la trayectoria?",
      opciones: ["Es máxima", "Es cero", "Es igual a la velocidad inicial horizontal", "Es igual a la gravedad"],
      respuestaCorrecta: 2,
      explicacion: "Como Vy es cero, la velocidad total V = √(Vx² + Vy²) se reduce a Vx."
    },
    {
      pregunta: "Si lanzamos dos objetos de diferente masa con la misma velocidad y ángulo en el vacío:",
      opciones: ["El más pesado llega más lejos", "El más ligero llega más lejos", "Llegan a la misma distancia", "Depende de la densidad"],
      respuestaCorrecta: 2,
      explicacion: "En el vacío, la masa no interviene en las ecuaciones cinemáticas del movimiento parabólico."
    },
    {
      pregunta: "¿Cómo cambia el alcance si lanzamos el proyectil desde una altura superior al suelo?",
      opciones: ["Disminuye", "Aumenta", "No cambia", "Se vuelve vertical"],
      respuestaCorrecta: 1,
      explicacion: "Al estar más alto, el proyectil tarda más tiempo en caer, permitiendo que avance más distancia horizontalmente."
    },
    {
      pregunta: "El ángulo que produce el mismo alcance que 30° es:",
      opciones: ["45°", "60°", "15°", "90°"],
      respuestaCorrecta: 1,
      explicacion: "Los ángulos complementarios (que suman 90°) producen el mismo alcance horizontal (sin(2θ))."
    },
    {
      pregunta: "¿Qué componente de la velocidad se ve afectada por la resistencia del aire?",
      opciones: ["Solo la horizontal", "Solo la vertical", "Ambas componentes", "Ninguna"],
      respuestaCorrecta: 2,
      explicacion: "El aire ejerce una fuerza de arrastre que se opone al movimiento en cualquier dirección."
    },
    {
      pregunta: "¿Cuál es la unidad de la aceleración en el SI?",
      opciones: ["m/s", "m²/s", "m/s²", "N/kg"],
      respuestaCorrecta: 2,
      explicacion: "Mide el cambio de velocidad (m/s) por cada segundo (s), resultando en metros por segundo al cuadrado."
    }
  ];

export default quiz;
