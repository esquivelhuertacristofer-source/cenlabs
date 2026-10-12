import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Máquina de Galton',
      mensaje: 'Cada bolita choca con 10 clavos y en cada uno va a la derecha con probabilidad p. El contenedor final cuenta cuántas veces fue a la derecha.',
    },
    {
      id: 2, tipo: 'calculo', pista: 'Predice μ y σ',
      mensaje: 'Ese conteo sigue una Binomial(10, p): μ = n·p y σ = √(n·p·(1 − p)). Escribe tu predicción en el panel antes de mirar la muestra.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Lanza la Población',
      mensaje: 'Suelta bolitas hasta tener al menos 200. Compara el histograma con la curva teórica y la media muestral con tu μ.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Distribución',
      mensaje: 'Presiona Validar: se comprueba tu predicción (±0.05) y que el histograma se ajusta a la binomial (prueba χ²).',
      accion: 'Validar Distribución',
    },
  ];

export default tutorSteps;
