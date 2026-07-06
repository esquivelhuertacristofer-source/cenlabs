import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'MAT-05',
    titulo: 'Círculo Trigonométrico',
    subtitulo: 'Funciones Circulares y Ondas',
    acento: '#6366f1',
    duracion: 40,
    videoUrl: 'https://youtu.be/AWhxHGpZfb0',
    bienvenida: `¡Bienvenido al Osciloscopio Geométrico! Soy el Dr. Quantum.\n\nTodo lo que gira se convierte en una onda. Entenderemos el Seno y el Coseno como las sombras de un punto que da vueltas.\n\nTu misión: Sincronizar la rotación para capturar ángulos específicos.`,
    conceptos: [
      { icono: '⭕', nombre: 'Círculo Unitario', descripcion: 'Círculo de radio 1 centrado en el origen.' },
      { icono: '↕️', nombre: 'Seno (y)', descripcion: 'Altura del punto en el círculo.' },
      { icono: '↔️', nombre: 'Coseno (x)', descripcion: 'Desplazamiento horizontal del punto.' },
      { icono: '🌊', nombre: 'Onda Sinusoidal', descripcion: 'Proyección del giro a lo largo del tiempo.' }
    ],
    mision: [
      'Activa el giro automático del vector.',
      'Observa cómo se dibuja la onda en la pantalla.',
      'Identifica los puntos de amplitud máxima (90°).',
      'Detén el vector en el ángulo solicitado.',
      'Valida el valor de Seno y Coseno.'
    ],
    aplicaciones: [
      { area: 'Música', ejemplo: 'Síntesis de sonido y ondas de audio.' },
      { area: 'Electricidad', ejemplo: 'Corriente Alterna (AC) en nuestras casas.' },
      { area: 'Clima', ejemplo: 'Modelado de mareas y ciclos estacionales.' }
    ]
  };

export default briefing;
