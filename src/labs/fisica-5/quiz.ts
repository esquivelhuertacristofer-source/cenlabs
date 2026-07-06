import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
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
  ];

export default quiz;
