import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-39",
  titulo: "Etapa de salida Clase AB: disipación, polarización VBE y disipador",
  subtitulo: "Electrónica de potencia · par complementario TIP31C/TIP32C, distorsión de cruce y Tj=Ta+P·ΣRθ",
  acento: "#E76F51",
  duracion: 35,
  videoUrl: '',
  bienvenida: `Esta es la última práctica de la Tanda 1 (D2 — Electrónica analógica y de potencia), y cierra el arco con el mismo tipo de circuito que probablemente ya usaste sin saberlo: la etapa de salida de cualquier amplificador de audio, desde una bocina Bluetooth hasta un equipo de sonido de banda. Un amplificador Clase AB usa dos transistores complementarios (uno NPN, uno PNP) conectados en configuración push-pull: uno empuja corriente hacia la carga en el semiciclo positivo, el otro la absorbe en el semiciclo negativo. Si no se polarizan en absoluto (Clase B pura), aparece un defecto audible llamado distorsión de cruce: una pequeña "zona muerta" cerca del cruce por cero donde ningún transistor conduce todavía. La solución es polarizar ambos transistores con una corriente de reposo pequeña, típicamente mediante una red llamada "multiplicador VBE" (un tercer transistor configurado para replicar y amplificar su propia caída base-emisor).

Pero polarizar tiene un costo: cada transistor de salida disipa calor, y ese calor tiene que salir de la unión de silicio (Tj) a través de la cápsula, hacia un disipador, hacia el aire — una cadena térmica Tj=Ta+P·ΣRθ que no puede violarse sin destruir el transistor. Aquí aparece la sorpresa central de esta práctica: la disipación de potencia en los transistores NO es máxima cuando el amplificador suena más fuerte. Es máxima en un punto intermedio, Vo_pk=2Vcc/π≈63.7% del riel de alimentación — un resultado que se obtiene derivando la fórmula de disipación e igualándola a cero, no por intuición. Diseñar el disipador pensando solo en "el volumen máximo" es un error común: hay que diseñar para el peor caso real, que ocurre a volumen moderado-alto, no al tope.`,
  conceptos: [
    { icono: '🔀', nombre: 'Push-pull complementario (Clase AB)', descripcion: 'Un transistor NPN conduce el semiciclo positivo, un PNP conduce el negativo, ambos en configuración seguidor de emisor. Una pequeña corriente de reposo (bias) mantiene ambos transistores levemente encendidos para evitar la distorsión de cruce de la Clase B pura.' },
    { icono: '📈', nombre: 'Disipación máxima en Vo_pk=2Vcc/π, NO al volumen máximo', descripcion: 'P_diss=P_supply−P_load es una parábola con un máximo interno: derivando respecto a Vo_pk e igualando a cero se obtiene Vo_pk=2Vcc/π≈0.637·Vcc — el punto de mayor estrés térmico, no el de mayor volumen.' },
    { icono: '🌡️', nombre: 'Cadena térmica: Tj=Ta+P·ΣRθ', descripcion: 'El calor generado en la unión del transistor (Tj) viaja a través de una cadena de resistencias térmicas (RθJC de la cápsula, RθCS de la interfaz, RθSA del disipador) hasta el ambiente (Ta). Si Tj supera Tj_max, el transistor falla.' },
    { icono: '⚡', nombre: 'Multiplicador VBE: V_CE=VBE·(1+R1/R2)', descripcion: 'Un transistor conectado como "multiplicador VBE" (con dos resistores R1/R2) fija con precisión la tensión de polarización de reposo entre las bases de los transistores de salida, y además compensa automáticamente con la temperatura porque su propia VBE cambia con Tj de forma similar a los transistores de potencia.' },
  ],
  mision: [
    'FASE 1 · Explora: ajusta Vcc, RL, la amplitud de salida Vo_pk, la polarización (multiplicador VBE) y el disipador, y observa cómo cambian la disipación de cada transistor, la temperatura de unión Tj y la distorsión de cruce.',
    'FASE 2 · Predicción: predice la disipación, la temperatura de unión o si hay distorsión de cruce con la configuración actual, antes de que el simulador revele el valor real.',
    'FASE 3 · Medición: ejecuta un barrido automático de amplitud de salida y observa en la gráfica cómo la disipación sube, alcanza su máximo en 2/π, y vuelve a bajar cerca del volumen máximo.',
    'FASE 4 · Reto: para un Vcc y RL objetivo, elige la polarización y el disipador que eliminen la distorsión de cruce y mantengan la unión por debajo del margen de diseño seguro, incluso en el peor caso de amplitud.',
  ],
  aplicaciones: [
    { area: 'Amplificadores de audio', ejemplo: 'Prácticamente todo amplificador de audio de potencia moderada (equipos de sonido, amplificadores de instrumento, bocinas activas) usa una etapa de salida Clase AB con un disipador dimensionado para el peor caso térmico, no para el volumen máximo aparente.' },
    { area: 'Reguladores lineales de potencia', ejemplo: 'Los reguladores de voltaje lineales de alta corriente (no conmutados) usan un transistor de paso cuya disipación también depende de la diferencia de voltaje y la corriente, y requieren el mismo análisis de cadena térmica Tj=Ta+P·ΣRθ para elegir el disipador correcto.' },
    { area: 'Diseño de disipadores en electrónica de potencia', ejemplo: 'Cualquier técnico que selecciona un disipador comercial para un transistor de potencia debe leer su hoja de datos (RθJC, y a veces datos de doble interfaz transitoria según JEDEC JESD51-14) y calcular el peor caso de disipación del circuito específico, no solo el caso "típico".' },
  ],
  retos: [
    'Con Vcc y RL fijos, activa el botón de "peor caso" que cambia SOLO la amplitud de salida al punto 2/π — compara la temperatura de unión resultante contra la del punto de referencia a volumen bajo, sin tocar ningún otro parámetro.',
    'Reduce la polarización del multiplicador VBE hasta "bases unidas" (Clase B pura) y observa en la curva de transferencia cómo aparece la zona muerta de distorsión de cruce; luego auméntala hasta el nivel nominal y verifica que la zona muerta desaparece.',
    'Arma (o simula en un software de circuitos) una etapa de salida Clase AB real con un par complementario de transistores de potencia y un multiplicador VBE, mide con un termopar la temperatura de la cápsula a distintas amplitudes de señal, y contrasta el punto de mayor temperatura contra la predicción Vo_pk=2Vcc/π de este simulador.',
  ],
};

export default briefing;
