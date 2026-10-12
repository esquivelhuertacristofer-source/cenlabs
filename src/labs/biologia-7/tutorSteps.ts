import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Reflejo Simple',
      mensaje: 'Mediremos la velocidad de conducción nerviosa usando el reflejo rotuliano.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Golpe de Martillo',
      mensaje: 'Golpea con varias fuerzas. ¿Hay una fuerza que no produzca reflejo? ¿Cambia la latencia al golpear más fuerte?',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Latencia',
      mensaje: 'A la latencia réstale los retardos de la sinapsis y de la placa; divide la distancia del arco entre ese tiempo.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Respuesta',
      mensaje: 'Escribe tu velocidad, elige el diagnóstico y valida.',
      accion: 'Validar Reflejo',
    }
  ];

export default tutorSteps;
