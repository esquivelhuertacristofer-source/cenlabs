import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'BIO-05',
    titulo: 'Leyes de Mendel',
    subtitulo: 'Genética Clásica y Herencia',
    acento: '#f43f5e',
    duracion: 35,
    videoUrl: 'https://youtu.be/uV5Xtnoi_D8',
    bienvenida: `¡Bienvenido al Invernadero de Genética! Soy el Dr. Quantum.\n\nDescubriremos las reglas de la lotería biológica. Veremos por qué te pareces a tus abuelos pero no eres idéntico a tus padres.\n\nTu misión: Validar la proporción 9:3:3:1 en un cruce dihíbrido.`,
    conceptos: [
      { icono: '🧬', nombre: 'Alelo', descripcion: 'Variante de un gen (Dominante o Recesivo).' },
      { icono: '🔲', nombre: 'Cuadro de Punnett', descripcion: 'Mapa de probabilidades de descendencia.' },
      { icono: '🌸', nombre: 'Fenotipo', descripcion: 'Rasgos físicos observables (Color, Forma).' },
      { icono: '🔢', nombre: 'Genotipo', descripcion: 'La información oculta en el ADN (AaBb).' }
    ],
    mision: [
      'Cruza plantas con semillas Amarillas/Lisas vs Verdes/Rugosas.',
      'Genera una población de 1000 individuos.',
      'Cuenta cuántos individuos de cada tipo nacieron.',
      'Compara tus datos reales con la teoría de Mendel.',
      'Valida la segregación independiente de alelos.'
    ],
    aplicaciones: [
      { area: 'Agronomía', ejemplo: 'Creación de variedades de plantas resistentes.' },
      { area: 'Veterinaria', ejemplo: 'Cría selectiva de animales de raza.' },
      { area: 'Medicina', ejemplo: 'Consejería genética para futuros padres.' }
    ]
  };

export default briefing;
