import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'QMI-10',
    titulo: 'Destilación Fraccionada',
    subtitulo: 'Separación por Volatilidad',
    acento: '#8b5cf6',
    duracion: 45,
    videoUrl: 'https://youtu.be/G91Gkcm4rzM',
    bienvenida: `¡Bienvenido a la Torre de Fraccionamiento! Soy el Dr. Quantum.\n\nSepararemos mezclas complejas usando el calor como filtro. La precisión en la temperatura determinará la pureza de tu producto final.\n\nTu misión: Recuperar Etanol puro de una mezcla hidroalcohólica.`,
    conceptos: [
      { icono: '🌡️', nombre: 'Punto de Ebullición', descripcion: 'Temperatura de cambio de fase líquido-gas.' },
      { icono: '💧', nombre: 'Condensación', descripcion: 'Recuperación del vapor mediante enfriamiento.' },
      { icono: '📈', nombre: 'Fraccionamiento', descripcion: 'Múltiples evaporaciones para alta pureza.' },
      { icono: '🔥', nombre: 'Calor Latente', descripcion: 'Energía necesaria para el cambio de estado.' }
    ],
    mision: [
      'Monta el equipo de destilación con cuidado.',
      'Calienta la mezcla hasta los 78.4°C.',
      'Controla que la T no suba de 90°C.',
      'Recupera el destilado en el matraz colector.',
      'Mide la densidad para validar la pureza.'
    ],
    aplicaciones: [
      { area: 'Petróleo', ejemplo: 'Separación de crudo en gasolina, diesel y gas.' },
      { area: 'Bebidas', ejemplo: 'Producción de alcoholes destilados.' },
      { area: 'Perfumería', ejemplo: 'Extracción de aceites esenciales puros.' }
    ]
  };

export default briefing;
