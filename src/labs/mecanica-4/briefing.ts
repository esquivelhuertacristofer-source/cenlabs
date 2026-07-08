import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
    codigo: 'MEC-04',
    titulo: 'Inversor Trifásico de Potencia',
    subtitulo: 'Autotrónica · Electrónica de potencia y diagnóstico',
    acento: '#2A9D8F',
    duracion: 40,
    videoUrl: 'https://youtu.be/7McpwVTjTiA',
    bienvenida: `¡Bienvenido al banco de electrónica de potencia de CEN Labs! Hoy vas a ensamblar un inversor trifásico, el dispositivo que convierte corriente continua en las tres fases que mueven un motor.\n\nMontarás el disipador, los capacitores del bus DC, los módulos IGBT, la placa de control y las busbarras. Luego calcularás el voltaje pico de salida y decidirás la frecuencia de conmutación, observando cómo se generan las tres fases. Finalmente diagnosticarás una falla real.\n\nCada decisión tiene consecuencia física. ¡A construir!`,
    conceptos: [
      { icono: '🔌', nombre: 'Bus DC', descripcion: 'Los capacitores estabilizan la tensión continua que alimenta al inversor.' },
      { icono: '🔺', nombre: 'Módulos IGBT', descripcion: 'Los transistores de potencia conmutan miles de veces por segundo para sintetizar la CA.' },
      { icono: '〰️', nombre: 'PWM y 3 Fases', descripcion: 'La modulación por ancho de pulso genera tres ondas senoidales desfasadas 120°.' },
      { icono: '🌡️', nombre: 'Diagnóstico', descripcion: 'IGBT, secuencia de disparo o sobrecalentamiento: cada falla tiene su firma.' },
    ],
    mision: [
      'FASE 1 · Armado: monta disipador, capacitores del bus DC, IGBT, placa de control y busbarras.',
      'FASE 2 · Fundamento: calcula el voltaje pico de salida y decide la frecuencia de conmutación.',
      'FASE 3 · Diagnóstico: identifica si la falla es un IGBT, la secuencia de disparo o sobrecalentamiento.',
      'Observa la conmutación generar las tres fases en tiempo real.',
    ],
    aplicaciones: [
      { area: 'Vehículos Eléctricos', ejemplo: 'El inversor traduce la batería DC en la CA que mueve el motor.' },
      { area: 'Energía Solar', ejemplo: 'Convierte la corriente continua de los paneles en CA para la red.' },
      { area: 'Industria', ejemplo: 'Variadores de frecuencia para controlar motores industriales.' },
    ],
    retos: [
      'Alcanza el voltaje de salida objetivo eligiendo la frecuencia óptima.',
      'Diagnostica el IGBT dañado sin desmontar todo el módulo.',
    ],
  };

export default briefing;
