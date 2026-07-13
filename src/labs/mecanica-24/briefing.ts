import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-24",
  titulo: "Pinza y shunt: mide corriente con y sin alterar el circuito",
  subtitulo: "Instrumentación · Medición de corriente y efecto de carga",
  acento: "#2A9D8F",
  duracion: 40,
  videoUrl: '',
  bienvenida: `¡Bienvenido al banco de instrumentación de CEN Labs! Hoy resuelves la pregunta que todo técnico enfrenta antes de medir corriente: ¿engancho la pinza o interrumpo el circuito con un shunt? Parece un detalle de catálogo, pero es la diferencia entre una medición que no toca el sistema y una que sí lo perturba — y saber cuál es cuál te ahorra errores de diagnóstico.\n\nVas a resolver 3 escenarios reales. En el Caso 1 mides ≈200 A con la pinza (sin contacto) y luego insertas un shunt de 4 terminales en serie: verás cómo la propia resistencia del instrumento hace caer la corriente real del circuito — eso es el efecto de carga (error de inserción), y tú vas a cuantificarlo con un %error calculado en vivo. En el Caso 2 vas a reproducir el error más común del oficio: abrazar con la pinza el vivo Y el neutro de un mismo cable — y ver la lectura irse a ≈0 A aunque el circuito siga energizado (cancelación de Ampère, el mismo principio detrás de un interruptor diferencial RCD/GFCI). En el Caso 3 medirás una corriente pequeña y descubrirás por qué la pinza se tara antes de cada medición.\n\nAl final compararás dos filosofías de medición: la pinza (Hall o transformador de corriente, sin abrir el circuito) contra el shunt (una resistencia calibrada en serie, que sí lo abre y lo carga). Ninguna es "mejor" en abstracto — cada una tiene su lugar según qué tan crítico sea no perturbar el sistema que mides. ¡A medir con criterio!`,
  conceptos: [
    { icono: '🪝', nombre: 'Efecto de carga (error de inserción)', descripcion: 'Todo instrumento conectado en serie añade su propia resistencia al circuito. El shunt reduce la corriente real que mide: a mayor resistencia del shunt frente a la carga, mayor el error de inserción.' },
    { icono: '🧲', nombre: 'Efecto Hall vs. transformador de corriente (TC)', descripcion: 'La pinza Hall mide CD y CA porque detecta el campo magnético directamente. La pinza TC solo mide CA porque necesita flujo cambiante (ley de Faraday, E = −N·dΦ/dt) para inducir señal.' },
    { icono: '⭕', nombre: 'Cancelación de Ampère', descripcion: 'Si la pinza abraza dos conductores con corrientes opuestas (vivo + neutro), el campo magnético neto es cero y la lectura cae a ≈0 A aunque el circuito esté energizado — el mismo principio que un interruptor diferencial.' },
    { icono: '🎯', nombre: 'Offset de cero y tara', descripcion: 'Todo sensor Hall arrastra un pequeño offset de cero (campo terrestre, deriva electrónica). Tarar antes de medir corrientes pequeñas evita sumar ese offset a la lectura.' },
  ],
  mision: [
    'FASE 1 · Caso Arranque — mide ≈200 A con la pinza tarada, luego inserta el shunt en serie y cuantifica el efecto de carga (%error de inserción).',
    'FASE 2 · Caso Calefactor — mide con la pinza abrazando solo el vivo, luego abraza vivo + neutro juntos y explica por qué la lectura cae a ≈0 A sin que la corriente real cambie.',
    'FASE 3 · Caso Testigo — mide una corriente pequeña sin tarar, luego tara y remide; identifica el origen del offset.',
    'FASE 4 · Modo TC — cambia la pinza a modo transformador de corriente sobre el Caso Testigo (CD) y explica por qué el instrumento marca falla.',
  ],
  aplicaciones: [
    { area: 'Mantenimiento industrial', ejemplo: 'Diagnóstico de consumo de motores y cargas sin interrumpir la línea — la pinza es la herramienta de campo por excelencia.' },
    { area: 'Metrología y calibración', ejemplo: 'Uso de un shunt de referencia trazable para calibrar otros instrumentos de corriente, aceptando su efecto de carga como parte del método.' },
    { area: 'Seguridad eléctrica', ejemplo: 'Reconocer la cancelación de Ampère como el principio de operación de los interruptores diferenciales (RCD/GFCI) que protegen instalaciones.' },
  ],
  retos: [
    'Calcula qué resistencia de shunt haría el error de inserción menor a 1 % para esta misma carga.',
    'Explica qué pasaría si la pinza en modo TC intentara medir la corriente de arranque (circuito de CD) — ¿por qué el fabricante advierte "solo CA"?',
    'Predice la lectura de la pinza si abrazas el vivo y el retorno de un motor de CD en dos vueltas opuestas de cable (conexión bifilar).',
  ],
};

export default briefing;
