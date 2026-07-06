import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
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
  ];

export default quiz;
