import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Preparación Molar',
      mensaje: '¡Hola, {alumno}! Prepárate para forjar una solución de NaCl 0.5M. La precisión en el pesaje y el aforo determinará tu éxito.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Pesaje de Precisión',
      mensaje: 'Coloca el vidrio de reloj en la balanza analítica y presiona TARA (botón Z). Luego añade la masa exacta de NaCl requerida para tu volumen objetivo.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Transferencia y Disolución',
      mensaje: 'Traslada el soluto pesado al matraz aforado. Añade una pequeña cantidad de agua para disolver antes de llegar al cuello del matraz.',
    },
    {
      id: 4, tipo: 'accion', pista: 'Control de Menisco',
      mensaje: 'Añade agua destilada gota a gota hasta que la curva inferior del menisco toque exactamente la línea de aforo. ¡Un exceso de una gota invalidará la muestra!',
    },
    {
      id: 5, tipo: 'verificar', pista: 'Validar Concentración',
      mensaje: 'Una vez aforado correctamente, presiona Validar. El sistema analizará la molaridad final mediante sensores de conductividad.',
      accion: 'Certificar Solución',
    }
  ];

export default tutorSteps;
