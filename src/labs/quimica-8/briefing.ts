import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'QMI-08',
    titulo: 'Equilibrio Químico',
    subtitulo: 'Principio de Le Châtelier',
    acento: '#f59e0b',
    duracion: 30,
    videoUrl: 'https://youtu.be/kzWxKfxu4DE',
    bienvenida: `¡Bienvenido al Observatorio de Dinámica Química! Soy el Dr. Quantum.\n\nLas reacciones no siempre terminan; a veces quedan atrapadas en un ciclo eterno. Veremos cómo el sistema se defiende de los cambios externos.\n\nTu misión: Predecir el desplazamiento del equilibrio del NO2 ante cambios de temperatura.`,
    conceptos: [
      { icono: '↔️', nombre: 'Equilibrio Dinámico', descripcion: 'Velocidad directa = Velocidad inversa.' },
      { icono: '🔄', nombre: 'Le Châtelier', descripcion: 'El sistema compensa cualquier perturbación externa.' },
      { icono: '🔥', nombre: 'Termocromismo', descripcion: 'Cambio de color inducido por la temperatura.' },
      { icono: '🌡️', nombre: 'Entalpía', descripcion: 'Calor absorbido o liberado por la reacción.' }
    ],
    mision: [
      'Prepara las jeringas con la mezcla gaseosa.',
      'Sumerge una en baño de hielo.',
      'Sumerge la otra en agua hirviendo.',
      'Compara la intensidad del color café.',
      'Deduce si la reacción es endo o exotérmica.'
    ],
    aplicaciones: [
      { area: 'Industria', ejemplo: 'Maximización de síntesis química variando T y P.' },
      { area: 'Biología', ejemplo: 'Equilibrio de oxígeno en la hemoglobina.' },
      { area: 'Atmosférica', ejemplo: 'Dinámica del smog y óxidos de nitrógeno.' }
    ]
  };

export default briefing;
