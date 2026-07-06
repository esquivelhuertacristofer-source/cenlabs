import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Genética Mendeliana',
      mensaje: 'Crucemos plantas para predecir la herencia. ¿Dominancia o recesividad?',
    },
    {
      id: 2, tipo: 'accion', pista: 'Cruza P1',
      mensaje: 'Selecciona los genotipos de los parentales. Observa las proporciones esperadas en el Cuadro de Punnett.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Generación F1',
      mensaje: 'Ejecuta la cruza y observa los fenotipos resultantes. ¿Se cumple la proporción 3:1 o 9:3:3:1?',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Alelos',
      mensaje: 'Confirma los resultados estadísticos de la descendencia para certificar la cruza.',
      accion: 'Validar Herencia',
    }
  ];

export default tutorSteps;
