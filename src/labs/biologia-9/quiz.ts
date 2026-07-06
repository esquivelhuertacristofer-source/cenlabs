import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
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
  ];

export default quiz;
