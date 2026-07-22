fichaTecnica({
  title: 'Fasores de Señales Senoidales y Medición de Desfase',
  intro: 'Una señal senoidal de corriente alterna v(t)=Vm·sen(ωt+φ) se puede representar como un fasor: un vector de magnitud Vm y ángulo φ que "congela" la rotación implícita a la frecuencia angular ω. Esta representación solo tiene sentido para comparar señales de la MISMA frecuencia — no le preguntas a un fasor "¿en qué ángulo está esta señal en este instante?" sino "¿cuánto le adelanta o le atrasa a la otra?". Ese desfase se mide con un osciloscopio de dos canales ubicando el instante en que cada señal cruza cero en el MISMO sentido (ambas ascendentes o ambas descendentes), nunca comparando picos ni mezclando tipos de cruce.',
  s1: {
    presentes: [
      'Modelo exacto de señal senoidal de doble canal v(t)=Vm·sen(2π·f·t+φ), sin ruido ni aproximación, con canal 1 fijo como referencia (Vm1=10 V, φ1=0°) y canal 2 con amplitud, frecuencia y fase configurables o sellables según el modo activo',
      'Diagrama fasorial polar sincronizado en tiempo real con el osciloscopio de dos trazos, con escala de magnitud común (Vm/Vm_max) y convención de fase seno explícita: v(t)=Vm·sen(ωt+φ) ↔ fasor V=Vm∠φ',
      'Mecanismo de medición de desfase por cursores de cruce por cero, uno por canal, con ajuste automático (snap) al cruce más cercano de esa señal —ascendente o descendente, tipo que queda registrado internamente— y cálculo exacto φ_medido=−Δt·360°/T, con Δt normalizado al periodo',
      'Verificación algebraica del método: se demostró numéricamente (21,600 combinaciones de ángulo de desfase, frecuencia y posición de cursor) que el desfase recuperado es EXACTO cuando ambos cursores usan el mismo tipo de cruce, sin importar en qué par específico de cruces caiga cada uno',
      'Detección y retroalimentación explícita del error de referencia inconsistente: si un cursor se ancla en un cruce ascendente y el otro en uno descendente, el desfase calculado difiere del valor real en exactamente 180° (mod 360°), de forma sistemática y predecible — verificado numéricamente, no una falla aleatoria',
      'Calificación independiente de amplitud (lectura visual en la rejilla volts/división, tolerancia ±8%) y desfase (medición por cursores, tolerancia ±5°) en el modo Reto',
    ],
    omitidos: [
      'Relación de fase producida por un circuito real con reactancia (RC, RL o RLC) — el desfase del canal 2 es un parámetro configurado o sellado directamente por el simulador, no derivado de una impedancia Z=R+j(ωL−1/ωC); esa relación es el tema declarado de la siguiente práctica del backlog (d1-10, impedancias RLC)',
      'Ruido de instrumentación, ancho de banda finito del osciloscopio o distorsión armónica de la señal — ambos canales son señales senoidales puras, exactas, sin limitación de muestreo real',
      'Impedancia de entrada del osciloscopio ni efecto de carga sobre un circuito medido — los dos canales se modelan como fuentes de voltaje ideales, no como mediciones tomadas sobre un circuito con impedancia propia',
      'Componentes de CD superpuestos, transitorios de arranque ni contenido armónico — ambas señales son puramente senoidales en estado estacionario desde t=0',
      'Sistemas trifásicos ni secuencia de fases — el banco es estrictamente de dos canales/dos señales; la sincronización de un generador a la red con las tres fases ya se practica, a otro nivel, en el banco de sincronización de alternador (mecanica-54)',
    ],
  },
  s2: {
    title: 'Elementos del banco',
    warn: 'Valores configurables o sellados por el modo activo — en un banco real cada generador de funciones tendría su propia tolerancia de calibración.',
    rows: [
      ['CH1', 'Generador de referencia', 'Vm=10 V, φ=0°, fijo', 'Siempre visible; es la referencia angular contra la que se mide el canal 2 en todos los modos'],
      ['CH2', 'Generador de señal a caracterizar', 'Vm∈{4,8,12,16,20} V · φ∈[−180°,180°] · f∈{60,120,250,500} Hz', 'Amplitud, frecuencia y fase configurables en Explora; sellados parcial o totalmente en Medición y Reto según el modo'],
      ['Osciloscopio', 'Instrumento simulado de dos trazos', 'Ventana ≈3.3 periodos, rejilla volts/división', 'Cursores independientes por canal con snap automático al cruce por cero más cercano'],
      ['Diagrama fasorial', 'Pizarrón polar sincronizado', 'Escala común Vm/Vm_max', 'Dibuja el vector de cada canal en tiempo real; el vector del canal 2 se oculta u opaca según lo que el modo activo permita revelar'],
    ],
  },
  s3: [
    'Dos generadores de señal senoidal (CH1 referencia fija, CH2 configurable) con pantalla digital de amplitud y fase',
    'Osciloscopio simulado de dos trazos con cursores de cruce por cero independientes',
    'Diagrama fasorial polar sincronizado en tiempo real con el osciloscopio',
    'Cableado de banco codificado por color (verde azulado = canal 1, ámbar = canal 2)',
  ],
  s4: {
    intro: 'Procedimiento para explorar, medir y resolver un desfase sellado:',
    items: [
      'En el modo Explora, ajusta libremente la amplitud, la frecuencia y el desfase del canal 2 con los controles del panel, y observa en tiempo real cómo el osciloscopio de dos trazos y el diagrama fasorial polar reflejan cada cambio — el vector del canal 2 siempre es visible y su ángulo coincide exactamente con el knob del generador.',
      'En el modo Medición, el sistema sella el desfase del canal 2 (amplitud y frecuencia quedan visibles). Arrastra el cursor de cada canal sobre el osciloscopio: al soltarlo, se ajusta automáticamente al cruce por cero más cercano de esa señal. Presiona "Medir φ" y verifica que ambos cursores usaron el MISMO tipo de cruce (ambos ascendentes o ambos descendentes) antes de confiar en el resultado — si no coinciden, el sistema señala el error de 180° explícitamente.',
      'En el modo Reto, el sistema sella tanto la amplitud como el desfase del canal 2 (solo la frecuencia queda visible). Lee la amplitud contando divisiones en la rejilla volts/división, mide el desfase con los cursores de cruce por cero, y reporta ambos valores — el sistema califica cada campo de forma independiente, sin presupuesto de mediciones bloqueante.',
    ],
  },
  s5: {
    modela: 'Modelo exacto de señal senoidal de doble canal v(t)=Vm·sen(2π·f·t+φ) con canal 1 fijo como referencia; diagrama fasorial polar sincronizado en tiempo real con convención de fase seno explícita; mecanismo de medición de desfase por cursores de cruce por cero con snap automático al cruce más cercano por canal y cálculo exacto Δt→φ; detección y retroalimentación del error sistemático de 180° por referencia de cruce inconsistente, verificado numéricamente en 21,600 combinaciones; calificación independiente de amplitud (lectura de rejilla) y desfase (medición por cursores) en el modo Reto.',
    noModela: 'Relación de fase derivada de un circuito real con reactancia (RC, RL, RLC) — el desfase es un parámetro configurado o sellado directamente por el simulador, no el resultado de una impedancia Z=R+j(ωL−1/ωC); ruido de instrumentación ni ancho de banda finito del osciloscopio; impedancia de entrada ni efecto de carga del instrumento; componentes de CD superpuestos, transitorios ni contenido armónico; sistemas trifásicos ni secuencia de fases — es un modelo de dos señales senoidales puras en estado estacionario.',
  },
  s6: [
    'Hayt, W. H., Kemmerly, J. E. y Durbin, S. M. — Análisis de circuitos en ingeniería (McGraw-Hill): representación fasorial de señales senoidales, fundamento teórico central de esta práctica.',
    'Boylestad, R. — Introductory Circuit Analysis (Pearson): fasores y medición de desfase con osciloscopio de dos canales.',
    'IEC 60027-1 — Letter symbols to be used in electrical technology: notación de fasores y magnitudes de corriente alterna.',
    'IEEE Std 280 — Standard Letter Symbols for Quantities Used in Electrical Science and Electrical Engineering: convenciones de símbolos para fasores y ángulos de fase.',
    'Manuales de aplicación de osciloscopios (p. ej. Tektronix, "XYZs of Oscilloscopes") — la medición de desfase por cruces por cero como método estándar de instrumentación, más robusto que comparar picos en una señal con ruido.',
  ],
});
