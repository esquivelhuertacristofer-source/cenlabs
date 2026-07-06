import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
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
  ];

export default quiz;
