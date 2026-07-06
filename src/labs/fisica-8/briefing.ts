import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'FIS-08',
    titulo: 'Ley de Ohm',
    subtitulo: 'Circuitos Eléctricos CC',
    acento: '#eab308',
    duracion: 35,
    videoUrl: 'https://youtu.be/q_BMFXFf0TU',
    bienvenida: `¡Bienvenido a la Central Eléctrica Virtual! Soy el Dr. Quantum.\n\nDominaremos el flujo de electrones. Voltaje, Corriente y Resistencia forman la trinidad de la electrónica moderna.\n\nTu misión: Verificar la relación V = I·R en una resistencia fija.`,
    conceptos: [
      { icono: '⚡', nombre: 'Voltaje (V)', descripcion: 'Presión eléctrica o diferencia de potencial.' },
      { icono: '🌊', nombre: 'Corriente (I)', descripcion: 'Flujo de electrones por unidad de tiempo.' },
      { icono: '🚧', nombre: 'Resistencia (R)', descripcion: 'Oposición al paso de la corriente.' },
      { icono: '📈', nombre: 'Gráfica Óhmica', descripcion: 'Relación lineal entre V e I.' }
    ],
    mision: [
      'Arma el circuito en serie.',
      'Varía el voltaje de la fuente paso a paso.',
      'Lee la corriente en el amperímetro.',
      'Registra los pares de datos (V, I).',
      'Calcula la resistencia promedio.'
    ],
    aplicaciones: [
      { area: 'Hogar', ejemplo: 'Funcionamiento de electrodomésticos y focos.' },
      { area: 'Hardware', ejemplo: 'Diseño de circuitos integrados y smartphones.' },
      { area: 'Seguridad', ejemplo: 'Fusibles y protección contra cortocircuitos.' }
    ]
  };

export default briefing;
