import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'MAT-02',
    titulo: 'Triangulación Satelital',
    subtitulo: 'Sistemas de Ecuaciones 2x2',
    acento: '#219EBC',
    duracion: 35,
    videoUrl: 'https://youtu.be/MFX5Aofjyfk',
    bienvenida: `¡Bienvenido a la Estación de Rastreo Orbital! Soy el Dr. Quantum y hoy vamos a usar el álgebra lineal para localizar una señal en el espacio.\n\nUn sistema de dos ecuaciones con dos incógnitas representa visualmente la intersección de dos trayectorias. Encontrar esa solución (x, y) es la base de la navegación GPS y la triangulación de telecomunicaciones.\n\nTu misión: ajustar las pendientes y ordenadas de dos haces láser hasta interceptar el satélite guía en las coordenadas indicadas en el radar.`,
    conceptos: [
      { icono: '📈', nombre: 'Pendiente (m)', descripcion: 'Indica la inclinación del haz láser. Representa la tasa de cambio de la trayectoria.' },
      { icono: '📍', nombre: 'Ordenada (b)', descripcion: 'El punto de origen o desfase de la trayectoria en el eje vertical.' },
      { icono: '✖️', nombre: 'Punto de Intersección', descripcion: 'La solución única (x, y) donde ambos haces se cruzan para localizar el objetivo.' },
      { icono: '平行', nombre: 'Paralelismo', descripcion: 'Si m₁ = m₂, los haces son paralelos y el sistema es inconsistente (no hay localización).' },
      { icono: '🎯', nombre: 'Método Gráfico', descripcion: 'Visualización directa de la solución mediante la superposición de trayectorias en el plano.' },
    ],
    mision: [
      'Identifica las coordenadas del OBJETIVO en el radar (X, Y).',
      'Ajusta m₁ y b₁ del Haz Alpha para que pase por el objetivo.',
      'Configura m₂ y b₂ del Haz Omega para que corte al primero justo ahí.',
      'Observa cómo cambian las ecuaciones y = mx + b en tiempo real sobre los láseres.',
      'Si las pendientes son iguales el sistema es inconsistente (paralelas) o dependiente (la misma recta): cambia una.',
      'Valida cuando la intersección quede a menos de 0.1 del objetivo en X y en Y.',
      'Registra los coeficientes finales en tu bitácora.'
    ],
    aplicaciones: [
      { area: 'Telecomunicaciones', ejemplo: 'Localización de un dispositivo mediante la potencia de dos torres base.' },
      { area: 'Ingeniería de Vuelo', ejemplo: 'Cálculo de rutas de interceptación para naves en órbita.' },
      { area: 'Logística Global', ejemplo: 'Optimización de rutas de transporte basadas en puntos de encuentro.' },
    ],
    retos: [
      'Interferencia Masiva: Localiza el objetivo cuando b1 y b2 son idénticos.',
      'Sincronía de Fallas: Triangula una señal usando solo coeficientes m positivos.',
      'Rastreo Silencioso: Encuentra la intersección sin que las rectas salgan del radar.',
    ]
  };

export default briefing;
