import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: 'MEC-70',
  titulo: 'Potencia en CA: Mide P, Q, S y el Factor de Potencia de Cargas Reales',
  subtitulo: 'Circuitos Eléctricos · Corriente alterna (CA)',
  acento: '#2A9D8F',
  duracion: 30,
  videoUrl: '',
  bienvenida: `Hasta ahora mediste impedancia (Z=R+jX), la barriste en frecuencia para encontrar resonancia, y leíste desfase con un osciloscopio. Es momento de preguntar algo más práctico: ¿cuánta potencia consume realmente una carga en corriente alterna, y por qué la Comisión Federal de Electricidad no solo te cobra por los watts que usas?

Una carga con impedancia Z=R+jX consume tres tipos de potencia. La potencia activa P=S·cos θ es la que hace trabajo útil — mueve un motor, enciende un foco, calienta una resistencia — y se mide en watts. La potencia reactiva Q=S·sin θ no hace trabajo neto: oscila de ida y vuelta entre la fuente y los campos magnético o eléctrico de la carga (un motor o un transformador la necesitan para magnetizarse), y se mide en VAR. La potencia aparente S=V·I es la que realmente "ocupa" la capacidad de cables, transformadores e interruptores — se mide en VA, y es siempre mayor o igual que P. La razón entre ambas, el factor de potencia FP=cos θ=P/S, mide qué tan eficientemente se usa esa capacidad instalada: FP=1 significa que toda la potencia aparente es útil; un FP bajo significa que se está pagando (en tamaño de cableado y transformadores) mucha capacidad que no produce trabajo.

En este banco vas a combinar dos cargas reales en paralelo sobre el mismo bus de voltaje — como dos máquinas conectadas al mismo circuito de una planta — y vas a descubrir algo que no es obvio a primera vista: las potencias activa y reactiva de ambas cargas se SUMAN directamente (P_total=P1+P2, Q_total=Q1+Q2), pero la potencia aparente total NO es la suma de las aparentes individuales. Debe recalcularse desde cero como S_total=√(P_total²+Q_total²), porque las corrientes de ambas cargas no están en fase entre sí. Vas a medir esa potencia total con un osciloscopio de dos canales — igual que mediste desfase en la práctica de resonancia — y a verificar el triángulo de potencias resultante.`,
  conceptos: [
    { icono: '⚡', nombre: 'Potencia activa P=S·cos θ', descripcion: 'La componente de la potencia aparente que hace trabajo útil: mueve un eje, calienta una resistencia, enciende un foco. Se mide en watts (W) y es la única que factura directamente la energía consumida.' },
    { icono: '🌀', nombre: 'Potencia reactiva Q=S·sin θ', descripcion: 'La componente que oscila entre la fuente y los campos magnético o eléctrico de la carga sin producir trabajo neto — necesaria para magnetizar un motor o un transformador. Se mide en VAR (volt-ampere reactivo).' },
    { icono: '📐', nombre: 'Potencia aparente S=V·I', descripcion: 'La hipotenusa del triángulo de potencias: S=√(P²+Q²). Es la que dimensiona cables, interruptores y transformadores, y se mide en VA. Siempre S≥P.' },
    { icono: '🎯', nombre: 'Factor de potencia FP=cos θ=P/S', descripcion: 'Mide qué fracción de la potencia aparente instalada se convierte en trabajo útil. Con dos cargas en paralelo, P y Q se suman directamente, pero S_total=√(P_total²+Q_total²) NO es la suma de las S individuales — las corrientes de cada carga no están en fase entre sí.' },
  ],
  mision: [
    'EXPLORA · Configura libremente el tipo (resistiva, inductiva o capacitiva) y los valores de dos cargas reales en paralelo. Observa en el triángulo de potencias cómo se suman los vectores (P,Q) de cada carga y cómo cambia la resultante total.',
    'MEDICIÓN · Ambas cargas son conocidas, pero el ángulo de potencia total queda sellado. Mide el desfase entre voltaje y corriente con el osciloscopio (igual que en la práctica de resonancia) y calcula P, Q, S y FP totales.',
    'RETO · Ambas cargas son conocidas, pero la corriente total (magnitud y fase) queda sellada — debes leerla directamente de la traza del osciloscopio. Calcula la cantidad pedida (P, Q, S o FP total) y comprueba tu resultado.',
  ],
  aplicaciones: [
    { area: 'Facturación industrial y penalización por bajo factor de potencia', ejemplo: 'CFE penaliza a plantas industriales cuyo factor de potencia cae por debajo de 0.90 — el motivo es exactamente este banco: cargas inductivas (motores, transformadores) consumen Q sin pagarlo directamente, pero obligan a sobredimensionar toda la instalación eléctrica.' },
    { area: 'Dimensionamiento de transformadores y cableado', ejemplo: 'Un transformador se especifica en kVA (potencia aparente), no en kW — si el FP de la carga total es bajo, se necesita un transformador más grande para entregar los mismos watts útiles, exactamente como mide S_total en este banco.' },
    { area: 'Diagnóstico de instalaciones con múltiples cargas', ejemplo: 'En una planta real, decenas de motores y equipos comparten el mismo bus; medir P, Q, S y FP totales con un analizador de potencia es el primer paso para decidir dónde y cuánta corrección de factor de potencia se necesita.' },
  ],
};

export default briefing;
