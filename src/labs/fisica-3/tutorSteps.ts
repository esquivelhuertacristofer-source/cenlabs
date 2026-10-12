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
      mensaje: 'Suelta el péndulo y cronometra al menos 10 oscilaciones completas (la fotopuerta las cuenta). Registra el tiempo y el número de oscilaciones: T = t/n. Mide dos masas con la misma L y al menos tres longitudes distintas.',
    },
    {
      id: 4, tipo: 'calculo', pista: 'Despeja g',
      mensaje: 'Despeja g = 4π²L/T² con cada muestra y promedia. Escribe tu g y pulsa "Comprobar análisis" (tolerancia ±5 %).',
    },
    {
      id: 5, tipo: 'verificar', pista: 'Validar Gravedad',
      mensaje: 'Presiona Validar cuando tengas el valor de g calculado.',
      accion: 'Validar Gravedad',
    }
  ];

export default tutorSteps;
