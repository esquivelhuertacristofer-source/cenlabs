import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: '¡Bienvenida!',
      mensaje: '¡Hola, {alumno}! Bienvenido al Plano de Pruebas. Tu misión es calcular la aceleración exacta de un bloque sobre una rampa inclinada para certificar su descenso.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Configura la Rampa',
      mensaje: 'Usa el control "Inclinador Hidráulico" para ajustar el ángulo θ. Observa cómo cambian los vectores de fuerza (Peso, Normal y Fricción) en la escena 3D.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Fuerza de Deslizamiento',
      mensaje: 'Calcula la fuerza tangencial Wx = m · g · sin(θ). Si Wx supera la fricción estática máxima (fs_max = μs · N), el bloque comenzará a deslizarse.',
    },
    {
      id: 4, tipo: 'accion', pista: 'Inicia el Descenso',
      mensaje: 'Lleva la rampa más allá del ángulo crítico para activar el descenso. El bloque acelerará según la 2da Ley de Newton: a = (Wx - fk) / m.',
    },
    {
      id: 5, tipo: 'verificar', pista: 'Valida la Aceleración',
      mensaje: 'Una vez que el bloque haya descendido, introduce el valor de la aceleración calculada en el dock inferior y presiona "Validar". ¡Precisión absoluta!',
      accion: 'Verificar Cálculos',
    }
  ];

export default tutorSteps;
