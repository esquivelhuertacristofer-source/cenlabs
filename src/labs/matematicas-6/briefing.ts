import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'MAT-06',
    titulo: 'Transformaciones Geométricas',
    subtitulo: 'Isometrías y Homotecias',
    acento: '#f43f5e',
    duracion: 35,
    videoUrl: 'https://youtu.be/vYE9qp-1PVw',
    bienvenida: `¡Bienvenido al Centro de Acoplamiento Espacial! Soy el Dr. Quantum.\n\nLas matemáticas nos permiten mover, rotar y escalar objetos con precisión absoluta. Usarás matrices para navegar una sonda.\n\nTu misión: Alinear la sonda con la plataforma fantasma.',`,
    conceptos: [
      { icono: '↔️', nombre: 'Traslación', descripcion: 'Desplazamiento sin rotación ni cambio de tamaño.' },
      { icono: '🔄', nombre: 'Rotación', descripcion: 'Giro alrededor de un punto de origen.' },
      { icono: '🔍', nombre: 'Escala', descripcion: 'Cambio de tamaño manteniendo la proporción.' },
      { icono: '📐', nombre: 'Vectores', descripcion: 'Dirección y magnitud del movimiento.' }
    ],
    mision: [
      'Identifica la posición de la plataforma objetivo.',
      'Aplica el factor de escala correcto.',
      'Rota la sonda para que coincida en ángulo.',
      'Traslada la sonda en los ejes X e Y.',
      'Confirma el acoplamiento perfecto.'
    ],
    aplicaciones: [
      { area: 'CGI', ejemplo: 'Animación de personajes en películas y juegos.' },
      { area: 'Robótica', ejemplo: 'Movimiento de brazos mecánicos industriales.' },
      { area: 'Diseño', ejemplo: 'Software CAD y diseño vectorial (Illustrator).' }
    ]
  };

export default briefing;
