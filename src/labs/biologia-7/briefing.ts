import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'BIO-07',
    titulo: 'Sistema Nervioso',
    subtitulo: 'Neurofisiología y Arco Reflejo',
    acento: '#f59e0b',
    duracion: 35,
    videoUrl: 'https://youtu.be/EJKf6BCdPGY',
    bienvenida: `¡Bienvenido al Centro de Control Neuronal! Soy el Dr. Quantum.\n\nLos impulsos viajan a la velocidad del rayo, pero requieren de cables aislados llamados mielina. Analizaremos tu velocidad de respuesta.\n\nTu misión: medir el reflejo rotuliano de un paciente y diagnosticar si su mielina conduce con normalidad.`,
    conceptos: [
      { icono: '⚡', nombre: 'Potencial de Acción', descripcion: 'Impulso eléctrico que viaja por el axón.' },
      { icono: '🛡️', nombre: 'Mielina', descripcion: 'Aislante que acelera la señal nerviosa.' },
      { icono: '🦵', nombre: 'Arco Reflejo', descripcion: 'Respuesta automática que no pasa por el cerebro.' },
      { icono: '🧠', nombre: 'Sinapsis', descripcion: 'Conexión química entre dos neuronas.' }
    ],
    mision: [
      'Golpea el tendón con distintas fuerzas y encuentra el umbral.',
      'Lee la latencia del reflejo en el EMG.',
      'Resta los retardos sinápticos y calcula la velocidad de conducción.',
      'Compara con el límite normal de 45 m/s.',
      'Emite y valida tu diagnóstico.'
    ],
    aplicaciones: [
      { area: 'Neurología', ejemplo: 'Diagnóstico de Esclerosis Múltiple.' },
      { area: 'Deportes', ejemplo: 'Entrenamiento de tiempos de reacción en atletas.' },
      { area: 'Ergonomía', ejemplo: 'Diseño de interfaces seguras para conductores.' }
    ]
  };

export default briefing;
