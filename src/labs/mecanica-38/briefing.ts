import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-38",
  titulo: "Amplificador de instrumentación INA128 + puente de galgas: sensibilidad y CMRR",
  subtitulo: "Acondicionamiento de señal analógica · puente de Wheatstone (¼/½/completo) y rechazo de modo común",
  acento: "#8E44AD",
  duracion: 35,
  videoUrl: '',
  bienvenida: `Después de dos prácticas dedicadas a fuentes conmutadas (buck y boost), esta práctica regresa al acondicionamiento de señal analógica que abrió la Tanda 1 con los op-amps, pero ahora sobre un problema mucho más exigente: medir un cambio de resistencia tan pequeño que resulta casi invisible. Una galga extensométrica (strain gauge) es una resistencia que cambia ligerísimamente su valor cuando se deforma junto con la superficie a la que está pegada — típicamente unas pocas partes por diez mil. Para convertir ese cambio de resistencia en un voltaje medible, la galga se monta en un puente de Wheatstone: con una sola galga activa (cuarto de puente) la salida es proporcional a la deformación pero con una pequeña no linealidad; con dos galgas activas en oposición (medio puente, típico de una viga en flexión) o cuatro (puente completo) la relación se vuelve exactamente lineal y más sensible.

El problema es que incluso en el mejor de los casos esa señal del puente son unos pocos milivoltios, montados sobre un voltaje de modo común de varios voltios (la mitad del voltaje de excitación del puente). Amplificar esa señal con un amplificador diferencial común no basta: cualquier pequeña asimetría hace que parte del enorme modo común se filtre a la salida, contaminando la medición. Para esto existe el amplificador de instrumentación, una familia de circuitos con altísima impedancia de entrada y, sobre todo, un rechazo de modo común (CMRR) muy alto — el INA128 de Texas Instruments, la referencia de esta práctica, alcanza hasta 130 dB de CMRR típico con la ganancia adecuada. En este laboratorio vas a ajustar el voltaje de excitación del puente, la deformación simulada, el tipo de puente y la ganancia del INA128 (fijada por una sola resistencia externa R_G), y vas a ver de primera mano cómo el CMRR limita el error de la medición — y por qué subir la ganancia no siempre es la respuesta correcta.`,
  conceptos: [
    { icono: '🌉', nombre: 'Puente de Wheatstone: ¼, ½ y completo', descripcion: 'Con 1 galga activa (¼ puente) la salida Vout/Vex=(GF·ε/4)/(1+GF·ε/2) tiene un término no lineal; con 2 galgas en oposición (½ puente) o 4 (completo) la relación se vuelve exactamente lineal: Vout/Vex=GF·ε/2 y GF·ε respectivamente.' },
    { icono: '📏', nombre: 'Factor de galga GF≈2.0', descripcion: 'El factor de galga relaciona el cambio relativo de resistencia con la deformación mecánica: (ΔR/R)/ε. Para galgas de constantano, el valor típico es GF≈2.0–2.1.' },
    { icono: '🔊', nombre: 'Ganancia del INA128: G=1+50kΩ/R_G', descripcion: 'El amplificador de instrumentación INA128 fija su ganancia con una sola resistencia externa R_G, según G=1+50kΩ/R_G, con un rango típico de G=1 a 10,000 V/V.' },
    { icono: '🛡️', nombre: 'CMRR: rechazo de modo común', descripcion: 'El voltaje de modo común del puente (Vcm≈Vex/2) es mucho mayor que la señal diferencial que interesa medir. El CMRR del INA128 (hasta 130 dB típico) determina cuánto de ese modo común se filtra como error a la salida — y ese error depende de G y Vex, no del tipo de puente.' },
  ],
  mision: [
    'FASE 1 · Explora: ajusta Vex, la deformación ε, el tipo de puente y la ganancia G, y observa cómo cambian Vbridge, VoutIdeal y el error de salida inducido por el CMRR del INA128.',
    'FASE 2 · Predicción: predice Vbridge, VoutIdeal o si el error absoluto de CMRR depende del tipo de puente, antes de que el simulador revele el valor real.',
    'FASE 3 · Medición: ejecuta un barrido automático de deformación ε y observa en una tabla cómo evolucionan Vbridge, VoutIdeal y el error relativo de CMRR.',
    'FASE 4 · Reto: con un Vex y ε objetivo fijos, elige el tipo de puente y la ganancia G para alcanzar un VoutIdeal objetivo manteniendo el error de CMRR bajo control.',
  ],
  aplicaciones: [
    { area: 'Celdas de carga industriales', ejemplo: 'Una báscula industrial usa una celda de carga con 4 galgas en puente completo y un amplificador de instrumentación para medir el peso con alta precisión, rechazando el ruido de modo común de líneas de alimentación cercanas.' },
    { area: 'Sensores de deformación en estructuras', ejemplo: 'Ingenieros civiles pegan galgas a vigas y columnas para monitorear la deformación estructural en tiempo real durante pruebas de carga o monitoreo de salud estructural a largo plazo.' },
    { area: 'Sensores de torque y presión', ejemplo: 'Muchos sensores de torque de banco de pruebas automotriz y transductores de presión industrial usan un puente de galgas internamente, acondicionado con un amplificador de instrumentación como el INA128 o su equivalente.' },
  ],
  retos: [
    'Compara el mismo Vex y ε en modo ¼ puente, ½ puente y puente completo — ¿por qué el puente completo entrega 4 veces la señal del cuarto de puente para la misma deformación?',
    'Fija ε en un valor pequeño y sube la ganancia G de 100 a 1000 — el error absoluto de salida crece casi proporcionalmente aunque el CMRR del INA128 apenas mejora en ese rango. ¿Por qué subir la ganancia no siempre reduce el error relativo?',
    'Arma un puente de galgas real (o un módulo de celda de carga con puente integrado) con un INA128 o AD620, y mide con un multímetro de precisión el voltaje de salida en reposo y bajo una deformación conocida: contrasta el resultado contra las fórmulas de este simulador.',
  ],
};

export default briefing;
