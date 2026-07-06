import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'BIO-09',
    titulo: 'Sistema Digestivo',
    subtitulo: 'Catálisis Enzimática y pH',
    acento: '#ea580c',
    duracion: 35,
    videoUrl: 'https://youtu.be/GNChoscsc4A',
    bienvenida: `¡Bienvenido al Laboratorio de Bioquímica Digestiva! Soy el Dr. Quantum.\n\nSomos lo que digerimos. Veremos cómo las enzimas rompen las proteínas solo si el pH es el adecuado.\n\nTu misión: Digerir una muestra de carne optimizando el ambiente estomacal.`,
    conceptos: [
      { icono: '🔑', nombre: 'Enzima', descripcion: 'Llave biológica que acelera las reacciones.' },
      { icono: '🧪', nombre: 'pH Gástrico', descripcion: 'Nivel de acidez necesario para activar enzimas.' },
      { icono: '🥩', nombre: 'Sustrato', descripcion: 'Materia que la enzima debe romper (ej: Proteína).' },
      { icono: '🔥', nombre: 'Desnaturalización', descripcion: 'Cuando el calor o pH incorrecto destruyen la enzima.' }
    ],
    mision: [
      'Inyecta Pepsina en el simulador.',
      'Baja el pH a 2.0 (ambiente ácido).',
      'Observa la ruptura de las cadenas de aminoácidos.',
      'Intenta digerir a pH 7.0 y nota el fallo.',
      'Valida la absorción de nutrientes en el intestino.'
    ],
    aplicaciones: [
      { area: 'Industria', ejemplo: 'Uso de enzimas en detergentes y lavado de telas.' },
      { area: 'Medicina', ejemplo: 'Tratamiento de insuficiencias pancreáticas.' }
    ]
  };

export default briefing;
