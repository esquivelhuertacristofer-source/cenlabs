import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Potencial Redox',
      mensaje: '¡Hola, {alumno}! Bienvenido al estudio de celdas galvánicas. Vamos a convertir energía química en eléctrica usando la espontaneidad redox.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Selección de Electrodos',
      mensaje: 'Elige un metal del panel inferior y colócalo en un vaso; luego el otro. El vaso izquierdo va a la punta COM (−) del voltímetro y el derecho a la punta V (+). Recuerda: el metal con menor potencial de reducción se oxidará (ánodo).',
    },
    {
      id: 3, tipo: 'accion', pista: 'Cierre del Circuito',
      mensaje: 'Instala el PUENTE SALINO entre ambos vasos para permitir el flujo iónico. Sin él, la acumulación de carga detendría la reacción instantáneamente.',
    },
    {
      id: 4, tipo: 'accion', pista: 'Conexión Eléctrica',
      mensaje: 'Conecta los cables del voltímetro. Si la lectura es negativa, la punta COM quedó en el cátodo: intercambia los electrodos de vaso.',
    },
    {
      id: 5, tipo: 'verificar', pista: 'Validar Voltaje',
      mensaje: 'Con la lectura positiva, indica en el panel cuál metal es el ánodo y cuál el cátodo, y pulsa "Validar Celda".',
      accion: 'Validar Circuito',
    }
  ];

export default tutorSteps;
