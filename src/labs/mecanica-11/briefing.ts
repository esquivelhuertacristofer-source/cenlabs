import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: 'MEC-11',
  titulo: 'Escáner OBD-II y Diagnóstico',
  subtitulo: 'Autotrónica · Diagnóstico a bordo y lectura de datos',
  acento: '#2A9D8F',
  duracion: 45,
  bienvenida: `¡Bienvenido a la bahía de diagnóstico de CEN Labs! Todo vehículo de gasolina moderno lleva un sistema de diagnóstico a bordo (OBD-II) que vigila el motor y las emisiones y guarda evidencia cuando algo falla.\n\nVas a conectar un escáner al conector DLC J1962, leer los datos en vivo (Modo $01), el cuadro congelado del momento de la falla (Modo $02) y los códigos de diagnóstico — DTC (Modo $03). Con esa evidencia deberás deducir la causa raíz.\n\nLa clave no es leer el código: es leer los DATOS. Un mismo síntoma ("mezcla pobre") puede venir de una fuga de vacío o de un sensor MAF sucio, y la prueba de rpm los distingue. ¡A diagnosticar con método!`,
  conceptos: [
    { icono: '🔌', nombre: 'Conector DLC J1962', descripcion: 'El puerto de 16 pines estandarizado (SAE J1962): pin 16 = +12 V, pines 6/14 = CAN High/Low, pin 7 = línea K.' },
    { icono: '📟', nombre: 'Modos y PIDs', descripcion: 'SAE J1979: Modo $01 datos en vivo, $02 cuadro congelado, $03 lectura de DTC. Cada dato es un PID.' },
    { icono: '⚖️', nombre: 'Ajuste de combustible', descripcion: 'STFT + LTFT. Positivo = la ECU añade combustible ⇒ mezcla pobre. |Total| > 25 % suele fijar P0171.' },
    { icono: '🌊', nombre: 'Sonda O₂ (lambda)', descripcion: 'Banda estrecha: 0.1–0.9 V, conmuta en 0.45 V. Una sonda sana conmuta rápido; una perezosa, lento (P0133).' },
  ],
  mision: [
    'FASE 1 · Conecta el escáner al DLC y verifica el flujo de datos en vivo (Modo $01).',
    'FASE 2 · Lee los DTC (Modo $03) y el cuadro congelado (Modo $02) del momento de la falla.',
    'FASE 3 · Compara el ajuste de combustible a ralentí vs 2500 rpm para distinguir la causa.',
    'FASE 4 · Deduce la causa raíz entre fuga de vacío, MAF sucio, fallo de encendido o sonda O₂ lenta.',
  ],
  aplicaciones: [
    { area: 'Automotriz', ejemplo: 'Diagnóstico de fallas del motor en cualquier taller con un escáner OBD-II.' },
    { area: 'Verificación vehicular', ejemplo: 'Monitores de disponibilidad (readiness) y DTC según la NOM-047-SEMARNAT-2014 en México.' },
    { area: 'Emisiones', ejemplo: 'Detección temprana de fallas que aumentan contaminantes antes de que sean visibles.' },
  ],
  retos: [
    'Distingue una fuga de vacío de un MAF sucio usando el ajuste de combustible a ralentí vs 2500 rpm.',
    'Identifica la sonda O₂ perezosa mirando la frecuencia de conmutación, no el voltaje.',
    'Relaciona cada DTC con el monitor de disponibilidad que queda incompleto.',
  ],
};

export default briefing;
