import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'MAT-07',
    titulo: 'Ley de Snell',
    subtitulo: 'Trigonometría y Óptica',
    acento: '#06b6d4',
    duracion: 35,
    videoUrl: 'https://youtu.be/8Sc6BTbc9cU',
    bienvenida: `¡Bienvenido al Laboratorio de Refracción! Soy el Dr. Quantum.\n\nLa luz se dobla al cambiar de medio. Usaremos el Seno para calcular por qué vemos las cosas deformadas bajo el agua.\n\nTu misión: Identificar un cristal desconocido midiendo su ángulo de refracción.`,
    conceptos: [
      { icono: '🔦', nombre: 'Incidencia', descripcion: 'Ángulo del rayo de luz al entrar.' },
      { icono: '📐', nombre: 'Refracción', descripcion: 'Ángulo del rayo al pasar al segundo medio.' },
      { icono: '💎', nombre: 'Índice n', descripcion: 'Resistencia del material al paso de la luz.' },
      { icono: '🔄', nombre: 'Reflexión Total', descripcion: 'Cuando la luz no logra salir del material.' }
    ],
    mision: [
      'Dispara el láser a través del cristal misterioso.',
      'Elige el ángulo de incidencia θ₁ con el deslizador.',
      'Mide el ángulo refractado θ₂ desde la normal con el transportador.',
      'Aplica la Ley de Snell: n₁ sen θ₁ = n₂ sen θ₂ y despeja n₂.',
      'Busca el índice n₂ en la tabla de materiales y valida.'
    ],
    aplicaciones: [
      { area: 'Óptica', ejemplo: 'Diseño de lentes para cámaras y anteojos.' },
      { area: 'Internet', ejemplo: 'Transmisión de datos por Fibra Óptica.' },
      { area: 'Gemología', ejemplo: 'Identificación de diamantes y piedras preciosas.' }
    ]
  };

export default briefing;
