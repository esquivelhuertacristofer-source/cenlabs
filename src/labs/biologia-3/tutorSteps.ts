import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Síntesis de Proteínas',
      mensaje: 'Vamos a decodificar el ADN. Primero, realiza la transcripción para crear el ARN mensajero.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Transcripción',
      mensaje: 'Aparea cada base de la hebra molde (A→U, T→A, C→G, G→C). Puedes usar el teclado. El ARNm saldrá por un poro nuclear.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Traducción',
      mensaje: 'En el ribosoma elige el ARNt cuyo anticodón sea complementario al codón (teclas 1-4). En un codón de paro, el factor de liberación.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Proteína Completa',
      mensaje: 'Cuando el factor de liberación suelte la cadena en el codón de paro, valida la secuencia obtenida.',
      accion: 'Validar Proteína',
    }
  ];

export default tutorSteps;
