import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Círculo Unitario',
      mensaje: 'Bienvenido al osciloscopio trigonométrico. Aquí el radio siempre es 1: el coseno es la sombra horizontal y el seno la vertical.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Genera la Onda',
      mensaje: 'Activa la animación y observa cómo la proyección vertical (seno) y la horizontal (coseno) crean ondas sinusoidales.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Resuelve la Ecuación',
      mensaje: 'Lee la ecuación del panel. En una vuelta completa hay DOS ángulos que la cumplen: piensa en qué cuadrantes la proyección tiene ese signo.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Captura y Valida',
      mensaje: 'Detén el vector en cada solución, captúrala y valida. Una captura incorrecta invalida la práctica: usa «Limpiar muestras».',
      accion: 'Validar',
    },
  ];

export default tutorSteps;
