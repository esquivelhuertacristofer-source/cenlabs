import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Potencial Redox',
      mensaje: '¡Hola, {alumno}! Bienvenido al estudio de celdas galvánicas. Vamos a convertir energía química en eléctrica usando la espontaneidad redox.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Selección de Electrodos',
      mensaje: 'Selecciona los metales para el ánodo y el cátodo en el dock inferior. Recuerda: el metal con menor potencial de reducción se oxidará (Ánodo).',
    },
    {
      id: 3, tipo: 'accion', pista: 'Cierre del Circuito',
      mensaje: 'Instala el PUENTE SALINO entre ambos vasos para permitir el flujo iónico. Sin él, la acumulación de carga detendría la reacción instantáneamente.',
    },
    {
      id: 4, tipo: 'accion', pista: 'Conexión Eléctrica',
      mensaje: 'Conecta los cables del voltímetro. Si el voltaje es negativo, intercambia la polaridad para detectar el flujo espontáneo de electrones.',
    },
    {
      id: 5, tipo: 'verificar', pista: 'Validar Voltaje',
      mensaje: 'Observa la telemetría gigante. Cuando detectes un potencial estable y positivo, habrás completado el circuito galvánico con éxito.',
      accion: 'Validar Circuito',
    }
  ];

export default tutorSteps;
