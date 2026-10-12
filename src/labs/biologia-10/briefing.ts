import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'BIO-10',
    titulo: 'Dinámica de Poblaciones',
    subtitulo: 'Ecología y Modelo Lotka-Volterra',
    acento: '#15803d',
    duracion: 40,
    videoUrl: 'https://youtu.be/vxCiT_f0h-E',
    bienvenida: `¡Bienvenido al Observatorio de Ecosistemas! Soy el Dr. Quantum.\n\nLa vida es un equilibrio frágil entre presas y depredadores. Veremos cómo sus poblaciones oscilan en ciclos.\n\nTu misión: ajustar los parámetros para que ninguna especie se extinga en 50 años virtuales.`,
    conceptos: [
      { icono: '⚖️', nombre: 'Punto de equilibrio', descripcion: 'x* = γ/δ presas y y* = α/β depredadores.' },
      { icono: '🐺', nombre: 'Depredación', descripcion: 'Control natural de la población de presas.' },
      { icono: '🔄', nombre: 'Ciclos de Población', descripcion: 'Oscilaciones naturales de crecimiento y caída.' },
      { icono: '📉', nombre: 'Extinción', descripcion: 'Peligro cuando la población llega a cero.' }
    ],
    mision: [
      'Corre la simulación con los parámetros iniciales.',
      'Observa qué especie colapsa y en qué año.',
      'Calcula el punto de equilibrio γ/δ y α/β.',
      'Ajusta los parámetros y vuelve a correr desde el inicio.',
      'Sostén ambas especies 50 años y valida.'
    ],
    aplicaciones: [
      { area: 'Conservación', ejemplo: 'Reintroducción de lobos en parques nacionales.' },
      { area: 'Economía', ejemplo: 'Modelado de mercados y competencia de empresas.' },
      { area: 'Salud', ejemplo: 'Propagación de virus en una población (modelos SIR).' }
    ]
  };

export default briefing;
