import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: '¡Bienvenida!',
      mensaje: '¡Hola, {alumno}! Bienvenido al Plano de Pruebas. Tu misión es PREDECIR la aceleración de un bloque sobre una rampa con fricción, y luego comprobarla soltándolo.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Configura el Ensayo',
      mensaje: 'Ajusta el ángulo θ, la fuerza F paralela a la rampa (positiva hacia arriba; puede ser cero o negativa) y la carga extra. Los coeficientes μs y μk están en el panel de datos.',
    },
    {
      id: 3, tipo: 'calculo', pista: '¿Se mueve?',
      mensaje: 'Calcula N = m·g·cos(θ) y la fuerza que tiende a moverlo, F − m·g·sin(θ). Si su valor absoluto no supera μs·N, el bloque se queda quieto: elige otra configuración.',
    },
    {
      id: 4, tipo: 'calculo', pista: 'Segunda Ley',
      mensaje: 'Si se mueve, la fricción cinética μk·N se opone al movimiento: a = (F − m·g·sin(θ) ∓ μk·N) / m. Toma positiva la aceleración hacia arriba de la rampa.',
    },
    {
      id: 5, tipo: 'verificar', pista: 'Predice y Suelta',
      mensaje: 'Escribe tu predicción y pulsa "Soltar bloque". El sensor mide la distancia y el tiempo: si tu predicción coincide (±0.1 m/s²), valida tu práctica.',
      accion: 'Verificar Cálculos',
    }
  ];

export default tutorSteps;
