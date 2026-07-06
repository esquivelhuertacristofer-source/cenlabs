import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Reflejo Simple',
      mensaje: 'Mediremos la velocidad de conducción nerviosa usando el reflejo rotuliano.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Golpe de Martillo',
      mensaje: 'Ajusta la fuerza del impacto. El sensor detectará el estímulo y la respuesta motora.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Latencia',
      mensaje: 'Mide el tiempo entre el golpe y la contracción. Calcula la velocidad basándote en la longitud del nervio.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Respuesta',
      mensaje: 'Confirma que el arco reflejo funciona correctamente para los parámetros de mielina actuales.',
      accion: 'Validar Reflejo',
    }
  ];

export default tutorSteps;
