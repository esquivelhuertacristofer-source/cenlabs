import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿Qué problema histórico motivó el origen de la integral?",
      opciones: ["Calcular el cambio", "Calcular el área de figuras irregulares", "Resolver sistemas 2x2", "Navegar por el mar"],
      respuestaCorrecta: 1,
      explicacion: "La integración surgió de la necesidad de encontrar áreas exactas bajo curvas donde la geometría básica fallaba."
    },
    {
      pregunta: "En las Sumas de Riemann, a medida que aumentamos el número de rectángulos (n):",
      opciones: ["El área total aumenta", "El error de aproximación disminuye", "La función cambia", "El cálculo se vuelve imposible"],
      respuestaCorrecta: 1,
      explicacion: "Al usar rectángulos más delgados, cubrimos mejor los espacios curvos, acercándonos al valor real del área."
    },
    {
      pregunta: "La Integral Definida representa:",
      opciones: ["La pendiente de la curva", "El área neta bajo la curva en un intervalo", "El valor máximo", "La raíz de la función"],
      respuestaCorrecta: 1,
      explicacion: "Es el límite de la suma de Riemann cuando el ancho de los rectángulos tiende a cero."
    },
    {
      pregunta: "El Teorema Fundamental del Cálculo une:",
      opciones: ["Álgebra y Geometría", "Derivadas e Integrales", "Seno y Coseno", "Masa y Volumen"],
      respuestaCorrecta: 1,
      explicacion: "Establece que la integración y la derivación son procesos inversos."
    },
    {
      pregunta: "Si una función está por debajo del eje X, su integral definida será:",
      opciones: ["Positiva", "Cero", "Negativa", "Imaginaria"],
      respuestaCorrecta: 2,
      explicacion: "Las áreas bajo el eje X se consideran negativas en el cálculo de integrales definidas."
    },
    {
      pregunta: "¿Cuál es la integral de f(x) = 1?",
      opciones: ["0", "x + C", "1", "x²"],
      respuestaCorrecta: 1,
      explicacion: "La función cuya derivada es 1 es x."
    },
    {
      pregunta: "¿Qué método de Riemann suele ser más preciso con pocos rectángulos?",
      opciones: ["Izquierda", "Derecha", "Punto Medio", "Aleatorio"],
      respuestaCorrecta: 2,
      explicacion: "El punto medio compensa el exceso y defecto de área de forma más equilibrada que los extremos."
    },
    {
      pregunta: "¿Qué representa la 'C' en una integral indefinida ∫ f(x)dx = F(x) + C?",
      opciones: ["Una constante de integración", "La velocidad", "El área", "Un error"],
      respuestaCorrecta: 0,
      explicacion: "Como la derivada de cualquier constante es cero, hay infinitas funciones cuya derivada es f(x)."
    },
    {
      pregunta: "¿Cuál es la integral indefinida de f(x) = x?",
      opciones: ["x²", "(x² / 2) + C", "1", "2x"],
      respuestaCorrecta: 1,
      explicacion: "∫ x^n dx = [x^(n+1) / (n+1)] + C. Para n=1, es x²/2."
    },
    {
      pregunta: "Si integramos la velocidad respecto al tiempo, obtenemos:",
      opciones: ["La aceleración", "La posición (desplazamiento)", "La fuerza", "La masa"],
      respuestaCorrecta: 1,
      explicacion: "La integración es el proceso inverso a la derivación; deshace el cambio para volver al estado original."
    },
    {
      pregunta: "¿Qué dice la Regla de Barrow?",
      opciones: ["Cómo derivar productos", "Cómo evaluar una integral definida: F(b) - F(a)", "Cómo calcular límites", "Cómo sumar fracciones"],
      respuestaCorrecta: 1,
      explicacion: "Permite calcular el área exacta evaluando la primitiva en los límites del intervalo."
    },
    {
      pregunta: "La integral de 1/x es:",
      opciones: ["x", "ln|x| + C", "-1/x²", "e^x"],
      respuestaCorrecta: 1,
      explicacion: "Es el caso especial donde la regla de la potencia (n=-1) no se aplica directamente."
    },
    {
      pregunta: "¿Qué sucede con el área si la función es simétrica respecto al origen (función impar) en [-a, a]?",
      opciones: ["Es el doble", "Es cero", "Es infinita", "Es positiva"],
      respuestaCorrecta: 1,
      explicacion: "Las áreas positiva y negativa se cancelan exactamente."
    },
    {
      pregunta: "¿Para qué sirve el 'Cálculo Integral' en ingeniería?",
      opciones: ["Solo para dibujar", "Para calcular centros de masa, volúmenes y trabajo", "Para sumar números", "Para programar"],
      respuestaCorrecta: 1,
      explicacion: "Es esencial para cuantificar acumulaciones físicas en 3D."
    }
  ];

export default quiz;
