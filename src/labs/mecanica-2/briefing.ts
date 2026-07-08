import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'MEC-02',
    titulo: 'Motor de Combustión Interna (4 Tiempos)',
    subtitulo: 'Autotrónica · Ciclo Otto y diagnóstico',
    acento: '#2A9D8F',
    duracion: 45,
    videoUrl: 'https://youtu.be/L60Rv4_t8sc',
    bienvenida: `¡Bienvenido de nuevo al taller de Autotrónica! Hoy vas a ensamblar un motor de combustión interna de cuatro tiempos y entender por qué gira.\n\nMontarás el bloque, el cigüeñal, los pistones y la culata, y definirás el orden de encendido 1-3-4-2. Luego calcularás la eficiencia del ciclo Otto a partir de la relación de compresión y observarás los cuatro tiempos en acción. Finalmente, el motor fallará y tendrás que diagnosticar la causa.\n\nCada decisión tiene consecuencia física. ¡Vamos a armarlo!`,
    conceptos: [
      { icono: '⚙️', nombre: 'Ciclo de 4 Tiempos', descripcion: 'Admisión, compresión, explosión y escape: la secuencia que convierte combustible en movimiento.' },
      { icono: '🔥', nombre: 'Relación de Compresión', descripcion: 'A mayor compresión, mayor eficiencia térmica del ciclo Otto (hasta el límite de detonación).' },
      { icono: '🔢', nombre: 'Orden de Encendido', descripcion: 'La secuencia 1-3-4-2 reparte los impulsos y equilibra las vibraciones del motor.' },
      { icono: '🩺', nombre: 'Diagnóstico', descripcion: 'Detonación, cilindro muerto u orden incorrecto: cada falla tiene su síntoma.' },
    ],
    mision: [
      'FASE 1 · Armado: monta bloque, cigüeñal, pistones y culata; define el orden de encendido 1-3-4-2.',
      'FASE 2 · Fundamento: calcula la eficiencia del ciclo Otto según la relación de compresión.',
      'FASE 3 · Diagnóstico: identifica si la falla es orden de encendido, detonación o un cilindro muerto.',
      'Observa el ciclo de 4 tiempos animado mientras ajustas los parámetros.',
    ],
    aplicaciones: [
      { area: 'Automóviles', ejemplo: 'La inmensa mayoría de coches a gasolina usan este ciclo.' },
      { area: 'Motocicletas y Náutica', ejemplo: 'Motores compactos de alta relación potencia/peso.' },
      { area: 'Maquinaria Agrícola', ejemplo: 'Tractores y generadores portátiles de combustión.' },
    ],
    retos: [
      'Maximiza la eficiencia sin cruzar el umbral de detonación.',
      'Diagnostica el cilindro muerto solo con la firma de vibración.',
    ],
  };

export default briefing;
