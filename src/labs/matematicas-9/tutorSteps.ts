import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Sumas de Riemann',
      mensaje: 'Calcularemos el área bajo la curva usando rectángulos. A más rectángulos, mayor precisión.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Incrementa n',
      mensaje: 'Aumenta el número de rectángulos (n). Observa cómo el error de aproximación disminuye visualmente.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Cambia el Método',
      mensaje: 'Prueba con extremos izquierdos, derechos y puntos medios. ¿Cuál se acerca más al valor real de la integral?',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Área',
      mensaje: 'Cuando logres un error menor al 1%, valida la integral.',
      accion: 'Validar Integral',
    }
  ];

export default tutorSteps;
