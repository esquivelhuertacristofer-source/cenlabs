import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Preparación Molar',
      mensaje: '¡Hola, {alumno}! Vas a preparar una solución con la molaridad y el volumen que marca tu misión. Empieza calculando la masa: m = M · V(L) · PM / pureza.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Pesaje de Precisión',
      mensaje: 'Con el vidrio de reloj en la balanza analítica presiona TARA: la lectura vuelve a cero. Añade el reactivo (grueso y luego fino) hasta la masa que calculaste; si te pasas, retira con la espátula.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Transferencia y Disolución',
      mensaje: 'Traslada el soluto pesado al matraz aforado. Añade una pequeña cantidad de agua para disolver antes de llegar al cuello del matraz.',
    },
    {
      id: 4, tipo: 'accion', pista: 'Control de Menisco',
      mensaje: 'Llena rápido hasta el cuello y termina gota a gota hasta que la curva inferior del menisco toque la línea de aforo. Si la rebasas, la solución queda diluida y hay que empezar de nuevo.',
    },
    {
      id: 5, tipo: 'verificar', pista: 'Validar Concentración',
      mensaje: 'Con el matraz aforado, certifica la solución: la molaridad final debe quedar a ±5 % de la pedida.',
      accion: 'Certificar Solución',
    }
  ];

export default tutorSteps;
