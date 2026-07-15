/* Ficha técnica — Generador de CD autoexcitado: curva de magnetización */
fichaTecnica({
  title: 'Generador de CD autoexcitado (shunt): autoexcitación y resistencia crítica',
  intro: 'Este laboratorio resuelve, en tiempo real, el problema clásico de la <b>autoexcitación</b> de un generador de CD conectado en derivación (shunt): el devanado de campo toma su propia corriente de excitación de los bornes que el generador produce, formando un lazo cerrado. El punto de equilibrio de ese lazo — dónde la recta del circuito de campo cruza la curva de magnetización de la máquina — se calcula de forma exacta (cerrada, sin iteración) para cualquier combinación de reóstato de campo Rf y velocidad n, y se contrasta contra la <b>resistencia crítica</b> a partir de la cual el generador deja de autoexcitar.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> curva de magnetización con forma de saturación tipo Fröhlich E0(If) = Em·If/(Ik+If); escalamiento de la fem con la velocidad E(If,n) = E0(If)·(n/n0), consecuencia directa de la ley de Faraday a flujo constante; punto de operación de autoexcitación en forma cerrada (intersección recta–curva); resistencia crítica Rc(n) = Rc0·(n/n0), que <b>emerge</b> de la pendiente de la curva en el origen (Rc0 = Em/Ik) y no está codificada aparte; operación exclusivamente en vacío (bornes abiertos, sin carga externa).',
    omitidos: [
      '<b>Resistencia de armadura ni caída IaRa</b>: el análisis es de vacío puro (corriente de armadura = corriente de campo, sin corriente de carga); un ensayo con carga real añadiría la caída Ia·Ra y la reacción de inducido.',
      '<b>Reacción de inducido</b>: la corriente de armadura bajo carga distorsiona el flujo de campo; en vacío esa distorsión no existe, así que el modelo no la incluye.',
      '<b>Histéresis y remanencia más allá del arranque</b>: el modelo asume que siempre existe magnetismo remanente suficiente para iniciar el lazo (si Rf &lt; Rc(n)); no reproduce la curva de histéresis completa ni la posibilidad real de remanencia insuficiente o de polaridad invertida.',
      '<b>Saturación bajo carga ni caída de tensión por regulación</b>: la curva de magnetización que se muestra es la de <b>vacío</b>; el comportamiento de un generador shunt con carga (que además debe resolver la caída en el devanado de armadura) es un ensayo distinto.',
      '<b>Temperatura del devanado de campo</b>: la resistencia del devanado (parte de lo que forma Rf en la práctica) no varía con la temperatura en este modelo; Rf se controla como parámetro directo.',
      '<b>Inductancia de campo ni dinámica temporal del arranque</b>: el lab resuelve el <b>punto de equilibrio</b> del lazo de autoexcitación, no la trayectoria en el tiempo (segundos) de cómo la tensión sube desde el remanente hasta ese punto.',
    ],
  },
  s2: {
    title: 'Ecuaciones del modelo',
    warn: 'Los valores de If, Vt, Rc(n) y el estado (autoexcita/colapsa) se recalculan en vivo con las fórmulas siguientes a partir de Rf y n — nunca se leen de una tabla fija. Todos los parámetros de la máquina (Em, Ik, n0) son valores <b>ilustrativos del simulador</b> ⚑, no de una máquina real.',
    rows: [
      ['Cantidad', 'Fórmula', 'Nota'],
      ['Curva de magnetización (a n0)', 'E0(If) = Em·If / (Ik + If)', 'saturación tipo Fröhlich; Em = asíntota, Ik = corriente de rodilla'],
      ['Curva a velocidad n', 'E(If,n) = E0(If)·(n/n0)', 'Faraday: fem ∝ velocidad a flujo constante'],
      ['Resistencia crítica a n0', 'Rc0 = Em / Ik', 'pendiente de E0(If) en el origen (If=0)'],
      ['Resistencia crítica a n', 'Rc(n) = Rc0·(n/n0)', 'umbral: si Rf ≥ Rc(n), no autoexcita'],
      ['Punto de operación (forma cerrada)', 'If* = máx(0, Em·(n/n0)/Rf − Ik) · Vt* = Rf·If*', 'intersección exacta recta–curva; sin iteración numérica'],
    ],
  },
  s3: [
    'Generador de CD shunt de laboratorio (o motor de CD operado como generador) acoplado a un primomotor de velocidad variable.',
    'Reóstato de campo conectado en derivación (shunt) con la armadura, para variar Rf y localizar la resistencia crítica.',
    'Voltímetro en bornes (Vt) y amperímetro en el circuito de campo (If) — en el lab, ambos se leen directamente en la telemetría en vez de instrumentarse.',
    'Tacómetro para medir n, o un variador/dinamómetro que permita fijar la velocidad del primomotor con precisión.',
  ],
  s4: {
    intro: 'El lab reduce el ensayo de autoexcitación a mover dos controles (Rf, n) y leer el resultado en equilibrio. Un ensayo de banco real añade pasos de manejo del equipo que el modelo no reproduce.',
    items: [
      'Verificar magnetismo remanente antes de arrancar: si la máquina se desmagnetizó (por inversión de polaridad o inactividad prolongada), el generador real puede NO autoexcitar aunque Rf &lt; Rc(n) en teoría — hace falta "flashear" el campo con una fuente externa. El modelo asume remanente siempre presente.',
      'Levantar la curva de magnetización punto por punto: excitar el campo con una fuente externa separada, fijar varias If, medir Ea en vacío a velocidad constante, y graficar — así se obtiene la curva real de la máquina en vez de la forma Fröhlich genérica de este modelo.',
      'Ubicar la resistencia crítica de forma experimental: trazar la recta Vt=Rf·If como una cuerda tangente a la curva medida cerca del origen, no solo calcularla de una fórmula cerrada como aquí.',
      'Respetar la secuencia de arranque del primomotor y llevarlo a velocidad nominal antes de cerrar el circuito de campo, para evitar operar por debajo de la velocidad de diseño del ensayo.',
    ],
  },
  s5: {
    modela: 'la curva de magnetización de vacío con forma de saturación tipo Fröhlich E0(If) = Em·If/(Ik+If); el escalamiento de la fem con la velocidad E(If,n) = E0(If)·(n/n0), consecuencia de la ley de Faraday a flujo constante; el punto de operación exacto de autoexcitación (intersección cerrada entre la curva y la recta Vt=Rf·If del circuito de campo); y la resistencia crítica Rc(n) = Rc0·(n/n0), que se deriva matemáticamente de la pendiente de la curva en el origen y no es un valor codificado aparte — por eso el criterio "Rf &lt; Rc(n) autoexcita, Rf ≥ Rc(n) colapsa" es una consecuencia geométrica del modelo, no una regla añadida.',
    noModela: 'la resistencia de armadura ni la caída IaRa (el análisis es solo de vacío, sin carga externa); la reacción de inducido; la histéresis completa ni la posibilidad de remanencia insuficiente o invertida (el modelo asume remanente siempre suficiente); el comportamiento bajo carga (regulación de tensión); la temperatura del devanado de campo; ni la inductancia de campo o la dinámica temporal del arranque — se resuelve el punto de EQUILIBRIO del lazo de autoexcitación, no cómo evoluciona en el tiempo.',
  },
  s6: [
    '⚑ Este código de práctica no tiene una norma ancla (IEC/NOM/ANSI) específica listada en la lista maestra del proyecto — el modelo se apoya en teoría estándar de máquinas de CD autoexcitadas, presente en cualquier texto de referencia del área (p. ej. Fitzgerald, Kingsley &amp; Umans, "Electric Machinery"; Chapman, "Máquinas Eléctricas"; Say, "Performance and Design of DC Machines").',
    '⚑ Los parámetros de la máquina (Em = 150 V, Ik = 0.6 A, n0 = 1200 rpm) y la forma Fröhlich de la curva de magnetización son valores <b>ilustrativos del simulador</b>, elegidos para que la resistencia crítica resultante (Rc0 = 250 Ω) quede dentro del rango de control del reóstato — no corresponden a la placa de una máquina comercial real; no deben citarse como dato de fabricante.',
    'Referencia curricular: programa ELE-II.2 (máquinas eléctricas — generadores de CD), dentro del eje de conversión electromecánica del plan de estudios del sector.',
    '⚑ El límite inferior del control de Rf (60 Ω) es una decisión de diseño del simulador para mantener If* dentro de un rango ilustrativo en el extremo de máxima excitación — no representa un límite físico documentado de la máquina de ejemplo.',
  ],
});
