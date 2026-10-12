import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'FIS-10',
    titulo: 'Motor Eléctrico',
    subtitulo: 'Inducción y Fuerza de Lorentz',
    acento: '#8b5cf6',
    duracion: 40,
    videoUrl: 'https://youtu.be/jj5WmYB4nxg',
    bienvenida: `¡Bienvenido al Taller de Electromovilidad! Soy el Dr. Quantum.\n\nConvertiremos electricidad en movimiento rotatorio. La magia sucede cuando el magnetismo empuja los electrones en movimiento.\n\nTu misión: Calibrar un motor para alcanzar las RPM objetivo.`,
    conceptos: [
      { icono: '🧲', nombre: 'Campo Magnético (B)', descripcion: 'Fuerza invisible de los imanes permanentes.' },
      { icono: '🌀', nombre: 'Torque', descripcion: 'Fuerza de giro aplicada a la bobina.' },
      { icono: '🔄', nombre: 'Conmutador', descripcion: 'Cerebro mecánico que invierte la corriente.' },
      { icono: '⚡', nombre: 'Fuerza de Lorentz', descripcion: 'Fuerza sobre una carga en un campo magnético.' }
    ],
    mision: [
      'Orienta los imanes con polos opuestos enfrentados.',
      'Elige el número de espiras de la bobina.',
      'Calcula el voltaje: V = k·ω + I·Rₐ.',
      'Energiza y mide las RPM y el sentido.',
      'Alcanza la velocidad pedida con la carga del freno.'
    ],
    aplicaciones: [
      { area: 'Automotriz', ejemplo: 'Motores de autos eléctricos y drones.' },
      { area: 'Doméstico', ejemplo: 'Licuadoras, ventiladores y herramientas.' },
      { area: 'Industria', ejemplo: 'Trenes de levitación y robótica avanzada.' }
    ]
  };

export default briefing;
