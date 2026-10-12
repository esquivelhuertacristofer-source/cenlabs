import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Localización 2x2',
      mensaje: '¡Hola, {alumno}! Bienvenido a la central de rastreo. Tu objetivo es que dos haces láser se crucen exactamente sobre el satélite.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Calibra Haz Alpha',
      mensaje: 'Usa los controles del Haz Alpha (m₁, b₁). La pendiente m₁ determina la inclinación y b₁ dónde corta al eje Y. Haz que el haz pase por el objetivo.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Calibra Haz Omega',
      mensaje: 'Ahora ajusta el Haz Omega (m₂, b₂) con una pendiente DISTINTA: con pendientes iguales las rectas son paralelas (sin solución) o la misma recta (infinitas).',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Sincronía de Coordenadas',
      mensaje: 'Cuando la intersección quede a menos de 0.1 del objetivo en cada coordenada, presiona Validar.',
      accion: 'Validar',
    },
  ];

export default tutorSteps;
