import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: '¡Bienvenida Táctica!',
      mensaje: '¡Hola, {alumno}! Bienvenido al polígono de artillería avanzada. Tu misión es destruir al dron invasor en el punto rojo, disparando desde un cañón elevado Y₀ superando el muro de contención.',
    },
    {
      id: 2, tipo: 'calculo', pista: 'Parábola General',
      mensaje: 'El terreno NO es simétrico: el cañón está a una altura y₀. En el vacío la trayectoria es y(x) = y₀ + x·tan(θ) − g·x² / (2v₀²·cos²(θ)). Úsala para una primera estimación: el aire y el viento la desvían un poco.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Librar el Muro',
      mensaje: 'Primero asegúrate empírica o matemáticamente de que tu altura Y cuando X sea igual a la posición del Muro sea MAYOR a la altura del Muro. De lo contrario, colapsarás.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Impacto Confirmado',
      mensaje: 'Dispara con tu estimación. La traza del disparo queda dibujada: compárala con tu cálculo y corrige ángulo o velocidad. Tienes 3 disparos por misión; un impacto confirmado basta para validar.',
      accion: 'Ejecutar Fuego',
    }
  ];

export default tutorSteps;
