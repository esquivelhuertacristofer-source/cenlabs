import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Óptica de Snell',
      mensaje: 'Calcularemos un índice de refracción desconocido usando trigonometría. Dispara el láser y observa la desviación.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Mide Ángulos',
      mensaje: 'Elige θ₁ con el deslizador y mide el ángulo refractado θ₂ en el transportador. Ambos ángulos se miden desde la NORMAL, no desde la superficie.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Ley de Snell',
      mensaje: 'Aplica n₁·sen(θ₁) = n₂·sen(θ₂). Despeja n₂ y escríbelo en el panel.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Índice',
      mensaje: 'Presiona Validar cuando tengas n₂ (se acepta ±0.05).',
      accion: 'Validar',
    },
  ];

export default tutorSteps;
