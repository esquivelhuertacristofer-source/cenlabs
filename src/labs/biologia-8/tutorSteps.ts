import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Ciclo Cardíaco',
      mensaje: 'Tienes un paciente monitorizado. El monitor no muestra la FC: hay que medirla en el trazo.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Medir el R-R',
      mensaje: 'Cuenta los cuadros grandes (200 ms) entre dos picos R: FC = 300 / n. Con eso diagnostica el ritmo de llegada.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Tratamiento',
      mensaje: 'Elige un fármaco según su mecanismo (vagal, β1 o antagonista β1). Tras cada bolo, vuelve a medir.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Ritmo',
      mensaje: 'Cuando el ritmo esté entre 60 y 100 lpm, registra la FC medida y valida.',
      accion: 'Validar Cardio',
    }
  ];

export default tutorSteps;
