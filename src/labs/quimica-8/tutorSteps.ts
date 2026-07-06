import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Le Châtelier',
      mensaje: '¡Bienvenido, {alumno}! Estudiaremos el equilibrio N₂O₄ ⇌ 2NO₂. El N₂O₄ es incoloro y el NO₂ es café. ¿Cómo afectará el calor?',
    },
    {
      id: 2, tipo: 'accion', pista: 'Estación Térmica',
      mensaje: 'Haz clic en una de las jeringas y muévela a la "Plancha Caliente". Observa el cambio de color inmediato.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Endotérmico',
      mensaje: 'Como la reacción es endotérmica, el calor favorece la formación de NO₂ (gas café). ¿Ves cómo se oscurece?',
    },
    {
      id: 4, tipo: 'accion', pista: 'Choque Térmico',
      mensaje: 'Ahora mueve esa misma jeringa al "Baño de Hielo". El equilibrio se desplazará hacia el N₂O₄ incoloro.',
    },
    {
      id: 5, tipo: 'verificar', pista: 'Inercia Térmica',
      mensaje: 'Observa la telemetría. La temperatura no cambia instantáneamente. Esa "inercia" es clave en procesos químicos industriales.',
    },
    {
      id: 6, tipo: 'verificar', pista: 'Finalizar',
      mensaje: 'Has demostrado el Principio de Le Châtelier. Registra tus observaciones en la bitácora y valida la práctica.',
      accion: 'Certificar Equilibrio',
    }
  ];

export default tutorSteps;
