import type { TutorStep } from '@/components/DrQuantumTutor';

const tutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: 'Le Châtelier',
      mensaje: '¡Bienvenido, {alumno}! Estudiaremos el equilibrio N₂O₄ ⇌ 2NO₂. El N₂O₄ es incoloro y el NO₂ es café. ¿Cómo afectará el calor?',
    },
    {
      id: 2, tipo: 'accion', pista: 'Estación Térmica',
      mensaje: 'Con los botones de cada jeringa, coloca una en el "Baño de Hielo", otra a "Temp. Ambiente" y otra en la "Plancha Caliente". El color cambia a medida que cambia su temperatura.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Endotérmico',
      mensaje: 'La reacción es endotérmica hacia el NO₂: al calentar se forma más NO₂ (café rojizo). Ojo: a 20 °C ya hay bastante NO₂ y la mezcla se ve ámbar, no incolora.',
    },
    {
      id: 4, tipo: 'accion', pista: 'Choque Térmico',
      mensaje: 'En el baño de hielo el equilibrio se desplaza hacia el N₂O₄ y la jeringa queda casi incolora (amarillo muy pálido), aunque nunca del todo.',
    },
    {
      id: 5, tipo: 'verificar', pista: 'Inercia Térmica',
      mensaje: 'Observa la telemetría. La temperatura no cambia instantáneamente. Esa "inercia" es clave en procesos químicos industriales.',
    },
    {
      id: 6, tipo: 'verificar', pista: 'Finalizar',
      mensaje: 'Cuando cada jeringa alcance la temperatura de su baño, anota en su selector el color que observas y pulsa "Verificar Equilibrio".',
      accion: 'Certificar Equilibrio',
    }
  ];

export default tutorSteps;
