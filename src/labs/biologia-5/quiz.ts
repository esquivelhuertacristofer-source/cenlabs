import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
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
  ];

export default quiz;
