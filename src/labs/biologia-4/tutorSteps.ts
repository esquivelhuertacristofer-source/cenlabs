import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Fotosíntesis',
      mensaje: 'Optimizaremos la producción de oxígeno variando la luz. ¡Energía solar en acción!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Espectro de Luz',
      mensaje: 'Cambia el color de la lámpara. ¿Qué color absorbe mejor la clorofila? Observa la tasa de burbujeo.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Intensidad Lumínica',
      mensaje: 'Acerca la lámpara. A mayor intensidad, mayor tasa fotosintética, hasta llegar al punto de saturación.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Acumular O2',
      mensaje: 'Cuando alcances la cuota de oxígeno objetivo, valida el rendimiento del cloroplasto.',
      accion: 'Validar O2',
    }
  ];

export default tutorSteps;
