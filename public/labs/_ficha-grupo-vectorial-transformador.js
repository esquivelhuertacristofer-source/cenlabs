/* Ficha técnica — Grupo Vectorial: Bancos Trifásicos de Transformadores */
fichaTecnica({
  title: 'Grupo vectorial de bancos trifásicos — el reloj de fases (Dyn11, Yyn0...)',
  intro: 'El modelo arma un banco trifásico con <b>tres transformadores monofásicos idénticos</b>, cada uno con sus propios cuatro terminales (H1, H2 en alta tensión; X1, X2 en baja tensión). Al conectar cada lado del banco en <b>estrella (Y)</b> o <b>delta (D)</b>, y al fijar la <b>polaridad</b> de referencia del lado de alta tensión, queda determinado un desfase angular fijo entre el fasor de línea de alta tensión y el de baja tensión. Ese desfase, expresado como una "hora" de reloj (1 hora = 30°) según IEC 60076-1, es el <b>grupo vectorial</b> del banco — un dato de placa tan importante como la relación de transformación, porque bancos con grupos incompatibles no pueden operar en paralelo.',
  s1: {
    presentes: 'Banco de tres unidades monofásicas idénticas, cada una con tanque propio y sus cuatro bujes rotulados (H1, H2 de alta tensión; X1, X2 de baja tensión); postes de línea de alta y de baja tensión, y postes de neutro (visibles solo cuando el lado correspondiente está en estrella); puentes/jumpers que amarran las unidades según la topología Y o D elegida; una marca de polaridad (punto) sobre el terminal de referencia de alta tensión de cada unidad; una placa de lectura con el rótulo del grupo vectorial resultante; un pizarrón esquemático interactivo con el diagrama de devanados y el diagrama de reloj de fases.',
    omitidos: [
      '<b>Núcleo y devanados internos de cada unidad</b>: cada tanque se representa cerrado, como una unidad de servicio real — el arrollamiento de cobre y el núcleo laminado no son geometría independiente (mismo criterio que las prácticas hermanas d5-01/d5-02).',
      '<b>Recableado físico al invertir la polaridad</b>: invertir la polaridad de alta tensión es, en este modelo, un cambio de referencia (qué extremo del devanado se llama "H1"), no una operación de campo — el amarre 3D del banco (jumpers) solo se reconstruye cuando cambia la topología Y/D de un lado, nunca por el toggle de polaridad, que únicamente mueve la marca de polaridad y recalcula el fasor. Ver §5.',
      '<b>Instrumentación de medición de fase real</b> (fasímetro, osciloscopio de dos canales para comparar formas de onda): el grupo vectorial se calcula y se muestra directamente, sin modelar el procedimiento de campo para determinarlo por medición (p. ej. el método del transformador auxiliar o el de las tres lámparas).',
    ],
  },
  s2: {
    title: 'Las 8 combinaciones posibles de este banco',
    warn: 'El rótulo de cada grupo (letra de AT + letra de BT + hora) se calcula en tiempo real con las fórmulas de §5 — nunca se transcribe de una tabla fija. Esta lista es solo un resumen de las 8 salidas posibles con este banco de 3 interruptores (primario Y/D, secundario Y/D, polaridad normal/invertida).',
    rows: [
      ['Primario', 'Secundario', 'Polaridad', 'Grupo'],
      ['Y', 'Y', 'normal', 'Yyn0'],
      ['Y', 'Y', 'invertida', 'Yyn6'],
      ['Y', 'D', 'normal', 'Yd1'],
      ['Y', 'D', 'invertida', 'Yd7'],
      ['D', 'Y', 'normal', 'Dyn11'],
      ['D', 'Y', 'invertida', 'Dyn5'],
      ['D', 'D', 'normal', 'Dd0'],
      ['D', 'D', 'invertida', 'Dd6'],
    ],
  },
  s3: [
    'Tres transformadores monofásicos de especificación idéntica (mismo grupo de trabajo que d5-01/d5-02) — un banco trifásico exige unidades con la misma relación de transformación e impedancia para repartir la carga de forma pareja.',
    'Puentes/jumpers de interconexión entre unidades (para armar Y o D en cada lado) y hacia las líneas del banco.',
    'Marcas de polaridad de fábrica en cada unidad (sustituto de la prueba de polaridad por golpe inductivo/kick test que se hace en campo antes de armar el banco).',
    'Un fasímetro o el método de las tres lámparas, para verificar en campo que dos bancos que se pondrán en paralelo comparten secuencia de fases y grupo vectorial (no modelado — ver §1).',
  ],
  s4: {
    intro: 'El lab reduce el armado de un banco trifásico a su núcleo de decisión: elegir Y o D en cada lado y fijar la polaridad de referencia, para luego leer el grupo vectorial resultante. Un armado de campo real añade pasos de verificación previos que el modelo no reproduce.',
    items: [
      'Prueba de polaridad (kick test) de cada unidad antes de integrarla al banco, para confirmar cuál extremo es realmente H1 — aquí la polaridad de cada unidad se toma como un dato ya conocido y correcto.',
      'Verificación de secuencia de fases (ABC vs. ACB) del sistema de alimentación antes de energizar el banco — el modelo asume una secuencia de fases fija y correcta.',
      'Prueba de paralelismo entre bancos (grupo vectorial, relación de transformación y secuencia de fases deben coincidir) antes de cerrar el interruptor de paralelo — no modelada; este lab cubre solo el cálculo del grupo de un banco, no la verificación de compatibilidad entre dos bancos.',
      'Reconexión física de los puentes de un banco real al cambiar de Y a D (o viceversa) implica destrenzar y volver a conectar cables con el banco desenergizado — aquí el cambio de topología se anima instantáneamente.',
    ],
  },
  s5: {
    modela: 'las 8 combinaciones posibles de este banco (Y/D en cada lado × polaridad normal/invertida de AT) y su grupo vectorial exacto según la convención de reloj de IEC 60076-1 (el fasor de AT se fija como referencia a las 12; el de BT se lee en la hora a la que "atrasa" respecto de AT, 1 hora = 30°); el ángulo de referencia que aporta cada topología (θ_ref=0° en estrella, 30° en delta, por el corrimiento entre tensión de línea y de fase); el giro de 180° que produce invertir la polaridad de referencia de AT; la familia de paralelismo resultante (grupos de hora par —0°/180°— vs. hora impar —±30°—, que es la condición necesaria de compatibilidad angular entre bancos).',
    noModela: 'el recableado físico del banco al invertir la polaridad de AT — se trata como un cambio de referencia, no como una operación de campo (ver §1); la prueba de polaridad (kick test) que en campo determina cuál terminal es H1 en cada unidad; la verificación de secuencia de fases del sistema de alimentación; la prueba de compatibilidad de paralelo entre dos bancos distintos (el lab calcula el grupo de UN banco, no compara dos); impedancias, corrientes de excitación ni el detalle interno de cada unidad (ver práctica hermana d5-02, que sí los modela).',
  },
  s6: [
    '<b>IEC 60076-1:2011 Ed.3.0</b> — Transformadores de potencia, Parte 1: Generalidades. Cláusula 3.10.6 y su Nota 2 (definición del desfase angular y convención de reloj: BT se lee en la hora a la que atrasa respecto de AT). Cláusula 7.1.5 (el grupo vectorial como dato que debe declararse junto con la relación de transformación).',
    '<b>ANSI/IEEE C57.12.00</b> — norma de referencia estadounidense para transformadores de distribución y potencia; a diferencia de IEC, la práctica ANSI/IEEE típicamente expresa el desfase solo en grados, sin la convención de reloj de 12 posiciones.',
    '<b>CFE K0000-04</b> — especificación mexicana de transformadores de distribución y potencia (misma convención de terminales H1/H2-X1/X2 usada en d5-01/d5-02).',
    '⚑ La designación de líneas del banco con mayúsculas (A, B, C en AT) y minúsculas (a, b, c en BT) usada en el pizarrón del lab es práctica de libro de texto ampliamente extendida; no se verificó una cláusula IEC específica que la exija en esta sesión — pendiente de confirmación contra el texto normativo primario.',
    '⚑ Las afirmaciones de que la conexión delta "ofrece mejor camino a corrientes armónicas de tercer orden/circulantes" o que "Dyn11 es el grupo por defecto en la práctica europea de distribución" son argumentos de ingeniería ampliamente citados en la literatura de transformadores, pero no se verificaron aquí contra una cláusula normativa específica ni contra una cifra comparativa (p. ej. un factor "10×") con una fuente primaria — se presentan como contexto cualitativo, no como dato de placa.',
  ],
});
