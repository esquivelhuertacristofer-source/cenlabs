import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
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
  ];

export default quiz;
