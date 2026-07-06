import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Ley de Coulomb',
      mensaje: 'Exploraremos la fuerza entre cargas eléctricas. ¿Atracción o repulsión?',
    },
    {
      id: 2, tipo: 'accion', pista: 'Magnitud de Carga',
      mensaje: 'Ajusta los valores de q1 y q2. Observa cómo cambian los vectores de fuerza eléctrica.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Variación de Distancia',
      mensaje: 'Mueve las cargas. Nota cómo la fuerza disminuye drásticamente al aumentar la distancia (ley del inverso al cuadrado).',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Fuerza',
      mensaje: 'Calcula la fuerza resultante para los valores actuales y valida tu resultado.',
      accion: 'Validar Fuerza',
    }
  ];

export default tutorSteps;
