import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Purificación Térmica',
      mensaje: '¡Hola, {alumno}! Tu misión es purificar Etanol mediante destilación fraccionada. Aprovecharemos la diferencia en los puntos de ebullición.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Manta Calefactora',
      mensaje: 'Ajusta la potencia de la manta calefactora para alcanzar una temperatura de vapor de ~78°C. Evita subir a 100°C para no arrastrar agua.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Equilibrio Vapor-Líquido',
      mensaje: 'Observa cómo el vapor asciende por la columna de fraccionamiento y se condensa en el refrigerante. Mantén la isoterma estable.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Recolección',
      mensaje: 'Colecta al menos 50ml de destilado en la probeta graduada. Verifica la pureza en la telemetría digital antes de validar.',
      accion: 'Certificar Pureza',
    }
  ];

export default tutorSteps;
