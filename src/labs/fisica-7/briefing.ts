import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'FIS-07',
    titulo: 'Dilatación Térmica',
    subtitulo: 'Expansión de Sólidos',
    acento: '#ef4444',
    duracion: 35,
    videoUrl: 'https://youtu.be/_tznlKPd4f8',
    bienvenida: `¡Bienvenido al Dilatómetro de Precisión! Soy el Dr. Quantum.\n\nEl calor hace que los átomos se alejen. Veremos cómo una barra de medio metro crece décimas de milímetro al calentarse.\n\nTu misión: Medir el coeficiente de dilatación de un metal desconocido.`,
    conceptos: [
      { icono: '📏', nombre: 'Longitud Inicial', descripcion: 'Medida del material a temperatura ambiente.' },
      { icono: '🔥', nombre: 'Gradiente Térmico', descripcion: 'Cambio de temperatura aplicado (ΔT).' },
      { icono: '🔬', nombre: 'Coeficiente α', descripcion: 'Capacidad de expansión propia de cada metal.' },
      { icono: '⚡', nombre: 'Vibración Atómica', descripcion: 'Origen microscópico de la expansión.' }
    ],
    mision: [
      'Monta la barra (L₀ = 500 mm) con el comparador en cero.',
      'Inyecta vapor de agua a 100°C.',
      'Lee la temperatura en el termómetro.',
      'Registra el alargamiento ΔL en el comparador.',
      'Calcula el coeficiente α del material.'
    ],
    aplicaciones: [
      { area: 'Civil', ejemplo: 'Juntas de expansión en puentes y vías de tren.' },
      { area: 'Odontología', ejemplo: 'Materiales para calzas que dilatan como el diente.' },
      { area: 'Domótica', ejemplo: 'Termostatos bimetálicos mecánicos.' }
    ]
  };

export default briefing;
