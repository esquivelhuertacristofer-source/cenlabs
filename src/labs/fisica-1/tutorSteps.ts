import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: '¡Bienvenida Táctica!',
      mensaje: '¡Hola, {alumno}! Bienvenido al polígono de artillería avanzada. Tu misión es destruir al dron invasor en el punto rojo, disparando desde un cañón elevado Y₀ superando el muro de contención.',
    },
    {
      id: 2, tipo: 'calculo', pista: 'Parábola General',
      mensaje: 'La cinemática escolar se acabó. El terreno NO es simétrico. Usa la ecuación y(x) = y₀ + x·tan(θ) - (g·x²) / (2v₀²·cos²(θ)). Esta ecuación define estrictamente tu trayectoria en 2D.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Librar el Muro',
      mensaje: 'Primero asegúrate empírica o matemáticamente de que tu altura Y cuando X sea igual a la posición del Muro sea MAYOR a la altura del Muro. De lo contrario, colapsarás.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Impacto Confirmado',
      mensaje: 'Cuando visualices que la parábola predictora (línea verde) atraviesa el centro del objetivo, ejecuta el disparo. ¡Buena suerte, cadete!',
      accion: 'Ejecutar Fuego',
    }
  ];

export default tutorSteps;
