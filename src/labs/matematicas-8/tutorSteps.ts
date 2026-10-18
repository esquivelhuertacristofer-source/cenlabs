import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'La Derivada',
      mensaje: 'La posición del cohete es s(t) = −k·t³ + m·t² (los números están en el panel). La derivada s\'(t) es la pendiente de la recta tangente: la velocidad.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Escanea la Curva',
      mensaje: 'Mueve el instante t. Observa cómo la recta secante se acerca a la tangente y cómo cambia la velocidad v(t).',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Máxima Velocidad',
      mensaje: 'La velocidad es máxima donde su propia derivada se anula: calcula a(t) = v\'(t) y resuelve a(t) = 0.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Telemetría',
      mensaje: 'Marca ese instante (se acepta ±0,2 s) y presiona Validar.',
      accion: 'Validar',
    },
  ];

export default tutorSteps;
