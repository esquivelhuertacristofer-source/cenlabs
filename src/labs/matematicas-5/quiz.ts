import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿Cuál es el valor del radio en el Círculo Unitario?",
      opciones: ["Depende del ángulo", "0", "1", "π"],
      respuestaCorrecta: 2,
      explicacion: "Se llama 'unitario' precisamente porque su radio es 1 unidad de longitud."
    },
    {
      pregunta: "En el círculo unitario, la coordenada 'y' de un punto representa:",
      opciones: ["El Coseno del ángulo", "La Tangente", "El Seno del ángulo", "El Radio"],
      respuestaCorrecta: 2,
      explicacion: "Como sin(θ) = opuesto / hipotenusa y hipotenusa = 1, entonces sin(θ) = y."
    },
    {
      pregunta: "En el círculo unitario, la coordenada 'x' de un punto representa:",
      opciones: ["El Seno del ángulo", "El Coseno del ángulo", "La Secante", "El Diámetro"],
      respuestaCorrecta: 1,
      explicacion: "Como cos(θ) = adyacente / hipotenusa y hipotenusa = 1, entonces cos(θ) = x."
    },
    {
      pregunta: "¿Cuál es el valor del Seno de 90 grados?",
      opciones: ["0", "1", "-1", "0.5"],
      respuestaCorrecta: 1,
      explicacion: "A 90°, el punto está en (0, 1). La coordenada y es 1."
    },
    {
      pregunta: "¿En qué cuadrantes el Seno es positivo?",
      opciones: ["I y II", "I y IV", "II y III", "III y IV"],
      respuestaCorrecta: 0,
      explicacion: "El seno es positivo donde 'y' es positiva, es decir, en la mitad superior del plano cartesiano."
    },
    {
      pregunta: "¿Qué función trigonométrica se obtiene al dividir Seno entre Coseno?",
      opciones: ["Secante", "Cosecante", "Tangente", "Cotangente"],
      respuestaCorrecta: 2,
      explicacion: "tan(θ) = sin(θ) / cos(θ). Geométricamente es la pendiente del radio."
    },
    {
      pregunta: "¿A cuántos radianes equivalen 180 grados?",
      opciones: ["π / 2", "2π", "π", "3π / 2"],
      respuestaCorrecta: 2,
      explicacion: "La circunferencia completa es 2π (360°), por lo que media vuelta son π radianes."
    },
    {
      pregunta: "¿Cuál es el valor del Coseno de 0 grados?",
      opciones: ["0", "1", "-1", "π"],
      respuestaCorrecta: 1,
      explicacion: "A 0°, el punto en el círculo unitario es (1, 0). La coordenada x es 1."
    },
    {
      pregunta: "Si un ángulo está en el III Cuadrante, ¿cómo son los signos de (Seno, Coseno)?",
      opciones: ["(+, +)", "(-, +)", "(-, -)", "(+, -)"],
      respuestaCorrecta: 2,
      explicacion: "En el III cuadrante tanto x como y son negativos."
    },
    {
      pregunta: "¿Qué ángulo en radianes equivale a 90 grados?",
      opciones: ["π", "π/2", "π/4", "2π"],
      respuestaCorrecta: 1,
      explicacion: "Si 180° es π, entonces 90° es la mitad, π/2."
    },
    {
      pregunta: "¿Cuál es el periodo de las funciones Seno y Coseno?",
      opciones: ["π", "2π", "90°", "1"],
      respuestaCorrecta: 1,
      explicacion: "Ambas funciones repiten sus valores cada vuelta completa al círculo (360° o 2π)."
    },
    {
      pregunta: "Si sin(θ) = 0.5 y θ está en el I Cuadrante, ¿cuánto vale θ?",
      opciones: ["30°", "45°", "60°", "90°"],
      respuestaCorrecta: 0,
      explicacion: "El seno de 30° (o π/6 rad) es exactamente 0.5."
    },
    {
      pregunta: "La identidad fundamental de la trigonometría es:",
      opciones: ["sin + cos = 1", "sin²(θ) + cos²(θ) = 1", "tan = sin * cos", "sin / cos = 1"],
      respuestaCorrecta: 1,
      explicacion: "Deriva directamente del Teorema de Pitágoras aplicado al círculo unitario (x² + y² = 1)."
    },
    {
      pregunta: "¿Cuál es el valor máximo de la función Tangente?",
      opciones: ["1", "π", "No tiene (tiende a infinito)", "0"],
      respuestaCorrecta: 2,
      explicacion: "Cuando el coseno se acerca a cero (90°), la tangente crece sin límite."
    }
  ];

export default quiz;
