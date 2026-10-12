import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Purificación Térmica',
      mensaje: '¡Hola, {alumno}! Tu misión es purificar Etanol mediante destilación fraccionada. Aprovecharemos la diferencia en los puntos de ebullición.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Manta Calefactora',
      mensaje: 'Sube la manta calefactora hasta apenas por encima de la ebullición de la mezcla (85-95 °C). La cabeza de la columna debe marcar cerca de 78 °C.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Equilibrio Vapor-Líquido',
      mensaje: 'Observa cómo el vapor asciende por la columna y se condensa en el refrigerante. Si calientas a fondo destilará más rápido, pero el destilado saldrá más aguado.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Recolección',
      mensaje: 'Colecta al menos 50 mL de destilado. El alcoholímetro del colector debe marcar 85 % v/v o más; entonces certifica la destilación.',
      accion: 'Certificar Pureza',
    }
  ];

export default tutorSteps;
