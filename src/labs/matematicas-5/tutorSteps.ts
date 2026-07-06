import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Círculo Unitario',
      mensaje: 'Bienvenido al osciloscopio trigonométrico. Aquí el radio siempre es 1. ¡Exploremos las funciones circulares!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Genera la Onda',
      mensaje: 'Activa la animación y observa cómo la proyección vertical (Seno) y horizontal (Coseno) crean ondas sinusoidales.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Captura Puntos',
      mensaje: 'Detén el vector en ángulos notables (45°, 90°, 180°) y registra los hallazgos en la bitácora para ver la tabla de valores.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Sincronía de Fase',
      mensaje: 'Lleva el vector a la posición objetivo y valida la fase para completar el análisis.',
      accion: 'Validar Fase',
    }
  ];

export default tutorSteps;
