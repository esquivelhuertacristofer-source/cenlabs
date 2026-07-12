import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-23",
  titulo: "Pérdidas de un MOSFET de Potencia en PWM: Conducción, Conmutación y Frecuencia de Cruce",
  subtitulo: "Electrónica de potencia · Pcond=D·I²·RDS(on), Psw=½·V·I·fsw·(tr+tf) y el cruce entre ambas",
  acento: "#2A9D8F",
  duracion: 35,
  videoUrl: '',
  bienvenida: `En la práctica anterior viste que el simulador de regiones de operación mostraba RDS(on) como referencia de catálogo, sin usarlo en ningún cálculo. Esta práctica es donde esa cifra por fin entra en acción: ahora vas a poner el mismo MOSFET a conmutar en PWM y a calcular cuánto calor disipa de verdad.

Un MOSFET conmutando pierde energía por dos caminos distintos. Mientras conduce, se comporta como una resistencia RDS(on) — esa pérdida de conducción crece con el cuadrado de la corriente y con el ciclo de trabajo. Pero cada vez que enciende o apaga, durante unos nanosegundos atraviesa una región intermedia donde tiene voltaje y corriente altos al mismo tiempo — esa pérdida de conmutación crece directamente con la frecuencia. Un MOSFET de potencia bien elegido para 1 kHz puede sobrecalentarse gravemente en el mismo circuito a 500 kHz, sin cambiar ni la corriente ni el voltaje.

En esta práctica vas a repartir la disipación total entre esos dos mecanismos, encontrar la frecuencia exacta donde se igualan — la frecuencia de cruce — y descubrir por qué esa frecuencia cambia con el dispositivo, la corriente y el ciclo de trabajo. También vas a toparte con un caso honesto de dato faltante: el 2N7000 no tiene tr+tf publicado en ninguna hoja de datos consultada, así que el simulador se niega a inventar una cifra para su pérdida de conmutación.`,
  conceptos: [
    { icono: '🔥', nombre: 'Pérdida de conducción', descripcion: 'Pcond=D·I²·RDS(on): mientras el MOSFET conduce, se comporta como una resistencia fija RDS(on) de hoja de datos; la pérdida crece con el cuadrado de la corriente y escala directamente con el ciclo de trabajo D.' },
    { icono: '⚡', nombre: 'Pérdida de conmutación', descripcion: 'Psw=½·V·I·fsw·(tr+tf): durante cada encendido y apagado, el MOSFET atraviesa unos nanosegundos con voltaje y corriente altos simultáneamente; esa pérdida escala directamente con la frecuencia de conmutación fsw.' },
    { icono: '⚖️', nombre: 'Frecuencia de cruce', descripcion: 'fsw*=2·D·I·RDS(on)/(V·(tr+tf)): el punto exacto donde Pcond=Psw. Por debajo de fsw* domina la conducción; por encima, domina la conmutación — y ambas partes del circuito importan para elegir el dispositivo correcto.' },
    { icono: '🚫', nombre: 'Honestidad ante el dato faltante', descripcion: 'El 2N7000 no tiene tr+tf publicado en ninguna hoja de datos consultada: el simulador no inventa una cifra, muestra "no disponible" para su pérdida de conmutación y solo calcula la pérdida de conducción.' },
  ],
  mision: [
    'FASE 1 · Explora: elige entre IRF540N, IRLZ44N y 2N7000, ajusta el bus V, la corriente de carga I, el ciclo de trabajo D y la frecuencia fsw, y observa cómo se reparten Pcond y Psw sobre la gráfica y el banco 3D.',
    'FASE 2 · Predicción: predice qué pérdida domina a una frecuencia dada, o estima Ptot numéricamente, antes de que el simulador lo confirme.',
    'FASE 3 · Barrido: recorre fsw a lo largo de un rango y observa en vivo el cruce exacto donde Pcond y Psw se igualan.',
    'FASE 4 · Reto de diseño: encuentra una combinación de D, I y fsw que mantenga al MOSFET dentro de sus límites de catálogo (ID máx, VDS máx, Ptot) para el dispositivo y bus V asignados.',
  ],
  aplicaciones: [
    { area: 'Elección de frecuencia de conmutación', ejemplo: 'Un convertidor buck o boost diseñado a 20 kHz sufre pérdidas de conmutación pequeñas pero un rizado de corriente grande (bobina más voluminosa); el mismo circuito a 500 kHz reduce el rizado y el tamaño de la bobina, pero la pérdida de conmutación puede volverse dominante si el MOSFET no fue elegido para conmutar rápido.' },
    { area: 'Selección de dispositivo por RDS(on) vs. tr+tf', ejemplo: 'Un MOSFET con RDS(on) muy bajo suele tener una compuerta más grande y, por lo tanto, tr+tf más largo — el dispositivo ideal para conducción continua a baja frecuencia no es necesariamente el ideal para conmutar rápido, y viceversa.' },
    { area: 'Disipador y presupuesto térmico', ejemplo: 'Antes de dimensionar un disipador, un diseñador de potencia necesita saber cuánto de la disipación total viene de conducción (que no cambia con fsw) y cuánto de conmutación (que sí) — el mismo reparto que calcula esta práctica.' },
  ],
  retos: [
    'Si subes la frecuencia de conmutación fsw sin cambiar nada más, ¿qué le pasa a Pcond y qué le pasa a Psw? ¿Por qué una sube y la otra no?',
    'El 2N7000 no tiene tr+tf publicado. Si igual quisieras usarlo para conmutar a alta frecuencia, ¿qué medición de laboratorio tendrías que hacer tú mismo antes de confiar en él?',
    'Dos MOSFET tienen el mismo RDS(on) pero uno tiene un tr+tf mucho más corto que el otro. ¿En qué tipo de circuito elegirías el de conmutación rápida, y en cuál te daría exactamente igual?',
  ],
};

export default briefing;
