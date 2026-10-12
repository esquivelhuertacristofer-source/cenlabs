import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Ecosistema Dinámico',
      mensaje: 'Simularemos la relación Presa-Depredador usando el modelo de Lotka-Volterra.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Primera corrida',
      mensaje: 'Corre 50 años con los parámetros iniciales. ¿Qué especie colapsa y cuándo?',
    },
    {
      id: 3, tipo: 'accion', pista: 'Punto de equilibrio',
      mensaje: 'Compara el equilibrio (γ/δ, α/β) con la población inicial. Si están lejos, las oscilaciones serán enormes.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Equilibrio Estable',
      mensaje: 'Cuando una corrida completa llegue a 50 años sin extinciones, valida.',
      accion: 'Validar Ecosistema',
    }
  ];

export default tutorSteps;
