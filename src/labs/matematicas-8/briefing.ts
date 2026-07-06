import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'MAT-08',
    titulo: 'La Derivada: Propulsión Crítica',
    subtitulo: 'Razón de Cambio y Velocidad Instantánea',
    acento: '#ef4444',
    duracion: 40,
    videoUrl: 'https://youtu.be/pVSfAX2BG5E',
    bienvenida: `¡Bienvenido al Centro de Control de Lanzamientos! Soy el Dr. Quantum. Hoy usaremos el poder del Cálculo Diferencial para evitar un desastre aeroespacial.\n\nLa derivada no es solo una fórmula; es la velocidad instantánea de un objeto. Si conocemos la función de posición s(t) de nuestro cohete, su derivada s'(t) nos dirá exactamente a qué velocidad viaja en cada microsegundo.\n\nTu misión: Analizar la telemetría del despegue, identificar el punto de máxima velocidad y calcular la aceleración para estabilizar el reactor.`,
    conceptos: [
      { icono: '🚀', nombre: 'Velocidad Instantánea', descripcion: 'La derivada de la posición respecto al tiempo: v(t) = ds/dt.' },
      { icono: '🔥', nombre: 'Aceleración', descripcion: 'La segunda derivada de la posición: a(t) = dv/dt.' },
      { icono: '📈', nombre: 'Pendiente Tangente', descripcion: 'Representación geométrica de la derivada en un punto de la trayectoria.' },
      { icono: '🎯', nombre: 'Optimización', descripcion: 'Búsqueda de máximos de empuje y mínimos de consumo de combustible.' }
    ],
    mision: [
      'Inicia la SECUENCIA DE DESPEGUE en el simulador.',
      'Activa el ESCÁNER TANGENTE para visualizar la velocidad en tiempo real.',
      'Identifica el instante exacto donde la pendiente es MÁXIMA.',
      'Calcula la derivada analítica de la función de telemetría.',
      'Valida el resultado para estabilizar la órbita del cohete.',
    ],
    aplicaciones: [
      { area: 'Finanzas', ejemplo: 'Optimización de ganancias y reducción de costos.' },
      { area: 'Física', ejemplo: 'Cálculo de velocidad y aceleración instantánea.' },
      { area: 'IA', ejemplo: 'Entrenamiento de redes neuronales (Gradiente Descendente).' }
    ]
  };

export default briefing;
