/* Ficha técnica — Métodos de Arranque de Motores de Inducción: Corriente de Irrupción */
fichaTecnica({
  title: 'Métodos de arranque de motores de inducción: corriente de irrupción (directo, estrella-delta, autotransformador)',
  intro: 'El modelo arma un banco con un <b>motor de inducción trifásico</b> y un <b>tablero de arranque</b> intercambiable, y compara tres métodos de arranque usados en la industria para limitar la corriente de irrupción (inrush) que el motor toma en el instante del arranque, cuando el rotor todavía está detenido: arranque directo (DOL, "a través de la línea"), arranque estrella-delta (Y-Δ) y arranque por autotransformador con derivación (tap) ajustable. Para cada método, el lab calcula en tiempo real la corriente de línea, el par de arranque y —solo en el caso del autotransformador— la corriente del lado del motor, y los grafica contra la derivación del autotransformador en un tablero-pizarrón.',
  s1: {
    presentes: 'Motor de inducción de banco (carcasa, tapas, eje y polea, reutilizando el modelo de motor de d5-05/d5-06); gabinete de arranque con tres contactores esquemáticos cuya disposición cambia según el método elegido — un contactor de línea "KL" para arranque directo; "KL"+"KY" (cerrado)+"KΔ" (abierto) para estrella-delta; "KL"+"AUTOTRAFO" (con etiqueta de derivación)+"KB" (abierto, de bypass) para autotransformador; un dial giratorio de derivación (tap) ligado al control deslizante; dos cajas de despliegue digital (corriente de línea y par de arranque, o corriente de línea y corriente de motor); cableado de banco; y un tablero-pizarrón con la curva de corriente de línea y de par de arranque contra la derivación a, más las marcas de las derivaciones típicas y de la derivación de equivalencia con estrella-delta.',
    omitidos: [
      '<b>Temporizador y lógica de enclavamiento del gabinete real (KY/KΔ nunca cerrados a la vez, retardo de transición)</b>: el simulador selecciona el método con un botón y aplica su fórmula de reducción de forma instantánea; la lógica de control que en un gabinete real evita el cortocircuito entre líneas durante la transición no se modela como circuito de control, solo se asume correcta.',
      '<b>Devanado interno del motor y su circuito equivalente</b>: ya se construyeron y explicaron en d5-05/d5-06; aquí el motor se trata como una caja con una corriente y un par de arranque nominales conocidos (placa), y el lab se concentra exclusivamente en cómo cada método de arranque reduce esos valores.',
      '<b>Relevador térmico de sobrecarga y demás protecciones del gabinete</b>: forman parte de un arrancador real pero no participan en el cálculo de corriente/par de arranque que es el objeto de esta práctica; se omiten para no saturar el ensamble con piezas que no tienen efecto en la física mostrada.',
    ],
  },
  s2: {
    title: 'Ecuaciones que gobiernan cada método de arranque',
    warn: 'Todo se expresa como múltiplos de los valores de arranque a través de la línea (DOL): ILR = corriente de arranque DOL / corriente nominal, TLR = par de arranque DOL / par nominal. Los otros métodos reducen esos múltiplos por un factor k que depende del método y, en el autotransformador, de la derivación a.',
    rows: [
      ['Método', 'Factor k', 'Corriente de línea', 'Par de arranque', 'Nota'],
      ['Directo (DOL)', 'k = 1', 'Ilínea = ILR', 'Tarranque = TLR', 'sin reducción; máxima corriente y máximo par de arranque'],
      ['Estrella-delta (Y-Δ)', 'k = 1/3', 'Ilínea = ILR/3', 'Tarranque = TLR/3', 'reducción fija de fábrica; el devanado ve tensión de fase en vez de tensión de línea'],
      ['Autotransformador', 'k = a²', 'Ilínea = ILR·a²', 'Tarranque = TLR·a²', 'a = derivación (tap), 0.35 ≤ a ≤ 1.0; a=1 equivale a DOL'],
      ['Autotransformador — lado motor', '—', 'Imotor = ILR·a', '—', 'el autotransformador reduce la corriente de línea con a² pero la del lado del motor solo con a: es la única asimetría Ilínea≠Imotor de los tres métodos'],
    ],
  },
  s3: [
    'Motor de inducción de banco con corriente y par de arranque de placa conocidos (código de letra NEMA o dato equivalente del fabricante) — sustituido aquí por los múltiplos ilustrativos ILR y TLR del simulador (ver §6).',
    'Equipo de arranque estrella-delta: tres contactores (línea, estrella, delta) y un temporizador de transición, o su equivalente de laboratorio didáctico.',
    'Equipo de arranque por autotransformador: autotransformador trifásico con derivaciones fijas (p. ej. 50/65/80 %) y su juego de contactores (línea, autotransformador, bypass).',
    'Amperímetro de gancho (pinza) con captura de pico, o registrador de corriente, para medir la corriente de irrupción real en el instante del arranque.',
    'Dinamómetro, sensor de par o tacómetro con estimación indirecta, para verificar el par de arranque real entregado por el motor bajo cada método.',
  ],
  s4: {
    intro: 'El lab reduce cada método de arranque a una fórmula algebraica que se aplica de forma instantánea al seleccionar el método. Un ensayo de banco real involucra maniobrar el gabinete físico y observar fenómenos transitorios que el modelo no reproduce.',
    items: [
      'Transición de estrella a delta (o de autotransformador a línea): en la realidad, si el temporizador abre el contactor de la etapa reducida antes de cerrar el de línea plena (transición abierta), aparece un pico de corriente transitorio adicional al reconectar el motor girando a una fuente desfasada respecto a su fem interna — el modelo solo muestra el estado "ya en la etapa reducida" o "ya en línea plena", nunca ese instante de conmutación.',
      'Caída de tensión en la fuente durante el arranque: un motor grande arrancando directo puede hacer caer la tensión de la red lo suficiente para afectar a otros equipos conectados — el simulador asume una fuente ideal que nunca se abate, sin importar la corriente de irrupción calculada.',
      'Las derivaciones de un autotransformador real son posiciones físicas discretas del devanado (típicamente 3 o 4 valores fijos) que se cambian con el equipo desenergizado — el control deslizante continuo de a en el modelo es una simplificación pedagógica para explorar la fórmula, no una operación que se pueda hacer en vivo sobre un autotransformador real.',
      'Verificación de que el motor acelera y llega a velocidad antes de que actúe el retardo de transición — el modelo no simula la aceleración del rotor en el tiempo (eso es objeto de la curva par-velocidad de d5-06); aquí cada método se evalúa únicamente en el instante de rotor bloqueado (arranque).',
    ],
  },
  s5: {
    modela: 'la reducción multiplicativa de la corriente de irrupción y del par de arranque respecto al arranque directo (DOL), para los tres métodos más usados en la práctica: k=1 (directo), k=1/3 (estrella-delta, fijo) y k=a² (autotransformador, ajustable con la derivación a); la asimetría propia del autotransformador entre la corriente de línea (reducida por a²) y la corriente del lado del motor (reducida solo por a), consecuencia directa de que el autotransformador es, él mismo, un transformador; y el punto de equivalencia exacto <b>a=1/√3≈0.577</b>, en el cual un autotransformador reproduce exactamente la misma reducción de corriente y par que el arranque estrella-delta (k=1/3 en ambos) — una relación derivada algebraicamente de las dos fórmulas, no un valor ajustado a mano.',
    noModela: 'la dinámica transitoria de la conmutación entre etapas (pico de corriente al abrir/cerrar contactores durante la transición, especialmente en transición abierta); el calentamiento del devanado ni el ciclo de trabajo permitido del equipo de arranque; la caída de tensión que la propia corriente de irrupción provoca en la fuente; la aceleración del rotor en el tiempo (el modelo evalúa cada método únicamente en el instante de rotor bloqueado, no la rampa completa hasta velocidad nominal); ni arrancadores suaves de estado sólido o variadores de frecuencia (VFD), que son un cuarto método común en la industria pero fuera del alcance de esta práctica.',
  },
  s6: [
    '⚑ Los múltiplos de arranque directo ILR=6.5 (corriente) y TLR=1.5 (par), y las derivaciones típicas de autotransformador [50%, 65%, 80%], son valores <b>ilustrativos del simulador</b> —consistentes con el orden de magnitud típico de un motor NEMA Diseño B (corriente de arranque de 5 a 7 veces la nominal)— pero no corresponden a la placa de un motor comercial específico; no deben citarse como dato de fabricante.',
    '⚑ Referencia normativa: IEC 60947-4-1 (contactores y arrancadores de motor — parte del alcance de un gabinete de arranque real) y NEMA ICS (normas de equipo de control industrial en Norteamérica). Las cláusulas específicas aplicables a los valores numéricos del simulador no han sido confirmadas por un experto revisor; se citan como referencia general del tema.',
    'Referencia curricular: programas ELE-III y EM-IV.1 (arranque y control de máquinas eléctricas), según la lista maestra de esta práctica.',
  ],
});
