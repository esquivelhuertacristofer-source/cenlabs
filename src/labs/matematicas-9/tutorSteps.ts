import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Sumas de Riemann',
      mensaje: 'Calcularemos el área bajo f(x) = 0.1x² + 1 en [0, 10] con rectángulos. El reto del panel te dice el método y el error máximo permitido.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Cambia el Método',
      mensaje: 'Prueba extremos izquierdos, derechos y puntos medios con pocos rectángulos. Como f crece, la izquierda se queda corta y la derecha se pasa.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Integral Exacta',
      mensaje: 'Calcula la integral exacta con la regla de Barrow (antiderivada x³/30 + x) y compárala con la suma: así se mide el error relativo.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Área',
      mensaje: 'Con el método del reto, aumenta n hasta que el error relativo quede bajo la tolerancia y valida.',
      accion: 'Validar Integral',
    },
  ];

export default tutorSteps;
