import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Digestión Enzimática',
      mensaje: 'Descompondremos macromoléculas usando enzimas específicas. ¡Química digestiva!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Sustrato y Enzima',
      mensaje: 'Elige entre proteínas, lípidos o carbohidratos. Selecciona la enzima correcta (Pepsina, Lipasa, Amilasa).',
    },
    {
      id: 3, tipo: 'accion', pista: 'Optimización de pH',
      mensaje: 'Ajusta el pH del medio. Cada enzima tiene un pH óptimo donde su actividad es máxima.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Absorción',
      mensaje: 'Cuando la hidrólisis sea completa y obtengas monómeros, valida el proceso digestivo.',
      accion: 'Validar Digestión',
    }
  ];

export default tutorSteps;
