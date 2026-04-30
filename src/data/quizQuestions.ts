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
    },
    {
      pregunta: "¿Qué es un sismograma?",
      opciones: ["Un tipo de sismo", "El registro visual de las ondas sísmicas", "La escala de medición", "Un sensor bajo tierra"],
      respuestaCorrecta: 1,
      explicacion: "Es el gráfico producido por el sismógrafo que muestra la amplitud de las ondas en el tiempo."
    },
    {
      pregunta: "Si log(x) + log(y) = log(100), ¿cuánto vale x*y?",
      opciones: ["10", "100", "1000", "2"],
      respuestaCorrecta: 1,
      explicacion: "Por propiedades de logaritmos, log(x*y) = log(100), por lo tanto x*y = 100."
    },
    {
      pregunta: "¿Qué mide la escala de Magnitud de Momento (Mw)?",
      opciones: ["La duración del sismo", "La energía total liberada", "Solo la altura de la onda", "La profundidad"],
      respuestaCorrecta: 1,
      explicacion: "A diferencia de Richter, Mw mide el trabajo total (energía) realizado durante la ruptura de la falla."
    },
    {
      pregunta: "¿A qué valor tiende log(x) cuando x se acerca a cero por la derecha?",
      opciones: ["Cero", "Uno", "Infinito negativo", "Infinito positivo"],
      respuestaCorrecta: 2,
      explicacion: "La función logarítmica tiene una asíntota vertical en x=0, tendiendo a -∞."
    },
    {
      pregunta: "Si un sismo libera 1000 veces más energía que otro, ¿cuántas unidades sube en la escala de magnitud aproximada?",
      opciones: ["1", "2", "3", "10"],
      respuestaCorrecta: 1,
      explicacion: "Cada unidad de magnitud representa ~32x energía. 32 * 32 ≈ 1000, por lo que sube 2 unidades."
    },
    {
      pregunta: "¿Cuál es el logaritmo en base 2 de 64?",
      opciones: ["4", "5", "6", "8"],
      respuestaCorrecta: 2,
      explicacion: "2 elevado a la 6 es 64 (2*2*2*2*2*2 = 64)."
    },
    {
      pregunta: "En la función y = log(x), ¿cuál es el dominio?",
      opciones: ["Todos los reales", "Reales positivos (x > 0)", "Reales negativos", "Cualquier número excepto el cero"],
      respuestaCorrecta: 1,
      explicacion: "No existen logaritmos de números negativos o cero en el conjunto de los números reales."
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
    },
    {
      pregunta: "Si la hipotenusa mide 10 y un cateto mide 6, ¿cuánto mide el otro?",
      opciones: ["4", "8", "16", "64"],
      respuestaCorrecta: 1,
      explicacion: "10² - 6² = 100 - 36 = 64. La raíz de 64 es 8."
    },
    {
      pregunta: "¿Puede un triángulo rectángulo ser equilátero?",
      opciones: ["Sí", "No", "Solo si es muy grande", "Depende del área"],
      respuestaCorrecta: 1,
      explicacion: "Un equilátero tiene ángulos de 60°. Un rectángulo requiere uno de 90°."
    },
    {
      pregunta: "En un triángulo rectángulo isósceles, si los catetos miden 1, la hipotenusa es:",
      opciones: ["1", "2", "√2", "√3"],
      respuestaCorrecta: 2,
      explicacion: "1² + 1² = 2. La hipotenusa es √2."
    },
    {
      pregunta: "¿Cómo se llama el ángulo opuesto a la hipotenusa?",
      opciones: ["Agudo", "Obtuso", "Recto (90°)", "Llano"],
      respuestaCorrecta: 2,
      explicacion: "Por definición, en un triángulo rectángulo la hipotenusa está siempre frente al ángulo de 90 grados."
    },
    {
      pregunta: "Si a=8, b=15, ¿cuánto vale c?",
      opciones: ["17", "23", "20", "19"],
      respuestaCorrecta: 0,
      explicacion: "8² (64) + 15² (225) = 289. √289 = 17."
    },
    {
      pregunta: "¿Qué descubrieron los pitagóricos sobre la raíz de 2?",
      opciones: ["Que es un número entero", "Que es irracional", "Que no existe", "Que es igual a 1.5"],
      respuestaCorrecta: 1,
      explicacion: "Fue el primer número irracional descubierto, lo que causó una crisis en su filosofía de los números enteros."
    },
    {
      pregunta: "Si triplicamos los lados de un triángulo 3-4-5, ¿sigue siendo rectángulo?",
      opciones: ["No", "Sí, con lados 9-12-15", "Solo si cambiamos el ángulo", "Solo en el espacio"],
      respuestaCorrecta: 1,
      explicacion: "Cualquier múltiplo de una terna pitagórica sigue cumpliendo el teorema."
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
    },
    {
      pregunta: "¿Cuál es el valor del Coseno de 0 grados?",
      opciones: ["0", "1", "-1", "π"],
      respuestaCorrecta: 1,
      explicacion: "A 0°, el punto en el círculo unitario es (1, 0). La coordenada x es 1."
    },
    {
      pregunta: "Si un ángulo está en el III Cuadrante, ¿cómo son los signos de (Seno, Coseno)?",
      opciones: ["(+, +)", "(-, +)", "(-, -)", "(+, -)"],
      respuestaCorrecta: 2,
      explicacion: "En el III cuadrante tanto x como y son negativos."
    },
    {
      pregunta: "¿Qué ángulo en radianes equivale a 90 grados?",
      opciones: ["π", "π/2", "π/4", "2π"],
      respuestaCorrecta: 1,
      explicacion: "Si 180° es π, entonces 90° es la mitad, π/2."
    },
    {
      pregunta: "¿Cuál es el periodo de las funciones Seno y Coseno?",
      opciones: ["π", "2π", "90°", "1"],
      respuestaCorrecta: 1,
      explicacion: "Ambas funciones repiten sus valores cada vuelta completa al círculo (360° o 2π)."
    },
    {
      pregunta: "Si sin(θ) = 0.5 y θ está en el I Cuadrante, ¿cuánto vale θ?",
      opciones: ["30°", "45°", "60°", "90°"],
      respuestaCorrecta: 0,
      explicacion: "El seno de 30° (o π/6 rad) es exactamente 0.5."
    },
    {
      pregunta: "La identidad fundamental de la trigonometría es:",
      opciones: ["sin + cos = 1", "sin²(θ) + cos²(θ) = 1", "tan = sin * cos", "sin / cos = 1"],
      respuestaCorrecta: 1,
      explicacion: "Deriva directamente del Teorema de Pitágoras aplicado al círculo unitario (x² + y² = 1)."
    },
    {
      pregunta: "¿Cuál es el valor máximo de la función Tangente?",
      opciones: ["1", "π", "No tiene (tiende a infinito)", "0"],
      respuestaCorrecta: 2,
      explicacion: "Cuando el coseno se acerca a cero (90°), la tangente crece sin límite."
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
    },
    {
      pregunta: "¿Qué sucede con el área de una figura si duplicamos su escala (factor 2)?",
      opciones: ["Se duplica", "Se mantiene igual", "Se cuadriplica", "Se triplica"],
      respuestaCorrecta: 2,
      explicacion: "Si los lados crecen por k, el área crece por k². En este caso 2² = 4."
    },
    {
      pregunta: "Una reflexión sobre el origen (0,0) equivale a una rotación de:",
      opciones: ["90°", "180°", "270°", "360°"],
      respuestaCorrecta: 1,
      explicacion: "Cambiar (x,y) por (-x,-y) es lo mismo que girar media vuelta."
    },
    {
      pregunta: "En una matriz de transformación, ¿qué representa la identidad [[1,0],[0,1]]?",
      opciones: ["Rotación de 90°", "Escala cero", "No aplicar ninguna transformación", "Reflexión"],
      respuestaCorrecta: 2,
      explicacion: "La matriz identidad mantiene las coordenadas originales sin cambios."
    },
    {
      pregunta: "¿Qué es una homotecia?",
      opciones: ["Un tipo de rotación", "Una transformación que escala desde un punto fijo", "Un desplazamiento lineal", "Un giro en el espacio"],
      respuestaCorrecta: 1,
      explicacion: "Es el nombre formal para las dilataciones o contracciones desde un centro."
    },
    {
      pregunta: "Si aplicamos una traslación (2, 3) y luego (-2, -3), el resultado es:",
      opciones: ["Moverse a (4,6)", "Volver al punto original", "Moverse a (2,3)", "Rotar 180°"],
      respuestaCorrecta: 1,
      explicacion: "Las traslaciones se suman vectorialmente. (2-2, 3-3) = (0,0)."
    },
    {
      pregunta: "¿Cómo se llama la transformación que 'voltea' la figura como un espejo?",
      opciones: ["Traslación", "Rotación", "Reflexión (Simetría)", "Escala"],
      respuestaCorrecta: 2,
      explicacion: "Invierte la orientación de la figura respecto a una recta o punto."
    },
    {
      pregunta: "Al rotar un punto (1, 0) 90° en sentido antihorario, obtenemos:",
      opciones: ["(0, 1)", "(-1, 0)", "(0, -1)", "(1, 1)"],
      respuestaCorrecta: 0,
      explicacion: "El punto se mueve del eje X positivo al eje Y positivo."
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
    },
    {
      pregunta: "Si conectamos dos resortes iguales en serie, la constante equivalente es:",
      opciones: ["El doble (2k)", "La mitad (k/2)", "La misma (k)", "Cero"],
      respuestaCorrecta: 1,
      explicacion: "En serie, el sistema se vuelve más 'blando' o flexible, reduciendo la constante total."
    },
    {
      pregunta: "Si conectamos dos resortes iguales en paralelo, la constante equivalente es:",
      opciones: ["El doble (2k)", "La mitad (k/2)", "La misma (k)", "k²"],
      respuestaCorrecta: 0,
      explicacion: "En paralelo, ambos resortes ayudan a soportar la carga, haciendo el sistema más rígido."
    },
    {
      pregunta: "Un material que NO recupera su forma se llama:",
      opciones: ["Elástico", "Plástico", "Inerte", "Líquido"],
      respuestaCorrecta: 1,
      explicacion: "La plasticidad es la propiedad de deformarse permanentemente bajo esfuerzo."
    },
    {
      pregunta: "¿Qué representa el área bajo la curva en un gráfico F vs x?",
      opciones: ["La constante k", "La energía potencial elástica almacenada", "La velocidad", "La masa"],
      respuestaCorrecta: 1,
      explicacion: "El trabajo realizado (energía) es el área de integración del gráfico Fuerza-Desplazamiento."
    },
    {
      pregunta: "¿Cuál es la unidad de la Energía en el SI?",
      opciones: ["Watt", "Newton", "Joule (J)", "Pascal"],
      respuestaCorrecta: 2,
      explicacion: "Un Joule equivale a un Newton-metro."
    },
    {
      pregunta: "El signo negativo en F = -kx indica:",
      opciones: ["Que la fuerza es débil", "Que la fuerza se opone al desplazamiento (fuerza restauradora)", "Que el resorte se rompe", "Error matemático"],
      respuestaCorrecta: 1,
      explicacion: "Si estiras el resorte (+x), la fuerza tira hacia atrás (-F)."
    },
    {
      pregunta: "Si un resorte se comprime en lugar de estirarse, ¿se cumple la Ley de Hooke?",
      opciones: ["No, solo para estirar", "Sí, funciona igual para compresión (mientras sea elástico)", "Solo si es de metal", "Depende de la gravedad"],
      respuestaCorrecta: 1,
      explicacion: "La ley es válida para ambos sentidos de deformación dentro del rango elástico."
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
    },
    {
      pregunta: "¿Qué es un fluido?",
      opciones: ["Solo los líquidos", "Solo los gases", "Cualquier sustancia que puede fluir (líquidos y gases)", "Algo que brilla"],
      respuestaCorrecta: 2,
      explicacion: "Tanto líquidos como gases carecen de forma fija y se adaptan a su contenedor."
    },
    {
      pregunta: "¿Cómo cambia la presión con la profundidad en un fluido en reposo?",
      opciones: ["Disminuye", "Se mantiene igual", "Aumenta proporcionalmente a la profundidad", "Aumenta al cuadrado"],
      respuestaCorrecta: 2,
      explicacion: "P = P0 + ρ*g*h. A mayor h (profundidad), mayor presión por el peso del fluido encima."
    },
    {
      pregunta: "En un gato hidráulico, si el área de entrada es 0.01 m² y la de salida 1 m², la ventaja mecánica es:",
      opciones: ["10", "100", "1000", "0.01"],
      respuestaCorrecta: 1,
      explicacion: "Ventaja = A_salida / A_entrada = 1 / 0.01 = 100."
    },
    {
      pregunta: "La presión atmosférica al nivel del mar es aproximadamente:",
      opciones: ["100 Pa", "101,325 Pa (1 atm)", "1 Pa", "1000 Pa"],
      respuestaCorrecta: 1,
      explicacion: "Es el peso de la columna de aire de la atmósfera sobre nosotros."
    },
    {
      pregunta: "Si un fluido es compresible (como el aire), ¿se aplica Pascal perfectamente?",
      opciones: ["Sí", "No, parte de la fuerza se pierde comprimiendo el fluido", "Solo en el espacio", "Solo a altas temperaturas"],
      respuestaCorrecta: 1,
      explicacion: "La compresibilidad absorbe energía, por eso los sistemas de alta potencia prefieren la hidráulica (aceite)."
    },
    {
      pregunta: "¿Quién inventó el barómetro de mercurio?",
      opciones: ["Pascal", "Torricelli", "Newton", "Arquímedes"],
      respuestaCorrecta: 1,
      explicacion: "Evangelista Torricelli midió por primera vez la presión atmosférica usando un tubo de mercurio."
    },
    {
      pregunta: "Unidades de presión 'psi' significan:",
      opciones: ["Pascales por segundo", "Libras por pulgada cuadrada", "Presión sobre incremento", "Poder solar interno"],
      respuestaCorrecta: 1,
      explicacion: "Pounds per Square Inch, unidad común en el sistema anglosajón."
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
    },
    {
      pregunta: "Si un objeto está totalmente sumergido, ¿cuánto vale el volumen desalojado?",
      opciones: ["La mitad de su volumen", "El doble de su volumen", "Exactamente su propio volumen", "Cero"],
      respuestaCorrecta: 2,
      explicacion: "Al entrar al agua, el objeto ocupa un espacio igual a su cuerpo, desplazando esa misma cantidad de agua."
    },
    {
      pregunta: "¿Qué sucede si el empuje es mayor que el peso?",
      opciones: ["El objeto se hunde", "El objeto sube a la superficie y flota", "El objeto explota", "No pasa nada"],
      respuestaCorrecta: 1,
      explicacion: "La fuerza neta es hacia arriba, impulsando al objeto hasta que parte de él salga del agua y el empuje se iguale al peso."
    },
    {
      pregunta: "Un submarino se sumerge aumentando su:",
      opciones: ["Volumen", "Empuje", "Peso (llenando tanques de agua)", "Velocidad"],
      respuestaCorrecta: 2,
      explicacion: "Al meter agua en sus tanques, aumenta su densidad promedio hasta ser mayor que la del mar."
    },
    {
      pregunta: "¿Por qué es más fácil levantar a alguien dentro de una piscina?",
      opciones: ["Porque somos más fuertes en el agua", "Por la fuerza de empuje que ayuda a sostener a la persona", "Porque el agua nos hace más ligeros", "Porque la gravedad es menor"],
      respuestaCorrecta: 1,
      explicacion: "El agua ejerce una fuerza hacia arriba que contrarresta parte del peso real."
    },
    {
      pregunta: "La densidad del agua pura es aproximadamente:",
      opciones: ["100 kg/m³", "1000 kg/m³", "1 kg/m³", "10,000 kg/m³"],
      respuestaCorrecta: 1,
      explicacion: "Equivale a 1 gramo por centímetro cúbico (1 g/cm³)."
    },
    {
      pregunta: "Si un objeto pesa 50N en el aire y 30N en el agua, el empuje es:",
      opciones: ["80N", "20N", "50N", "30N"],
      respuestaCorrecta: 1,
      explicacion: "Empuje = Peso_real - Peso_aparente = 50 - 30 = 20 Newtons."
    },
    {
      pregunta: "¿Qué sucede con el empuje si bajamos a mucha profundidad (sin cambiar el volumen)?",
      opciones: ["Aumenta mucho", "Disminuye", "Se mantiene casi igual (el agua es incompresible)", "Se vuelve cero"],
      respuestaCorrecta: 2,
      explicacion: "Como la densidad del agua casi no cambia con la profundidad, el empuje permanece constante."
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
    },
    {
      pregunta: "¿En qué unidades se mide la temperatura en el SI?",
      opciones: ["Celsius", "Fahrenheit", "Kelvin (K)", "Calorías"],
      respuestaCorrecta: 2,
      explicacion: "La escala Kelvin es la escala absoluta utilizada en ciencia."
    },
    {
      pregunta: "La dilatación que ocurre en una lámina plana se llama:",
      opciones: ["Lineal", "Superficial", "Volumétrica", "Angular"],
      respuestaCorrecta: 1,
      explicacion: "Afecta a las dos dimensiones del área (largo y ancho)."
    },
    {
      pregunta: "¿Qué le sucede a un agujero en una placa de metal cuando la placa se calienta?",
      opciones: ["Se hace más pequeño", "Se hace más grande", "No cambia de tamaño", "Se cierra"],
      respuestaCorrecta: 1,
      explicacion: "El agujero se expande exactamente como si estuviera lleno del mismo material de la placa."
    },
    {
      pregunta: "El 'Cero Absoluto' equivale a:",
      opciones: ["0° C", "-273.15° C", "100° C", "0° F"],
      respuestaCorrecta: 1,
      explicacion: "Es la temperatura mínima teórica donde el movimiento atómico se detiene."
    },
    {
      pregunta: "¿Cómo se transfiere el calor por el vacío?",
      opciones: ["Conducción", "Convección", "Radiación", "No se puede"],
      respuestaCorrecta: 2,
      explicacion: "La radiación electromagnética (como la luz del sol) no requiere un medio material para viajar."
    },
    {
      pregunta: "Si dos barras de distintos materiales tienen el mismo α, bajo el mismo calor:",
      opciones: ["Se expanden distinto", "Se expanden igual", "Una se rompe", "Cambian de masa"],
      respuestaCorrecta: 1,
      explicacion: "El coeficiente α define la tasa de expansión; si es igual, el comportamiento es idéntico."
    },
    {
      pregunta: "¿Qué es el calor específico?",
      opciones: ["La temperatura del objeto", "La energía necesaria para elevar 1°C la temperatura de 1kg de material", "El punto de fusión", "La dilatación máxima"],
      respuestaCorrecta: 1,
      explicacion: "Mide la 'capacidad térmica' de una sustancia; el agua tiene uno de los más altos."
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
    },
    {
      pregunta: "¿Qué es la corriente eléctrica?",
      opciones: ["La velocidad de los electrones", "El flujo de carga por unidad de tiempo", "La energía de la batería", "La presión de los cables"],
      respuestaCorrecta: 1,
      explicacion: "I = Q / t. Se mide en Amperios (C/s)."
    },
    {
      pregunta: "En un circuito en PARALELO, el voltaje es:",
      opciones: ["Diferente en cada rama", "Igual en todas las ramas", "La suma de los voltajes", "Cero"],
      respuestaCorrecta: 1,
      explicacion: "Todos los componentes están conectados a los mismos dos puntos de potencial."
    },
    {
      pregunta: "Si una bombilla se funde en un circuito en SERIE:",
      opciones: ["Las demás brillan más", "Las demás se apagan", "No pasa nada", "El circuito explota"],
      respuestaCorrecta: 1,
      explicacion: "Se rompe el único camino de la corriente, deteniendo el flujo en todo el circuito."
    },
    {
      pregunta: "¿Cuál es la función de un fusible?",
      opciones: ["Aumentar el voltaje", "Almacenar energía", "Cortar el circuito si la corriente es demasiado alta (protección)", "Cambiar la resistencia"],
      respuestaCorrecta: 2,
      explicacion: "Es un dispositivo de seguridad que se funde para evitar incendios o daños por sobrecarga."
    },
    {
      pregunta: "La potencia eléctrica se calcula como:",
      opciones: ["P = V * I", "P = V / I", "P = R * I", "P = V + I"],
      respuestaCorrecta: 0,
      explicacion: "La potencia (en Watts) es el producto del voltaje por la corriente."
    },
    {
      pregunta: "Si R1 = 10Ω y R2 = 10Ω están en serie, la R total es:",
      opciones: ["5 Ω", "10 Ω", "20 Ω", "100 Ω"],
      respuestaCorrecta: 2,
      explicacion: "En serie, las resistencias simplemente se suman."
    },
    {
      pregunta: "¿Qué mide un multímetro en modo 'Continuidad'?",
      opciones: ["El color del cable", "Si el circuito está cerrado y la corriente puede pasar (emite un pitido)", "La temperatura", "La capacidad de la batería"],
      respuestaCorrecta: 1,
      explicacion: "Verifica que no haya rupturas en el conductor eléctrico."
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
    },
    {
      pregunta: "La unidad de carga en el SI es el:",
      opciones: ["Voltio", "Amperio", "Coulomb (C)", "Newton"],
      respuestaCorrecta: 2,
      explicacion: "Llamada así por Charles-Augustin de Coulomb."
    },
    {
      pregunta: "Un objeto con igual número de protones y electrones es:",
      opciones: ["Positivo", "Negativa", "Neutro", "Radiactivo"],
      respuestaCorrecta: 2,
      explicacion: "Las cargas se cancelan mutuamente, resultando en una carga neta cero."
    },
    {
      pregunta: "¿Qué partícula tiene carga positiva?",
      opciones: ["Electrón", "Neutrón", "Protón", "Fotón"],
      respuestaCorrecta: 2,
      explicacion: "Los protones se encuentran en el núcleo y definen la carga positiva del átomo."
    },
    {
      pregunta: "Un material dieléctrico es:",
      opciones: ["Un superconductor", "Un aislante que puede polarizarse", "Un metal líquido", "Un imán"],
      respuestaCorrecta: 1,
      explicacion: "Aunque no conduce, sus cargas internas se reorientan ante un campo externo."
    },
    {
      pregunta: "¿Qué sucede con la fuerza si duplicamos la distancia entre dos cargas?",
      opciones: ["Se duplica", "Se reduce a la mitad", "Se reduce a la cuarta parte", "No cambia"],
      respuestaCorrecta: 2,
      explicacion: "Por la ley del inverso del cuadrado: (1/2)² = 1/4."
    },
    {
      pregunta: "La carga eléctrica no se crea ni se destruye, solo se transfiere. Esto es:",
      opciones: ["Ley de Ohm", "Conservación de la Carga", "Efecto Joule", "Ley de Ampere"],
      respuestaCorrecta: 1,
      explicacion: "Principio fundamental de la física electromagnética."
    },
    {
      pregunta: "¿Cómo se llama el instrumento usado para detectar carga eléctrica?",
      opciones: ["Termómetro", "Electroscopio", "Barómetro", "Sismógrafo"],
      respuestaCorrecta: 1,
      explicacion: "Usa láminas metálicas que se separan cuando el dispositivo se carga."
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
    },
    {
      pregunta: "¿Qué establece la Ley de Faraday?",
      opciones: ["La corriente crea calor", "Un campo magnético variable induce una corriente eléctrica", "Las cargas se atraen", "Los motores son ruidosos"],
      respuestaCorrecta: 1,
      explicacion: "Es el principio inverso al motor, usado en generadores para crear electricidad."
    },
    {
      pregunta: "El torque es máximo cuando la bobina está:",
      opciones: ["Paralela al campo magnético", "Perpendicular al campo magnético", "A 45 grados", "Apagada"],
      respuestaCorrecta: 0,
      explicacion: "En esta posición, los brazos de la bobina reciben la fuerza máxima en la dirección del giro."
    },
    {
      pregunta: "¿Qué material se usa comúnmente para las escobillas de un motor?",
      opciones: ["Plástico", "Grafito (Carbón)", "Vidrio", "Madera"],
      respuestaCorrecta: 1,
      explicacion: "El grafito es conductor y autolubricante, ideal para el contacto rozante."
    },
    {
      pregunta: "Un electroimán es:",
      opciones: ["Un imán natural", "Un imán creado por corriente eléctrica en una bobina", "Un trozo de hierro", "Una batería"],
      respuestaCorrecta: 1,
      explicacion: "Permite tener un campo magnético que se puede encender y apagar a voluntad."
    },
    {
      pregunta: "La unidad de inducción magnética es el:",
      opciones: ["Voltio", "Tesla (T)", "Weber", "Ohmio"],
      respuestaCorrecta: 1,
      explicacion: "Llamada así por Nikola Tesla."
    },
    {
      pregunta: "¿Qué sucede si aumentamos el voltaje en el motor?",
      opciones: ["Se detiene", "Gira más rápido (aumenta la corriente y la fuerza)", "Se enfría", "Cambia de color"],
      respuestaCorrecta: 1,
      explicacion: "Mayor voltaje impulsa más corriente, generando una fuerza de Lorentz mayor."
    },
    {
      pregunta: "¿Cuál es el componente que permite el contacto eléctrico con el rotor giratorio?",
      opciones: ["El eje", "Las escobillas", "El chasis", "El ventilador"],
      respuestaCorrecta: 1,
      explicacion: "Las escobillas presionan contra el conmutador para cerrar el circuito móvil."
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
    },
    {
      pregunta: "¿Cuál es la carga eléctrica de un neutrón?",
      opciones: ["Positiva (+1)", "Negativa (-1)", "Neutra (0)", "Variable"],
      respuestaCorrecta: 2,
      explicacion: "Los neutrones son partículas subatómicas sin carga neta, situadas en el núcleo."
    },
    {
      pregunta: "Si un átomo pierde electrones, se convierte en un:",
      opciones: ["Anión (carga negativa)", "Catión (carga positiva)", "Isótopo", "Neutrón"],
      respuestaCorrecta: 1,
      explicacion: "Al perder cargas negativas (electrones), predominan las positivas de los protones."
    },
    {
      pregunta: "¿Qué es el Número Atómico (Z)?",
      opciones: ["La suma de protones y neutrones", "El número de protones en el núcleo", "El peso del átomo", "El número de orbitales"],
      respuestaCorrecta: 1,
      explicacion: "Z define la identidad del elemento químico."
    },
    {
      pregunta: "¿Qué establece el Principio de Exclusión de Pauli?",
      opciones: ["Dos electrones no pueden tener los mismos 4 números cuánticos", "Los átomos son indivisibles", "La masa se conserva", "Los electrones son ondas"],
      respuestaCorrecta: 0,
      explicacion: "Limita a un máximo de dos electrones por orbital, con spines opuestos."
    },
    {
      pregunta: "¿Cuál es el orbital con forma esférica?",
      opciones: ["Orbital p", "Orbital d", "Orbital s", "Orbital f"],
      respuestaCorrecta: 2,
      explicacion: "Los orbitales 's' tienen simetría esférica alrededor del núcleo."
    },
    {
      pregunta: "¿Qué partícula subatómica fue descubierta por J.J. Thomson?",
      opciones: ["Protón", "Neutrón", "Electrón", "Positrón"],
      respuestaCorrecta: 2,
      explicacion: "Thomson descubrió el electrón mediante experimentos con tubos de rayos catódicos."
    },
    {
      pregunta: "¿Qué es un Isóbaro?",
      opciones: ["Átomos con igual número de protones", "Átomos con igual número de masa (A)", "Átomos con igual número de neutrones", "Átomos que flotan"],
      respuestaCorrecta: 1,
      explicacion: "Los isóbaros tienen distinta Z pero misma masa atómica total."
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
    },
    {
      pregunta: "Según la Ley de Charles, a presión constante, el volumen es:",
      opciones: ["Inversamente proporcional a T", "Directamente proporcional a la temperatura absoluta (T)", "Independiente de T", "Igual a la masa"],
      respuestaCorrecta: 1,
      explicacion: "V1/T1 = V2/T2. Si calientas un gas, este se expande."
    },
    {
      pregunta: "¿Qué establece la Ley de las Presiones Parciales de Dalton?",
      opciones: ["La presión total es el promedio", "La presión total es la suma de las presiones individuales de cada gas", "Los gases no tienen presión", "La presión depende del color del gas"],
      respuestaCorrecta: 1,
      explicacion: "P_total = P1 + P2 + P3... en una mezcla de gases no reactivos."
    },
    {
      pregunta: "¿Qué es el Cero Absoluto?",
      opciones: ["0°C", "-273.15°C", "0°F", "100K"],
      respuestaCorrecta: 1,
      explicacion: "Es la temperatura teórica más baja posible, correspondiente a 0 Kelvin."
    },
    {
      pregunta: "En la Teoría Cinética, se asume que las colisiones entre moléculas son:",
      opciones: ["Plásticas", "Elásticas (no hay pérdida de energía cinética)", "Inexistentes", "Explosivas"],
      respuestaCorrecta: 1,
      explicacion: "La energía se transfiere pero no se disipa en forma de calor interno molecular."
    },
    {
      pregunta: "¿Qué gas es más denso en condiciones iguales?",
      opciones: ["Hidrógeno (H2)", "Helio (He)", "Oxígeno (O2)", "Dióxido de Carbono (CO2)"],
      respuestaCorrecta: 3,
      explicacion: "A mayor masa molar (CO2 = 44 g/mol), mayor densidad del gas."
    },
    {
      pregunta: "¿Qué constante R se usa comúnmente con Atmósferas y Litros?",
      opciones: ["8.314 J/molK", "0.0821 L*atm/molK", "1.987 cal/molK", "9.8 m/s2"],
      respuestaCorrecta: 1,
      explicacion: "0.0821 es el valor estándar para unidades de laboratorio tradicionales."
    },
    {
      pregunta: "¿Qué sucede con la densidad de un gas si se calienta a presión constante?",
      opciones: ["Aumenta", "Disminuye", "No cambia", "Se vuelve infinita"],
      respuestaCorrecta: 1,
      explicacion: "Al calentarse, el volumen aumenta; como la masa es constante, la densidad (m/V) baja."
    }
  ],
  'quimica-3': [
    {
      pregunta: "¿Qué establece la Ley de Conservación de la Materia de Lavoisier?",
      opciones: ["La masa aumenta en una reacción", "La masa total de los reactivos es igual a la masa total de los productos", "La materia desaparece al quemarse", "Solo los gases conservan su masa"],
      respuestaCorrecta: 1,
      explicacion: "En un sistema cerrado, la masa no se crea ni se destruye, solo se transforma."
    },
    {
      pregunta: "¿Qué representa el coeficiente estequiométrico en una ecuación química?",
      opciones: ["La temperatura de la reacción", "El número de moléculas o moles que participan", "La masa en gramos fija", "La velocidad de la reacción"],
      respuestaCorrecta: 1,
      explicacion: "Los coeficientes indican la proporción molar necesaria para que la reacción sea completa."
    },
    {
      pregunta: "Si en una reacción entran 100g de reactivos, ¿cuántos gramos de productos esperamos?",
      opciones: ["50g", "Depende del clima", "Exactamente 100g", "200g"],
      respuestaCorrecta: 2,
      explicacion: "Por la Ley de Lavoisier, la masa de salida debe ser idéntica a la de entrada."
    },
    {
      pregunta: "¿Qué es un mol en química?",
      opciones: ["Una medida de volumen", "La cantidad de sustancia que contiene 6.022x10²³ partículas", "El peso de un átomo", "Una mezcla de reactivos"],
      respuestaCorrecta: 1,
      explicacion: "El mol es la unidad fundamental para contar átomos y moléculas a escala macroscópica."
    },
    {
      pregunta: "En la combustión del propano (C₃H₈ + 5O₂ → 3CO₂ + 4H₂O), ¿cuántos moles de O₂ se necesitan por cada mol de propano?",
      opciones: ["1", "3", "5", "4"],
      respuestaCorrecta: 2,
      explicacion: "El coeficiente del O₂ es 5, indicando que se requiere 5 veces más oxígeno que propano."
    },
    {
      pregunta: "¿Cuál es la masa molar aproximada del agua (H₂O)? (H=1, O=16)",
      opciones: ["10 g/mol", "18 g/mol", "16 g/mol", "2 g/mol"],
      respuestaCorrecta: 1,
      explicacion: "2 * 1 (Hidrógeno) + 16 (Oxígeno) = 18 g/mol."
    },
    {
      pregunta: "¿Qué sucede si una ecuación química no está balanceada?",
      opciones: ["La reacción es más rápida", "Viola la Ley de Conservación de la Materia", "No pasa nada", "Produce más energía"],
      respuestaCorrecta: 1,
      explicacion: "Una ecuación no balanceada implicaría que átomos desaparecen o aparecen mágicamente, lo cual es físicamente imposible."
    },
    {
      pregunta: "¿Cuál es el Número de Avogadro?",
      opciones: ["6.022 x 10^23", "3.1416", "9.81", "1.6 x 10^-19"],
      respuestaCorrecta: 0,
      explicacion: "Es el número de entidades elementales presentes en un mol de sustancia."
    },
    {
      pregunta: "La masa de un mol de una sustancia expresada en gramos se llama:",
      opciones: ["Número atómico", "Masa Molar", "Masa Volumétrica", "Densidad"],
      respuestaCorrecta: 1,
      explicacion: "Se mide en g/mol y coincide numéricamente con el peso atómico/molecular."
    },
    {
      pregunta: "En la reacción N2 + 3H2 -> 2NH3, ¿cuántos gramos de N2 (28g/mol) hay en un mol?",
      opciones: ["14g", "28g", "3g", "17g"],
      respuestaCorrecta: 1,
      explicacion: "El N2 tiene dos átomos de nitrógeno (14+14=28)."
    },
    {
      pregunta: "¿Qué indica la flecha (→) en una ecuación química?",
      opciones: ["Igualdad matemática", "Dirección de la transformación (produce)", "Que es un gas", "Que es un sólido"],
      respuestaCorrecta: 1,
      explicacion: "Separa los reactivos de los productos indicando el sentido de la reacción."
    },
    {
      pregunta: "¿Qué es un reactivo en exceso?",
      opciones: ["El que se acaba primero", "El que queda sobrando después de que el limitante se agota", "El más barato", "El que explota"],
      respuestaCorrecta: 1,
      explicacion: "Es aquel que está presente en mayor cantidad de la necesaria estequiométricamente."
    },
    {
      pregunta: "Si balanceamos H2 + Cl2 -> HCl, el coeficiente del HCl es:",
      opciones: ["1", "2", "3", "0"],
      respuestaCorrecta: 1,
      explicacion: "H2 + Cl2 -> 2HCl. Se necesitan 2 moléculas de HCl para equilibrar los 2 átomos de cada reactivo."
    },
    {
      pregunta: "¿Qué representa el estado físico (s) en una ecuación?",
      opciones: ["Sodio", "Sólido", "Solución", "Saturado"],
      respuestaCorrecta: 1,
      explicacion: "Las etiquetas (s), (l), (g) y (aq) indican el estado de agregación de la materia."
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
    },
    {
      pregunta: "¿Qué componente de la estequiometría dicta cuánto producto se forma?",
      opciones: ["El reactivo en exceso", "El reactivo limitante", "El catalizador", "La presión"],
      respuestaCorrecta: 1,
      explicacion: "El limitante es el 'techo' de la reacción; una vez se acaba, no se puede producir más."
    },
    {
      pregunta: "Si el rendimiento real es igual al teórico, el rendimiento porcentual es:",
      opciones: ["0%", "50%", "100%", "200%"],
      respuestaCorrecta: 2,
      explicacion: "Indica una eficiencia perfecta en el proceso."
    },
    {
      pregunta: "En 2A + B -> C, si tenemos 10 moles de A y 10 moles de B, ¿quién es el limitante?",
      opciones: ["A", "B", "Ambos", "Ninguno"],
      respuestaCorrecta: 0,
      explicacion: "Para 10 de A se necesitan solo 5 de B. B sobra (exceso), A se acaba (limitante)."
    },
    {
      pregunta: "¿Qué significa que un reactivo esté en una proporción 1:1?",
      opciones: ["Que tienen la misma masa", "Que se requiere un mol de uno por cada mol del otro", "Que son el mismo elemento", "Que no reaccionan"],
      respuestaCorrecta: 1,
      explicacion: "Es la relación estequiométrica más simple en una ecuación balanceada."
    },
    {
      pregunta: "Si el rendimiento teórico es 50g y obtienes 40g, ¿cuál es el % de rendimiento?",
      opciones: ["90%", "80%", "75%", "40%"],
      respuestaCorrecta: 1,
      explicacion: "(40/50) * 100 = 80%."
    },
    {
      pregunta: "¿Cuál NO es una razón para un rendimiento bajo?",
      opciones: ["Reacciones incompletas", "Pérdida por filtración", "Uso de un catalizador", "Evaporación del producto"],
      respuestaCorrecta: 2,
      explicacion: "Un catalizador solo acelera la reacción, no debería reducir la cantidad final de producto."
    },
    {
      pregunta: "En estequiometría, los cálculos siempre deben basarse en:",
      opciones: ["El reactivo en exceso", "El reactivo limitante", "Cualquiera de los dos", "El volumen de agua"],
      respuestaCorrecta: 1,
      explicacion: "Solo el limitante garantiza que los productos calculados sean físicamente posibles."
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
    },
    {
      pregunta: "¿Qué es el 'Soluto'?",
      opciones: ["El componente que disuelve", "La sustancia que se disuelve (presente en menor cantidad)", "El líquido transparente", "El matraz"],
      respuestaCorrecta: 1,
      explicacion: "Es el componente que se dispersa en el solvente para formar la solución."
    },
    {
      pregunta: "¿Qué es el 'Solvente' o 'Disolvente'?",
      opciones: ["La sustancia que disuelve al soluto", "El polvo blanco", "La balanza", "El resultado de la mezcla"],
      respuestaCorrecta: 0,
      explicacion: "Generalmente es el componente en mayor cantidad (como el agua)."
    },
    {
      pregunta: "¿Qué indica la 'Normalidad' (N)?",
      opciones: ["Es lo mismo que Molaridad", "Equivalentes de soluto por litro", "Masa por volumen", "Grado de pureza"],
      respuestaCorrecta: 1,
      explicacion: "Se usa a menudo en titulaciones ácido-base para considerar la valencia."
    },
    {
      pregunta: "¿Qué sucede con la molaridad si el volumen de la solución se reduce por evaporación?",
      opciones: ["Aumenta", "Disminuye", "No cambia", "Se vuelve negativa"],
      respuestaCorrecta: 0,
      explicacion: "Al haber menos solvente para la misma cantidad de soluto, la solución se vuelve más concentrada."
    },
    {
      pregunta: "Una solución 0.5 M contiene:",
      opciones: ["0.5 moles en 500ml", "0.5 moles en 1 litro", "1 mol en 1 litro", "5 moles en 10 litros"],
      respuestaCorrecta: 1,
      explicacion: "La molaridad siempre se refiere a moles por cada 1000ml (1L)."
    },
    {
      pregunta: "¿Por qué se usa agua destilada en lugar de agua de grifo?",
      opciones: ["Para que sea potable", "Para evitar contaminar la solución con iones externos", "Porque es más barata", "Porque no tiene burbujas"],
      respuestaCorrecta: 1,
      explicacion: "Los minerales del grifo podrían reaccionar con el soluto y falsear la concentración."
    },
    {
      pregunta: "El término 'Partes por Millón' (ppm) se usa para concentraciones:",
      opciones: ["Muy altas", "Muy bajas (trazas)", "Medias", "Solo de gases"],
      respuestaCorrecta: 1,
      explicacion: "Equivale a 1 mg de soluto en 1 kg o litro de solución."
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
    },
    {
      pregunta: "¿Qué es una solución insaturada?",
      opciones: ["La que tiene exceso de soluto", "La que contiene menos soluto del máximo permitido a esa temperatura", "La que está hirviendo", "Una mezcla de gases"],
      respuestaCorrecta: 1,
      explicacion: "Todavía tiene capacidad de disolver más soluto si se le agrega."
    },
    {
      pregunta: "¿Cómo afecta la presión a la solubilidad de un GAS en un líquido (Ley de Henry)?",
      opciones: ["A mayor presión, mayor solubilidad", "A mayor presión, menor solubilidad", "No le afecta", "Hace que el gas se congele"],
      respuestaCorrecta: 0,
      explicacion: "Por eso los refrescos tienen gas bajo presión; al abrir la tapa, la presión baja y el gas sale (burbujas)."
    },
    {
      pregunta: "El proceso inverso a la disolución es la:",
      opciones: ["Evaporación", "Precipitación / Cristalización", "Fusión", "Sublimación"],
      respuestaCorrecta: 1,
      explicacion: "Cuando el soluto sale de la fase líquida para volver a ser sólido."
    },
    {
      pregunta: "¿Qué es una 'Siembra' de cristales?",
      opciones: ["Plantar semillas en el jardín", "Agregar un pequeño cristal puro a una solución sobresaturada para iniciar el crecimiento", "Usar tierra en el laboratorio", "Hervir la solución"],
      respuestaCorrecta: 1,
      explicacion: "Proporciona una superficie de nucleación inmediata para que el soluto se deposite."
    },
    {
      pregunta: "En una curva de solubilidad, el eje Y suele representar:",
      opciones: ["Temperatura", "Gramos de soluto por cada 100g de solvente", "Presión", "Tiempo"],
      respuestaCorrecta: 1,
      explicacion: "Muestra la capacidad máxima de disolución frente a la variable X (Temperatura)."
    },
    {
      pregunta: "¿Qué significa 'Semejante disuelve a semejante'?",
      opciones: ["Que solo se mezclan líquidos", "Que sustancias con polaridad similar se disuelven entre sí", "Que el agua disuelve todo", "Que los metales se disuelven en ácidos"],
      respuestaCorrecta: 1,
      explicacion: "Lo polar (como el agua) disuelve lo polar (sal); lo no polar (aceite) disuelve lo no polar (grasa)."
    },
    {
      pregunta: "¿Cuál es el solvente universal?",
      opciones: ["Alcohol", "Acetona", "Agua", "Ácido Sulfúrico"],
      respuestaCorrecta: 2,
      explicacion: "El agua disuelve una enorme variedad de sustancias debido a su naturaleza polar y puentes de hidrógeno."
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
    },
    {
      pregunta: "¿Qué es un Ácido según Brønsted-Lowry?",
      opciones: ["Una especie que acepta protones", "Una especie que dona protones (H+)", "Una sustancia que tiene sabor amargo", "Un metal"],
      respuestaCorrecta: 1,
      explicacion: "Los ácidos son donadores de protones en reacciones de transferencia."
    },
    {
      pregunta: "¿Qué es una Base según Brønsted-Lowry?",
      opciones: ["Una especie que dona protones", "Una especie que acepta protones (H+)", "Algo que pica", "Un gas noble"],
      respuestaCorrecta: 1,
      explicacion: "Las bases son receptoras de protones."
    },
    {
      pregunta: "¿Qué pH indica una solución básica o alcalina?",
      opciones: ["pH < 7", "pH = 7", "pH > 7", "pH = 0"],
      respuestaCorrecta: 2,
      explicacion: "En la escala de pH, valores superiores a 7 corresponden a medios básicos."
    },
    {
      pregunta: "La reacción entre un ácido y una base produce:",
      opciones: ["Gas y metal", "Sal y agua", "Solo ácido", "Luz"],
      respuestaCorrecta: 1,
      explicacion: "Es la definición clásica de una reacción de neutralización."
    },
    {
      pregunta: "¿Qué es una solución amortiguadora o Buffer?",
      opciones: ["Una solución que cambia de pH rápido", "Una solución que resiste cambios bruscos de pH al agregar ácido o base", "Agua pura", "Un indicador"],
      respuestaCorrecta: 1,
      explicacion: "Los buffers mantienen el pH estable, vital en sistemas biológicos como la sangre."
    },
    {
      pregunta: "Si el pOH de una solución es 4, ¿cuál es su pH?",
      opciones: ["4", "14", "10", "7"],
      respuestaCorrecta: 2,
      explicacion: "pH + pOH = 14 a 25°C."
    },
    {
      pregunta: "¿Qué indica un cambio de color brusco de la fenolftaleína de incoloro a rosa?",
      opciones: ["Que el medio se volvió ácido", "Que el medio se volvió básico", "Que la reacción se detuvo", "Que el indicador se dañó"],
      respuestaCorrecta: 1,
      explicacion: "La fenolftaleína vira a rosa en medios básicos (pH > 8.2)."
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
    },
    {
      pregunta: "¿Qué es un equilibrio dinámico?",
      opciones: ["Cuando nada se mueve", "Cuando las velocidades de la reacción directa e inversa son iguales", "Cuando la reacción explota", "Cuando no hay reactivos"],
      respuestaCorrecta: 1,
      explicacion: "A nivel macroscópico no hay cambios, pero a nivel molecular la reacción sigue ocurriendo en ambos sentidos."
    },
    {
      pregunta: "¿Qué factores NO afectan el valor de la constante de equilibrio (Kc)?",
      opciones: ["Temperatura", "Concentración y Presión", "Volumen", "Catalizadores"],
      respuestaCorrecta: 1,
      explicacion: "Kc solo cambia con la temperatura. Las concentraciones cambian el equilibrio, pero Kc se mantiene."
    },
    {
      pregunta: "En una reacción EXOTÉRMICA, si enfriamos el sistema, el equilibrio:",
      opciones: ["Se desplaza a la derecha (productos)", "Se desplaza a la izquierda (reactivos)", "Se detiene", "Kc disminuye"],
      respuestaCorrecta: 0,
      explicacion: "Al quitar calor, el sistema busca producir más calor desplazándose hacia el lado exotérmico."
    },
    {
      pregunta: "¿Qué indica un valor de Kc cercano a 1?",
      opciones: ["Que solo hay reactivos", "Que solo hay productos", "Que en el equilibrio hay concentraciones significativas de ambos", "Que la reacción no ocurre"],
      respuestaCorrecta: 2,
      explicacion: "Indica que ni reactivos ni productos dominan de forma absoluta en el equilibrio."
    },
    {
      pregunta: "¿Cómo se escribe la expresión de Kc para la reacción: aA + bB ⇌ cC?",
      opciones: ["[A]^a [B]^b / [C]^c", "[C]^c / ([A]^a [B]^b)", "[A] + [B] / [C]", "a*b / c"],
      respuestaCorrecta: 1,
      explicacion: "Es el producto de las concentraciones de los productos elevado a sus coeficientes entre el de los reactivos."
    },
    {
      pregunta: "Si el Cociente de Reacción (Q) es menor que Kc (Q < Kc):",
      opciones: ["El sistema está en equilibrio", "La reacción procederá hacia la derecha para alcanzar el equilibrio", "La reacción procederá hacia la izquierda", "Kc debe aumentar"],
      respuestaCorrecta: 1,
      explicacion: "Todavía falta formar más producto para llegar al valor de equilibrio."
    },
    {
      pregunta: "¿Qué sustancias NO se incluyen en la expresión de Kc?",
      opciones: ["Gases", "Sólidos puros y líquidos puros", "Iones disueltos", "Ninguna"],
      respuestaCorrecta: 1,
      explicacion: "Su actividad o concentración efectiva se considera constante (1) y no afecta la expresión."
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
    },
    {
      pregunta: "¿Qué mide un Voltímetro en una celda galvánica?",
      opciones: ["La corriente", "La diferencia de potencial (voltaje) entre los electrodos", "La masa", "El pH"],
      respuestaCorrecta: 1,
      explicacion: "Indica la fuerza con la que los electrones son empujados a través del circuito."
    },
    {
      pregunta: "En una celda ELECTROLÍTICA, la reacción es:",
      opciones: ["Espontánea", "No espontánea (requiere energía externa)", "Rápida", "Fría"],
      respuestaCorrecta: 1,
      explicacion: "Se usa electricidad para forzar una reacción química que no ocurriría por sí sola."
    },
    {
      pregunta: "¿Cuál es la unidad de carga eléctrica?",
      opciones: ["Voltio", "Amperio", "Coulomb (C)", "Ohmio"],
      respuestaCorrecta: 2,
      explicacion: "Un mol de electrones tiene una carga de aproximadamente 96,500 Coulombs (Constante de Faraday)."
    },
    {
      pregunta: "La reducción siempre ocurre en el:",
      opciones: ["Ánodo", "Cátodo", "Puente salino", "Voltímetro"],
      respuestaCorrecta: 1,
      explicacion: "En el cátodo, las especies químicas ganan electrones."
    },
    {
      pregunta: "Si E°cell es 1.10 V y la concentración de iones cambia, el potencial se calcula con:",
      opciones: ["Ley de Ohm", "Ecuación de Nernst", "Ecuación de Einstein", "Ley de Newton"],
      respuestaCorrecta: 1,
      explicacion: "Nernst permite calcular el potencial en condiciones no estándar."
    },
    {
      pregunta: "Un agente oxidante es aquel que:",
      opciones: ["Se oxida", "Gana electrones (se reduce) provocando la oxidación de otro", "Libera gas", "Es un metal noble"],
      respuestaCorrecta: 1,
      explicacion: "Al 'robar' electrones a otro, causa que el otro se oxide."
    },
    {
      pregunta: "La corrosión de los metales es un proceso de:",
      opciones: ["Reducción", "Oxidación natural", "Fusión", "Destilación"],
      respuestaCorrecta: 1,
      explicacion: "El metal reacciona con el oxígeno o humedad perdiendo electrones."
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
    },
    {
      pregunta: "¿Qué es el 'Destilado'?",
      opciones: ["El líquido que queda en el matraz inicial", "El producto líquido recolectado después de la condensación", "El gas que se escapa", "El agua de enfriamiento"],
      respuestaCorrecta: 1,
      explicacion: "Es la sustancia purificada que ha pasado por la fase de vapor."
    },
    {
      pregunta: "¿Qué es el 'Residuo' en destilación?",
      opciones: ["Lo que se evapora", "Lo que queda en el matraz de ebullición al final", "El agua del condensador", "El termómetro"],
      respuestaCorrecta: 1,
      explicacion: "Son los componentes con mayor punto de ebullición o impurezas que no se evaporaron."
    },
    {
      pregunta: "¿Para qué se usa la destilación al vacío?",
      opciones: ["Para ir más rápido", "Para destilar sustancias que se descomponen a altas temperaturas", "Para que no huela", "Para ahorrar electricidad"],
      respuestaCorrecta: 1,
      explicacion: "Al bajar la presión, el punto de ebullición disminuye, permitiendo destilar a temperaturas más bajas."
    },
    {
      pregunta: "En el laboratorio, el termómetro debe colocarse:",
      opciones: ["Dentro del líquido", "A la altura de la salida lateral hacia el condensador", "En el fondo del matraz", "Fuera del equipo"],
      respuestaCorrecta: 1,
      explicacion: "Para medir con precisión la temperatura del VAPOR que realmente está entrando al condensador."
    },
    {
      pregunta: "La destilación simple es efectiva cuando la diferencia de puntos de ebullición es:",
      opciones: ["Menor a 5°C", "Mayor a 25-30°C", "Cero", "No importa la diferencia"],
      respuestaCorrecta: 1,
      explicacion: "Si los puntos están muy cerca, se requiere destilación fraccionada para una buena separación."
    },
    {
      pregunta: "¿Qué fuente de calor es más segura para destilar líquidos inflamables?",
      opciones: ["Mechero Bunsen (llama abierta)", "Manta de calentamiento eléctrica o baño de maría", "Velas", "Fricción"],
      respuestaCorrecta: 1,
      explicacion: "Evita el riesgo de ignición de los vapores en caso de fugas."
    },
    {
      pregunta: "La destilación es un proceso físico porque:",
      opciones: ["Cambia la estructura molecular", "Solo hay cambios de estado de la materia", "Produce fuego", "Usa mucha fuerza"],
      respuestaCorrecta: 1,
      explicacion: "No se rompen ni forman enlaces químicos, solo se separan sustancias por sus propiedades físicas."
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
    },
    {
      pregunta: "Un microscopio estereoscópico (lupa) se usa para:",
      opciones: ["Ver bacterias", "Ver objetos grandes en 3D", "Ver virus", "Ver átomos"],
      respuestaCorrecta: 1,
      explicacion: "Tienen dos oculares que dan una visión profunda de objetos macroscópicos."
    },
    {
      pregunta: "¿Qué sucede con la luminosidad al aumentar los aumentos?",
      opciones: ["Aumenta", "Disminuye", "No cambia", "Depende del color"],
      respuestaCorrecta: 1,
      explicacion: "Al ver un área más pequeña, entra menos luz al ojo, por lo que hay que abrir el diafragma."
    },
    {
      pregunta: "El tornillo micrométrico se usa para:",
      opciones: ["Mover la platina rápido", "Afinar el enfoque con alta precisión", "Encender la luz", "Girar el revólver"],
      respuestaCorrecta: 1,
      explicacion: "Mueve la platina distancias casi imperceptibles para lograr nitidez total."
    },
    {
      pregunta: "¿Cómo se debe limpiar un objetivo de inmersión?",
      opciones: ["Con la manga de la bata", "Con papel especial de lentes y solvente adecuado", "Con agua y jabón", "No se limpia"],
      respuestaCorrecta: 1,
      explicacion: "El aceite puede dañar los sellos si se deja secar o si se usa material abrasivo."
    },
    {
      pregunta: "La parte donde se coloca la muestra se llama:",
      opciones: ["Ocular", "Platina", "Pie", "Brazo"],
      respuestaCorrecta: 1,
      explicacion: "Es la plataforma horizontal con pinzas para sujetar el portaobjetos."
    },
    {
      pregunta: "El 'Revólver' del microscopio permite:",
      opciones: ["Disparar luz", "Cambiar entre los distintos objetivos", "Ajustar la altura", "Limpiar los lentes"],
      respuestaCorrecta: 1,
      explicacion: "Es la pieza giratoria que sostiene los objetivos de diferentes aumentos."
    },
    {
      pregunta: "¿Qué tipo de microscopio usa electrones en lugar de luz?",
      opciones: ["Óptico", "Electrónico", "De fase", "Fluorescente"],
      respuestaCorrecta: 1,
      explicacion: "Permite aumentos muchísimo mayores, llegando a ver estructuras internas de organelos."
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
    },
    {
      pregunta: "¿Qué componente da fluidez a la membrana celular animal?",
      opciones: ["Proteínas", "Colesterol", "Almidón", "Celulosa"],
      respuestaCorrecta: 1,
      explicacion: "El colesterol se intercala entre los fosfolípidos regulando la rigidez."
    },
    {
      pregunta: "El transporte de glucosa a favor del gradiente usando una proteína se llama:",
      opciones: ["Difusión simple", "Difusión facilitada", "Ósmosis", "Bomba de Sodio"],
      respuestaCorrecta: 1,
      explicacion: "Usa proteínas canal o transportadoras sin gastar ATP."
    },
    {
      pregunta: "¿Qué organelo es el 'centro de control' de la célula?",
      opciones: ["Vacuola", "Núcleo", "Lisosoma", "Ribosoma"],
      respuestaCorrecta: 1,
      explicacion: "Contiene el material genético (ADN) que dirige todas las funciones."
    },
    {
      pregunta: "Las mitocondrias son responsables de:",
      opciones: ["La fotosíntesis", "La respiración celular y producción de ATP", "La síntesis de proteínas", "La digestión"],
      respuestaCorrecta: 1,
      explicacion: "Son las centrales energéticas de la célula."
    },
    {
      pregunta: "¿Qué diferencia a una célula procariota de una eucariota?",
      opciones: ["La presencia de ADN", "La ausencia de un núcleo definido por membrana", "La pared celular", "El tamaño"],
      respuestaCorrecta: 1,
      explicacion: "Las procariotas (bacterias) tienen el ADN libre en el citoplasma."
    },
    {
      pregunta: "Los ribosomas se encargan de:",
      opciones: ["Sintetizar lípidos", "Sintetizar proteínas", "Mover la célula", "Almacenar agua"],
      respuestaCorrecta: 1,
      explicacion: "Leen el ARNm para ensamblar cadenas de aminoácidos."
    },
    {
      pregunta: "¿Qué estructura es exclusiva de la célula vegetal?",
      opciones: ["Membrana", "Cloroplastos y Pared Celular", "Núcleo", "Mitocondrias"],
      respuestaCorrecta: 1,
      explicacion: "Permiten realizar fotosíntesis y dar soporte rígido a la planta."
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
    },
    {
      pregunta: "¿Qué enzima separa las hebras de ADN durante la replicación?",
      opciones: ["Polimerasa", "Helicasa", "Ligasa", "Amilasa"],
      respuestaCorrecta: 1,
      explicacion: "Actúa como una cremallera abriendo la doble hélice."
    },
    {
      pregunta: "El ADN tiene una estructura de:",
      opciones: ["Hélice simple", "Doble hélice", "Círculo plano", "Cubo"],
      respuestaCorrecta: 1,
      explicacion: "Descubierta por Watson, Crick y Franklin en 1953."
    },
    {
      pregunta: "La Guanina (G) siempre se aparea con:",
      opciones: ["Adenina", "Citosina", "Uracilo", "Timina"],
      respuestaCorrecta: 1,
      explicacion: "Se unen mediante tres puentes de hidrógeno."
    },
    {
      pregunta: "¿Cuál es el 'dogma central' de la biología molecular?",
      opciones: ["Proteína -> ARN -> ADN", "ADN -> ARN -> Proteína", "Luz -> Azúcar", "Célula -> Tejido"],
      respuestaCorrecta: 1,
      explicacion: "Describe el flujo normal de la información genética."
    },
    {
      pregunta: "Una mutación es:",
      opciones: ["Un cambio en la secuencia del ADN", "Una enfermedad siempre", "Hacerse más fuerte", "Cambiar de color de pelo"],
      respuestaCorrecta: 0,
      explicacion: "Puede ser beneficiosa, neutra o perjudicial; es la base de la variabilidad."
    },
    {
      pregunta: "¿Cuántos aminoácidos existen comúnmente en las proteínas?",
      opciones: ["4", "20", "64", "100"],
      respuestaCorrecta: 1,
      explicacion: "Aunque hay 64 combinaciones de codones, solo codifican para 20 aminoácidos esenciales."
    },
    {
      pregunta: "El azúcar presente en el ADN es la:",
      opciones: ["Ribosa", "Desoxirribosa", "Glucosa", "Fructosa"],
      respuestaCorrecta: 1,
      explicacion: "De ahí el nombre Ácido Desoxirribonucleico."
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
    },
    {
      pregunta: "¿Qué sucede con la fotosíntesis durante la noche?",
      opciones: ["Se detiene por completo", "Solo ocurre la fase oscura (Fijación de Carbono)", "Se vuelve más rápida", "La planta exhala CO2 solamente"],
      respuestaCorrecta: 1,
      explicacion: "La fase oscura no requiere luz, pero usa el ATP y NADPH acumulados durante el día."
    },
    {
      pregunta: "La molécula orgánica principal resultante de la fotosíntesis es:",
      opciones: ["Glucosa (C6H12O6)", "Almidón", "Celulosa", "Lípidos"],
      respuestaCorrecta: 0,
      explicacion: "La glucosa es el combustible básico para la planta y base de otras moléculas."
    },
    {
      pregunta: "¿Qué parte de la hoja permite el intercambio de gases?",
      opciones: ["Epidermis", "Estomas", "Haz", "Envés"],
      respuestaCorrecta: 1,
      explicacion: "Los estomas son poros que se abren y cierran para dejar entrar CO2 y sacar O2."
    },
    {
      pregunta: "El magnesio es un mineral vital para las plantas porque forma parte de:",
      opciones: ["Las raíces", "La clorofila", "Las flores", "El tallo"],
      respuestaCorrecta: 1,
      explicacion: "El átomo central de la molécula de clorofila es el Magnesio (Mg)."
    },
    {
      pregunta: "¿Qué es un organismo autótrofo?",
      opciones: ["Uno que come otros animales", "Uno que fabrica su propio alimento", "Uno que vive en el agua", "Uno que no respira"],
      respuestaCorrecta: 1,
      explicacion: "Del griego 'autos' (por sí mismo) y 'trophe' (nutrición)."
    },
    {
      pregunta: "La fase luminosa ocurre en:",
      opciones: ["El estroma", "Los tilacoides", "El núcleo", "La vacuola"],
      respuestaCorrecta: 1,
      explicacion: "En las membranas de los tilacoides están los fotosistemas que captan la luz."
    },
    {
      pregunta: "Si una planta no tiene agua, la fotosíntesis se detiene porque:",
      opciones: ["Le da sed", "No hay electrones para la fase luminosa y los estomas se cierran", "Hace mucho calor", "La planta se vuelve blanca"],
      respuestaCorrecta: 1,
      explicacion: "El agua es el donador inicial de electrones."
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
    },
    {
      pregunta: "¿Qué es el Cuadro de Punnett?",
      opciones: ["Un microscopio", "Un diagrama para predecir proporciones genotípicas y fenotípicas", "Una ley de Mendel", "Un tipo de guisante"],
      respuestaCorrecta: 1,
      explicacion: "Muestra todas las combinaciones posibles de los gametos de los padres."
    },
    {
      pregunta: "Si un individuo tiene alelos distintos (Aa), se dice que es:",
      opciones: ["Homocigoto", "Heterocigoto", "Dominante", "Híbrido Puro"],
      respuestaCorrecta: 1,
      explicacion: "Hétero significa diferente."
    },
    {
      pregunta: "Gregor Mendel es considerado el padre de la:",
      opciones: ["Evolución", "Genética", "Microbiología", "Botánica"],
      respuestaCorrecta: 1,
      explicacion: "Sus experimentos con guisantes (Pisum sativum) establecieron las leyes de la herencia."
    },
    {
      pregunta: "La Tercera Ley de Mendel se refiere a la:",
      opciones: ["Segregación", "Uniformidad", "Transmisión independiente de caracteres", "Dominancia completa"],
      respuestaCorrecta: 2,
      explicacion: "Diferentes rasgos se heredan independientemente unos de otros (si están en cromosomas distintos)."
    },
    {
      pregunta: "¿Qué es un gen?",
      opciones: ["Una proteína", "Un segmento de ADN que codifica una característica", "Una célula reproductiva", "Un cromosoma entero"],
      respuestaCorrecta: 1,
      explicacion: "Es la unidad funcional de la herencia."
    },
    {
      pregunta: "Si una flor roja (dominante) se cruza con una blanca (recesiva) y sale rosa, hablamos de:",
      opciones: ["Dominancia Completa", "Dominancia Incompleta", "Codominancia", "Mutación"],
      respuestaCorrecta: 1,
      explicacion: "El fenotipo del heterocigoto es un intermedio entre los padres."
    },
    {
      pregunta: "Los seres humanos tenemos normalmente ___ pares de cromosomas:",
      opciones: ["12", "23", "46", "2"],
      respuestaCorrecta: 1,
      explicacion: "23 pares para un total de 46 cromosomas en células somáticas."
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
    },
    {
      pregunta: "¿Qué es una mutación en el contexto evolutivo?",
      opciones: ["Algo malo siempre", "La fuente original de variabilidad genética", "Un cambio de color", "Un error de copia sin importancia"],
      respuestaCorrecta: 1,
      explicacion: "Sin mutaciones, todos los individuos serían clones y no habría evolución."
    },
    {
      pregunta: "Las estructuras homólogas son aquellas que:",
      opciones: ["Tienen funciones iguales pero origen distinto", "Tienen origen común pero pueden tener funciones distintas (ej: ala de murciélago y brazo humano)", "Son iguales en todo", "No sirven para nada"],
      respuestaCorrecta: 1,
      explicacion: "Evidencian un ancestro común."
    },
    {
      pregunta: "La Selección Artificial es realizada por:",
      opciones: ["La naturaleza", "Los humanos (ej: razas de perros)", "Las máquinas", "El azar"],
      respuestaCorrecta: 1,
      explicacion: "Elegimos rasgos que nos convienen (productividad, estética)."
    },
    {
      pregunta: "¿Qué es un fósil?",
      opciones: ["Una roca vieja", "Restos o evidencias de organismos que vivieron en el pasado", "Un animal vivo", "Una herramienta de piedra"],
      respuestaCorrecta: 1,
      explicacion: "Permiten reconstruir la historia de la vida."
    },
    {
      pregunta: "El mimetismo es una adaptación donde:",
      opciones: ["Un organismo imita a otro o al entorno para protección", "Un organismo cambia de casa", "Un organismo duerme mucho", "Un organismo corre rápido"],
      respuestaCorrecta: 0,
      explicacion: "Ejemplo: mariposas que parecen ojos de búho."
    },
    {
      pregunta: "Jean-Baptiste Lamarck proponía erróneamente que:",
      opciones: ["Los caracteres adquiridos se heredan", "La selección natural manda", "Las jirafas no existen", "El ADN es una hélice"],
      respuestaCorrecta: 0,
      explicacion: "Creía que si un atleta ganaba músculo, su hijo nacería musculoso."
    },
    {
      pregunta: "La Especiación es el proceso de:",
      opciones: ["Muerte de una especie", "Formación de una nueva especie", "Viajar al espacio", "Clonar animales"],
      respuestaCorrecta: 1,
      explicacion: "Ocurre cuando poblaciones se separan y evolucionan de forma distinta hasta no poder reproducirse entre sí."
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
    },
    {
      pregunta: "¿Qué es un neurotransmisor?",
      opciones: ["Una célula de la médula", "Una sustancia química que transmite señales entre neuronas", "Un hueso", "Una proteína del músculo"],
      respuestaCorrecta: 1,
      explicacion: "Ejemplos son la dopamina, serotonina y acetilcolina."
    },
    {
      pregunta: "El sistema nervioso central está compuesto por:",
      opciones: ["Los nervios de las manos", "El encéfalo y la médula espinal", "Solo el cerebro", "El corazón y pulmones"],
      respuestaCorrecta: 1,
      explicacion: "Es el centro de procesamiento principal del cuerpo."
    },
    {
      pregunta: "¿Qué sucede en el 'Umbral de Excitación'?",
      opciones: ["La neurona se muere", "Se dispara un potencial de acción (impulso nervioso)", "La neurona descansa", "Se detiene la sangre"],
      respuestaCorrecta: 1,
      explicacion: "Es el voltaje mínimo necesario para generar una señal eléctrica."
    },
    {
      pregunta: "La neurona motora (o eferente) se encarga de:",
      opciones: ["Sentir el calor", "Llevar la orden del sistema nervioso al músculo", "Pensar", "Ver colores"],
      respuestaCorrecta: 1,
      explicacion: "Produce la respuesta física (el movimiento)."
    },
    {
      pregunta: "El lóbulo occipital del cerebro se especializa en:",
      opciones: ["El oído", "La visión", "El olfato", "El equilibrio"],
      respuestaCorrecta: 1,
      explicacion: "Procesa toda la información que viene de los ojos."
    },
    {
      pregunta: "¿Qué parte del cerebro coordina el equilibrio y la motricidad fina?",
      opciones: ["Hipotálamo", "Cerebelo", "Bulbo raquídeo", "Amígdala"],
      respuestaCorrecta: 1,
      explicacion: "Es vital para caminar, escribir y tocar instrumentos."
    },
    {
      pregunta: "El sistema nervioso Autónomo controla:",
      opciones: ["Caminar", "Funciones involuntarias (latidos, digestión)", "Hablar", "Leer"],
      respuestaCorrecta: 1,
      explicacion: "Funciona sin que tengamos que pensar en ello."
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
    },
    {
      pregunta: "¿Cuál es la función de los glóbulos rojos (eritrocitos)?",
      opciones: ["Defender de virus", "Transportar oxígeno usando hemoglobina", "Cerrar heridas", "Limpiar toxinas"],
      respuestaCorrecta: 1,
      explicacion: "Cargan el oxígeno en los pulmones y lo sueltan en los tejidos."
    },
    {
      pregunta: "Las válvulas que separan aurículas de ventrículos son:",
      opciones: ["Aórtica y Pulmonar", "Tricúspide y Mitral", "Venas y Arterias", "Filtros"],
      respuestaCorrecta: 1,
      explicacion: "Evitan que la sangre regrese a las aurículas cuando los ventrículos se contraen."
    },
    {
      pregunta: "Un infarto al miocardio ocurre cuando:",
      opciones: ["El corazón late muy rápido", "Se bloquea el flujo de sangre a las arterias coronarias (muerte del tejido)", "Falta aire", "Se rompe una costilla"],
      respuestaCorrecta: 1,
      explicacion: "El músculo cardíaco se queda sin oxígeno y deja de funcionar."
    },
    {
      pregunta: "Los capilares son:",
      opciones: ["Vasos grandes y gruesos", "Los vasos más pequeños donde ocurre el intercambio de gases y nutrientes", "Nervios", "Músculos"],
      respuestaCorrecta: 1,
      explicacion: "Sus paredes son tan delgadas que permiten que las moléculas pasen a las células."
    },
    {
      pregunta: "¿Qué es la presión arterial?",
      opciones: ["El peso de la sangre", "La fuerza que ejerce la sangre contra las paredes de las arterias", "La velocidad del latido", "El calor del cuerpo"],
      respuestaCorrecta: 1,
      explicacion: "Se mide con un esfigmomanómetro (típico 120/80 mmHg)."
    },
    {
      pregunta: "La circulación PULMONAR tiene como fin:",
      opciones: ["Llevar sangre al cerebro", "Oxigenar la sangre en los alvéolos", "Limpiar los riñones", "Mover las piernas"],
      respuestaCorrecta: 1,
      explicacion: "Lleva sangre cargada de CO2 a los pulmones y trae sangre con O2."
    },
    {
      pregunta: "¿Qué cámaras tienen paredes musculares más gruesas?",
      opciones: ["Aurículas", "Ventrículos (especialmente el izquierdo)", "Venas", "Capilares"],
      respuestaCorrecta: 1,
      explicacion: "Necesitan más fuerza para bombear la sangre a todo el cuerpo."
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
    },
    {
      pregunta: "¿Qué es la desnaturalización de una enzima?",
      opciones: ["Que se vuelve más rápida", "La pérdida de su estructura tridimensional y función por calor o pH extremo", "Que se convierte en azúcar", "Que se divide en dos"],
      respuestaCorrecta: 1,
      explicacion: "Al perder la forma, el sitio activo ya no encaja con el sustrato."
    },
    {
      pregunta: "La Lipasa es la enzima que digiere:",
      opciones: ["Proteínas", "Grasas (lípidos)", "Almidón", "ADN"],
      respuestaCorrecta: 1,
      explicacion: "Rompe las grasas en ácidos grasos y glicerol."
    },
    {
      pregunta: "El páncreas secreta jugo pancreático al:",
      opciones: ["Estómago", "Duodeno (parte inicial del intestino delgado)", "Esófago", "Hígado"],
      respuestaCorrecta: 1,
      explicacion: "Contiene enzimas para digerir carbohidratos, grasas y proteínas."
    },
    {
      pregunta: "¿Qué sucede con la velocidad de reacción si aumentamos la concentración de sustrato (hasta saturar)?",
      opciones: ["Baja", "Aumenta hasta alcanzar una velocidad máxima (Vmax)", "Se detiene", "Vuelve a cero"],
      respuestaCorrecta: 1,
      explicacion: "Llega un punto donde todas las enzimas están ocupadas trabajando."
    },
    {
      pregunta: "La Pepsina trabaja mejor en un ambiente:",
      opciones: ["Neutro (pH 7)", "Muy ácido (pH 2)", "Básico (pH 10)", "Frío"],
      respuestaCorrecta: 1,
      explicacion: "Es la enzima principal del estómago."
    },
    {
      pregunta: "¿Cuál es la función del Intestino Grueso?",
      opciones: ["Digerir carne", "Absorber agua y formar las heces", "Fabricar insulina", "Absorber vitaminas solamente"],
      respuestaCorrecta: 1,
      explicacion: "Recupera líquidos para evitar la deshidratación."
    },
    {
      pregunta: "Los inhibidores enzimáticos son moléculas que:",
      opciones: ["Ayudan a la enzima", "Bloquean o disminuyen la actividad de la enzima", "Le dan color a la célula", "Son comida"],
      respuestaCorrecta: 1,
      explicacion: "Pueden ser competitivos (se pegan al sitio activo) o no competitivos."
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
    },
    {
      pregunta: "¿Qué es un factor abiótico?",
      opciones: ["Un ser vivo", "Un elemento no vivo (luz, agua, temperatura, suelo)", "Un tipo de planta", "Un virus"],
      respuestaCorrecta: 1,
      explicacion: "Son las condiciones físicas y químicas del entorno."
    },
    {
      pregunta: "La relación de Simbiosis donde ambos se benefician se llama:",
      opciones: ["Parasitismo", "Mutualismo", "Comensalismo", "Competencia"],
      respuestaCorrecta: 1,
      explicacion: "Ejemplo: las abejas y las flores."
    },
    {
      pregunta: "¿Qué es la Huella Ecológica?",
      opciones: ["La marca de un zapato", "La medida del impacto humano sobre la capacidad de regeneración de la naturaleza", "Un camino en el bosque", "El peso de un animal"],
      respuestaCorrecta: 1,
      explicacion: "Mide cuánta tierra y agua necesitamos para mantener nuestro estilo de vida."
    },
    {
      pregunta: "El Efecto Invernadero es:",
      opciones: ["Malo siempre", "Un proceso natural que mantiene la temperatura de la Tierra apta para la vida", "Una máquina para plantas", "Cuando llueve mucho"],
      respuestaCorrecta: 1,
      explicacion: "El problema actual es su aumento excesivo por la contaminación (Calentamiento Global)."
    },
    {
      pregunta: "¿Qué es una población en ecología?",
      opciones: ["Todos los seres vivos del mundo", "Un grupo de individuos de la misma especie que viven en un mismo lugar", "Una ciudad", "Diferentes especies juntas"],
      respuestaCorrecta: 1,
      explicacion: "Comparten recursos y pueden reproducirse entre sí."
    },
    {
      pregunta: "En una pirámide de energía, ¿qué porcentaje se suele pasar al siguiente nivel?",
      opciones: ["100%", "90%", "Aproximadamente el 10%", "50%"],
      respuestaCorrecta: 2,
      explicacion: "La mayor parte de la energía se pierde como calor o en procesos vitales (Ley del Diezmo)."
    },
    {
      pregunta: "El 'Nicho Ecológico' de una especie es:",
      opciones: ["Su dirección física (dónde vive)", "Su función o papel en el ecosistema (qué come, quién lo come, etc.)", "Un agujero en una roca", "Su nombre científico"],
      respuestaCorrecta: 1,
      explicacion: "Es como su 'profesión' dentro de la comunidad biológica."
    }
  ],
};

// Generador de quices con rotación aleatoria
export const getQuizForPractice = (id: string): Question[] => {
  const allQuestions = ALL_QUIZZES[id] || [
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

  // Shuffle Fisher-Yates
  const shuffled = [...allQuestions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Retornamos un set de 7 preguntas para mantener la consistencia del UI
  return shuffled.slice(0, 7);
};
