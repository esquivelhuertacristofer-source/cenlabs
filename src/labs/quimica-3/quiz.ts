import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
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
  ];

export default quiz;
