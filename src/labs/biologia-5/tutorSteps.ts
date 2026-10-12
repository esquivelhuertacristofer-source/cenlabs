import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Genética Mendeliana',
      mensaje: 'Tienes una cruza asignada. Primero se predice, después se cruza: así se pone a prueba una hipótesis.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Predicción',
      mensaje: 'Escribe los gametos de cada progenitor, arma el cuadro de Punnett y escribe la proporción fenotípica en enteros.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Cruza y χ²',
      mensaje: 'Elige el tamaño de la muestra y cruza. Si χ² supera el valor crítico, los datos contradicen tu predicción.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Alelos',
      mensaje: 'Con una muestra de al menos 100 semillas y tu predicción registrada, valida la práctica.',
      accion: 'Validar Herencia',
    }
  ];

export default tutorSteps;
