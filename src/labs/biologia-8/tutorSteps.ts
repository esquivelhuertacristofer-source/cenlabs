import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Ciclo Cardíaco',
      mensaje: 'Analizaremos la sístole y diástole. ¡Escucha el latido del motor de la vida!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Estado Fisiológico',
      mensaje: 'Cambia entre reposo y ejercicio. Observa cómo el corazón ajusta su frecuencia cardíaca (BPM).',
    },
    {
      id: 3, tipo: 'accion', pista: 'Presión Arterial',
      mensaje: 'Observa la variación de presión en las cámaras. El cierre de las válvulas crea los sonidos cardíacos.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Ritmo',
      mensaje: 'Alcanza el ritmo objetivo para el escenario actual y valida el análisis hemodinámico.',
      accion: 'Validar Cardio',
    }
  ];

export default tutorSteps;
