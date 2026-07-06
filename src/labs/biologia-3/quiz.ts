import type { Question } from '@/components/LabQuiz';

const quiz: Question[] = [
    {
      pregunta: "¿En qué parte de la célula ocurre la TRANSCRIPCIÓN?",
      opciones: ["En el Ribosoma", "En el Citoplasma", "En el Núcleo", "En la Mitocondria"],
      respuestaCorrecta: 2,
      explicacion: "Es el proceso de copiar el ADN a ARNm, y el ADN nunca sale del núcleo en eucariotas."
    },
    {
      pregunta: "¿Qué base nitrogenada es exclusiva del ARN?",
      opciones: ["Timina (T)", "Uracilo (U)", "Adenina (A)", "Guanina (G)"],
      respuestaCorrecta: 1,
      explicacion: "En el ARN, el Uracilo reemplaza a la Timina y se aparea con la Adenina."
    },
    {
      pregunta: "La función del ARNm (mensajero) es:",
      opciones: ["Transportar aminoácidos", "Llevar la información genética del núcleo al ribosoma", "Formar parte de la estructura del ribosoma", "Cortar el ADN"],
      respuestaCorrecta: 1,
      explicacion: "Actúa como el 'plano' o instructivo para construir la proteína."
    },
    {
      pregunta: "¿Qué es un CODÓN?",
      opciones: ["Una proteína pequeña", "Una secuencia de 3 bases nitrogenadas que codifica un aminoácido", "Un tipo de azúcar", "El centro del núcleo"],
      respuestaCorrecta: 1,
      explicacion: "El código genético se lee de tres en tres letras."
    },
    {
      pregunta: "El proceso de TRADUCCIÓN consiste en:",
      opciones: ["Copiar ADN a ADN", "Copiar ADN a ARN", "Convertir la secuencia de ARNm en una cadena de aminoácidos (proteína)", "Destruir proteínas"],
      respuestaCorrecta: 2,
      explicacion: "Ocurre en el ribosoma con la ayuda del ARNt (transferencia)."
    },
    {
      pregunta: "¿Qué sucede cuando el ribosoma llega a un 'Codón de Parada' (STOP)?",
      opciones: ["La célula muere", "La traducción se detiene y la proteína es liberada", "Se reinicia el proceso", "Se añade un lípido"],
      respuestaCorrecta: 1,
      explicacion: "Indica el final de la cadena polipeptídica."
    },
    {
      pregunta: "Si la secuencia de ADN es TAC, ¿cuál es el codón de ARNm correspondiente?",
      opciones: ["ATG", "AUG", "UAC", "GUA"],
      respuestaCorrecta: 1,
      explicacion: "T se une con A, A con U (en ARN), y C con G. El codón AUG es el inicio universal."
    },
    {
      pregunta: "¿Qué enzima separa las hebras de ADN durante la replicación?",
      opciones: ["Polimerasa", "Helicasa", "Ligasa", "Amilasa"],
      respuestaCorrecta: 1,
      explicacion: "Actúa como una cremallera abriendo la doble hélice."
    },
    {
      pregunta: "El ADN tiene una estructura de:",
      opciones: ["Hélice simple", "Doble hélice", "Círculo plano", "Cubo"],
      respuestaCorrecta: 1,
      explicacion: "Descubierta por Watson, Crick y Franklin en 1953."
    },
    {
      pregunta: "La Guanina (G) siempre se aparea con:",
      opciones: ["Adenina", "Citosina", "Uracilo", "Timina"],
      respuestaCorrecta: 1,
      explicacion: "Se unen mediante tres puentes de hidrógeno."
    },
    {
      pregunta: "¿Cuál es el 'dogma central' de la biología molecular?",
      opciones: ["Proteína -> ARN -> ADN", "ADN -> ARN -> Proteína", "Luz -> Azúcar", "Célula -> Tejido"],
      respuestaCorrecta: 1,
      explicacion: "Describe el flujo normal de la información genética."
    },
    {
      pregunta: "Una mutación es:",
      opciones: ["Un cambio en la secuencia del ADN", "Una enfermedad siempre", "Hacerse más fuerte", "Cambiar de color de pelo"],
      respuestaCorrecta: 0,
      explicacion: "Puede ser beneficiosa, neutra o perjudicial; es la base de la variabilidad."
    },
    {
      pregunta: "¿Cuántos aminoácidos existen comúnmente en las proteínas?",
      opciones: ["4", "20", "64", "100"],
      respuestaCorrecta: 1,
      explicacion: "Aunque hay 64 combinaciones de codones, solo codifican para 20 aminoácidos esenciales."
    },
    {
      pregunta: "El azúcar presente en el ADN es la:",
      opciones: ["Ribosa", "Desoxirribosa", "Glucosa", "Fructosa"],
      respuestaCorrecta: 1,
      explicacion: "De ahí el nombre Ácido Desoxirribonucleico."
    }
  ];

export default quiz;
