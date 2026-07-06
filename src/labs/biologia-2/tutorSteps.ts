import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Ósmosis Celular',
      mensaje: 'Observaremos cómo las células responden a diferentes concentraciones de sal. ¡Cuidado con la citólisis!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Medio Hipotónico',
      mensaje: 'Baja la concentración externa. El agua entrará a la célula por ósmosis. ¿Ves cómo se hincha?',
    },
    {
      id: 3, tipo: 'accion', pista: 'Medio Hipertónico',
      mensaje: 'Sube la salinidad externa. El agua saldrá de la célula (plasmólisis). Observa la contracción del citoplasma.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Equilibrio Osmótico',
      mensaje: 'Ajusta las concentraciones hasta que el flujo neto de agua sea cero (isotónico) y valida.',
      accion: 'Validar Tonicidad',
    }
  ];

export default tutorSteps;
