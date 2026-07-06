import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "Según la Ley de Boyle, a temperatura constante, si el volumen disminuye:",
      opciones: ["La presión disminuye", "La presión aumenta", "La presión no cambia", "El gas se congela"],
      respuestaCorrecta: 1,
      explicacion: "P y V son inversamente proporcionales. Menos espacio significa choques más frecuentes contra las paredes."
    },
    {
      pregunta: "¿Qué escala de temperatura DEBE usarse en las leyes de los gases?",
      opciones: ["Celsius (°C)", "Fahrenheit (°F)", "Kelvin (K)", "Reaumur (°R)"],
      respuestaCorrecta: 2,
      explicacion: "Kelvin es la escala absoluta. El cero absoluto es el punto donde cesa el movimiento molecular."
    },
    {
      pregunta: "La ecuación de estado de los gases ideales es:",
      opciones: ["F = m*a", "PV = nRT", "E = h*f", "V = I*R"],
      respuestaCorrecta: 1,
      explicacion: "Relaciona Presión, Volumen, Moles, la Constante R y la Temperatura."
    },
    {
      pregunta: "¿Qué sucede con la presión si aumentamos la temperatura a volumen constante (Ley de Gay-Lussac)?",
      opciones: ["Aumenta", "Disminuye", "Se mantiene igual", "El volumen aumenta"],
      respuestaCorrecta: 0,
      explicacion: "Al calentar, las moléculas se mueven más rápido y chocan con más fuerza, subiendo la presión."
    },
    {
      pregunta: "El volumen molar de un gas ideal en Condiciones Normales (1 atm, 273K) es:",
      opciones: ["1 L", "22.4 L", "10 L", "44.8 L"],
      respuestaCorrecta: 1,
      explicacion: "Es una constante fundamental para cálculos estequiométricos de gases."
    },
    {
      pregunta: "¿Qué representa la variable 'n' en PV=nRT?",
      opciones: ["Número de partículas", "Masa en gramos", "Cantidad de sustancia en moles", "Nitrógeno"],
      respuestaCorrecta: 2,
      explicacion: "n representa los moles, que es la unidad estándar para contar átomos o moléculas."
    },
    {
      pregunta: "Un gas real se comporta como ideal cuando:",
      opciones: ["La presión es alta y temperatura baja", "La presión es baja y temperatura alta", "Está en estado líquido", "Nunca"],
      respuestaCorrecta: 1,
      explicacion: "A baja presión y alta temperatura, las interacciones entre moléculas son despreciables."
    },
    {
      pregunta: "Según la Ley de Charles, a presión constante, el volumen es:",
      opciones: ["Inversamente proporcional a T", "Directamente proporcional a la temperatura absoluta (T)", "Independiente de T", "Igual a la masa"],
      respuestaCorrecta: 1,
      explicacion: "V1/T1 = V2/T2. Si calientas un gas, este se expande."
    },
    {
      pregunta: "¿Qué establece la Ley de las Presiones Parciales de Dalton?",
      opciones: ["La presión total es el promedio", "La presión total es la suma de las presiones individuales de cada gas", "Los gases no tienen presión", "La presión depende del color del gas"],
      respuestaCorrecta: 1,
      explicacion: "P_total = P1 + P2 + P3... en una mezcla de gases no reactivos."
    },
    {
      pregunta: "¿Qué es el Cero Absoluto?",
      opciones: ["0°C", "-273.15°C", "0°F", "100K"],
      respuestaCorrecta: 1,
      explicacion: "Es la temperatura teórica más baja posible, correspondiente a 0 Kelvin."
    },
    {
      pregunta: "En la Teoría Cinética, se asume que las colisiones entre moléculas son:",
      opciones: ["Plásticas", "Elásticas (no hay pérdida de energía cinética)", "Inexistentes", "Explosivas"],
      respuestaCorrecta: 1,
      explicacion: "La energía se transfiere pero no se disipa en forma de calor interno molecular."
    },
    {
      pregunta: "¿Qué gas es más denso en condiciones iguales?",
      opciones: ["Hidrógeno (H2)", "Helio (He)", "Oxígeno (O2)", "Dióxido de Carbono (CO2)"],
      respuestaCorrecta: 3,
      explicacion: "A mayor masa molar (CO2 = 44 g/mol), mayor densidad del gas."
    },
    {
      pregunta: "¿Qué constante R se usa comúnmente con Atmósferas y Litros?",
      opciones: ["8.314 J/molK", "0.0821 L*atm/molK", "1.987 cal/molK", "9.8 m/s2"],
      respuestaCorrecta: 1,
      explicacion: "0.0821 es el valor estándar para unidades de laboratorio tradicionales."
    },
    {
      pregunta: "¿Qué sucede con la densidad de un gas si se calienta a presión constante?",
      opciones: ["Aumenta", "Disminuye", "No cambia", "Se vuelve infinita"],
      respuestaCorrecta: 1,
      explicacion: "Al calentarse, el volumen aumenta; como la masa es constante, la densidad (m/V) baja."
    }
  ];

export default quiz;
