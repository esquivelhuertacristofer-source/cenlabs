import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'QMI-06',
    titulo: 'Solubilidad y Cristalización',
    subtitulo: 'Termodinámica de Fases',
    acento: '#6366f1',
    duracion: 30,
    videoUrl: 'https://youtu.be/Pu7otmbiEeY',
    bienvenida: `¡Bienvenido al Taller de Purificación Térmica! Soy el Dr. Quantum.\n\nVerás cómo el orden emerge del caos mediante el control de la temperatura. Forzaremos la sobresaturación para crear cristales geométricos perfectos.\n\nTu misión: Recristalizar KNO3 mediante un choque térmico controlado.`,
    conceptos: [
      { icono: '📈', nombre: 'Solubilidad', descripcion: 'Máxima cantidad de soluto a una T específica.' },
      { icono: '🔥', nombre: 'Saturación', descripcion: 'Punto de equilibrio dinámico entre sólido y líquido.' },
      { icono: '🧊', nombre: 'Cristalización', descripcion: 'Ordenamiento molecular en redes geométricas.' },
      { icono: '⚡', nombre: 'Sobresaturación', descripcion: 'Estado metaestable inestable inducido por enfriamiento.' }
    ],
    mision: [
      'Disuelve 80g de soluto en agua caliente.',
      'Calienta hasta lograr una solución límpida.',
      'Traslada al baño de hielo bruscamente.',
      'Observa la nucleación de los cristales.',
      'Valida la pureza del cristal obtenido.'
    ],
    aplicaciones: [
      { area: 'Minería', ejemplo: 'Purificación de metales preciosos.' },
      { area: 'Farmacia', ejemplo: 'Aislamiento de principios activos puros.' },
      { area: 'Electrónica', ejemplo: 'Crecimiento de cristales de silicio para chips.' }
    ]
  };

export default briefing;
