import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-43",
  titulo: "Termopar, RTD e Infrarrojo: Medición de Temperatura",
  subtitulo: "Instrumentación · Termometría industrial",
  acento: "#2A9D8F",
  duracion: 40,
  videoUrl: '',
  bienvenida: `¡Bienvenido al banco de termometría de CEN Labs! Hoy vas a medir la misma temperatura con tres instrumentos que trabajan sobre principios físicos completamente distintos — y vas a descubrir que cada uno tiene su propio modo de "mentir" si no lo usas correctamente.\n\nEn el escenario del Termopar Tipo K medirás el voltaje que genera la unión de dos metales distintos (efecto Seebeck, IEC 60584) y verás cómo, sin compensación de junta fría (CJC), el lector siempre indica de menos — exactamente en la magnitud de su propia temperatura ambiente. En el escenario de la RTD Pt100 (IEC 60751) descubrirás por qué la conexión a 2 hilos suma la resistencia de los propios cables de extensión a la lectura, y por qué la industria usa 4 hilos (conexión Kelvin) para eliminar ese error. En el escenario de la pistola infrarroja verás el error más dramático de los tres: si la emisividad configurada no coincide con la de la superficie real, el instrumento puede subestimar la temperatura en más de 100 °C sobre una pieza metálica brillante — un riesgo real y documentado en seguridad eléctrica.\n\nNinguno de estos instrumentos "falla" en el sentido de estar descompuesto: cada error que vas a ver es el instrumento haciendo exactamente lo que su principio físico le permite, mal configurado. Tu trabajo es reconocer la firma de cada error y corregirla. ¡A medir con criterio!`,
  conceptos: [
    { icono: '🌡️', nombre: 'Efecto Seebeck y compensación de junta fría (CJC)', descripcion: 'Un termopar genera un voltaje proporcional a la diferencia de temperatura entre su punta y su unión de referencia. Sin conocer la temperatura de esa unión de referencia (CJC), el lector no puede convertir el voltaje en temperatura absoluta correcta.' },
    { icono: '🔩', nombre: 'RTD Pt100 y conexión a 2 vs. 4 hilos', descripcion: 'Una RTD cambia su resistencia de forma casi lineal con la temperatura (IEC 60751). A 2 hilos, la resistencia de los cables de extensión se suma a la de la RTD; a 4 hilos (Kelvin), un par mide corriente y otro mide tensión, cancelando ese error.' },
    { icono: '📡', nombre: 'Radiación infrarroja y emisividad', descripcion: 'Toda superficie emite radiación infrarroja proporcional a su temperatura, pero también según su emisividad (ε). Un instrumento IR infiere la temperatura asumiendo un valor de ε: si ese valor no coincide con el real de la superficie, el error puede ser enorme.' },
    { icono: '🎯', nombre: 'Diagnóstico por firma de error', descripcion: 'Cada instrumento de temperatura tiene un modo de falla característico y predecible según su principio físico — reconocer esa firma es más rápido y más confiable que sospechar primero de una descalibración.' },
  ],
  mision: [
    'FASE 1 · Termopar Tipo K — mide con CJC desactivada, observa el error sistemático por debajo de la temperatura real, y actívala para corregirlo.',
    'FASE 2 · RTD Pt100 — mide a 2 hilos, observa el error introducido por la resistencia de los cables, y cambia a 4 hilos (Kelvin) para eliminarlo.',
    'FASE 3 · Pistola infrarroja — mide con emisividad de fábrica sobre una superficie metálica pulida, observa la subestimación drástica, y corrige la emisividad configurada.',
    'FASE 4 · Diagnóstico — para cada escenario, identifica la causa correcta del error entre las opciones propuestas.',
  ],
  aplicaciones: [
    { area: 'Mantenimiento industrial', ejemplo: 'Monitoreo de temperatura de rodamientos, líneas de proceso y componentes eléctricos con termopares y RTDs conectados a PLC o registradores.' },
    { area: 'Diagnóstico automotriz', ejemplo: 'Sensores de temperatura de refrigerante y gases de escape basados en termopares y RTDs, y uso de pistolas IR para diagnóstico rápido de puntos calientes.' },
    { area: 'Seguridad eléctrica', ejemplo: 'Termografía de tableros y conexiones con cámaras/pistolas IR, donde configurar mal la emisividad puede ocultar un punto caliente peligroso.' },
  ],
  retos: [
    'Calcula el error de indicación del termopar si la temperatura ambiente de la unión de referencia fuera 35 °C en vez de 22 °C, sin CJC.',
    'Explica por qué la conexión a 3 hilos (no solo 2 o 4) es un estándar industrial común para RTD, y qué compromiso resuelve frente a 2 y 4 hilos.',
    'Predice qué le pasaría a la lectura de la pistola IR si apuntas a una superficie de emisividad muy alta (ε≈0.95, p.ej. pintura mate negra) con el instrumento configurado de fábrica en ε=0.95.',
  ],
};

export default briefing;
