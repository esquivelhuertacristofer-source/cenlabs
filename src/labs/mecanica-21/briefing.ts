import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-21",
  titulo: "Amplificador BJT en Emisor Común: Ganancia de Pequeña Señal",
  subtitulo: "Electrónica analógica · Polarización DC, modelo hybrid-π y recorte por recta de carga AC",
  acento: "#2A9D8F",
  duracion: 35,
  videoUrl: '',
  bienvenida: `En la práctica anterior polarizaste un BJT en su punto de operación DC y lo dejaste ahí, quieto. Pero un transistor polarizado en la región activa no solo "se queda" en un punto — también puede amplificar. Si le superpones una señal AC pequeña a la base, esa señal sale amplificada por el colector, con la misma forma pero mucho más grande.

En esta práctica construyes el amplificador en emisor común más común de todos: divisor de voltaje para la polarización DC, RC como resistencia de colector, y RE con un capacitor de bypass opcional. Vas a descubrir que el bypass no es un detalle cosmético — con RE bypaseada la ganancia depende de gm (una propiedad interna del transistor, difícil de controlar con precisión); sin bypass, la ganancia queda fijada casi enteramente por la razón RC/RE, mucho más predecible pero mucho menor.

También vas a chocar contra un límite físico real: la señal de salida no puede crecer para siempre. Si la amplitud de entrada es demasiado grande, la salida se recorta al llegar a los límites de corte o saturación del transistor — y el simulador te deja ver exactamente dónde ocurre ese recorte sobre la recta de carga AC, no solo como una advertencia de texto.`,
  conceptos: [
    { icono: '📍', nombre: 'Punto Q (polarización DC)', descripcion: 'Antes de amplificar nada, el divisor R1/R2 fija un punto de operación estable: IB=(VBB−VBE)/(RBB+(β+1)·RE), con VBE=0.7V constante y β dentro del rango de hoja de datos del transistor elegido.' },
    { icono: '🔀', nombre: 'Modelo hybrid-π (pequeña señal)', descripcion: 'Para la señal AC, el transistor se comporta como un circuito lineal alrededor del punto Q: gm=ICQ/VT y rπ=β/gm, con VT=25mV a temperatura ambiente — el punto de partida estándar para calcular ganancia.' },
    { icono: '⚖️', nombre: 'Bypass de RE: ganancia vs. estabilidad', descripcion: 'Con RE bypaseada, Av=−gm·(RC‖RL): ganancia alta pero sensible a gm. Sin bypass, Av=−β·(RC‖RL)/[rπ+(β+1)·RE]: ganancia mucho menor pero fijada principalmente por resistencias, no por el transistor.' },
    { icono: '✂️', nombre: 'Recorte por recta de carga AC', descripcion: 'La recta de carga AC pivotea sobre el punto Q con una pendiente distinta a la recta DC; si la señal amplificada excede el margen disponible hacia corte o hacia saturación, la salida se aplana — el simulador muestra ese recorte directamente en el osciloscopio.' },
  ],
  mision: [
    'FASE 1 · Explora: ajusta VCC/R1/R2/RC/RE/RL, activa o desactiva el bypass, y observa cómo cambian el punto Q y la ganancia Av en tiempo real sobre el banco 3D.',
    'FASE 2 · Predicción: predice si el transistor queda en corte, activa o saturación — o predice el valor aproximado de |Av| — antes de que el simulador lo confirme.',
    'FASE 3 · Medición: recorre la amplitud de entrada y observa en el osciloscopio cómo la señal amplificada se recorta contra los límites de la recta de carga AC.',
    'FASE 4 · Reto de diseño: ajusta el divisor de polarización para lograr un ICQ objetivo que se mantenga válido para todo el rango de β de hoja de datos del transistor, no solo para un β "típico".',
  ],
  aplicaciones: [
    { area: 'Etapas preamplificadoras de audio', ejemplo: 'La primera etapa de muchos preamplificadores de micrófono o guitarra es un simple emisor común con RE parcialmente bypaseada, para ganar señal sin sacrificar toda la estabilidad térmica del punto Q.' },
    { area: 'Acondicionamiento de señal de sensores', ejemplo: 'Sensores que entregan señales de pocos milivolts (termopares, galgas extensométricas) suelen pasar primero por una etapa BJT en emisor común antes de llegar a un ADC, para elevar la señal por encima del piso de ruido.' },
    { area: 'Diseño con margen de tolerancia de fabricación', ejemplo: 'Como β varía enormemente entre transistores del mismo modelo (p. ej. 200–450 en el BC547B), un buen diseño de polarización — como el que exige el modo Reto — debe funcionar para cualquier unidad real, no solo para el valor de catálogo "promedio".' },
  ],
  retos: [
    '¿Por qué la ganancia Av cambia tan drásticamente al quitar el capacitor de bypass de RE, si RE sigue estando físicamente presente en el circuito en ambos casos?',
    'Si aumentas la amplitud de la señal de entrada más allá del punto donde el osciloscopio muestra recorte, ¿el problema es del amplificador o del punto Q elegido? ¿Qué cambiarías primero?',
    'En el modo Reto, ¿tu divisor de polarización siguió cumpliendo el ICQ objetivo en todo el rango de β del transistor, o solo cerca del valor central? ¿Qué tan sensible es tu diseño a esa variación?',
  ],
};

export default briefing;
