import { Question } from "@/components/LabQuiz";
import { fromRegistry } from '@/labs/_registry';

const LEGACY_ALL_QUIZZES: Record<string, Question[]> = {};

// Generador de quices con rotación aleatoria
export const getQuizForPractice = (id: string): Question[] => {
  const allQuestions = ALL_QUIZZES[id] || [
    {
      pregunta: "¿Cuál es el objetivo principal de este laboratorio?",
      opciones: ["Validar una teoría científica", "Pasar el tiempo", "Destruir el equipo", "No aprender nada"],
      respuestaCorrecta: 0,
      explicacion: "Todo laboratorio CEN busca validar conceptos teóricos mediante la experimentación práctica."
    },
    {
      pregunta: "¿Qué ley rige el comportamiento observado en este simulador?",
      opciones: ["Leyes de Newton", "Leyes de la Termodinámica", "Leyes de la Conservación", "Depende del módulo"],
      respuestaCorrecta: 3,
      explicacion: "Cada módulo está basado en principios físicos, químicos o biológicos específicos de su área."
    },
    {
      pregunta: "La precisión en la toma de datos es importante porque...",
      opciones: ["Se ve mejor en la bitácora", "Minimiza el error experimental", "Es una regla sin sentido", "No es importante"],
      respuestaCorrecta: 1,
      explicacion: "La precisión asegura que los resultados experimentales se acerquen a los valores teóricos esperados."
    },
    {
      pregunta: "¿Qué componente del simulador permite registrar los hallazgos?",
      opciones: ["El radar", "La bitácora", "El cronómetro", "El ventilador"],
      respuestaCorrecta: 1,
      explicacion: "La bitácora es el documento científico donde se asientan las observaciones y resultados."
    },
    {
      pregunta: "¿Cuál es el papel del Dr. Quantum?",
      opciones: ["Es un estorbo", "Es el tutor pedagógico", "Es un enemigo", "No tiene papel"],
      respuestaCorrecta: 1,
      explicacion: "El Dr. Quantum actúa como guía para asegurar que los objetivos de aprendizaje se cumplan."
    },
    {
      pregunta: "En una validación científica, el % de error aceptable suele ser...",
      opciones: ["100%", "50%", "Bajo (típicamente < 5%)", "No importa el error"],
      respuestaCorrecta: 2,
      explicacion: "Un bajo porcentaje de error indica una experimentación exitosa y controlada."
    },
    {
      pregunta: "El método científico comienza con...",
      opciones: ["La conclusión", "La observación", "El examen", "La risa"],
      respuestaCorrecta: 1,
      explicacion: "Todo proceso científico inicia observando un fenómeno para formular una hipótesis."
    }
  ];

  // Shuffle Fisher-Yates
  const shuffled = [...allQuestions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Retornamos un set de 7 preguntas para mantener la consistencia del UI
  return shuffled.slice(0, 7);
};

export const ALL_QUIZZES: Record<string, Question[]> = {
  ...LEGACY_ALL_QUIZZES,
  ...fromRegistry('quiz'),
};
