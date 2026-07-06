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
      mensaje: 'Aplica fuerza F1 para levantar el vehículo. Verifica que la presión sea igual en ambos lados.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Ganancia',
      mensaje: 'Presiona Validar cuando la carga esté en la altura objetivo.',
      accion: 'Validar Elevación',
    }
  ];

export default tutorSteps;
