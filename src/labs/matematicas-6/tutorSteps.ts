import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Transformaciones',
      mensaje: 'Tu misión es acoplar la sonda con la silueta objetivo usando escala, rotación y traslación. El panel no te da los números: tienes que leerlos de la figura.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Escala y Rota',
      mensaje: 'Ajusta el tamaño de la sonda para que coincida con la silueta. Luego rótala para alinear los puertos de acoplamiento.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Traslación X/Y',
      mensaje: 'Mueve la sonda en los ejes cartesianos. La matriz M = T·R·S del panel es la operación que estás aplicando.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Acoplamiento',
      mensaje: 'Cuando la superposición sea total, presiona Validar Acoplamiento.',
      accion: 'Validar',
    },
  ];

export default tutorSteps;
