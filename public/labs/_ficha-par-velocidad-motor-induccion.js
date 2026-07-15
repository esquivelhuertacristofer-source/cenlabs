/* Ficha técnica — Motor de Inducción: Deslizamiento y Curva Par-Velocidad */
fichaTecnica({
  title: 'Motor de inducción trifásico: deslizamiento y curva par-velocidad (jaula de ardilla)',
  intro: 'El modelo arma, pieza por pieza, un <b>motor de inducción trifásico de jaula de ardilla</b> — el motor más común en la industria, donde el estátor (fijo) recibe la alimentación trifásica y el rotor (jaula de barras cortocircuitadas) gira por inducción, sin ninguna conexión eléctrica externa a él. Una vez armado, el lab expone tres controles — frecuencia de línea f, número de polos p y par de carga TL — y calcula en tiempo real la velocidad síncrona ns, el deslizamiento s, la velocidad del rotor n y el par entregado T, mostrados tanto en un diagrama de deslizamiento como en la curva par–velocidad de Kloss.',
  s1: {
    presentes: 'Carcasa con aletas de enfriamiento y ventana de corte (pieza fija, típica de un motor TEFC); estátor con núcleo laminado y devanado trifásico (bobinas de las tres fases A/B/C, coloreadas para distinguirlas); rotor de jaula de ardilla (núcleo laminado + barras conductoras + anillos de cortocircuito + eje); tapa trasera con el muñón donde se monta el ventilador; tapa delantera con el eje de salida para acoplar la carga; ventilador externo y su cubierta perforada; banco de trabajo con pedestales numerados para el armado; un tablero esquemático que alterna entre el diagrama de deslizamiento y la curva par–velocidad.',
    omitidos: [
      '<b>Circuito eléctrico equivalente del motor (R1, X1, R2\', X2\', Xm)</b>: esta práctica se concentra en la relación cinemática ns–s–n y en la curva par-velocidad; la derivación del circuito equivalente a partir de ensayos de vacío y rotor bloqueado es el objetivo de la siguiente práctica del programa (d5-08) y no se repite aquí.',
      '<b>Rodamientos, aislamiento de ranura y barniz de impregnación del devanado</b>: el modelo se concentra en las piezas que determinan la relación par–velocidad-deslizamiento; los componentes de soporte mecánico y aislamiento eléctrico interno no aportan a esa física y se omiten para no saturar el ensamble.',
      '<b>Caja de terminales interna y su conexión estrella/delta</b>: se representa una caja de conexiones esquemática sobre la carcasa; el detalle de los seis terminales (U1-U2, V1-V2, W1-W2) y la elección estrella/delta no se modela — la alimentación trifásica se controla aquí como un solo parámetro de frecuencia f.',
    ],
  },
  s2: {
    title: 'Ecuaciones que gobiernan el motor',
    warn: 'Los valores de ns, s, n, T y potencia mecánica se recalculan en vivo con las fórmulas de §5 a partir de los tres controles (f, p, TL) — nunca se leen de una tabla fija.',
    rows: [
      ['Cantidad', 'Fórmula', 'Nota'],
      ['Velocidad síncrona', 'ns = 120 · f / p', 'velocidad del campo magnético giratorio del estátor'],
      ['Deslizamiento', 's = (ns − n) / ns', 'fracción de "atraso" del rotor respecto al campo'],
      ['Par electromagnético', 'T(s) = 2·Tmáx / (s/sm + sm/s)', 'ecuación simplificada de Kloss (sin resistencia de estátor)'],
      ['Deslizamiento de operación', 's(TL) = sm·(1−√(1−k²))/k, k=TL/Tmáx', 'forma cerrada exacta de la rama estable 0<s≤sm'],
      ['Potencia mecánica', 'Pmec = TL · ω', 'ω = n · 2π/60; nula si el rotor está detenido (calado)'],
    ],
  },
  s3: [
    'Fuente/variador trifásico con frecuencia f regulable (aquí, el control deslizante correspondiente; el simulador no modela la relación V/f de un variador real — ver §5).',
    'Freno dinamométrico o dinamómetro capaz de imponer un par de carga TL conocido — sustituido aquí por el control deslizante de TL.',
    'Tacómetro o encoder para medir la velocidad n del rotor — en el reto de esta práctica, se simula justamente esa lectura de tacómetro para calcular el deslizamiento.',
    'Placa de datos del motor, que típicamente reporta el deslizamiento nominal — usada en el reto para el sentido inverso: partir del dato de placa y calcular la velocidad nominal esperada.',
  ],
  s4: {
    intro: 'El lab reduce la caracterización mecánica de un motor de inducción a fijar tres parámetros y leer el resultado en estado estacionario. Un ensayo de banco real añade pasos de manejo del equipo y fenómenos transitorios que el modelo no reproduce.',
    items: [
      'Arranque del motor: en la realidad, un motor de inducción conectado directamente a la línea (arranque directo) consume una corriente de arranque muy alta (típicamente 6 a 8 veces la nominal) durante el instante en que s=1 — el modelo solo muestra puntos de operación ya establecidos (estacionarios) o el punto de arranque como un valor más de la curva, nunca el transitorio eléctrico ni el esfuerzo térmico que ese arranque implica.',
      'Métodos de arranque reducido (estrella-delta, autotransformador, arrancador suave) usados en la práctica para limitar esa corriente de arranque — no se modelan; el simulador solo permite variar f y p como si el motor ya estuviera girando en régimen permanente.',
      'Calibración y ajuste del tacómetro o encoder antes de tomar lecturas — aquí la telemetría es instantánea y exacta.',
      'Verificación de que el motor está mecánicamente alineado y acoplado a la carga antes de energizar — el acoplamiento motor-carga se da por hecho, no se modela como paso de ensamble aparte.',
    ],
  },
  s5: {
    modela: 'la relación cinemática ns=120·f/p entre la frecuencia de línea, el número de polos y la velocidad síncrona; la definición de deslizamiento s=(ns−n)/ns; la curva par-deslizamiento simplificada de Kloss T(s)=2·Tmáx/(s/sm+sm/s), que reproduce correctamente la forma característica del par de un motor de inducción (arranque, par máximo o "de vuelco", y la rama descendente hacia el deslizamiento nominal); y, de forma matemáticamente derivada de esa ecuación (no una regla añadida aparte), el hecho de que <b>para cada TL≤Tmáx existe exactamente un punto de operación estable en la rama 0<s≤sm</b>, mientras que para TL>Tmáx no existe ninguno y el motor se cala (s=1, n=0, par igual al par de arranque).',
    noModela: 'el circuito eléctrico equivalente del motor (resistencias e impedancias de estátor y rotor, rama de magnetización) — eso es el objeto de la práctica siguiente del programa; la relación V/f de un variador de frecuencia ni el debilitamiento de campo a frecuencias altas — Tmáx y sm se tratan aquí como constantes fijas, independientes de f; la corriente de línea, el factor de potencia ni la potencia eléctrica de entrada — por eso el lab no reporta ni puede reportar una eficiencia (Pmec/Pin), solo potencia mecánica de salida; inductancias ni transitorios eléctricos de arranque; calentamiento del devanado; ni la rama inestable del deslizamiento (sm<s<1) como un punto de operación real y sostenible — se muestra en la curva únicamente como referencia teórica de por qué esa zona no es un régimen de trabajo válido para una carga de par constante.',
  },
  s6: [
    '⚑ Los parámetros del motor (Tmáx=22 N·m, sm=0.18) son valores <b>ilustrativos del simulador</b>, elegidos para que el rango de controles produzca resultados físicamente consistentes y pedagógicamente claros — no corresponden a la placa de un motor comercial real; no deben citarse como dato de un fabricante.',
    '⚑ El control deslizante de frecuencia cubre únicamente 50-60 Hz (los dos estándares de red eléctrica más comunes en el mundo) — deliberadamente no se amplía a un rango típico de variador de frecuencia (VFD), porque el simulador no modela la relación V/f necesaria para que esa exploración sea físicamente correcta.',
    'Referencias normativas generales citadas en la lista maestra de esta práctica: IEEE 112 (procedimiento de prueba de motores de inducción polifásicos) e IEC 60034 (máquinas eléctricas rotativas). ⚑ Las cláusulas específicas aplicables no han sido confirmadas por un experto revisor; se citan como referencia general del tema, no como fuente literal de los valores numéricos usados en el simulador.',
    'Referencia curricular: programa ELE-II.1 / EM-II.1 (máquinas de inducción), dentro del eje de máquinas eléctricas del plan de estudios del sector.',
  ],
});
