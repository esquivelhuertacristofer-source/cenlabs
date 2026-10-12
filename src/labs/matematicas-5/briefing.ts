import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'MAT-05',
    titulo: 'Círculo Trigonométrico',
    subtitulo: 'Funciones Circulares y Ondas',
    acento: '#6366f1',
    duracion: 40,
    videoUrl: 'https://youtu.be/AWhxHGpZfb0',
    bienvenida: `¡Bienvenido al Osciloscopio Geométrico! Soy el Dr. Quantum.\n\nTodo lo que gira se convierte en una onda. Entenderemos el Seno y el Coseno como las sombras de un punto que da vueltas.\n\nTu misión: encontrar los DOS ángulos de una vuelta que cumplen una ecuación como sen θ = 1/2.`,
    conceptos: [
      { icono: '⭕', nombre: 'Círculo Unitario', descripcion: 'Círculo de radio 1 centrado en el origen.' },
      { icono: '↕️', nombre: 'Seno (y)', descripcion: 'Altura del punto en el círculo.' },
      { icono: '↔️', nombre: 'Coseno (x)', descripcion: 'Desplazamiento horizontal del punto.' },
      { icono: '🌊', nombre: 'Onda Sinusoidal', descripcion: 'Proyección del giro a lo largo del tiempo.' }
    ],
    mision: [
      'Lee la ECUACIÓN OBJETIVO del panel.',
      'Activa el giro y observa cómo se dibujan las ondas seno y coseno.',
      'Detén el vector donde la proyección cumpla la ecuación y captura el ángulo.',
      'Busca la segunda solución en otro cuadrante y captúrala.',
      'Valida cuando tengas las dos soluciones y ninguna captura equivocada.'
    ],
    aplicaciones: [
      { area: 'Música', ejemplo: 'Síntesis de sonido y ondas de audio.' },
      { area: 'Electricidad', ejemplo: 'Corriente Alterna (AC) en nuestras casas.' },
      { area: 'Clima', ejemplo: 'Modelado de mareas y ciclos estacionales.' }
    ]
  };

export default briefing;
