import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'MAT-10',
    titulo: 'Máquina de Galton',
    subtitulo: 'Probabilidad y Estadística',
    acento: '#f59e0b',
    duracion: 35,
    videoUrl: 'https://youtu.be/mk1npkgh0ts',
    bienvenida: `¡Bienvenido al Casino de la Probabilidad! Soy el Dr. Quantum.\n\nVerás cómo del caos aleatorio surge un orden matemático perfecto. Cada rebote es una moneda al aire.\n\nTu misión: predecir la media y la desviación del contenedor final y comprobarlas con el histograma.`,
    conceptos: [
      { icono: '🎲', nombre: 'Aleatoriedad', descripcion: 'Sucesos individuales impredecibles.' },
      { icono: '📈', nombre: 'Distribución Normal', descripcion: 'La famosa Campana de Gauss que rige la naturaleza.' },
      { icono: '🔢', nombre: 'Probabilidad (p)', descripcion: 'Chance de rebotar a la derecha o izquierda.' },
      { icono: '📊', nombre: 'Histograma', descripcion: 'Gráfico de barras que muestra la frecuencia real.' }
    ],
    mision: [
      'Lee la probabilidad p de desvío a la derecha.',
      'Calcula la media μ y la desviación σ de la Binomial(10, p).',
      'Escribe tu predicción en el panel.',
      'Suelta bolitas hasta reunir al menos 200.',
      'Compara la curva teórica con el histograma y valida.'
    ],
    aplicaciones: [
      { area: 'Genética', ejemplo: 'Distribución de rasgos físicos en una población.' },
      { area: 'Seguros', ejemplo: 'Cálculo de riesgos y esperanza de vida.' },
      { area: 'Calidad', ejemplo: 'Control de procesos en fábricas masivas.' }
    ]
  };

export default briefing;
