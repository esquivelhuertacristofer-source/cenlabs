import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-20",
  titulo: "Conmutación de Carga Inductiva y Diodo de Marcha Libre",
  subtitulo: "Electrónica de potencia · Protección de un switch frente al colapso de una bobina",
  acento: "#2A9D8F",
  duracion: 35,
  videoUrl: '',
  bienvenida: `Toda carga inductiva — el bobinado de un relevador, un solenoide, un motor DC — se opone a que su corriente cambie de golpe. Mientras el switch que la alimenta está cerrado, esto no se nota. El problema aparece en el instante en que lo abres: la bobina "quiere" seguir empujando la misma corriente, y si no le das un camino por dónde hacerlo, ese empuje aparece como un pico de voltaje que puede destruir el propio switch.

En esta práctica abres el switch de tres cargas distintas (un relevador de 5 V, un relevador/solenoide de 12 V, un motor DC) bajo tres estrategias de protección: sin nada, con un diodo de marcha libre, y con un clamp activo por zener. Vas a comparar dos cosas que están en tensión directa: qué tan rápido se apaga la corriente, y qué tanto voltaje tiene que soportar el switch mientras eso ocurre. Un diodo simple es seguro pero relativamente lento; un clamp por zener es varias veces más rápido, a cambio de un pico de voltaje mayor.

El transitorio real dura microsegundos o pocos milisegundos — demasiado rápido para verlo a simple vista. Por eso el simulador siempre reproduce la curva capturada en una ventana fija de cámara lenta, y te dice en pantalla cuánto dura la física real y cuánto se está estirando la animación para que puedas observarla.`,
  conceptos: [
    { icono: '🌀', nombre: 'Colapso del campo magnético', descripcion: 'Al abrir el switch, la energía almacenada en el campo magnético de la bobina (E=½·L·I²) tiene que ir a alguna parte — sin una trayectoria de descarga, aparece como un pico de voltaje sobre el propio switch.' },
    { icono: '↩️', nombre: 'Diodo de marcha libre', descripcion: 'Un diodo en antiparalelo con la bobina le da a la corriente una trayectoria de descarga a través de una caída de voltaje pequeña y constante (Vf) — el switch queda protegido, pero la corriente decae de forma relativamente lenta (τ=L/R).' },
    { icono: '⚡', nombre: 'Clamp activo por zener', descripcion: 'Un zener en serie con un diodo fuerza una caída de voltaje mayor (Vz+Vf) sobre la bobina durante la descarga, acelerando el apagado — a costa de exponer al switch a un voltaje pico más alto que con el diodo simple.' },
    { icono: '🐢', nombre: 'Cámara lenta declarada', descripcion: 'El transitorio real es de microsegundos a milisegundos; el simulador siempre lo reproduce en una ventana fija de 1.6 s y declara en pantalla el factor de escala real, en vez de fingir una velocidad que nadie podría percibir.' },
  ],
  mision: [
    'FASE 1 · Explora: elige una carga, un diodo y una topología de protección, abre el switch y observa la corriente colapsar en el osciloscopio del banco — compara qué tan rápido se apaga con cada topología.',
    'FASE 2 · Predice: dado un circuito y una topología concretos, predice el tiempo de apagado o el voltaje pico sobre el switch antes de que el simulador te lo confirme.',
    'FASE 3 · Medición: captura el transitorio, mide τ con el cursor de tiempo, y compara la energía disipada exacta contra la aproximación rápida ≈2·Vf/Vsupply — cuantifica cuánto se equivoca esa regla de bolsillo.',
    'FASE 4 · Reto de diseño: elige la topología de protección (y el zener, si aplica) que cumpla a la vez un tiempo de apagado máximo y un presupuesto de voltaje sobre el switch.',
  ],
  aplicaciones: [
    { area: 'Módulos de relevador para microcontrolador', ejemplo: 'Casi todo módulo de relevador comercial (como el Songle SRD-05VDC-SL-C) incluye un diodo de marcha libre soldado junto a la bobina — sin él, la corriente de conmutación del transistor de control puede dañarlo en pocos ciclos.' },
    { area: 'Conmutación de motores DC por PWM', ejemplo: 'Un MOSFET que conmuta un motor DC a alta frecuencia necesita un diodo de marcha libre rápido (típicamente Schottky) porque el circuito se abre y cierra miles de veces por segundo — un diodo lento no alcanza a apagarse entre pulsos.' },
    { area: 'Salidas de control industrial y automotriz', ejemplo: 'Solenoides y relevadores de 12–24 V en tableros de control suelen protegerse con un clamp activo (zener) cuando el tiempo de apagado importa —por ejemplo, para liberar rápido un actuador— aceptando a cambio un switch con mayor voltaje de ruptura.' },
  ],
  retos: [
    '¿Por qué abrir el switch de una carga inductiva sin ninguna protección puede destruirlo, aunque ese mismo switch funcione sin problema mientras el circuito está cerrado?',
    'Si el diodo de marcha libre es "seguro" para el switch, ¿por qué alguien elegiría un clamp activo por zener, que expone al switch a un voltaje pico mayor?',
    'En el modo Reto, ¿qué combinación de topología y zener te permitió cumplir a la vez el tiempo de apagado máximo y el presupuesto de voltaje del switch? ¿Qué pasó cuando intentaste la otra topología?',
  ],
};

export default briefing;
