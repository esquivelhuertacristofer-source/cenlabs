import { Question } from "@/components/LabQuiz";

export const ALL_QUIZZES: Record<string, Question[]> = {
  'matematicas-1': [
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
    }
  ],
  'matematicas-2': [
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
    }
  ],
  'matematicas-3': [
    {
      pregunta: "¿Cuál es la base del logaritmo utilizado en la escala de Richter?",
      opciones: ["Base e", "Base 2", "Base 10", "Base 12"],
      respuestaCorrecta: 2,
      explicacion: "Richter usa una escala logarítmica decimal (base 10), lo que facilita medir variaciones de gran magnitud."
    },
    {
      pregunta: "Si un sismo es de magnitud 6 y otro de 7, ¿cuántas veces es mayor la amplitud de onda del segundo?",
      opciones: ["1 vez", "10 veces", "32 veces", "2 veces"],
      respuestaCorrecta: 1,
      explicacion: "Como es base 10, cada unidad entera de incremento representa un aumento de 10 veces en la amplitud medida por el sismógrafo."
    },
    {
      pregunta: "En términos de ENERGÍA, ¿cuánto representa cada grado de incremento?",
      opciones: ["10 veces", "100 veces", "Aproximadamente 32 veces", "5 veces"],
      respuestaCorrecta: 2,
      explicacion: "La relación energía-magnitud sigue el factor 10^(1.5), que es aproximadamente 31.6 (redondeado a 32)."
    },
    {
      pregunta: "Un logaritmo es, por definición:",
      opciones: ["Una raíz cuadrada", "Un exponente", "Una fracción", "Una integral"],
      respuestaCorrecta: 1,
      explicacion: "log_b(a) = c significa que b^c = a. Por lo tanto, el logaritmo es el exponente al que se eleva la base."
    },
    {
      pregunta: "Si log(x) = 3, ¿cuánto vale x?",
      opciones: ["3", "30", "1000", "10"],
      respuestaCorrecta: 2,
      explicacion: "10 elevado a la 3 es 1000."
    },
    {
      pregunta: "¿Por qué se usan escalas logarítmicas para los sismos?",
      opciones: ["Porque son más fáciles de sumar", "Para comprimir un rango enorme de valores en números pequeños", "Por tradición", "Porque la tierra es redonda"],
      respuestaCorrecta: 1,
      explicacion: "La energía de los sismos varía en billones de julios; los logaritmos permiten manejarlos en una escala del 1 al 10."
    },
    {
      pregunta: "¿Qué significa que la escala de Richter sea 'abierta'?",
      opciones: ["Que cualquiera puede usarla", "Que no tiene un límite teórico superior", "Que solo mide sismos en el mar", "Que usa decimales"],
      respuestaCorrecta: 1,
      explicacion: "Aunque los sismos más grandes registrados rondan el 9.5, la escala no tiene un tope matemático definido."
    }
  ],
  'matematicas-4': [
    {
      pregunta: "¿En qué tipo de triángulos se aplica el Teorema de Pitágoras?",
      opciones: ["Equiláteros", "Acutángulos", "Rectángulos (un ángulo de 90°)", "Obtusángulos"],
      respuestaCorrecta: 2,
      explicacion: "El teorema es una propiedad exclusiva de los triángulos rectángulos, relacionando sus lados mediante áreas cuadradas."
    },
    {
      pregunta: "La hipotenusa es siempre:",
      opciones: ["El lado más corto", "El lado opuesto al ángulo recto", "Igual a la suma de los catetos", "Vertical"],
      respuestaCorrecta: 1,
      explicacion: "La hipotenusa es el lado de mayor longitud y siempre se encuentra frente al ángulo de 90 grados."
    },
    {
      pregunta: "Si los catetos miden 3 y 4, la hipotenusa mide:",
      opciones: ["7", "5", "25", "12"],
      respuestaCorrecta: 1,
      explicacion: "3² + 4² = 9 + 16 = 25. La raíz cuadrada de 25 es 5."
    },
    {
      pregunta: "¿Cuál es la expresión correcta del teorema?",
      opciones: ["a + b = c", "a² + b² = c²", "√(a+b) = c", "a² - b² = c²"],
      respuestaCorrecta: 1,
      explicacion: "La suma de los cuadrados de los catetos es igual al cuadrado de la hipotenusa."
    },
    {
      pregunta: "Una terna pitagórica es un conjunto de tres números enteros que cumplen el teorema. ¿Cuál es una?",
      opciones: ["1, 2, 3", "5, 12, 13", "2, 2, 4", "10, 10, 20"],
      respuestaCorrecta: 1,
      explicacion: "5² (25) + 12² (144) = 169, que es 13²."
    },
    {
      pregunta: "Si conocemos la hipotenusa (c) y un cateto (a), ¿cómo hallamos el otro cateto (b)?",
      opciones: ["b = c - a", "b = √(c² - a²)", "b = √(c² + a²)", "b = c² / a"],
      respuestaCorrecta: 1,
      explicacion: "Despejando de la fórmula original: b² = c² - a², por lo tanto b es la raíz de esa diferencia."
    },
    {
      pregunta: "En la vida real, ¿para qué sirve este teorema?",
      opciones: ["Para calcular distancias directas (línea de visión)", "Para medir el peso de objetos", "Para calcular áreas circulares", "Para cocinar"],
      respuestaCorrecta: 0,
      explicacion: "Es fundamental en navegación, arquitectura y física para encontrar distancias diagonales cortas."
    }
  ],
  'matematicas-5': [
    {
      pregunta: "¿Cuál es el valor del radio en el Círculo Unitario?",
      opciones: ["Depende del ángulo", "0", "1", "π"],
      respuestaCorrecta: 2,
      explicacion: "Se llama 'unitario' precisamente porque su radio es 1 unidad de longitud."
    },
    {
      pregunta: "En el círculo unitario, la coordenada 'y' de un punto representa:",
      opciones: ["El Coseno del ángulo", "La Tangente", "El Seno del ángulo", "El Radio"],
      respuestaCorrecta: 2,
      explicacion: "Como sin(θ) = opuesto / hipotenusa y hipotenusa = 1, entonces sin(θ) = y."
    },
    {
      pregunta: "En el círculo unitario, la coordenada 'x' de un punto representa:",
      opciones: ["El Seno del ángulo", "El Coseno del ángulo", "La Secante", "El Diámetro"],
      respuestaCorrecta: 1,
      explicacion: "Como cos(θ) = adyacente / hipotenusa y hipotenusa = 1, entonces cos(θ) = x."
    },
    {
      pregunta: "¿Cuál es el valor del Seno de 90 grados?",
      opciones: ["0", "1", "-1", "0.5"],
      respuestaCorrecta: 1,
      explicacion: "A 90°, el punto está en (0, 1). La coordenada y es 1."
    },
    {
      pregunta: "¿En qué cuadrantes el Seno es positivo?",
      opciones: ["I y II", "I y IV", "II y III", "III y IV"],
      respuestaCorrecta: 0,
      explicacion: "El seno es positivo donde 'y' es positiva, es decir, en la mitad superior del plano cartesiano."
    },
    {
      pregunta: "¿Qué función trigonométrica se obtiene al dividir Seno entre Coseno?",
      opciones: ["Secante", "Cosecante", "Tangente", "Cotangente"],
      respuestaCorrecta: 2,
      explicacion: "tan(θ) = sin(θ) / cos(θ). Geométricamente es la pendiente del radio."
    },
    {
      pregunta: "¿A cuántos radianes equivalen 180 grados?",
      opciones: ["π / 2", "2π", "π", "3π / 2"],
      respuestaCorrecta: 2,
      explicacion: "La circunferencia completa es 2π (360°), por lo que media vuelta son π radianes."
    }
  ],
  'matematicas-6': [
    {
      pregunta: "¿Qué tipo de transformación cambia el tamaño de una figura pero no su forma?",
      opciones: ["Rotación", "Traslación", "Dilatación o Escala", "Reflexión"],
      respuestaCorrecta: 2,
      explicacion: "La escala (homotecia) multiplica las coordenadas por un factor, agrandando o achicando la figura proporcionalmente."
    },
    {
      pregunta: "Si rotamos una figura 180 grados respecto al origen, el punto (x, y) se convierte en:",
      opciones: ["(y, x)", "(-x, -y)", "(-y, x)", "(x, -y)"],
      respuestaCorrecta: 1,
      explicacion: "Una rotación de 180° equivale a una simetría central, invirtiendo los signos de ambas coordenadas."
    },
    {
      pregunta: "Una traslación de vector (3, -2) significa:",
      opciones: ["Mover 3 arriba y 2 izquierda", "Mover 3 derecha y 2 abajo", "Rotar 3 grados", "Triplicar el tamaño"],
      respuestaCorrecta: 1,
      explicacion: "El primer componente afecta a X (derecha si es +) y el segundo a Y (abajo si es -)."
    },
    {
      pregunta: "Las transformaciones que mantienen las distancias y ángulos se llaman:",
      opciones: ["Isometrías", "Fractales", "Logarítmicas", "Afines"],
      respuestaCorrecta: 0,
      explicacion: "Las isometrías (traslación, rotación, reflexión) conservan la forma y tamaño exactos de la figura original."
    },
    {
      pregunta: "¿Qué sucede si aplicamos una escala de factor 0.5?",
      opciones: ["La figura se duplica", "La figura se reduce a la mitad", "La figura desaparece", "La figura se voltea"],
      respuestaCorrecta: 1,
      explicacion: "Un factor entre 0 y 1 produce una contracción o reducción de la figura."
    },
    {
      pregunta: "En una reflexión respecto al eje X, el punto (2, 5) pasa a ser:",
      opciones: ["(-2, 5)", "(2, -5)", "(5, 2)", "(-2, -5)"],
      respuestaCorrecta: 1,
      explicacion: "Al reflejar sobre X, la coordenada X se mantiene pero la Y cambia de signo."
    },
    {
      pregunta: "Para 'deshacer' una traslación de (5, 5), debemos aplicar una de:",
      opciones: ["(5, 5)", "(-5, -5)", "(0, 0)", "(1/5, 1/5)"],
      respuestaCorrecta: 1,
      explicacion: "La transformación inversa de una traslación es usar el vector opuesto."
    }
  ],
  'matematicas-7': [
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
    }
  ],
  'matematicas-8': [
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
    }
  ],
  'matematicas-9': [
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
    }
  ],
  'matematicas-10': [
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
    }
  ],
  'fisica-1': [
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
    }
  ],
  'fisica-2': [
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
    }
  ],
  'fisica-3': [
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
    }
  ],
  'fisica-4': [
    {
      pregunta: "¿Qué establece la Ley de Hooke?",
      opciones: ["F = m * a", "F = k * x", "E = m * c²", "P = F / A"],
      respuestaCorrecta: 1,
      explicacion: "La fuerza ejercida por un resorte es directamente proporcional a su estiramiento o compresión (x)."
    },
    {
      pregunta: "La unidad de la constante elástica (k) en el SI es:",
      opciones: ["Newtons", "Metros", "N / m", "Joules"],
      respuestaCorrecta: 2,
      explicacion: "k representa cuánta fuerza se necesita para estirar el resorte un metro."
    },
    {
      pregunta: "Si un resorte tiene k = 100 N/m y se estira 0.1 m, ¿cuánta fuerza ejerce?",
      opciones: ["10 N", "1000 N", "1 N", "100 N"],
      respuestaCorrecta: 0,
      explicacion: "F = 100 * 0.1 = 10 Newtons."
    },
    {
      pregunta: "¿Qué sucede si superamos el 'límite elástico' de un material?",
      opciones: ["Se estira más rápido", "Se deforma permanentemente o se rompe", "Se vuelve más fuerte", "No pasa nada"],
      respuestaCorrecta: 1,
      explicacion: "Más allá de este límite, el material ya no recupera su forma original al quitar la fuerza."
    },
    {
      pregunta: "En un gráfico de Fuerza vs Estiramiento, k representa:",
      opciones: ["El área bajo la curva", "La pendiente de la recta", "El punto de corte con Y", "La velocidad"],
      respuestaCorrecta: 1,
      explicacion: "Como F = kx, la pendiente de la línea recta es precisamente la constante k."
    },
    {
      pregunta: "La energía almacenada en un resorte estirado se llama:",
      opciones: ["Energía Cinética", "Energía Potencial Elástica", "Energía Térmica", "Energía Química"],
      respuestaCorrecta: 1,
      explicacion: "Es energía acumulada debido a la configuración del sistema (U = 1/2 kx²)."
    },
    {
      pregunta: "¿Por qué los amortiguadores de los autos usan resortes fuertes (k alta)?",
      opciones: ["Para que el auto sea más alto", "Para soportar grandes fuerzas con poco desplazamiento", "Para ahorrar combustible", "Por estética"],
      respuestaCorrecta: 1,
      explicacion: "Se requiere mucha fuerza para comprimir el resorte, lo que absorbe los impactos del camino."
    }
  ],
  'fisica-5': [
    {
      pregunta: "¿Qué principio físico rige la prensa hidráulica?",
      opciones: ["Principio de Arquímedes", "Principio de Pascal", "Leyes de Newton", "Ley de Ohm"],
      respuestaCorrecta: 1,
      explicacion: "Pascal establece que la presión aplicada a un fluido encerrado se transmite por igual a todos los puntos del mismo."
    },
    {
      pregunta: "La presión se define como:",
      opciones: ["Fuerza por Área", "Fuerza dividida entre Área", "Área entre Fuerza", "Masa por Gravedad"],
      respuestaCorrecta: 1,
      explicacion: "P = F / A. Se mide en Pascales (N/m²)."
    },
    {
      pregunta: "Si el área del émbolo de salida es 10 veces mayor al de entrada:",
      opciones: ["La fuerza se divide por 10", "La fuerza se multiplica por 10", "La presión se multiplica por 10", "No hay cambio"],
      respuestaCorrecta: 1,
      explicacion: "Como P1 = P2, entonces F1/A1 = F2/A2. Si A2 es 10*A1, entonces F2 será 10*F1."
    },
    {
      pregunta: "¿Qué se 'pierde' al ganar fuerza en una prensa hidráulica?",
      opciones: ["Presión", "Energía", "Distancia de recorrido", "Masa"],
      respuestaCorrecta: 2,
      explicacion: "Debes mover el émbolo pequeño una gran distancia para mover el grande una distancia muy pequeña (Conservación del trabajo)."
    },
    {
      pregunta: "¿Por qué se usa aceite en lugar de aire en estos sistemas?",
      opciones: ["Porque es más barato", "Porque los líquidos son prácticamente incompresibles", "Porque el aire se escapa", "Porque el aceite brilla"],
      respuestaCorrecta: 1,
      explicacion: "El aire se comprimiría absorbiendo la fuerza; el aceite transmite la presión de forma inmediata y eficiente."
    },
    {
      pregunta: "Un elevador hidráulico es un ejemplo de:",
      opciones: ["Máquina simple", "Ventaja mecánica", "Multiplicador de par", "Todas las anteriores"],
      respuestaCorrecta: 3,
      explicacion: "Utiliza principios básicos para permitir que una fuerza pequeña mueva una carga enorme."
    },
    {
      pregunta: "Si aplicamos 100 N en un área de 1 m², la presión es:",
      opciones: ["100 Pa", "1 Pa", "1000 Pa", "10 Pa"],
      respuestaCorrecta: 0,
      explicacion: "P = 100 / 1 = 100 Pascales."
    }
  ],
  'fisica-6': [
    {
      pregunta: "¿Qué establece el Principio de Arquímedes?",
      opciones: ["Que los cuerpos pesados siempre se hunden", "Que todo cuerpo sumergido experimenta un empuje vertical hacia arriba igual al peso del fluido desalojado", "Que la presión aumenta con la profundidad", "Que el agua es azul"],
      respuestaCorrecta: 1,
      explicacion: "El empuje es una fuerza creada por la diferencia de presiones sobre el objeto sumergido."
    },
    {
      pregunta: "¿De qué depende la fuerza de empuje (E)?",
      opciones: ["De la masa del objeto", "Del volumen sumergido y la densidad del fluido", "Del color del fluido", "De la forma del objeto únicamente"],
      respuestaCorrecta: 1,
      explicacion: "E = ρ_fluido * g * V_sumergido. No importa de qué esté hecho el objeto, solo cuánto espacio ocupa."
    },
    {
      pregunta: "Si un objeto flota, significa que:",
      opciones: ["Su densidad es mayor que la del fluido", "Su densidad es menor que la del fluido", "No tiene peso", "Está lleno de aire"],
      respuestaCorrecta: 1,
      explicacion: "Al ser menos denso, el volumen de agua necesario para igualar su peso es menor a su volumen total."
    },
    {
      pregunta: "¿Qué es el 'Peso Aparente'?",
      opciones: ["El peso real multiplicado por dos", "La diferencia entre el peso real y el empuje", "El peso del agua", "Una ilusión óptica"],
      respuestaCorrecta: 1,
      explicacion: "Es lo que marca una balanza cuando el objeto está sumergido; se siente más ligero porque el agua lo 'ayuda' a subir."
    },
    {
      pregunta: "Un barco de hierro flota porque:",
      opciones: ["El hierro flota en agua salada", "Su diseño desplaza un volumen de agua cuyo peso es igual al peso total del barco", "Tiene motores potentes", "La pintura lo hace ligero"],
      respuestaCorrecta: 1,
      explicacion: "Aunque el hierro es denso, la forma hueca del barco desplaza muchísima agua, generando un empuje enorme."
    },
    {
      pregunta: "¿Por qué es más fácil flotar en el Mar Muerto que en una piscina?",
      opciones: ["Porque hay más sol", "Porque el agua salada es más densa, generando más empuje", "Porque el agua es más profunda", "Porque no hay olas"],
      respuestaCorrecta: 1,
      explicacion: "A mayor densidad del fluido (ρ_fluido), mayor es la fuerza de empuje para el mismo volumen sumergido."
    },
    {
      pregunta: "Si un objeto desaloja 1 litro de agua, el empuje es de aproximadamente:",
      opciones: ["1 Newton", "9.8 Newtons", "100 Newtons", "0.1 Newtons"],
      respuestaCorrecta: 1,
      explicacion: "1 litro de agua pesa 1 kg. Su peso es m*g = 1 * 9.8 = 9.8 N."
    }
  ],
  'fisica-7': [
    {
      pregunta: "¿Qué sucede con la mayoría de los materiales cuando aumenta su temperatura?",
      opciones: ["Se contraen", "Se expanden", "Cambian de color", "Se vuelven magnéticos"],
      respuestaCorrecta: 1,
      explicacion: "El calor aumenta la energía cinética de los átomos, haciendo que vibren más y se alejen entre sí."
    },
    {
      pregunta: "El coeficiente de dilatación lineal (α) depende de:",
      opciones: ["La longitud de la barra", "El tipo de material", "La temperatura inicial", "La presión atmosférica"],
      respuestaCorrecta: 1,
      explicacion: "Cada material (hierro, aluminio, vidrio) tiene una estructura atómica propia que determina cuánto se expande por cada grado."
    },
    {
      pregunta: "¿Por qué las vías del tren tienen pequeños espacios entre los rieles?",
      opciones: ["Para ahorrar metal", "Para permitir la dilatación térmica en verano sin que se deformen", "Para que el tren haga ruido", "Por error de construcción"],
      respuestaCorrecta: 1,
      explicacion: "Sin estas juntas de dilatación, los rieles se doblarían al expandirse con el calor del sol."
    },
    {
      pregunta: "Si una barra de 1m se expande 1mm, ¿cuánto se expandirá una de 2m bajo el mismo calor?",
      opciones: ["1 mm", "2 mm", "0.5 mm", "4 mm"],
      respuestaCorrecta: 1,
      explicacion: "La dilatación es proporcional a la longitud inicial (ΔL = α * L0 * ΔT)."
    },
    {
      pregunta: "Un termómetro de mercurio funciona basado en la:",
      opciones: ["Dilatación volumétrica", "Conducción eléctrica", "Presión de vapor", "Gravedad"],
      respuestaCorrecta: 0,
      explicacion: "El líquido se expande mucho más que el vidrio al calentarse, subiendo por el capilar."
    },
    {
      pregunta: "¿Qué material suele tener un coeficiente de dilatación más alto?",
      opciones: ["Vidrio", "Plástico", "Metales (como el Aluminio)", "Cerámica"],
      respuestaCorrecta: 2,
      explicacion: "Los metales generalmente tienen enlaces que permiten una mayor expansión térmica que los cerámicos."
    },
    {
      pregunta: "Si enfriamos un objeto, este generalmente:",
      opciones: ["Se expande", "Se contrae", "Aumenta su masa", "Se vuelve líquido"],
      respuestaCorrecta: 1,
      explicacion: "Al perder energía, los átomos vibran menos y se acercan, reduciendo el tamaño total."
    }
  ],
  'fisica-8': [
    {
      pregunta: "¿Qué establece la Ley de Ohm?",
      opciones: ["V = I / R", "V = I * R", "I = V * R", "R = V * I"],
      respuestaCorrecta: 1,
      explicacion: "El voltaje es directamente proporcional a la corriente y a la resistencia del conductor."
    },
    {
      pregunta: "La unidad de medida de la resistencia eléctrica es el:",
      opciones: ["Amperio", "Voltio", "Ohmio (Ω)", "Vatio"],
      respuestaCorrecta: 2,
      explicacion: "Nombrada en honor a Georg Simon Ohm, mide la oposición al flujo de electrones."
    },
    {
      pregunta: "Si aumentamos el voltaje en un circuito con resistencia fija, la corriente:",
      opciones: ["Disminuye", "Aumenta", "Se mantiene igual", "Desaparece"],
      respuestaCorrecta: 1,
      explicacion: "Al haber más 'presión' eléctrica (voltaje), fluyen más electrones (corriente)."
    },
    {
      pregunta: "Un material 'Aislante' es aquel que tiene una resistencia:",
      opciones: ["Muy baja", "Muy alta", "Cero", "Variable"],
      respuestaCorrecta: 1,
      explicacion: "Los aislantes (como el plástico) impiden el paso de corriente debido a su altísima resistencia."
    },
    {
      pregunta: "En un circuito en SERIE, la corriente es:",
      opciones: ["Diferente en cada componente", "Igual en todos los puntos", "Cero", "Infinita"],
      respuestaCorrecta: 1,
      explicacion: "Solo hay un camino para los electrones, por lo que la corriente no tiene más opción que ser la misma en todo el lazo."
    },
    {
      pregunta: "¿Cuál es la función de una resistencia en un circuito con un LED?",
      opciones: ["Darle más energía", "Limitar la corriente para evitar que el LED se queme", "Cambiar el color del LED", "Almacenar carga"],
      respuestaCorrecta: 1,
      explicacion: "Los LED tienen muy poca resistencia interna; sin una externa, la corriente subiría demasiado y destruiría el componente."
    },
    {
      pregunta: "Si V = 12V e I = 2A, ¿cuál es la resistencia?",
      opciones: ["24 Ω", "6 Ω", "10 Ω", "14 Ω"],
      respuestaCorrecta: 1,
      explicacion: "R = V / I = 12 / 2 = 6 Ohmios."
    }
  ],
  'fisica-9': [
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
    }
  ],
  'fisica-10': [
    {
      pregunta: "¿Qué fenómeno permite que un motor eléctrico funcione?",
      opciones: ["La fricción", "La fuerza de Lorentz (interacción corriente-campo magnético)", "La gravedad", "La presión"],
      respuestaCorrecta: 1,
      explicacion: "Cuando una corriente circula por un cable dentro de un campo magnético, experimenta una fuerza que lo hace moverse."
    },
    {
      pregunta: "En un motor de C.C., el 'Estator' es:",
      opciones: ["La parte que gira", "La parte fija (imanes)", "La batería", "El cable"],
      respuestaCorrecta: 1,
      explicacion: "El estator genera el campo magnético constante necesario para el empuje."
    },
    {
      pregunta: "El 'Rotor' o armadura es:",
      opciones: ["El interruptor", "La parte móvil que contiene las bobinas", "El chasis", "El ventilador"],
      respuestaCorrecta: 1,
      explicacion: "Es el componente que gira al recibir la fuerza magnética."
    },
    {
      pregunta: "¿Para qué sirve el conmutador y las escobillas?",
      opciones: ["Para limpiar el motor", "Para invertir la dirección de la corriente y mantener el giro constante", "Para frenar el motor", "Para aumentar el voltaje"],
      respuestaCorrecta: 1,
      explicacion: "Sin ellos, el motor daría media vuelta y se detendría; ellos aseguran que la fuerza siempre empuje en el mismo sentido de giro."
    },
    {
      pregunta: "Si invertimos la polaridad de la batería, el motor:",
      opciones: ["Se quema", "Gira en sentido contrario", "Se detiene", "Gira más rápido"],
      respuestaCorrecta: 1,
      explicacion: "Al cambiar el sentido de la corriente, cambia la dirección de la fuerza de Lorentz."
    },
    {
      pregunta: "¿Cómo podemos aumentar el torque (fuerza de giro) de nuestro motor?",
      opciones: ["Usando imanes más débiles", "Aumentando el número de espiras y la corriente", "Pintándolo de rojo", "Usando cables más largos"],
      respuestaCorrecta: 1,
      explicacion: "La fuerza magnética es proporcional a la corriente (I), al campo (B) y al número de vueltas de alambre (N)."
    },
    {
      pregunta: "Un motor eléctrico convierte energía:",
      opciones: ["Mecánica en Eléctrica", "Eléctrica en Mecánica", "Química en Térmica", "Solar en Eléctrica"],
      respuestaCorrecta: 1,
      explicacion: "Usa electricidad para generar movimiento físico."
    }
  ],
  'quimica-1': [
    {
      pregunta: "¿Qué partícula define la identidad de un elemento químico?",
      opciones: ["El Electrón", "El Neutrón", "El Protón", "El Positrón"],
      respuestaCorrecta: 2,
      explicacion: "El Número Atómico (Z) es el número de protones; si este cambia, el elemento cambia."
    },
    {
      pregunta: "Los isótopos son átomos del mismo elemento que tienen diferente número de:",
      opciones: ["Protones", "Electrones", "Neutrones", "Cargas"],
      respuestaCorrecta: 2,
      explicacion: "Tienen el mismo Z pero diferente N, lo que cambia su masa atómica (A)."
    },
    {
      pregunta: "¿Dónde se encuentra casi toda la masa del átomo?",
      opciones: ["En la corteza electrónica", "En el núcleo", "En los orbitales", "Está distribuida uniformemente"],
      respuestaCorrecta: 1,
      explicacion: "El núcleo contiene protones y neutrones, que son unas 1800 veces más pesados que los electrones."
    },
    {
      pregunta: "Un átomo con 6 protones y 8 neutrones es un isótopo de:",
      opciones: ["Oxígeno", "Nitrógeno", "Carbono (Carbono-14)", "Boro"],
      respuestaCorrecta: 2,
      explicacion: "6 protones = Carbono. La masa es 6+8=14."
    },
    {
      pregunta: "¿Qué fuerza mantiene unidos a los protones en el núcleo a pesar de su repulsión?",
      opciones: ["Fuerza Gravitatoria", "Fuerza Nuclear Fuerte", "Fuerza Electromagnética", "Fricción"],
      respuestaCorrecta: 1,
      explicacion: "La fuerza fuerte es la interacción más poderosa de la naturaleza, superando la repulsión eléctrica a distancias nucleares."
    },
    {
      pregunta: "En un átomo neutro, el número de electrones es igual al de:",
      opciones: ["Neutrones", "Protones", "Masa atómica", "Niveles de energía"],
      respuestaCorrecta: 1,
      explicacion: "Para que la carga neta sea cero, las cargas negativas (e-) deben igualar a las positivas (p+)."
    },
    {
      pregunta: "¿Qué indica el Diagrama de Segré?",
      opciones: ["La velocidad de los electrones", "La estabilidad de los núcleos según su relación N/Z", "El color de la llama", "La dureza del metal"],
      respuestaCorrecta: 1,
      explicacion: "Muestra la 'banda de estabilidad'; los núcleos fuera de ella tienden a decaer radiactivamente."
    }
  ],
  'quimica-2': [
    {
      pregunta: "Según la Ley de Boyle, a temperatura constante, si el volumen disminuye:",
      opciones: ["La presión disminuye", "La presión aumenta", "La presión no cambia", "El gas se congela"],
      respuestaCorrecta: 1,
      explicacion: "P y V son inversamente proporcionales. Menos espacio significa choques más frecuentes contra las paredes."
    },
    {
      pregunta: "¿Qué escala de temperatura DEBE usarse en las leyes de los gases?",
      opciones: ["Celsius (°C)", "Fahrenheit (°F)", "Kelvin (K)", "Reaumur (°R)"],
      respuestaCorrecta: 2,
      explicacion: "Kelvin es la escala absoluta. El cero absoluto es el punto donde cesa el movimiento molecular."
    },
    {
      pregunta: "La ecuación de estado de los gases ideales es:",
      opciones: ["F = m*a", "PV = nRT", "E = h*f", "V = I*R"],
      respuestaCorrecta: 1,
      explicacion: "Relaciona Presión, Volumen, Moles, la Constante R y la Temperatura."
    },
    {
      pregunta: "¿Qué sucede con la presión si aumentamos la temperatura a volumen constante (Ley de Gay-Lussac)?",
      opciones: ["Aumenta", "Disminuye", "Se mantiene igual", "El volumen aumenta"],
      respuestaCorrecta: 0,
      explicacion: "Al calentar, las moléculas se mueven más rápido y chocan con más fuerza, subiendo la presión."
    },
    {
      pregunta: "El volumen molar de un gas ideal en Condiciones Normales (1 atm, 273K) es:",
      opciones: ["1 L", "22.4 L", "10 L", "44.8 L"],
      respuestaCorrecta: 1,
      explicacion: "Es una constante fundamental para cálculos estequiométricos de gases."
    },
    {
      pregunta: "¿Qué representa la variable 'n' en PV=nRT?",
      opciones: ["Número de partículas", "Masa en gramos", "Cantidad de sustancia en moles", "Nitrógeno"],
      respuestaCorrecta: 2,
      explicacion: "n representa los moles, que es la unidad estándar para contar átomos o moléculas."
    },
    {
      pregunta: "Un gas real se comporta como ideal cuando:",
      opciones: ["La presión es alta y temperatura baja", "La presión es baja y temperatura alta", "Está en estado líquido", "Nunca"],
      respuestaCorrecta: 1,
      explicacion: "A baja presión y alta temperatura, las interacciones entre moléculas son despreciables."
    }
  ],
  'quimica-3': [
    {
      pregunta: "¿Qué establece la Ley de Conservación de la Masa (Lavoisier)?",
      opciones: ["La masa aumenta en una explosión", "La masa no se crea ni se destruye, solo se transforma", "La masa se convierte en energía siempre", "Los átomos desaparecen"],
      respuestaCorrecta: 1,
      explicacion: "En una reacción química, el número total de átomos de cada elemento debe ser el mismo al inicio y al final."
    },
    {
      pregunta: "En la ecuación 2H₂ + O₂ → 2H₂O, el número '2' delante del H₂ se llama:",
      opciones: ["Subíndice", "Coeficiente Estequiométrico", "Exponente", "Número atómico"],
      respuestaCorrecta: 1,
      explicacion: "Los coeficientes indican la proporción en moles de las sustancias que reaccionan o se producen."
    },
    {
      pregunta: "¿Cuál es el balance correcto para: CH₄ + O₂ → CO₂ + H₂O?",
      opciones: ["1, 1, 1, 1", "1, 2, 1, 2", "2, 1, 2, 1", "1, 4, 1, 2"],
      respuestaCorrecta: 1,
      explicacion: "1 C, 4 H y 4 O en ambos lados."
    },
    {
      pregunta: "Los reactivos se ubican siempre a la:",
      opciones: ["Derecha de la flecha", "Izquierda de la flecha", "Arriba de la flecha", "En el pie de página"],
      respuestaCorrecta: 1,
      explicacion: "La convención es Reactivos → Productos."
    },
    {
      pregunta: "Una reacción de COMBUSTIÓN siempre requiere:",
      opciones: ["Agua", "Oxígeno (Comburente)", "Nitrógeno", "Hierro"],
      respuestaCorrecta: 1,
      explicacion: "La combustión es una oxidación rápida que necesita un combustible y oxígeno."
    },
    {
      pregunta: "Si en una ecuación hay 4 átomos de Oxígeno en los reactivos, ¿cuántos debe haber en los productos?",
      opciones: ["2", "8", "4", "Depende de la temperatura"],
      respuestaCorrecta: 2,
      explicacion: "Por la ley de conservación, el conteo de átomos debe ser idéntico."
    },
    {
      pregunta: "Balancear una ecuación consiste en:",
      opciones: ["Cambiar los subíndices de las moléculas", "Ajustar los coeficientes estequiométricos", "Borrar elementos", "Sumar masas"],
      respuestaCorrecta: 1,
      explicacion: "NUNCA se deben cambiar los subíndices (eso cambiaría la sustancia); solo se ajustan las cantidades de moléculas."
    }
  ],
  'quimica-4': [
    {
      pregunta: "¿Qué es el Reactivo Limitante?",
      opciones: ["El que es más peligroso", "El que se consume totalmente primero y detiene la reacción", "El que sobra al final", "El que tiene más masa"],
      respuestaCorrecta: 1,
      explicacion: "La reacción no puede continuar una vez que uno de los reactivos necesarios se agota."
    },
    {
      pregunta: "¿Cómo se identifica el reactivo limitante?",
      opciones: ["Viendo cuál tiene menos gramos", "Dividiendo los moles disponibles entre su coeficiente estequiométrico", "Por su color", "Pesando el producto"],
      respuestaCorrecta: 1,
      explicacion: "La proporción molar es la que determina la disponibilidad real frente a la necesidad de la receta química."
    },
    {
      pregunta: "Si tenemos 2 moles de A y 2 moles de B para la reacción A + 2B → C, ¿quién limita?",
      opciones: ["A", "B", "Ninguno", "Ambos"],
      respuestaCorrecta: 1,
      explicacion: "Necesitamos el doble de B que de A. Para 2 moles de A necesitaríamos 4 de B, pero solo tenemos 2. B se agota primero."
    },
    {
      pregunta: "¿Qué es el Rendimiento Teórico?",
      opciones: ["Lo que realmente obtengo en el laboratorio", "La cantidad máxima de producto calculada matemáticamente", "La velocidad de la reacción", "El costo de los reactivos"],
      respuestaCorrecta: 1,
      explicacion: "Es la cantidad 'ideal' que obtendrías si todo reaccionara perfectamente sin pérdidas."
    },
    {
      pregunta: "El Rendimiento Porcentual se calcula como:",
      opciones: ["(Real / Teórico) * 100", "(Teórico / Real) * 100", "Real + Teórico", "Masa / Volumen"],
      respuestaCorrecta: 0,
      explicacion: "Mide la eficiencia del proceso real frente al ideal matemático."
    },
    {
      pregunta: "¿Por qué el rendimiento real suele ser menor al teórico?",
      opciones: ["Por reacciones secundarias", "Por impurezas", "Por pérdida de material al trasvasar", "Todas las anteriores"],
      respuestaCorrecta: 3,
      explicacion: "En el mundo real, muchos factores impiden alcanzar la perfección estequiométrica."
    },
    {
      pregunta: "En la síntesis de Haber (N₂ + 3H₂ → 2NH₃), si tienes 1 mol de N₂ y 4 moles de H₂, el exceso es de:",
      opciones: ["1 mol de N₂", "1 mol de H₂", "0 moles", "2 moles de NH₃"],
      respuestaCorrecta: 1,
      explicacion: "1 N₂ consume 3 H₂. Sobra 4 - 3 = 1 mol de H₂."
    }
  ],
  'quimica-5': [
    {
      pregunta: "¿Qué es la Molaridad (M)?",
      opciones: ["Gramos de soluto por litro", "Moles de soluto por litro de solución", "Moles de soluto por kg de solvente", "Densidad de la mezcla"],
      respuestaCorrecta: 1,
      explicacion: "Es la unidad de concentración más común en química analítica."
    },
    {
      pregunta: "¿Para qué sirve el aforo en un matraz volumétrico?",
      opciones: ["Para decorar", "Para indicar el volumen exacto de calibración", "Para sujetarlo", "Para medir la temperatura"],
      respuestaCorrecta: 1,
      explicacion: "El matraz está diseñado para contener un volumen preciso solo cuando el menisco está en el aforo."
    },
    {
      pregunta: "Para preparar 1L de solución 1M de NaCl (masa molar ≈ 58.5g/mol), necesito pesar:",
      opciones: ["1 gramo", "100 gramos", "58.5 gramos", "22.4 gramos"],
      respuestaCorrecta: 2,
      explicacion: "M = n/V. Si M=1 y V=1, entonces n=1 mol. 1 mol de NaCl pesa su masa molar."
    },
    {
      pregunta: "¿Cómo debe leerse el menisco en una solución acuosa?",
      opciones: ["Desde la parte superior de la curva", "Desde la parte inferior (punto más bajo de la panza)", "En diagonal", "No importa"],
      respuestaCorrecta: 1,
      explicacion: "La tensión superficial crea una curva; la medida estándar es la base de esa curva."
    },
    {
      pregunta: "Una solución saturada es aquella que:",
      opciones: ["Tiene mucha agua", "No admite más soluto a esa temperatura", "Está muy caliente", "Es transparente"],
      respuestaCorrecta: 1,
      explicacion: "Ha alcanzado el límite de solubilidad; cualquier soluto extra se irá al fondo sin disolverse."
    },
    {
      pregunta: "¿Qué significa 'Aforar'?",
      opciones: ["Pesar el soluto", "Llenar el matraz hasta la marca de precisión", "Limpiar el equipo", "Agitar la mezcla"],
      respuestaCorrecta: 1,
      explicacion: "Es la acción crítica de llevar el volumen al nivel exacto de la marca (aforo)."
    },
    {
      pregunta: "Si diluyo 100ml de solución 2M agregando 100ml de agua pura, la nueva concentración es:",
      opciones: ["2 M", "4 M", "1 M", "0.5 M"],
      respuestaCorrecta: 2,
      explicacion: "Al duplicar el volumen, la concentración se reduce a la mitad (C1V1 = C2V2)."
    }
  ],
  'quimica-6': [
    {
      pregunta: "¿Qué es la solubilidad?",
      opciones: ["La velocidad de disolución", "La cantidad máxima de soluto que se puede disolver en un solvente a una temperatura dada", "El color de la solución", "La dureza del cristal"],
      respuestaCorrecta: 1,
      explicacion: "Es una propiedad física que depende fuertemente de la temperatura y la naturaleza química."
    },
    {
      pregunta: "En la mayoría de los sólidos, si la temperatura aumenta, la solubilidad:",
      opciones: ["Disminuye", "Aumenta", "Se mantiene igual", "Se vuelve cero"],
      respuestaCorrecta: 1,
      explicacion: "El calor ayuda a romper las fuerzas intermoleculares del sólido, facilitando que entre en el solvente."
    },
    {
      pregunta: "¿Qué sucede en una solución SOBRESATURADA?",
      opciones: ["Es muy estable", "Contiene más soluto del que puede disolver en equilibrio; es inestable", "No tiene soluto", "Es un gas"],
      respuestaCorrecta: 1,
      explicacion: "Se logra calentando y enfriando con cuidado. Cualquier perturbación hará que el exceso de soluto cristalice."
    },
    {
      pregunta: "La cristalización se utiliza principalmente para:",
      opciones: ["Destruir sustancias", "Purificar sólidos", "Medir el pH", "Aumentar el volumen"],
      respuestaCorrecta: 1,
      explicacion: "Al cristalizar, las moléculas se ordenan en una red perfecta, dejando las impurezas fuera en el líquido (aguas madres)."
    },
    {
      pregunta: "¿Qué inicia el proceso de cristalización en una solución saturada?",
      opciones: ["Aumento de temperatura", "Disminución de temperatura o evaporación del solvente", "Agregar más agua", "Agitar muy lento"],
      respuestaCorrecta: 1,
      explicacion: "Al enfriar, la solubilidad cae; el soluto ya no cabe en el agua y debe salir en forma de cristales."
    },
    {
      pregunta: "La nucleación es:",
      opciones: ["La explosión del núcleo", "El primer paso de la formación del cristal donde las moléculas se agrupan", "El cambio de color", "La filtración"],
      respuestaCorrecta: 1,
      explicacion: "Es el nacimiento de los cristales; a partir de pequeños núcleos, el cristal crece."
    },
    {
      pregunta: "Si enfriamos MUY rápido (choque térmico), los cristales suelen ser:",
      opciones: ["Muy grandes y perfectos", "Pequeños y numerosos", "No se forman cristales", "Se vuelven negros"],
      respuestaCorrecta: 1,
      explicacion: "Un enfriamiento rápido crea muchos núcleos simultáneamente, resultando en cristales pequeños."
    }
  ],
  'quimica-7': [
    {
      pregunta: "¿Qué es una titulación o valoración ácido-base?",
      opciones: ["Medir la masa de un ácido", "Determinar la concentración desconocida de una solución usando otra de concentración conocida", "Mezclar colores", "Hacer que algo explote"],
      respuestaCorrecta: 1,
      explicacion: "Es una técnica volumétrica basada en la neutralización química."
    },
    {
      pregunta: "¿Qué sucede en el Punto de Equivalencia?",
      opciones: ["Se acaba el agua", "Los moles de H+ del ácido igualan a los moles de OH- de la base", "La solución explota", "El pH siempre es 14"],
      respuestaCorrecta: 1,
      explicacion: "Es el momento teórico donde la reacción es estequiométricamente completa."
    },
    {
      pregunta: "¿Cuál es la función del indicador (ej: fenolftaleína)?",
      opciones: ["Acelerar la reacción", "Cambiar de color cerca del punto de equivalencia para avisarnos", "Limpiar el matraz", "Aumentar el pH"],
      respuestaCorrecta: 1,
      explicacion: "Los indicadores son ácidos o bases débiles que tienen colores distintos según el pH del medio."
    },
    {
      pregunta: "En una titulación de HCl con NaOH, el pH en el punto de equivalencia es:",
      opciones: ["0", "7 (Neutro)", "14", "4"],
      respuestaCorrecta: 1,
      explicacion: "Al ser ácido fuerte y base fuerte, la sal resultante (NaCl) no hidroliza, dejando el pH neutro."
    },
    {
      pregunta: "La 'Bureta' se utiliza para:",
      opciones: ["Contener el ácido", "Medir y dispensar el volumen de titulante con alta precisión", "Pesar sólidos", "Calentar la mezcla"],
      respuestaCorrecta: 1,
      explicacion: "Su escala y válvula permiten controlar gota a gota la adición de reactivo."
    },
    {
      pregunta: "¿Qué es el 'Punto Final'?",
      opciones: ["El final del laboratorio", "El momento en que el indicador cambia de color permanentemente", "Cuando se rompe el vidrio", "El inicio del goteo"],
      respuestaCorrecta: 1,
      explicacion: "Es la aproximación experimental al punto de equivalencia."
    },
    {
      pregunta: "Si usamos 20ml de NaOH 0.1M para neutralizar 20ml de HCl, la molaridad del HCl es:",
      opciones: ["0.2 M", "0.1 M", "0.05 M", "1 M"],
      respuestaCorrecta: 1,
      explicacion: "Al ser volúmenes iguales y relación 1:1, las concentraciones deben ser iguales."
    }
  ],
  'quimica-8': [
    {
      pregunta: "¿Qué dice el Principio de Le Châtelier?",
      opciones: ["Que las reacciones nunca terminan", "Que si un sistema en equilibrio es perturbado, este se desplazará para contrarrestar la perturbación", "Que el calor siempre ayuda", "Que la masa se conserva"],
      respuestaCorrecta: 1,
      explicacion: "Es como una ley de 'terquedad' química: el sistema busca volver a su estado de calma."
    },
    {
      pregunta: "En una reacción ENDOTÉRMICA, si aumentamos la temperatura, el equilibrio:",
      opciones: ["Se desplaza a la derecha (productos)", "Se desplaza a la izquierda (reactivos)", "No se mueve", "Se detiene"],
      respuestaCorrecta: 0,
      explicacion: "Como la reacción 'consume' calor, darle más calor es como darle más reactivo."
    },
    {
      pregunta: "Si aumentamos la presión en un equilibrio gaseoso, el sistema se desplaza hacia:",
      opciones: ["Donde hay más moles de gas", "Donde hay menos moles de gas", "La derecha siempre", "No le afecta la presión"],
      respuestaCorrecta: 1,
      explicacion: "Al haber menos espacio, el sistema busca la configuración que ocupe menos volumen (menos moléculas)."
    },
    {
      pregunta: "¿Qué indica una constante de equilibrio (Kc) muy grande (>1000)?",
      opciones: ["Que casi no hay productos", "Que la reacción favorece fuertemente la formación de productos", "Que la reacción es muy lenta", "Que el sistema no tiene equilibrio"],
      respuestaCorrecta: 1,
      explicacion: "Kc = [Productos]/[Reactivos]. Un valor alto significa un numerador mucho más grande."
    },
    {
      pregunta: "En el sistema N₂O₄ (incoloro) ⇌ 2NO₂ (café), si se oscurece al calentar, la reacción es:",
      opciones: ["Exotérmica", "Endotérmica", "De combustión", "Imposible"],
      respuestaCorrecta: 1,
      explicacion: "El calor favoreció al NO₂ (productos), por lo que absorbió energía para formarse."
    },
    {
      pregunta: "¿Cómo afecta un catalizador al estado de equilibrio?",
      opciones: ["Lo desplaza a la derecha", "Lo desplaza a la izquierda", "No afecta la posición del equilibrio, solo hace que se alcance más rápido", "Aumenta la constante Kc"],
      respuestaCorrecta: 2,
      explicacion: "El catalizador baja la energía de activación para AMBOS sentidos, por lo que no favorece a un lado sobre el otro."
    },
    {
      pregunta: "Si retiramos producto continuamente de un reactor en equilibrio:",
      opciones: ["La reacción se detiene", "El sistema producirá más producto para intentar compensar la pérdida", "Kc cambia", "La temperatura sube"],
      respuestaCorrecta: 1,
      explicacion: "Es el truco usado en la industria para forzar rendimientos del 100%."
    }
  ],
  'quimica-9': [
    {
      pregunta: "¿Qué ocurre en el Ánodo de una celda galvánica?",
      opciones: ["Reducción", "Oxidación (pérdida de electrones)", "Se crea energía", "No ocurre nada"],
      respuestaCorrecta: 1,
      explicacion: "Mnemotecnia: AN-OX (Ánodo-Oxidación) y CA-RED (Cátodo-Reducción)."
    },
    {
      pregunta: "¿Cuál es la función del puente salino?",
      opciones: ["Transportar electrones", "Mantener la neutralidad eléctrica permitiendo el flujo de iones", "Calentar la celda", "Sujetar los vasos"],
      respuestaCorrecta: 1,
      explicacion: "Sin él, las soluciones se cargarían eléctricamente y la reacción se detendría en microsegundos."
    },
    {
      pregunta: "Los electrones fluyen a través del cable externo desde el:",
      opciones: ["Cátodo al Ánodo", "Ánodo al Cátodo", "Puente salino al voltímetro", "Positivo al Negativo siempre"],
      respuestaCorrecta: 1,
      explicacion: "Salen de donde se producen (oxidación en el ánodo) hacia donde se consumen (reducción en el cátodo)."
    },
    {
      pregunta: "Un potencial de celda (E°cell) positivo indica que la reacción es:",
      opciones: ["Espontánea", "No espontánea", "Muy lenta", "Explosiva"],
      respuestaCorrecta: 0,
      explicacion: "Significa que la energía química puede convertirse naturalmente en trabajo eléctrico (ΔG < 0)."
    },
    {
      pregunta: "En la serie de actividad, el metal más 'noble' (como el Oro o Plata):",
      opciones: ["Se oxida fácilmente", "Tiende a reducirse y ser el cátodo", "Flota", "Es un gas"],
      respuestaCorrecta: 1,
      explicacion: "Tienen potenciales de reducción altos, por lo que 'quieren' ganar electrones."
    },
    {
      pregunta: "La unidad de potencial eléctrico es el:",
      opciones: ["Amperio", "Vatio", "Voltio (V)", "Coulomb"],
      respuestaCorrecta: 2,
      explicacion: "Mide la 'fuerza electromotriz' o diferencia de energía potencial por unidad de carga."
    },
    {
      pregunta: "¿Qué sucede con el electrodo del cátodo a medida que avanza la reacción?",
      opciones: ["Se disuelve y pierde masa", "Aumenta su masa al depositarse metal sobre él", "Se vuelve líquido", "No cambia"],
      respuestaCorrecta: 1,
      explicacion: "Los iones en solución ganan electrones y se convierten en metal sólido sobre la superficie."
    }
  ],
  'quimica-10': [
    {
      pregunta: "¿En qué propiedad se basa la destilación para separar mezclas?",
      opciones: ["Densidad", "Solubilidad", "Diferencia en los puntos de ebullición", "Magnetismo"],
      respuestaCorrecta: 2,
      explicacion: "El componente más volátil (menor punto de ebullición) se convierte en vapor primero."
    },
    {
      pregunta: "¿Cuál es la función del condensador (refrigerante)?",
      opciones: ["Calentar el líquido", "Enfriar el vapor para que vuelva a ser líquido", "Filtrar impurezas", "Medir la presión"],
      respuestaCorrecta: 1,
      explicacion: "Usa un flujo de agua externa para extraer calor del vapor."
    },
    {
      pregunta: "¿Para qué sirven las 'piedras de ebullición' o perlas de vidrio en el matraz?",
      opciones: ["Para que pese más", "Para asegurar una ebullición suave y evitar proyecciones violentas", "Para dar sabor", "Para filtrar"],
      respuestaCorrecta: 1,
      explicacion: "Proporcionan puntos de nucleación para las burbujas, evitando el sobrecalentamiento."
    },
    {
      pregunta: "En una destilación fraccionada, la columna de fraccionamiento permite:",
      opciones: ["Ir más rápido", "Realizar múltiples ciclos de evaporación-condensación, mejorando la pureza", "Cambiar el color", "Ahorrar agua"],
      respuestaCorrecta: 1,
      explicacion: "Es esencial para separar líquidos con puntos de ebullición muy cercanos."
    },
    {
      pregunta: "Si destilamos una mezcla de agua (100°C) y acetona (56°C), ¿qué sale primero?",
      opciones: ["Agua", "Acetona", "Ambas al mismo tiempo", "Ninguna"],
      respuestaCorrecta: 1,
      explicacion: "La acetona es más volátil; su vapor saturará el sistema mucho antes que el del agua."
    },
    {
      pregunta: "¿Por qué el agua en el refrigerante debe entrar por la parte inferior?",
      opciones: ["Por gravedad", "Para asegurar que el tubo esté siempre lleno y el enfriamiento sea eficiente", "Porque la manguera es corta", "Para que no salpique"],
      respuestaCorrecta: 1,
      explicacion: "El flujo a contracorriente maximiza la transferencia de calor."
    },
    {
      pregunta: "Un 'Azeótropo' es una mezcla que:",
      opciones: ["No se puede mezclar", "Destila con una composición constante, como si fuera una sustancia pura", "Es explosiva", "Es muy densa"],
      respuestaCorrecta: 1,
      explicacion: "Como el alcohol al 96%; no se puede purificar más mediante destilación simple debido a interacciones moleculares."
    }
  ],
  'biologia-1': [
    {
      pregunta: "¿Qué parte del microscopio se usa para el enfoque inicial con objetivos de bajo aumento?",
      opciones: ["Tornillo Micrométrico", "Tornillo Macrométrico", "Condensador", "Revólver"],
      respuestaCorrecta: 1,
      explicacion: "El macrométrico mueve la platina grandes distancias para localizar la muestra rápidamente."
    },
    {
      pregunta: "Si usas un ocular de 10x y un objetivo de 40x, ¿cuál es el aumento total?",
      opciones: ["50x", "40x", "400x", "100x"],
      respuestaCorrecta: 2,
      explicacion: "El aumento total es el producto del aumento del ocular por el del objetivo (10 * 40 = 400)."
    },
    {
      pregunta: "¿Qué es la 'Apertura Numérica' (NA) de un objetivo?",
      opciones: ["El precio del lente", "La capacidad del lente para captar luz y resolver detalles finos", "El diámetro físico del lente", "El número de serie"],
      respuestaCorrecta: 1,
      explicacion: "A mayor NA, mayor es la resolución (capacidad de ver dos puntos cercanos como separados)."
    },
    {
      pregunta: "¿Para qué sirve el aceite de inmersión?",
      opciones: ["Para limpiar el lente", "Para evitar la refracción de la luz entre el vidrio y el aire en objetivos de 100x", "Para lubricar los tornillos", "Para que la muestra no se mueva"],
      respuestaCorrecta: 1,
      explicacion: "Tiene el mismo índice de refracción que el vidrio, permitiendo que más luz entre al objetivo."
    },
    {
      pregunta: "El límite de resolución depende de:",
      opciones: ["La intensidad de la luz", "La longitud de onda de la luz y la Apertura Numérica", "La marca del microscopio", "El tamaño de la pantalla"],
      respuestaCorrecta: 1,
      explicacion: "Según la ley de Abbe, d = λ / (2 * NA). Luz azul (λ corta) da mejor resolución que la roja."
    },
    {
      pregunta: "La función del condensador es:",
      opciones: ["Ampliar la imagen", "Concentrar la luz sobre la muestra", "Cambiar los objetivos", "Sujetar el portaobjetos"],
      respuestaCorrecta: 1,
      explicacion: "Ajusta el cono de luz para iluminar de forma óptima el campo visual."
    },
    {
      pregunta: "Al pasar de 10x a 40x, el campo de visión:",
      opciones: ["Se vuelve más grande", "Se vuelve más pequeño (ves menos área pero con más detalle)", "No cambia", "Se vuelve más brillante"],
      respuestaCorrecta: 1,
      explicacion: "A mayor aumento, el área real que observas en la platina disminuye significativamente."
    }
  ],
  'biologia-2': [
    {
      pregunta: "¿Qué es la ósmosis?",
      opciones: ["El paso de solutos a través de una membrana", "El movimiento neto de agua a través de una membrana semipermeable", "La respiración celular", "La división del núcleo"],
      respuestaCorrecta: 1,
      explicacion: "El agua se mueve de donde hay menos soluto (más agua) a donde hay más soluto (menos agua)."
    },
    {
      pregunta: "En un medio HIPERTÓNICO, una célula animal:",
      opciones: ["Se hincha y puede explotar (citólisis)", "Se arruga y pierde agua (crenación)", "No cambia", "Se divide"],
      respuestaCorrecta: 1,
      explicacion: "Como el exterior está más concentrado, el agua sale de la célula para intentar equilibrar."
    },
    {
      pregunta: "¿Qué evita que una célula vegetal explote en un medio hipotónico?",
      opciones: ["La membrana plasmática", "La pared celular rígida", "Las vacuolas", "El núcleo"],
      respuestaCorrecta: 1,
      explicacion: "La pared ejerce una presión contraria (presión de turgencia) que limita la entrada de agua."
    },
    {
      pregunta: "Una solución ISOTÓNICA es aquella donde:",
      opciones: ["La concentración de solutos es igual adentro y afuera de la célula", "Hay mucha sal afuera", "No hay agua", "La célula muere"],
      respuestaCorrecta: 0,
      explicacion: "No hay flujo neto de agua; la célula mantiene su volumen estable."
    },
    {
      pregunta: "El fenómeno de la plasmólisis en plantas ocurre cuando:",
      opciones: ["La célula gana agua", "La membrana se separa de la pared debido a la pérdida de agua", "La célula se divide", "La planta florece"],
      respuestaCorrecta: 1,
      explicacion: "Ocurre en medios hipertónicos; la vacuola se encoge y jala a la membrana."
    },
    {
      pregunta: "¿Qué tipo de transporte es la ósmosis?",
      opciones: ["Transporte Activo (usa ATP)", "Transporte Pasivo (difusión simple de agua)", "Endocitosis", "Exocitosis"],
      respuestaCorrecta: 1,
      explicacion: "No requiere gasto de energía celular; ocurre por gradiente de concentración."
    },
    {
      pregunta: "Si bebes mucha agua de mar (muy salada), tus células:",
      opciones: ["Se hidratan más", "Se deshidratan por ósmosis", "Se vuelven más fuertes", "No les pasa nada"],
      respuestaCorrecta: 1,
      explicacion: "El exceso de sal en la sangre crearía un medio hipertónico, sacando el agua de tus células."
    }
  ],
  'biologia-3': [
    {
      pregunta: "¿En qué parte de la célula ocurre la TRANSCRIPCIÓN?",
      opciones: ["En el Ribosoma", "En el Citoplasma", "En el Núcleo", "En la Mitocondria"],
      respuestaCorrecta: 2,
      explicacion: "Es el proceso de copiar el ADN a ARNm, y el ADN nunca sale del núcleo en eucariotas."
    },
    {
      pregunta: "¿Qué base nitrogenada es exclusiva del ARN?",
      opciones: ["Timina (T)", "Uracilo (U)", "Adenina (A)", "Guanina (G)"],
      respuestaCorrecta: 1,
      explicacion: "En el ARN, el Uracilo reemplaza a la Timina y se aparea con la Adenina."
    },
    {
      pregunta: "La función del ARNm (mensajero) es:",
      opciones: ["Transportar aminoácidos", "Llevar la información genética del núcleo al ribosoma", "Formar parte de la estructura del ribosoma", "Cortar el ADN"],
      respuestaCorrecta: 1,
      explicacion: "Actúa como el 'plano' o instructivo para construir la proteína."
    },
    {
      pregunta: "¿Qué es un CODÓN?",
      opciones: ["Una proteína pequeña", "Una secuencia de 3 bases nitrogenadas que codifica un aminoácido", "Un tipo de azúcar", "El centro del núcleo"],
      respuestaCorrecta: 1,
      explicacion: "El código genético se lee de tres en tres letras."
    },
    {
      pregunta: "El proceso de TRADUCCIÓN consiste en:",
      opciones: ["Copiar ADN a ADN", "Copiar ADN a ARN", "Convertir la secuencia de ARNm en una cadena de aminoácidos (proteína)", "Destruir proteínas"],
      respuestaCorrecta: 2,
      explicacion: "Ocurre en el ribosoma con la ayuda del ARNt (transferencia)."
    },
    {
      pregunta: "¿Qué sucede cuando el ribosoma llega a un 'Codón de Parada' (STOP)?",
      opciones: ["La célula muere", "La traducción se detiene y la proteína es liberada", "Se reinicia el proceso", "Se añade un lípido"],
      respuestaCorrecta: 1,
      explicacion: "Indica el final de la cadena polipeptídica."
    },
    {
      pregunta: "Si la secuencia de ADN es TAC, ¿cuál es el codón de ARNm correspondiente?",
      opciones: ["ATG", "AUG", "UAC", "GUA"],
      respuestaCorrecta: 1,
      explicacion: "T se une con A, A con U (en ARN), y C con G. El codón AUG es el inicio universal."
    }
  ],
  'biologia-4': [
    {
      pregunta: "¿Cuál es el organelo encargado de la fotosíntesis?",
      opciones: ["Mitocondria", "Cloroplasto", "Aparato de Golgi", "Lisosoma"],
      respuestaCorrecta: 1,
      explicacion: "Los cloroplastos contienen la clorofila necesaria para capturar la energía lumínica."
    },
    {
      pregunta: "¿Qué gas producen las plantas como subproducto de la fotosíntesis?",
      opciones: ["Dióxido de Carbono (CO₂)", "Oxígeno (O₂)", "Nitrógeno (N₂)", "Metano"],
      respuestaCorrecta: 1,
      explicacion: "El oxígeno proviene de la ruptura de la molécula de agua durante la fase luminosa."
    },
    {
      pregunta: "¿Qué color de luz es MENOS eficiente para la fotosíntesis?",
      opciones: ["Azul", "Rojo", "Verde", "Violeta"],
      respuestaCorrecta: 2,
      explicacion: "Las plantas se ven verdes porque reflejan esa luz en lugar de absorberla."
    },
    {
      pregunta: "¿Cuál es la fuente de energía inicial para este proceso?",
      opciones: ["Glucosa", "ATP", "Luz solar", "Calor del suelo"],
      respuestaCorrecta: 2,
      explicacion: "La energía fotónica se convierte en energía química (ATP y NADPH)."
    },
    {
      pregunta: "¿Qué moléculas se necesitan como 'materias primas'?",
      opciones: ["O₂ y Glucosa", "CO₂ y Agua", "Nitrógeno y Suelo", "Proteínas"],
      respuestaCorrecta: 1,
      explicacion: "Usan el carbono del aire y los electrones del agua para fabricar azúcares."
    },
    {
      pregunta: "El Ciclo de Calvin (fase oscura) tiene como objetivo:",
      opciones: ["Romper el agua", "Producir O₂", "Fijar el CO₂ para producir glucosa", "Absorber luz"],
      respuestaCorrecta: 2,
      explicacion: "Ocurre en el estroma del cloroplasto y no requiere luz directa, pero sí los productos de la fase luminosa."
    },
    {
      pregunta: "Si aumentamos mucho la temperatura, la tasa fotosintética:",
      opciones: ["Sigue subiendo siempre", "Cae drásticamente porque las enzimas se desnaturalizan", "No cambia", "Se vuelve negativa"],
      respuestaCorrecta: 1,
      explicacion: "Como todo proceso bioquímico, depende de enzimas que tienen un rango de temperatura óptimo."
    }
  ],
  'biologia-5': [
    {
      pregunta: "¿Qué es un alelo dominante?",
      opciones: ["Uno que nunca se expresa", "Uno que se expresa siempre que está presente, ocultando al recesivo", "Uno que solo está en los machos", "Un gen mutado"],
      respuestaCorrecta: 1,
      explicacion: "Se representa con letra mayúscula (A). Basta una copia para ver el rasgo."
    },
    {
      pregunta: "Si cruzamos dos plantas heterocigotas (Aa x Aa), ¿cuál es la proporción fenotípica esperada?",
      opciones: ["100% dominantes", "50% dominantes, 50% recesivas", "3:1 (75% dominantes, 25% recesivas)", "1:1:1:1"],
      respuestaCorrecta: 2,
      explicacion: "Es la segunda ley de Mendel. El rasgo recesivo reaparece en la F2."
    },
    {
      pregunta: "¿Qué es el GENOTIPO?",
      opciones: ["La apariencia física", "La composición genética (los alelos)", "El color de las flores", "El peso de la planta"],
      respuestaCorrecta: 1,
      explicacion: "Es la información interna (ej: AA, Aa, aa)."
    },
    {
      pregunta: "¿Qué es el FENOTIPO?",
      opciones: ["La secuencia de ADN", "La expresión observable de los genes", "La cantidad de cromosomas", "El tipo de polen"],
      respuestaCorrecta: 1,
      explicacion: "Es lo que vemos (ej: ojos azules, tallo alto)."
    },
    {
      pregunta: "Un organismo Homocigoto Recesivo se representa como:",
      opciones: ["AA", "Aa", "aa", "XY"],
      respuestaCorrecta: 2,
      explicacion: "Tiene dos copias del alelo 'débil' o recesivo."
    },
    {
      pregunta: "¿Qué herramienta se usa para predecir las cruzas genéticas?",
      opciones: ["Regla de tres", "Cuadro de Punnett", "Microscopio", "Gráfico de barras"],
      respuestaCorrecta: 1,
      explicacion: "Permite visualizar todas las combinaciones posibles de gametos."
    },
    {
      pregunta: "Si un rasgo solo aparece cuando el organismo es homocigoto, el alelo es:",
      opciones: ["Dominante", "Recesivo", "Codominante", "Letal"],
      respuestaCorrecta: 1,
      explicacion: "Los alelos recesivos son 'enmascarados' por los dominantes en los heterocigotos."
    }
  ],
  'biologia-6': [
    {
      pregunta: "¿Quién propuso la teoría de la evolución por selección natural?",
      opciones: ["Mendel", "Charles Darwin", "Einstein", "Pasteur"],
      respuestaCorrecta: 1,
      explicacion: "En su obra 'El origen de las especies' (1859)."
    },
    {
      pregunta: "¿Cuál es el motor principal de la selección natural?",
      opciones: ["El deseo de cambiar", "La variabilidad genética y la presión del entorno", "La magia", "La falta de comida solamente"],
      respuestaCorrecta: 1,
      explicacion: "Individuos con rasgos ventajosos sobreviven más y dejan más descendencia."
    },
    {
      pregunta: "¿Qué es una adaptación?",
      opciones: ["Un cambio que ocurre en un solo individuo durante su vida", "Un rasgo heredable que aumenta la supervivencia en un ambiente", "Aprender a nadar", "Mudarse de casa"],
      respuestaCorrecta: 1,
      explicacion: "Son rasgos refinados por la selección a lo largo de muchas generaciones."
    },
    {
      pregunta: "En el caso de las polillas de Manchester, ¿por qué aumentaron las oscuras?",
      opciones: ["Por la contaminación que oscureció los árboles (mejor camuflaje)", "Porque hacía más calor", "Porque eran más fuertes", "Fue por azar"],
      respuestaCorrecta: 0,
      explicacion: "La selección favoreció a las que no eran vistas por los pájaros en troncos llenos de hollín."
    },
    {
      pregunta: "La selección natural actúa sobre:",
      opciones: ["Los genes directamente", "El fenotipo (el individuo)", "Solo las crías", "Las rocas"],
      respuestaCorrecta: 1,
      explicacion: "El ambiente 'elige' a los individuos; esto cambia la frecuencia de los genes en la población después."
    },
    {
      pregunta: "¿Qué sucede con una especie que no puede adaptarse a un cambio ambiental rápido?",
      opciones: ["Se vuelve inmortal", "Corre el riesgo de extinguirse", "Cambia sus genes a voluntad", "Se duplica"],
      respuestaCorrecta: 1,
      explicacion: "Si la tasa de cambio ambiental supera la tasa de evolución, la población colapsa."
    },
    {
      pregunta: "La 'supervivencia del más apto' significa:",
      opciones: ["El más fuerte físicamente", "El que mejor se reproduce y transmite sus genes", "El más inteligente", "El que vive más años"],
      respuestaCorrecta: 1,
      explicacion: "En biología, 'aptitud' es éxito reproductivo."
    }
  ],
  'biologia-7': [
    {
      pregunta: "¿Cuál es la función principal de los reflejos?",
      opciones: ["Pensar rápido", "Protección y respuesta rápida ante estímulos sin intervención del cerebro consciente", "Hacer ejercicio", "Gastar energía"],
      respuestaCorrecta: 1,
      explicacion: "Los reflejos son automáticos y procesados principalmente en la médula espinal (arco reflejo)."
    },
    {
      pregunta: "¿Qué camino sigue el arco reflejo?",
      opciones: ["Receptor -> Cerebro -> Músculo", "Receptor -> Neurona Sensorial -> Médula -> Neurona Motora -> Músculo", "Músculo -> Nervio -> Corazón", "Piel -> Ojo -> Mano"],
      respuestaCorrecta: 1,
      explicacion: "Es un circuito corto que ahorra tiempo vital en situaciones de peligro."
    },
    {
      pregunta: "¿Qué sustancia acelera la conducción del impulso nervioso?",
      opciones: ["Agua", "Mielina", "Sangre", "Calcio"],
      respuestaCorrecta: 1,
      explicacion: "La vaina de mielina actúa como aislante eléctrico permitiendo la conducción saltatoria."
    },
    {
      pregunta: "El reflejo rotuliano (golpe en la rodilla) es un ejemplo de:",
      opciones: ["Reflejo condicionado", "Reflejo miotático (de estiramiento)", "Reflejo visual", "Enfermedad"],
      respuestaCorrecta: 1,
      explicacion: "Mide la integridad de los nervios espinales y la respuesta muscular básica."
    },
    {
      pregunta: "¿Qué es una sinapsis?",
      opciones: ["Un hueso del cráneo", "El espacio de comunicación entre dos neuronas", "Una parte del músculo", "El núcleo de la célula"],
      respuestaCorrecta: 1,
      explicacion: "Aquí se liberan neurotransmisores para pasar la señal química a la siguiente célula."
    },
    {
      pregunta: "La velocidad de un impulso nervioso puede ser de hasta:",
      opciones: ["1 km/h", "120 m/s (unos 430 km/h)", "La velocidad de la luz", "10 m/s"],
      respuestaCorrecta: 1,
      explicacion: "Es increíblemente rápida gracias a los nodos de Ranvier y la mielina."
    },
    {
      pregunta: "Si se daña la raíz dorsal de la médula, el paciente pierde:",
      opciones: ["El movimiento", "La sensibilidad", "La memoria", "La vista"],
      respuestaCorrecta: 1,
      explicacion: "La raíz dorsal lleva la información sensorial HACIA la médula."
    }
  ],
  'biologia-8': [
    {
      pregunta: "¿Qué fase del ciclo cardíaco corresponde a la contracción del corazón?",
      opciones: ["Diástole", "Sístole", "Arritmia", "Reposo"],
      respuestaCorrecta: 1,
      explicacion: "Durante la sístole, el músculo se contrae para bombear la sangre a las arterias."
    },
    {
      pregunta: "¿Qué cámaras del corazón reciben la sangre de las venas?",
      opciones: ["Ventrículos", "Aurículas (o Atrios)", "Aortas", "Válvulas"],
      respuestaCorrecta: 1,
      explicacion: "Las aurículas son las cámaras de entrada."
    },
    {
      pregunta: "La sangre oxigenada sale del corazón hacia el cuerpo a través de:",
      opciones: ["La Arteria Pulmonar", "La Arteria Aorta", "La Vena Cava", "La Vena Porta"],
      respuestaCorrecta: 1,
      explicacion: "La aorta es la arteria más grande y nace en el ventrículo izquierdo."
    },
    {
      pregunta: "¿Qué produce el sonido 'lub-dub' del corazón?",
      opciones: ["El choque de la sangre contra las paredes", "El cierre de las válvulas cardíacas", "El roce del corazón con los pulmones", "La entrada de aire"],
      respuestaCorrecta: 1,
      explicacion: "Los ruidos son las válvulas cerrándose para evitar que la sangre retroceda."
    },
    {
      pregunta: "La frecuencia cardíaca normal en reposo es de aproximadamente:",
      opciones: ["20-40 BPM", "60-100 BPM", "150-200 BPM", "500 BPM"],
      respuestaCorrecta: 1,
      explicacion: "BPM = Latidos por minuto. Varía con la edad y condición física."
    },
    {
      pregunta: "¿Qué sucede con la frecuencia cardíaca durante el ejercicio?",
      opciones: ["Disminuye", "Aumenta para suministrar más oxígeno a los músculos", "Se detiene", "Se vuelve irregular"],
      respuestaCorrecta: 1,
      explicacion: "Es una respuesta homeostática a la mayor demanda metabólica."
    },
    {
      pregunta: "El marcapasos natural del corazón se llama:",
      opciones: ["Válvula Mitral", "Nodo Sinusal", "Haz de His", "Fibras de Purkinje"],
      respuestaCorrecta: 1,
      explicacion: "Es un grupo de células que generan el impulso eléctrico inicial de forma rítmica."
    }
  ],
  'biologia-9': [
    {
      pregunta: "¿Qué tipo de moléculas son las enzimas?",
      opciones: ["Lípidos", "Carbohidratos", "Proteínas (catalizadores biológicos)", "Minerales"],
      respuestaCorrecta: 2,
      explicacion: "Aceleran las reacciones químicas millones de veces sin consumirse."
    },
    {
      pregunta: "¿Qué enzima inicia la digestión de los carbohidratos en la boca?",
      opciones: ["Pepsina", "Amilasa salival", "Lipasa", "Tripsina"],
      respuestaCorrecta: 1,
      explicacion: "Descompone el almidón en azúcares más simples (maltosa)."
    },
    {
      pregunta: "¿En qué órgano se digieren principalmente las proteínas gracias al ácido clorhídrico?",
      opciones: ["Boca", "Estómago", "Intestino Grueso", "Esófago"],
      respuestaCorrecta: 1,
      explicacion: "El pH bajo del estómago activa la pepsina para romper proteínas."
    },
    {
      pregunta: "¿Qué sucede con la actividad enzimática si el pH cambia drásticamente?",
      opciones: ["Aumenta siempre", "Disminuye porque la enzima pierde su forma (desnaturalización)", "No le afecta", "La enzima cambia de nombre"],
      respuestaCorrecta: 1,
      explicacion: "Cada enzima tiene un pH óptimo (ej: pepsina pH 2, amilasa pH 7)."
    },
    {
      pregunta: "La función de la bilis (producida por el hígado) es:",
      opciones: ["Digerir proteínas", "Emulsionar las grasas (lípidos) para facilitar su digestión", "Matar bacterias", "Absorber agua"],
      respuestaCorrecta: 1,
      explicacion: "Actúa como un 'detergente' que rompe las gotas grandes de grasa en pequeñas."
    },
    {
      pregunta: "¿Dónde ocurre la mayor parte de la absorción de nutrientes?",
      opciones: ["Estómago", "Intestino Delgado", "Hígado", "Páncreas"],
      respuestaCorrecta: 1,
      explicacion: "Sus vellosidades aumentan el área de contacto con la sangre."
    },
    {
      pregunta: "El sustrato es:",
      opciones: ["La enzima misma", "La molécula sobre la cual actúa la enzima", "El producto final", "Un desecho"],
      respuestaCorrecta: 1,
      explicacion: "La enzima tiene un 'sitio activo' específico para encajar con su sustrato (modelo llave-cerradura)."
    }
  ],
  'biologia-10': [
    {
      pregunta: "¿Qué representa un ecosistema?",
      opciones: ["Solo los animales", "La interacción entre factores bióticos (seres vivos) y abióticos (ambiente)", "Las plantas únicamente", "Un zoológico"],
      respuestaCorrecta: 1,
      explicacion: "Es una unidad funcional donde la materia y energía fluyen entre lo vivo y lo no vivo."
    },
    {
      pregunta: "¿Qué sucede en el modelo Presa-Depredador si hay demasiados depredadores?",
      opciones: ["Las presas aumentan", "La población de presas colapsa, seguida por la de depredadores (hambre)", "Nada, el ecosistema es infinito", "Los depredadores se vuelven vegetarianos"],
      respuestaCorrecta: 1,
      explicacion: "Es un ciclo de retroalimentación negativa que mantiene el equilibrio."
    },
    {
      pregunta: "¿Quiénes son los 'Productores' en una cadena trófica?",
      opciones: ["Los hongos", "Los leones", "Las plantas y algas (autótrofos)", "Los humanos"],
      respuestaCorrecta: 2,
      explicacion: "Son los únicos capaces de transformar energía solar en energía química (comida)."
    },
    {
      pregunta: "¿Qué es la capacidad de carga de un ecosistema?",
      opciones: ["El peso de la tierra", "El tamaño máximo de población que el ambiente puede soportar indefinidamente", "Cuánta comida hay en un camión", "La velocidad del viento"],
      respuestaCorrecta: 1,
      explicacion: "Llegado a este punto, la falta de recursos limita el crecimiento poblacional."
    },
    {
      pregunta: "¿Qué papel juegan los descomponedores (bacterias y hongos)?",
      opciones: ["Cazar animales", "Reciclar la materia orgánica convirtiéndola en inorgánica para los productores", "No sirven de nada", "Ensuciar el suelo"],
      respuestaCorrecta: 1,
      explicacion: "Sin ellos, los nutrientes quedarían atrapados en los cadáveres y la vida se detendría."
    },
    {
      pregunta: "La biodiversidad es importante porque:",
      opciones: ["Se ve bonito", "Aumenta la estabilidad y resiliencia del ecosistema ante cambios", "Hace que el aire sea más denso", "No es importante"],
      respuestaCorrecta: 1,
      explicacion: "Ecosistemas con más especies tienen más formas de recuperarse de desastres."
    },
    {
      pregunta: "Si una especie desaparece por completo, se dice que está:",
      opciones: ["En peligro", "Extinta", "Durmiendo", "Migrando"],
      respuestaCorrecta: 1,
      explicacion: "La extinción es la pérdida total de los individuos de una especie."
    }
  ],
};

// Generador de quices genéricos para prácticas no definidas
export const getQuizForPractice = (id: string): Question[] => {
  return ALL_QUIZZES[id] || [
    {
      pregunta: "¿Cuál es el objetivo principal de este laboratorio?",
      opciones: ["Validar una teoría científica", "Pasar el tiempo", "Destruir el equipo", "No aprender nada"],
      respuestaCorrecta: 0,
      explicacion: "Todo laboratorio CEN busca validar conceptos teóricos mediante la experimentación práctica."
    },
    {
      pregunta: "¿Qué ley rige el comportamiento observado en este simulador?",
      opciones: ["Leyes de Newton", "Leyes de la Termodinámica", "Leyes de la Conservación", "Depende del módulo"],
      respuestaCorrecta: 3,
      explicacion: "Cada módulo está basado en principios físicos, químicos o biológicos específicos de su área."
    },
    {
      pregunta: "La precisión en la toma de datos es importante porque...",
      opciones: ["Se ve mejor en la bitácora", "Minimiza el error experimental", "Es una regla sin sentido", "No es importante"],
      respuestaCorrecta: 1,
      explicacion: "La precisión asegura que los resultados experimentales se acerquen a los valores teóricos esperados."
    },
    {
      pregunta: "¿Qué componente del simulador permite registrar los hallazgos?",
      opciones: ["El radar", "La bitácora", "El cronómetro", "El ventilador"],
      respuestaCorrecta: 1,
      explicacion: "La bitácora es el documento científico donde se asientan las observaciones y resultados."
    },
    {
      pregunta: "¿Cuál es el papel del Dr. Quantum?",
      opciones: ["Es un estorbo", "Es el tutor pedagógico", "Es un enemigo", "No tiene papel"],
      respuestaCorrecta: 1,
      explicacion: "El Dr. Quantum actúa como guía para asegurar que los objetivos de aprendizaje se cumplan."
    },
    {
      pregunta: "En una validación científica, el % de error aceptable suele ser...",
      opciones: ["100%", "50%", "Bajo (típicamente < 5%)", "No importa el error"],
      respuestaCorrecta: 2,
      explicacion: "Un bajo porcentaje de error indica una experimentación exitosa y controlada."
    },
    {
      pregunta: "El método científico comienza con...",
      opciones: ["La conclusión", "La observación", "El examen", "La risa"],
      respuestaCorrecta: 1,
      explicacion: "Todo proceso científico inicia observando un fenómeno para formular una hipótesis."
    }
  ];
};
