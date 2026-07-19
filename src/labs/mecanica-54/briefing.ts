import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-54",
  titulo: "Sincronización de un Alternador a la Red",
  subtitulo: "Máquinas eléctricas · Puesta en paralelo con la red",
  acento: "#3A6EA5",
  duracion: 35,
  videoUrl: '',
  bienvenida: `Antes de que un alternador pueda entregar energía a una red ya energizada, tiene que "entrar en fase" con ella: si el interruptor se cierra en el momento equivocado, el resultado no es una conexión suave sino un choque eléctrico y mecánico que puede dañar la máquina y perturbar a todo lo que ya está conectado a esa red. Por eso todo operador aprende las mismas cuatro condiciones antes de tocar el interruptor: igual tensión, igual frecuencia, igual secuencia de fases e igual ángulo de fase.

Este laboratorio te pone frente al mismo tablero que usaría un operador de planta: un sincronoscopio que gira mientras la frecuencia no coincide y se detiene cuando el ángulo es cero, un indicador de tres lámparas que delata una secuencia de fases invertida, y un interruptor que solo debes cerrar cuando las cuatro luces están en verde. Tu misión es aprender a leer esos instrumentos y, en el modo Reto, a diagnosticar —antes de cerrar— cuál de las cuatro condiciones es la que realmente está fallando.`,
  conceptos: [
    { icono: '🔄', nombre: 'El sincronoscopio: una aguja que cuenta la diferencia de frecuencia', descripcion: 'Mientras la frecuencia del generador no sea idéntica a la de la red, la aguja del sincronoscopio gira continuamente — más rápido cuanto mayor es la diferencia. Cuando se detiene apuntando "arriba", el ángulo de fase entre generador y red es cero: ese es el instante correcto para cerrar el interruptor, nunca antes.' },
    { icono: '💡', nombre: 'Las tres lámparas: el método clásico para detectar secuencia invertida', descripcion: 'Si la secuencia de fases del generador coincide con la de la red, las tres lámparas conectadas entre fases correspondientes se apagan y encienden juntas. Si la secuencia está invertida, las lámparas se encienden y apagan una tras otra, en secuencia rotativa — un patrón que ningún sincronoscopio de aguja puede revelar por sí solo.' },
    { icono: '⚡', nombre: 'Las cuatro condiciones son independientes entre sí', descripcion: 'Tensión, frecuencia, secuencia de fases y ángulo de fase se evalúan cada una por separado. Es perfectamente posible que tres de las cuatro estén dentro de tolerancia y la cuarta no lo esté — y cerrar el interruptor en ese caso sigue siendo un error, aunque el sincronoscopio "parezca" estar en la posición correcta.' },
    { icono: '🚫', nombre: 'La secuencia de fases invertida es la falla más severa', descripcion: 'Un error de tensión o de ángulo produce una corriente circulante transitoria proporcional al error. Una secuencia de fases invertida, en cambio, produce un cortocircuito franco entre fases en el instante mismo del cierre —es la única de las cuatro condiciones que no admite ninguna tolerancia: o coincide, o no se cierra el interruptor.' },
  ],
  mision: [
    'EXPLORA · Mueve la tensión y la frecuencia del generador y observa cómo responden el sincronoscopio, las lámparas y las cuatro condiciones del tablero de telemetría.',
    'COMPARA · Invierte la secuencia de fases y usa el indicador dedicado para distinguir, sin ambigüedad, una secuencia correcta de una invertida.',
    'SINCRONIZA · Ajusta las cuatro condiciones hasta que el tablero marque las cuatro en verde y cierra el interruptor en el instante correcto.',
    'RETO · Ante un escenario con exactamente una condición fuera de tolerancia, diagnostica cuál es antes de decidir si cierras el interruptor.',
  ],
  aplicaciones: [
    { area: 'Puesta en servicio de un generador nuevo en una planta', ejemplo: 'La primera vez que se conecta un generador nuevo a una red, un técnico debe verificar la secuencia de fases con un indicador dedicado antes de cualquier intento de sincronización — conectar con la secuencia invertida en la primera puesta en servicio es un error clásico y costoso que este paso previene.' },
    { area: 'Sincronización manual de un generador de respaldo', ejemplo: 'En una planta con generación de respaldo, el operador ajusta el regulador de velocidad del generador para hacer coincidir la frecuencia con la red, observa el sincronoscopio y cierra el interruptor en el instante en que la aguja pasa por la posición de las 12 — el mismo procedimiento que reproduce este laboratorio.' },
    { area: 'Diagnóstico de un disparo tras una sincronización fallida', ejemplo: 'Si un interruptor de sincronización dispara inmediatamente después de cerrar, comparar cuál de las cuatro condiciones (tensión, frecuencia, secuencia, ángulo) estaba fuera de tolerancia en el instante del cierre es el primer paso para diagnosticar si el relevador de protección actuó correctamente o si hubo un error de maniobra.' },
  ],
};

export default briefing;
