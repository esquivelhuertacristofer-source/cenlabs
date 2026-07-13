import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: 'MEC-31',
  titulo: 'Diagnóstico de la ECU: Alimentaciones, Tierras y Comunicación',
  subtitulo: 'Autotrónica · Alimentación constante/conmutada, tierras de potencia/señal y referencia de 5 V compartida',
  acento: '#2A9D8F',
  duracion: 45,
  bienvenida: `¡De vuelta en la bahía de CEN Labs! Ya usaste el osciloscopio para leer el bus CAN, la red que conecta a las ECU entre sí. Hoy cambias de capa otra vez: en vez de mirar la red, miras a la ECU misma, y a todo lo que la rodea antes de que puedas siquiera sospechar de ella.\n\nUn técnico con experiencia nunca empieza revisando la computadora: empieza revisando su entorno eléctrico. ¿Tiene alimentación? ¿Tiene una tierra limpia? ¿La referencia que comparten sus sensores está sana? La mayoría de las "ECU dañadas" que llegan a un taller resultan ser exactamente esto — un pin de su entorno, no la computadora en sí.\n\nEl conector con el que trabajas hoy es genérico y representativo: agrupa las categorías de pines más comunes de una ECU real (alimentación constante, alimentación conmutada, tierra de potencia, tierra de señal, referencia de 5 V, bus CAN, y dos sensores que dependen de esa referencia), pero no es el clon de ningún conector estandarizado — ni siquiera el propio conector de diagnóstico estandariza la referencia de 5 V; esa vive en el conector propio de cada ECU, específico de fabricante.\n\nVas a recorrer 4 casos. En el Caso 1 confirmas cómo se ve una ECU sana: alimentación presente, tierras limpias, referencia estable. En el Caso 2 mides una tierra de señal que en reposo parece sana — hasta que activas una carga real y su caída de tensión revela una falla que estaba ahí todo el tiempo, desplazando en silencio cada sensor que depende de ella. En el Caso 3 llegas con tres códigos de sensor "fuera de rango" a la vez, y aprendes a no cambiar tres sensores cuando en realidad uno solo, con un corto interno, está arrastrando el riel de referencia que comparten los demás. Y en el Caso 4 un pin marca 0 V y todo apunta a un circuito abierto — hasta que confirmas el estado de la llave y descubres que ese pin estaba diseñado para apagarse exactamente así.\n\nAl final vas a poder mirar cualquier pin de una ECU y preguntarte, antes que nada: ¿qué se supone que debería estar leyendo aquí, en este estado del sistema? ¡A las puntas del multímetro!`,
  conceptos: [
    { icono: '🔋', nombre: 'Alimentación constante vs. conmutada', descripcion: 'La alimentación de batería está siempre viva, con o sin contacto — mantiene viva la memoria de la ECU. La alimentación conmutada solo se energiza con la llave en contacto o marcha: leer 0 V ahí con la llave apagada es el comportamiento esperado, no una falla.' },
    { icono: '🧷', nombre: 'Tierra de potencia vs. tierra de señal', descripcion: 'La tierra de señal es dedicada y de baja resistencia para que la ECU mida a los sensores con precisión; la tierra de potencia retorna corrientes más grandes (inyectores, actuadores) y tolera algo más de caída. Dañar la tierra de señal desplaza cada lectura de sensor referida a ella.' },
    { icono: '🎚️', nombre: 'Referencia de 5 V compartida', descripcion: 'Varios sensores analógicos (MAP, TPS) se alimentan del mismo riel regulado de 5 V. Un solo sensor con un corto interno a tierra puede arrastrar todo el riel y producir códigos simultáneos en sensores que en realidad están sanos.' },
    { icono: '📉', nombre: 'Caída de tensión bajo carga', descripcion: 'Una tierra dañada casi nunca se nota en reposo: la caída de tensión solo aparece cuando hay corriente real circulando. ≤0.1 V bajo carga es sano; más de 0.3 V indica corrosión o mal contacto — valores típicos de diagnóstico, consulta el manual del fabricante para cifras exactas.' },
  ],
  mision: [
    'FASE 1 · Caso ECU sana — confirma cómo se ve una base eléctrica sana: alimentación de batería presente, tierras limpias, referencia de 5 V estable.',
    'FASE 2 · Caso Tierra en alta resistencia — mide la tierra de señal sin carga y bajo carga, y relaciona la caída de tensión con el desplazamiento silencioso de cada sensor que depende de ella.',
    'FASE 3 · Caso Corto en la referencia de 5 V — aísla, sensor por sensor, cuál de los que comparten el riel es el que realmente tiene el corto interno.',
    'FASE 4 · Caso Alimentación conmutada — antes de declarar un circuito abierto, confirma el estado de la llave.',
  ],
  aplicaciones: [
    { area: 'Diagnóstico automotriz', ejemplo: 'Antes de reemplazar una ECU por sospecha de daño, confirmar que su alimentación, sus tierras y su referencia de 5 V están sanas — la mayoría de los "módulos dañados" resultan ser justamente esto.' },
    { area: 'Autotrónica de posventa', ejemplo: 'Explicar a un cliente por qué tres códigos de sensor a la vez no siempre significan tres sensores dañados, sino un riel de referencia compartido arrastrado por uno solo.' },
    { area: 'Electrónica industrial', ejemplo: 'Aplicar la misma disciplina de "revisar el entorno antes que el módulo" — alimentación, tierra dedicada, referencia compartida — a cualquier controlador industrial con sensores analógicos.' },
  ],
  retos: [
    'Explica por qué una tierra de señal dañada puede pasar inadvertida con el motor apagado y solo revelarse con un consumidor real activo.',
    'Dado un patrón de códigos de falla en varios sensores que comparten la misma referencia de 5 V, describe el procedimiento para aislar cuál de ellos tiene el corto real.',
    'Explica por qué "0 V en un pin" no siempre significa circuito abierto, usando el ejemplo de la alimentación conmutada.',
  ],
};

export default briefing;
