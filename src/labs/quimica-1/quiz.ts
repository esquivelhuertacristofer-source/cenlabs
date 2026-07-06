import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
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
  ];

export default quiz;
