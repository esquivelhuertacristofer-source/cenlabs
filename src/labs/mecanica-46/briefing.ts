import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-46",
  titulo: "Grupo Vectorial: Bancos Trifásicos y Desfase Angular",
  subtitulo: "Transformadores · Conexión de bancos",
  acento: "#3A6EA5",
  duracion: 45,
  videoUrl: '',
  bienvenida: `Tres transformadores monofásicos idénticos, cada uno con sus propios cuatro terminales, se arman en un banco trifásico. Pero antes de energizarlo hay que decidir dos cosas en cada lado del banco: ¿el primario va en estrella o en delta? ¿el secundario va en estrella o en delta? Y una tercera decisión, más sutil: ¿cuál extremo del devanado de alta tensión se toma como referencia? Esas tres decisiones —topología del primario, topología del secundario, polaridad de referencia— no son solo cuestión de gusto: fijan un desfase angular exacto entre la tensión de línea de alta y la de baja, que la norma IEC 60076-1 expresa como una hora de reloj. Dyn11, por ejemplo, no es un nombre arbitrario: dice "delta en alta, estrella con neutro en baja, y baja atrasa a alta 330°" — que es lo mismo que decir que baja adelanta a alta 30°.

Ese dato —el grupo vectorial— importa tanto como la relación de transformación, porque dos bancos con grupos vectoriales incompatibles no pueden operar en paralelo sin generar corrientes circulantes destructivas: sus fasores de línea, aunque tengan la misma magnitud, apuntan a horas distintas del reloj. Este laboratorio construye el grupo vectorial en vivo a partir de las tres decisiones —nunca de una tabla memorizada— para que la fórmula detrás del rótulo deje de ser una receta y se vuelva un cálculo que se puede rehacer para cualquier combinación.`,
  conceptos: [
    { icono: '⭐', nombre: 'Estrella (Y) vs. delta (D): θ_ref = 0° o 30°', descripcion: 'En estrella, los tres finales de devanado se unen en un neutro común y las líneas salen de los inicios: la tensión de línea coincide en fase con la tensión de fase (θ_ref=0°). En delta, el final de un devanado se une al inicio del siguiente formando un anillo: la tensión de línea es la resta fasorial de dos tensiones de fase, lo que introduce un corrimiento fijo de 30° (θ_ref=30°).' },
    { icono: '🔄', nombre: 'Polaridad de referencia: un giro de 180°', descripcion: 'Invertir cuál extremo del devanado primario se llama "H1" no es un recableado — es un cambio de qué fasor se toma como cero. Ese cambio de referencia gira el fasor de alta tensión exactamente 180°, y por lo tanto desplaza igual de 180° el desfase medido hacia baja tensión.' },
    { icono: '🕐', nombre: 'Convención de reloj (IEC 60076-1, Cl. 3.10.6)', descripcion: 'El fasor de línea de alta tensión se fija a las 12 en punto. El fasor de línea de baja tensión se lee en la posición horaria a la que "atrasa" respecto de alta tensión, donde cada hora equivale a 30°. Dyn11 significa que baja tensión atrasa 330° a alta tensión (idéntico a decir que adelanta 30°) — un grupo distinto de Dyn1, que atrasaría solo 30°.' },
    { icono: '⚡', nombre: 'Familias de paralelismo: horas pares vs. impares', descripcion: 'Los ocho grupos posibles de este banco caen en dos familias: hora par (0 o 6, desfase de 0° o 180°, propia de combinaciones Y-Y o D-D) y hora impar (desfase de ±30°, propia de combinaciones Y-D o D-Y). Dos bancos solo pueden operar en paralelo si comparten la misma familia y, dentro de ella, la misma hora exacta.' },
  ],
  mision: [
    'FASE 1 · Explora: reconoce el banco de tres unidades monofásicas idénticas, cada una con sus cuatro terminales propios (H1, H2 de alta tensión; X1, X2 de baja tensión).',
    'FASE 2 · Conexión Y/D: cambia la topología de cada lado del banco y observa cómo se re-arma el amarre físico de los puentes entre unidades.',
    'FASE 3 · Fasor: invierte la polaridad de referencia de alta tensión y sigue el diagrama de reloj para entender cómo se calcula el grupo vectorial resultante en cada una de las 8 combinaciones posibles.',
    'FASE 4 · Reto: con una conexión dada (oculta), predice el desfase en grados y la hora del reloj antes de revelar el grupo vectorial.',
  ],
  aplicaciones: [
    { area: 'Puesta en paralelo de bancos trifásicos', ejemplo: 'Antes de cerrar el interruptor que une dos bancos, el ingeniero debe confirmar que comparten grupo vectorial, relación de transformación y secuencia de fases — un desfase de solo 30° entre bancos supuestamente "iguales" produce corrientes circulantes que pueden dañar el equipo.' },
    { area: 'Selección de conexión para sistemas de distribución', ejemplo: 'La conexión Dyn11 es ampliamente usada en distribución porque el lado delta ofrece un camino cerrado para componentes de secuencia cero y armónicos de tercer orden, mientras que el lado estrella-neutro entrega la tensión fase-neutro que necesitan las cargas monofásicas.' },
    { area: 'Interpretación de placas de transformadores', ejemplo: 'Leer correctamente un rótulo como "Dyn11" en la placa de un transformador —sin confundirlo con Dyn1 o Dyn5— es indispensable antes de instalarlo o de ponerlo en paralelo con equipo existente.' },
  ],
};

export default briefing;
