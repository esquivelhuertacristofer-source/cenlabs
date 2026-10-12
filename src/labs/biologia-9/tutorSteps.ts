import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Digestión Enzimática',
      mensaje: 'Tienes un alimento asignado. Lo digerirás en un tubo de ensayo a 37 °C.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Sustrato y Enzima',
      mensaje: 'Elige una enzima e incuba. Si no hay reacción, piensa en la especificidad: ¿esa enzima reconoce tu sustrato?',
    },
    {
      id: 3, tipo: 'accion', pista: 'Optimización de pH',
      mensaje: 'Ajusta el pH: lejos del óptimo la actividad cae y algunas enzimas se desnaturalizan. Si tu sustrato es grasa, ¿qué la emulsiona?',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Absorción',
      mensaje: 'Con una hidrólisis completa, indica dónde actúa la enzima y dónde se absorben los productos, y valida.',
      accion: 'Validar Digestión',
    }
  ];

export default tutorSteps;
