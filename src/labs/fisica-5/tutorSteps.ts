import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Prensa Hidráulica',
      mensaje: 'Multiplicaremos fuerza usando el Principio de Pascal. ¡Ingeniería de fluidos!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Radios de Émbolos',
      mensaje: 'Ajusta r1 y r2. Observa cómo cambia la ventaja mecánica (r2/r1)².',
    },
    {
      id: 3, tipo: 'accion', pista: 'Eleva la Carga',
      mensaje: 'Calcula la fuerza mínima que sostiene la carga: F₁ = m·g·(r₁/r₂)². Escríbela como predicción, elige una F₁ y pulsa "Bombear": si la presión alcanza, la carga sube (mucho menos de lo que baja el émbolo pequeño).',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Ganancia',
      mensaje: 'Cuando la carga suba y tu fuerza mínima sea correcta (±3 %), valida tu práctica.',
      accion: 'Validar Elevación',
    }
  ];

export default tutorSteps;
