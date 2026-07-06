import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Dilatación Térmica',
      mensaje: 'Veremos cómo los metales crecen con el calor. ¡Cuidado con el quemador!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Calentamiento',
      mensaje: 'Incrementa la temperatura de la barra de metal. Usa el micrómetro para medir el cambio en la longitud ΔL.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Coeficiente Alfa',
      mensaje: 'Aplica ΔL = α * L0 * ΔT. Despeja α e identifica el material según su expansión.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Material',
      mensaje: 'Presiona Validar cuando identifiques el coeficiente de dilatación.',
      accion: 'Validar Expansión',
    }
  ];

export default tutorSteps;
