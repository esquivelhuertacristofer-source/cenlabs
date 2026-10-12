import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Protocolo Iniciado',
      mensaje: '¡Bienvenido al reactor de balanceo! Tu misión es demostrar la Conservación de la Masa: ajusta los coeficientes para que cada tipo de átomo aparezca el mismo número de veces en reactivos y productos.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Coeficientes mínimos',
      mensaje: 'Sube o baja cada coeficiente con las flechas del panel inferior y compara el conteo de átomos de los dos paneles laterales. Usa los coeficientes enteros MÍNIMOS: si todos tienen un divisor común, simplifícalos.',
    },
    {
      id: 3, tipo: 'verificar', pista: 'Ley de Lavoisier',
      mensaje: 'Cada reacción balanceada desbloquea la siguiente. Con 4 reacciones balanceadas, valida la práctica.',
      accion: 'Validar práctica',
    }
  ];

export default tutorSteps;
