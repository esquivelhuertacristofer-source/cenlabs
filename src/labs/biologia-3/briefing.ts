import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'BIO-03',
    titulo: 'Síntesis de Proteínas',
    subtitulo: 'Dogma Central de la Biología',
    acento: '#8b5cf6',
    duracion: 35,
    videoUrl: 'https://youtu.be/QlBaQUJ0ddE',
    bienvenida: `¡Bienvenido a la Fábrica de la Vida! Soy el Dr. Quantum.\n\nTraduciremos el código secreto del ADN en máquinas moleculares llamadas proteínas. El lenguaje de la vida tiene solo 4 letras.\n\nTu misión: transcribir un gen y traducirlo hasta el codón de paro, con 2 errores como máximo.`,
    conceptos: [
      { icono: '🧬', nombre: 'Transcripción', descripcion: 'Copiado de ADN a ARNm en el núcleo.' },
      { icono: '🏗️', nombre: 'Traducción', descripcion: 'Ensamblaje de aminoácidos en el ribosoma.' },
      { icono: '🔢', nombre: 'Codón', descripcion: 'Trío de letras que codifica un aminoácido.' },
      { icono: '🛑', nombre: 'Codón STOP', descripcion: 'Señal que indica el final de la proteína.' }
    ],
    mision: [
      'Aparea cada base de la hebra molde para formar el ARNm.',
      'Lleva el ARNm al citoplasma por un poro nuclear.',
      'Elige el ARNt con el anticodón complementario a cada codón.',
      'Llega al codón de paro y usa el factor de liberación.',
      'Valida la proteína terminada.'
    ],
    aplicaciones: [
      { area: 'Biotecnología', ejemplo: 'Producción de insulina humana en bacterias.' },
      { area: 'Genética', ejemplo: 'Estudio de enfermedades hereditarias.' },
      { area: 'Vacunas', ejemplo: 'Desarrollo de vacunas de ARNm (como COVID-19).' }
    ]
  };

export default briefing;
