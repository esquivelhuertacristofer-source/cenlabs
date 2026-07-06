import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
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
  ];

export default quiz;
