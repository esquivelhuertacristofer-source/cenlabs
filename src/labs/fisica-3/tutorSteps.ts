import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Péndulo de Precisión',
      mensaje: 'Calcularemos la gravedad local usando un péndulo simple. ¡El tiempo es nuestra herramienta!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Longitud de Cuerda',
      mensaje: 'Ajusta la longitud L. Recuerda que el periodo T depende principalmente de esta variable y de la gravedad.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Inicia Oscilación',
      mensaje: 'Desplaza la masa y suéltala. Usa el cronómetro para medir el tiempo de 10 oscilaciones y sacar el promedio.',
    },
    {
      id: 4, tipo: 'calculo', pista: 'Despeja g',
      mensaje: 'Usa T = 2π√(L/g) para despejar la gravedad. Ingresa el valor en la telemetría.',
    },
    {
      id: 5, tipo: 'verificar', pista: 'Validar Gravedad',
      mensaje: 'Presiona Validar cuando tengas el valor de g calculado.',
      accion: 'Validar Gravedad',
    }
  ];

export default tutorSteps;
