import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Ley de Coulomb',
      mensaje: 'Exploraremos la fuerza entre cargas eléctricas. ¿Atracción o repulsión?',
    },
    {
      id: 2, tipo: 'accion', pista: 'Magnitud de Carga',
      mensaje: 'En la zona de exploración cambia q₁ y q₂. Observa cómo cambia la dirección de las fuerzas: cargas de igual signo se repelen y de signo opuesto se atraen.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Variación de Distancia',
      mensaje: 'Cambia la separación r (en centímetros). La fuerza disminuye con el cuadrado de la distancia: al duplicar r, F se reduce a la cuarta parte.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Fuerza',
      mensaje: 'Resuelve el reto: convierte μC a C y cm a m, calcula |F| = k·|q₁q₂|/r² en newtons, elige atracción o repulsión y pulsa "Comprobar" (tolerancia ±3 %).',
      accion: 'Validar Fuerza',
    }
  ];

export default tutorSteps;
