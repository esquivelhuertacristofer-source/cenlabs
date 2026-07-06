import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Ecosistema Dinámico',
      mensaje: 'Simularemos la relación Presa-Depredador usando el modelo de Lotka-Volterra.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Poblaciones Iniciales',
      mensaje: 'Define cuántas liebres y lobos inician. Activa la simulación para ver los ciclos de población.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Tasa de Encuentro',
      mensaje: 'Ajusta la voracidad de los depredadores. Un desequilibrio puede llevar a la extinción de ambas especies.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Equilibrio Estable',
      mensaje: 'Logra un ciclo poblacional estable y valida el análisis ecológico.',
      accion: 'Validar Ecosistema',
    }
  ];

export default tutorSteps;
