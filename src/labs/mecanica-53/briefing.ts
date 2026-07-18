import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-53",
  titulo: "Motor Monofásico: Fase Partida y Capacitor — Diagnóstico",
  subtitulo: "Transformadores · Motores monofásicos de inducción",
  acento: "#B8562F",
  duracion: 40,
  videoUrl: '',
  bienvenida: `Un motor de inducción monofásico tiene un problema que uno trifásico nunca enfrenta: alimentado con una sola fase de corriente alterna, su devanado principal produce un campo magnético que solo pulsa —crece y decrece sobre el mismo eje— en vez de girar. Un campo pulsante no puede arrancar un rotor detenido: el par neto en reposo es exactamente cero. Por eso todo motor monofásico necesita un segundo devanado, el auxiliar, cuya corriente llega desfasada respecto a la del principal —a veces con ayuda de un capacitor— el tiempo justo para crear, mientras dura el arranque, un campo lo bastante giratorio para poner al rotor en marcha.

Este laboratorio te pone a armar ese motor pieza por pieza —incluido el interruptor centrífugo que desconecta el devanado auxiliar una vez que el motor ya gira por sí solo— y luego a comparar las cuatro arquitecturas monofásicas más comunes por su par de arranque, y a diagnosticar fallas típicas leyendo, como lo haría un técnico con un óhmetro en la mano, las resistencias entre los tres terminales C, S y R.`,
  conceptos: [
    { icono: '🧲', nombre: 'Campo pulsante: por qué un solo devanado no arranca', descripcion: 'Una corriente monofásica en un devanado produce un campo magnético que crece y decrece sobre el mismo eje espacial —un campo pulsante—, no un campo giratorio. Un campo pulsante ejerce par nulo sobre un rotor detenido: el motor "zumba" pero no arranca por sí solo.' },
    { icono: '🌀', nombre: 'Devanado auxiliar: el desfase que crea el arranque', descripcion: 'El devanado auxiliar (o de arranque) usa alambre más delgado y de mayor resistencia que el principal, lo que retrasa su corriente lo suficiente para que, combinada con la del devanado principal, produzca un campo giratorio parcial —justo el que el rotor necesita para arrancar.' },
    { icono: '🔌', nombre: 'El capacitor: más desfase, más par de arranque', descripcion: 'Poner un capacitor en serie con el devanado auxiliar aumenta el desfase eléctrico de 25°-30° (fase partida simple) a 80°-90° —mucho más cercano al ideal de 90° de un campo giratorio verdadero— lo que puede triplicar o más el par de arranque disponible.' },
    { icono: '⚙️', nombre: 'Interruptor centrífugo: desconectar lo que ya no se necesita', descripcion: 'Cerca del 75% de la velocidad nominal, un interruptor accionado por la fuerza centrífuga del propio eje desconecta el devanado auxiliar (y su capacitor, si lo hay) — ese devanado está diseñado para el esfuerzo breve del arranque, no para operar de forma continua.' },
  ],
  mision: [
    'ENSAMBLA · Arma el motor monofásico pieza por pieza: devanado principal, devanado auxiliar, rotor de jaula de ardilla, tapas, interruptor centrífugo, ventilador y capacitor de arranque.',
    'TIPOS · Compara las cuatro arquitecturas monofásicas —fase partida, capacitor de arranque, capacitor permanente y capacitor de arranque y marcha— por su par de arranque, corriente y uso típico.',
    'DIAGNÓSTICO · Interpreta lecturas de óhmetro entre los terminales Común, Start y Run para reconocer seis escenarios de falla, desde un motor sano hasta un devanado en corto a tierra.',
    'RETO · Dado un conjunto de lecturas sin nombre, identifica la falla correcta entre seis diagnósticos posibles, como lo haría un técnico de mantenimiento en campo.',
  ],
  aplicaciones: [
    { area: 'Selección del tipo de motor monofásico para una carga doméstica o comercial', ejemplo: 'Un compresor hermético de refrigeración necesita mucho par de arranque contra la presión ya acumulada en el sistema —típicamente un motor CSIR o CSCR—, mientras que un extractor de aire, con arranque casi sin carga, funciona bien y en silencio con un motor PSC de un solo capacitor permanente.' },
    { area: 'Diagnóstico de campo de un motor monofásico que no arranca', ejemplo: 'Un técnico que encuentra un motor que "zumba pero no gira" mide con un óhmetro la resistencia entre los tres terminales del motor desenergizado: un devanado auxiliar abierto (lectura OL entre Común-Start) es una de las causas más comunes de ese síntoma exacto.' },
    { area: 'Reemplazo seguro de un capacitor de arranque o marcha', ejemplo: 'Antes de sustituir un capacitor sospechoso, se verifica su continuidad con el óhmetro: un capacitor en corto (≈0 Ω) deja arrancar al motor pero con corriente elevada y riesgo de disparo térmico, mientras que uno abierto (sin continuidad) impide el arranque casi por completo.' },
  ],
};

export default briefing;
