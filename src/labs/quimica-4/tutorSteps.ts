import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Reactivo Limitante',
      mensaje: '¡Hola, {alumno}! Bienvenido a la planta de amoníaco. Tu misión es optimizar la producción de NH₃ identificando el reactivo que limita la reacción.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Carga de Reactivos',
      mensaje: 'Ajusta la cantidad inicial de Nitrógeno (N₂) e Hidrógeno (H₂) usando los controles del dock inferior. Observa cómo cambian las proporciones molares.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Análisis Estequiométrico',
      mensaje: 'Usa la proporción 1:3 para determinar el limitante. Divide los moles de cada reactivo entre su coeficiente. El menor valor te indicará quién se agota primero.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Inicia Síntesis',
      mensaje: 'Presiona "Iniciar Reacción". Observa el flujo de productos y cuánto reactivo queda en exceso. Si los cálculos son correctos, el rendimiento será máximo.',
      accion: 'Ejecutar Síntesis',
    }
  ];

export default tutorSteps;
