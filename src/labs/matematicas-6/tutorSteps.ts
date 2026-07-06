import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Transformaciones',
      mensaje: 'Tu misión es acoplar la sonda espacial usando traslaciones, rotaciones y escalas. ¡Precisión de navegación!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Escala y Rota',
      mensaje: 'Ajusta el tamaño de la sonda para que coincida con el fantasma objetivo. Luego rótala para alinear los puertos de acoplamiento.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Traslación X/Y',
      mensaje: 'Mueve la sonda en los ejes cartesianos. Recuerda que cada transformación es una operación matricial en el fondo.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Acoplamiento',
      mensaje: 'Cuando la superposición sea total, presiona Validar Acoplamiento.',
      accion: 'Ejecutar Docking',
    }
  ];

export default tutorSteps;
