import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'FIS-07',
    titulo: 'Dilatación Térmica',
    subtitulo: 'Expansión de Sólidos',
    acento: '#ef4444',
    duracion: 35,
    videoUrl: 'https://youtu.be/_tznlKPd4f8',
    bienvenida: `¡Bienvenido al Horno de Precisión Micrométrica! Soy el Dr. Quantum.\n\nEl calor hace que los átomos se alejen. Veremos cómo estructuras masivas crecen milímetros imperceptibles pero peligrosos.\n\nTu misión: Medir el coeficiente de dilatación del Aluminio.`,
    conceptos: [
      { icono: '📏', nombre: 'Longitud Inicial', descripcion: 'Medida del material a temperatura ambiente.' },
      { icono: '🔥', nombre: 'Gradiente Térmico', descripcion: 'Cambio de temperatura aplicado (ΔT).' },
      { icono: '🔬', nombre: 'Coeficiente α', descripcion: 'Capacidad de expansión propia de cada metal.' },
      { icono: '⚡', nombre: 'Vibración Atómica', descripcion: 'Origen microscópico de la expansión.' }
    ],
    mision: [
      'Mide la barra de metal con el micrómetro.',
      'Inyecta vapor de agua a 100°C.',
      'Observa el desplazamiento de la aguja.',
      'Registra la elongación milimétrica.',
      'Calcula el coeficiente α del material.'
    ],
    aplicaciones: [
      { area: 'Civil', ejemplo: 'Juntas de expansión en puentes y vías de tren.' },
      { area: 'Odontología', ejemplo: 'Materiales para calzas que dilatan como el diente.' },
      { area: 'Domótica', ejemplo: 'Termostatos bimetálicos mecánicos.' }
    ]
  };

export default briefing;
