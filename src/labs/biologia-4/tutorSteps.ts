import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Fotosíntesis',
      mensaje: 'Mediremos el O₂ que libera una ramita de Elodea en 10 minutos. Lee la meta y el límite de distancia.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Espectro de Luz',
      mensaje: 'Deja fija la distancia y mide con varios colores. Todas las lámparas emiten los mismos fotones: ¿cuál rinde más O₂?',
    },
    {
      id: 3, tipo: 'accion', pista: 'Intensidad Lumínica',
      mensaje: 'Ahora deja fijo el color y cambia la distancia. La intensidad cae con el cuadrado, pero cerca de la lámpara la tasa se satura.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Acumular O2',
      mensaje: 'Cuando un ensayo de tu tabla alcance la meta, valida la práctica.',
      accion: 'Validar O2',
    }
  ];

export default tutorSteps;
