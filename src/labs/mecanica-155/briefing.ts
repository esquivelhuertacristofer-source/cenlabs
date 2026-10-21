import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-155",
  titulo: "Control vectorial (FOC) del motor de tracción: de tres corrientes a dos números",
  subtitulo: "Autotrónica",
  acento: "#2A9D8F",
  duracion: 40,
  videoUrl: '',
  bienvenida: `Conviertes las tres corrientes que giran del motor en dos números fijos para controlar su fuerza fácilmente.
Un motor de coche eléctrico recibe tres corrientes que suben y bajan sin parar. Mirándolas desde el rotor, que gira con ellas, se vuelven dos números quietos: uno empuja (da el par) y el otro sube o baja el campo del imán. Un regulador mueve la tensión hasta que esos dos números lleguen adonde se piden.
Primero calculas el par que dan dos corrientes; luego ajustas qué tan rápido es el regulador y cómo repartes la corriente para seguir un escalón de par a cierta velocidad; al final diagnosticas por qué falla un control mal ajustado.`,
  conceptos: [
    { icono: '🔄', nombre: 'Clarke y Park: de tres ondas a dos números', descripcion: 'Las tres corrientes son las sombras de una sola flecha que gira. Si miras desde el rotor, la flecha queda quieta y sus dos componentes, id e iq, son constantes: así un regulador PI puede controlarlas.' },
    { icono: '⚙️', nombre: 'Par = imanes + reluctancia', descripcion: 'T = 3/2·p·(ψm·iq + (Ld − Lq)·id·iq). La iq da casi todo el par; con imanes interiores, una id negativa añade par de reluctancia, y el MTPA reparte la corriente para usar la menor posible.' },
    { icono: '⚡', nombre: 'Se acaba la tensión: debilitar el campo', descripcion: 'Al girar, los imanes inducen una tensión que crece con la velocidad y se come la del inversor. Con una id negativa se resta flujo y la tensión vuelve a caber, a costa de más corriente.' },
  ],
  mision: [
    'Calcula el par que dan una id y una iq dadas, separando la parte de los imanes y la de reluctancia.',
    'Elige la rapidez del lazo, la parte integral y el reparto de la corriente para seguir un escalón de par sin pasarte, rápido, sin dejar la tensión al tope y sin calentar de más.',
    'Diagnostica si un control falla por un lazo lento, una parte integral excesiva, falta de tensión o falta de desacople.',
  ],
  aplicaciones: [
    { area: 'Vehículos eléctricos', ejemplo: 'El inversor de cualquier coche eléctrico con motor de imanes permanentes calcula id e iq miles de veces por segundo para dar el par que pide el pedal, y debilita el campo para llegar a altas velocidades.' },
    { area: 'Motores industriales y robótica', ejemplo: 'Los servomotores de las máquinas CNC y de los robots usan el mismo control vectorial para dar par suave a baja velocidad y responder rápido a un escalón de carga.' },
  ],
};

export default briefing;
