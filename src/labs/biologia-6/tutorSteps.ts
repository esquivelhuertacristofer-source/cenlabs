import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Selección Natural',
      mensaje: 'Eres un depredador en un entorno cambiante. Observa cómo la evolución favorece al más apto.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Camuflaje',
      mensaje: 'Fíjate en la corteza. Un ave caza lo que alcanza a ver: caza la cuota de esta generación.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Generaciones',
      mensaje: 'Pulsa «Siguiente generación»: las supervivientes se reproducen. Compara el % de oscuras y q de cada generación.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Adaptación',
      mensaje: 'Con al menos 3 generaciones registradas, valida el proceso evolutivo.',
      accion: 'Validar Selección',
    }
  ];

export default tutorSteps;
