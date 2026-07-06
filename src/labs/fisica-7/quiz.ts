import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
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
  ];

export default quiz;
