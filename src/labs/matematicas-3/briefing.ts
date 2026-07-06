import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'MAT-03',
    titulo: 'Análisis Exponencial: Magnitud de Momento (Mw)',
    subtitulo: 'Logaritmos y Energía Sísmica',
    acento: '#f43f5e',
    duracion: 40,
    videoUrl: 'https://youtu.be/B_0q1tpaZbk',
    bienvenida: `¡Bienvenido al Centro de Monitoreo Sismológico! Soy el Dr. Quantum. Hoy descubriremos por qué los terremotos no se miden en una escala lineal común.\n\nLa escala de Magnitud de Momento (Mw) es logarítmica. Esto significa que un sismo de magnitud 7.0 no es "un poco" más fuerte que uno de 6.0 — su onda es 10 veces más alta y libera 32 veces más energía.\n\nTu misión: Analizar hitos históricos como Valdivia 1960 o Tohoku 2011 y visualizar el poder destructivo del crecimiento logarítmico.`,
    conceptos: [
      { icono: 'log', nombre: 'Base Logarítmica', descripcion: 'La escala Mw usa base 10 para la altura de la onda. Cada grado aumenta la altura x10.' },
      { icono: '🌋', nombre: 'Factor de Energía (x32)', descripcion: 'Cada incremento de 1.0 en la magnitud libera aproximadamente 32 veces más energía.' },
      { icono: '〰️', nombre: 'Amplitud de Onda', descripcion: 'La altura máxima registrada por el sismógrafo, visible en la estación 3D.' },
      { icono: '📈', nombre: 'Crecimiento Exponencial', descripcion: 'Pequeños cambios en Mw resultan en cambios masivos en el volumen de energía.' },
    ],
    mision: [
      'Selecciona uno de los CASOS HISTÓRICOS (Valdivia, CDMX o Tohoku).',
      'Observa la Estación de REFERENCIA configurada en Mw 5.0.',
      'Ajusta la Estación EXPERIMENTAL hasta alcanzar la magnitud del evento histórico.',
      'Analiza las notas de impacto físico que aparecen en el HUD al subir la intensidad.',
      'Calcula cuántas veces más energía se liberó en ese evento frente a la referencia.',
      'Documenta el colapso estructural simulado a magnitudes superiores a 9.0.',
    ],
    aplicaciones: [
      { area: 'Sismología Avanzada', ejemplo: 'Cuantificación del daño potencial basado en el momento sísmico liberado.' },
      { area: 'Ingeniería Civil', ejemplo: 'Diseño antisísmico capaz de resistir aceleraciones logarítmicas.' },
      { area: 'Gestión de Riesgos', ejemplo: 'Modelado de impacto para planes de evacuación en zonas de falla.' },
    ],
    retos: [
      'Comparativa Valdivia: Visualiza la energía del sismo más fuerte de la historia (9.5).',
      'Cálculo de Réplicas: Estima la energía de un sismo de 6.0 frente a uno de 8.0.',
      'Límite Estructural: Identifica a qué magnitud ocurre el colapso total del sistema.',
    ]
  };

export default briefing;
