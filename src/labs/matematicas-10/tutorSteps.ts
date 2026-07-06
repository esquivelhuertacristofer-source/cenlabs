import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Máquina de Galton',
      mensaje: 'Exploraremos la probabilidad y la curva normal. ¿Hacia dónde caerán las bolitas?',
    },
    {
      id: 2, tipo: 'accion', pista: 'Lanza la Población',
      mensaje: 'Inicia el lanzamiento de bolitas. Observa cómo se acumulan en los contenedores siguiendo una distribución binomial.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Campana de Gauss',
      mensaje: 'A medida que aumentas la población, la forma de la campana se vuelve más definida. Verifica la probabilidad 0.5.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Distribución',
      mensaje: 'Presiona Validar cuando la muestra sea estadísticamente significativa.',
      accion: 'Validar Datos',
    }
  ];

export default tutorSteps;
