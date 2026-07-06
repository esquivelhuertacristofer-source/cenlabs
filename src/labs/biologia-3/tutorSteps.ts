import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Síntesis de Proteínas',
      mensaje: 'Vamos a decodificar el ADN. Primero, realiza la transcripción para crear el ARN mensajero.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Transcripción',
      mensaje: 'Selecciona las bases nitrogenadas complementarias (A-U, C-G). El ARN saldrá del núcleo hacia el ribosoma.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Traducción',
      mensaje: 'En el ribosoma, une los codones con sus respectivos aminoácidos para formar la cadena polipeptídica.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Proteína Completa',
      mensaje: 'Cuando llegues al codón de STOP, la proteína se plegará. Valida la secuencia obtenida.',
      accion: 'Validar Proteína',
    }
  ];

export default tutorSteps;
