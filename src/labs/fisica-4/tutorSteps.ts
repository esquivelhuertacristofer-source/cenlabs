import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Ley de Hooke',
      mensaje: 'Estudiaremos la elasticidad. Vamos a estirar resortes para encontrar su constante k.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Carga de Masas',
      mensaje: 'Cuelga diferentes pesos y observa la elongación (x). Los vectores mostrarán la fuerza restauradora.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Constante k',
      mensaje: 'Calcula k = F / x para cada medición. ¿Es constante? Verifica la linealidad en el gráfico.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Resorte',
      mensaje: 'Presiona Validar cuando identifiques la constante elástica.',
      accion: 'Validar Elongación',
    }
  ];

export default tutorSteps;
