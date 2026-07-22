import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: 'MEC-68',
  titulo: 'Impedancias RLC: Calcula y Mide un Circuito Serie o Paralelo',
  subtitulo: 'Circuitos Eléctricos · Corriente alterna (CA)',
  acento: '#2A9D8F',
  duracion: 30,
  videoUrl: '',
  bienvenida: `En la práctica anterior mediste el desfase entre dos señales senoidales cualesquiera — un desfase que el simulador configuraba o sellaba directamente, como un número dado. Pero en un circuito real ese desfase no aparece de la nada: lo produce la impedancia de los elementos reactivos (bobinas y capacitores) que componen el circuito. Una resistencia R se opone a la corriente sin desfasarla; una bobina L y un capacitor C sí la desfasan, y en direcciones opuestas. La combinación de los tres —R, L y C— define un número complejo, la impedancia Z=R+jX, cuya magnitud |Z| dice "cuánto se opone" el circuito y cuyo ángulo θz dice "cuánto desfasa" la corriente respecto al voltaje.

Este banco te da un circuito RLC de tres elementos, en dos topologías posibles: serie (R, L y C en un solo lazo, misma corriente) o paralelo (los tres conectados a las mismas dos terminales, mismo voltaje). Vas a alimentarlo con una fuente senoidal de voltaje conocido y vas a MEDIR la corriente que circula con la misma técnica de instrumentación real que ya dominas: un resistor "shunt" de precisión (1 Ω) en serie con la rama, cuyo voltaje —proporcional a la corriente por la Ley de Ohm— se observa en el canal 2 del osciloscopio. El canal 1 sigue siendo tu referencia (el voltaje aplicado); comparando sus cruces por cero contra los del canal 2 obtienes exactamente el mismo tipo de desfase que ya sabes medir. Solo que ahora ese desfase no es un número arbitrario: es −θz, el ángulo de la impedancia del circuito, y tú vas a deducirlo, no solo leerlo.

En el modo Reto, uno de los tres componentes (R, L o C, según la ronda) queda sellado. Tu trabajo es medir |Z| y θz con el osciloscopio —igual que antes— y despejar el valor del componente oculto a partir de las ecuaciones de la topología activa. Es el mismo principio de "caja negra" del banco de Thévenin/Norton (d1-04), aplicado ahora a corriente alterna: la medición no te da el componente directamente, te da lo necesario para calcularlo.`,
  conceptos: [
    { icono: '🔗', nombre: 'Impedancia Z=R+jX', descripcion: 'Número complejo que combina la oposición resistiva (R) y la reactiva (X=XL−XC) de un circuito de CA. Su magnitud |Z| limita la corriente (I=V/|Z|); su ángulo θz es el desfase que introduce entre voltaje y corriente.' },
    { icono: '🌀', nombre: 'Reactancia inductiva y capacitiva', descripcion: 'XL=ωL crece con la frecuencia (la bobina se opone más rápido a los cambios de corriente); XC=1/(ωC) decrece con la frecuencia (el capacitor se "ve" como un cortocircuito a alta frecuencia). Se oponen entre sí en el eje imaginario de Z.' },
    { icono: '⚡', nombre: 'Serie vs. paralelo', descripcion: 'En serie, R, L y C comparten la MISMA corriente y sus impedancias se suman directamente: Z=R+j(XL−XC). En paralelo comparten el MISMO voltaje y se suman sus admitancias (inversos): Y=1/R+j(ωC−1/ωL), con Z=1/Y.' },
    { icono: '📏', nombre: 'Medición de corriente por shunt', descripcion: 'Un resistor de precisión conocido (1 Ω) en serie con la rama convierte la corriente en un voltaje proporcional (v_shunt=Rs·i), visible en el segundo canal del osciloscopio — la misma técnica que usa una pinza de corriente real, sin alterar la fase medida.' },
  ],
  mision: [
    'EXPLORA · Elige la topología (serie o paralelo) y ajusta libremente R, L, C y la frecuencia. Observa en tiempo real cómo cambian |Z|, θz y las trazas de voltaje/corriente en el osciloscopio.',
    'MEDICIÓN · El sistema sella un componente y su combinación con los otros dos produce una impedancia oculta. Mide |Z| y θz con voltaje (canal 1) y corriente vía shunt (canal 2), y compara contra el valor calculado internamente.',
    'RETO · Un componente (R, L o C, según la ronda) queda sellado. Mide |Z| y θz con el osciloscopio y despeja el valor del componente oculto a partir de las ecuaciones de la topología activa.',
  ],
  aplicaciones: [
    { area: 'Corrección del factor de potencia', ejemplo: 'Una carga inductiva industrial (motores, balastros) presenta θz>0: consume potencia reactiva que penaliza la factura eléctrica. Calcular el capacitor de corrección exacto exige resolver la misma ecuación de impedancia paralelo que practicas en este banco.' },
    { area: 'Diseño de filtros pasivos', ejemplo: 'Un filtro RLC pasa-banda o rechaza-banda se diseña eligiendo R, L y C para que |Z| y θz tengan el comportamiento deseado en la frecuencia de interés — la misma relación Z(ω) que exploras aquí, aplicada al diseño de audio, RF o instrumentación.' },
    { area: 'Diagnóstico de fallas en bobinados', ejemplo: 'Un devanado de motor con espiras en corto cambia su inductancia efectiva, lo que se detecta midiendo la impedancia del devanado con un puente RLC o, de forma más básica, con la técnica de voltaje/corriente y desfase que practicas en este banco.' },
  ],
};

export default briefing;
