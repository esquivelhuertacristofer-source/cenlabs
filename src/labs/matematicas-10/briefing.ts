import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'MAT-10',
    titulo: 'Máquina de Galton',
    subtitulo: 'Probabilidad y Estadística',
    acento: '#f59e0b',
    duracion: 35,
    videoUrl: 'https://youtu.be/mk1npkgh0ts',
    bienvenida: `¡Bienvenido al Casino de la Probabilidad! Soy el Dr. Quantum.\n\nVerás cómo del caos aleatorio surge un orden matemático perfecto. Cada rebote es una moneda al aire.\n\nTu misión: Comprobar el Teorema del Límite Central.',`,
    conceptos: [
      { icono: '🎲', nombre: 'Aleatoriedad', descripcion: 'Sucesos individuales impredecibles.' },
      { icono: '📈', nombre: 'Distribución Normal', descripcion: 'La famosa Campana de Gauss que rige la naturaleza.' },
      { icono: '🔢', nombre: 'Probabilidad (p)', descripcion: 'Chance de rebotar a la derecha o izquierda.' },
      { icono: '📊', nombre: 'Histograma', descripcion: 'Gráfico de barras que muestra la frecuencia real.' }
    ],
    mision: [
      'Inicia la lluvia de esferas.',
      'Observa cómo se acumulan en la base.',
      'Ajusta el sesgo para mover la media.',
      'Superpón la curva teórica sobre los datos.',
      'Valida cuando la muestra sea estadísticamente significativa.'
    ],
    aplicaciones: [
      { area: 'Genética', ejemplo: 'Distribución de rasgos físicos en una población.' },
      { area: 'Seguros', ejemplo: 'Cálculo de riesgos y esperanza de vida.' },
      { area: 'Calidad', ejemplo: 'Control de procesos en fábricas masivas.' }
    ]
  };

export default briefing;
