import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'QMI-09',
    titulo: 'Celdas Galvánicas',
    subtitulo: 'Electroquímica y Potenciales Redox',
    acento: '#3b82f6',
    duracion: 40,
    videoUrl: 'https://youtu.be/S36fqFGHIfo',
    bienvenida: `¡Bienvenido al Laboratorio de Energía Química! Soy el Dr. Quantum.\n\nConvertiremos el flujo de electrones en electricidad utilizable. Entenderás cómo funcionan las baterías que mueven el mundo moderno.\n\nTu misión: Ensamblar una pila funcional y medir su voltaje real.`,
    conceptos: [
      { icono: '🔋', nombre: 'Ánodo', descripcion: 'Electrodo donde ocurre la oxidación (pérdida de e-).' },
      { icono: '⚡', nombre: 'Cátodo', descripcion: 'Electrodo donde ocurre la reducción (ganancia de e-).' },
      { icono: '🔗', nombre: 'Puente Salino', descripcion: 'Conector que mantiene la neutralidad iónica.' },
      { icono: '📐', nombre: 'Ecuación de Nernst', descripcion: 'Predicción del voltaje según la concentración.' }
    ],
    mision: [
      'Limpia los electrodos de Zinc y Cobre.',
      'Prepara las soluciones de sulfato.',
      'Instala el puente salino correctamente.',
      'Conecta el voltímetro y verifica la polaridad.',
      'Calcula el potencial teórico vs el medido.'
    ],
    aplicaciones: [
      { area: 'Energía', ejemplo: 'Baterías de Litio y acumuladores de plomo.' },
      { area: 'Corrosión', ejemplo: 'Protección catódica de barcos y tuberías.' },
      { area: 'Metalurgia', ejemplo: 'Galvanoplastia y recubrimientos metálicos.' }
    ]
  };

export default briefing;
