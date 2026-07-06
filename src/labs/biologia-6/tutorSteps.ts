import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Selección Natural',
      mensaje: 'Eres un depredador en un entorno cambiante. Observa cómo la evolución favorece al más apto.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Camuflaje',
      mensaje: 'Cambia el color del fondo. Las polillas que contrasten más serán cazadas primero. Inicia la simulación.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Deriva Genética',
      mensaje: 'Tras varias generaciones, observa cómo cambia la frecuencia de los colores en la población.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Adaptación',
      mensaje: 'Analiza los datos del gráfico de población y valida el proceso evolutivo.',
      accion: 'Validar Selección',
    }
  ];

export default tutorSteps;
