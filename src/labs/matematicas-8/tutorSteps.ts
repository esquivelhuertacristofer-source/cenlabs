import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'La Derivada',
      mensaje: 'Encontraremos los puntos críticos de una función. La derivada nos dice la pendiente de la recta tangente.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Escanea la Curva',
      mensaje: 'Mueve el cursor sobre la gráfica. Observa cómo cambia la recta tangente. Busca donde la pendiente es CERO.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Máximos y Mínimos',
      mensaje: 'Ubica los valles y las cimas. En estos puntos la función cambia de dirección. Valida los puntos críticos encontrados.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Optimización',
      mensaje: 'Presiona Validar cuando hayas localizado los extremos de la función.',
      accion: 'Validar Extremos',
    }
  ];

export default tutorSteps;
