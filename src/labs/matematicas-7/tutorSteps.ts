import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Óptica de Snell',
      mensaje: 'Calcularemos índices de refracción usando trigonometría. Dispara el láser y observa la desviación.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Mide Ángulos',
      mensaje: 'Usa el transportador para medir el ángulo de incidencia y el de refracción. Anótalos en la bitácora.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Ley de Snell',
      mensaje: 'Aplica n1*sin(θ1) = n2*sin(θ2). Despeja n2 e ingresa el valor para identificar el material misterioso.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Índice',
      mensaje: 'Presiona Validar cuando tengas el índice n2 calculado.',
      accion: 'Validar Refracción',
    }
  ];

export default tutorSteps;
