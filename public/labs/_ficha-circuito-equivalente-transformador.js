/* Ficha técnica — Circuito Equivalente por Ensayos de Vacío y Cortocircuito */
fichaTecnica({
  title: 'Circuito equivalente por ensayos de vacío y cortocircuito — banco de tensión reducida',
  intro: 'El modelo representa el mismo banco de pruebas de bajo voltaje de la práctica hermana d5-01 (variac, transformador de 4 terminales, panel de instrumentos), reutilizado aquí para dos ensayos de rutina distintos: el <b>ensayo de vacío</b> (circuito abierto, excitando el lado de baja tensión) y el <b>ensayo de cortocircuito</b> (excitando el lado de alta tensión con el de baja en corto). De ambos se obtiene el circuito equivalente completo (Rc, Xm, Req, Xeq), que luego se usa para predecir la regulación de voltaje y la eficiencia a plena carga sin necesidad de ensayar el transformador bajo carga real.',
  s1: {
    presentes: 'Fuente de tensión reducida (variac) con dos terminales de salida; transformador con tanque, cuatro bujes/terminales rotulados (H1, H2 de alta tensión; X1, X2 de baja tensión) y placa de datos; puente de cortocircuito entre X1-X2 (visible solo en el ensayo de cortocircuito); banco de carga a plena capacidad (visible solo en los casos de regulación de voltaje y eficiencia); tres instrumentos de panel (voltímetro, amperímetro, wattmetro) con aguja y lectura digital; esquemático interactivo que alterna entre el diagrama del ensayo activo y el circuito equivalente resultante, con cada elemento identificable al tocarlo.',
    omitidos: [
      '<b>Núcleo y devanados internos</b>: el tanque se representa cerrado, como en una unidad real de servicio — el arrollamiento de cobre y el núcleo laminado no son visibles ni se modelan como geometría independiente.',
      '<b>Elementos de seguridad de banco real</b>: guantes dieléctricos, tapete aislante, procedimiento de bloqueo/etiquetado (LOTO) y verificación de ausencia de tensión antes de instalar o retirar el puente de cortocircuito — el lab asume un entorno de práctica ya asegurado.',
      '<b>Clase de exactitud del instrumento</b>: el voltímetro, el amperímetro y el wattmetro se dibujan respondiendo exactamente al valor calculado, sin el error de lectura, histéresis o clase de exactitud de un instrumento real.',
    ],
  },
  s2: {
    title: 'Especificaciones usadas por el modelo (unidad de ejemplo)',
    warn: 'Los valores de placa y de ensayo (Voc, Ioc, Poc, Vsc, Psc) son constantes representativas de un transformador de control de instrumentación típico — no provienen de una hoja de datos de un fabricante específico. Las cantidades derivadas (Rc, Xm, Req, Xeq, %VR, η) se calculan en tiempo real a partir de estas constantes; nunca se transcriben a mano.',
    rows: [
      ['Ensayo', 'Excitación', 'Otro devanado', 'Lecturas'],
      ['Vacío (OC)', 'BT (X1-X2), tensión reducida', 'AT (H1-H2) abierto', 'Voc=24.00 V · Ioc=1.04 A · Poc=8.00 W'],
      ['Cortocircuito (SC)', 'AT (H1-H2), hasta I nominal', 'BT (X1-X2) en corto', 'Vsc=13.20 V · Psc=12.90 W'],
      ['Unidad', 'Control 500 VA, 220/24 V (misma unidad de d5-01)', '', 'a nominal = 220/24 = 9.1667'],
    ],
  },
  s3: [
    'Fuente de CA de tensión reducida (variac o transformador de aislamiento con derivaciones) — ambos ensayos se hacen muy por debajo de la tensión nominal de placa.',
    'Amperímetro de CA en serie con el devanado excitado.',
    'Wattmetro (tensión y corriente) para leer la potencia activa de cada ensayo.',
    'Voltímetro de CA en paralelo con el devanado excitado.',
    'Puente/cable de prueba con caimanes para cortocircuitar el devanado de baja tensión en el ensayo de cortocircuito.',
    'Guantes dieléctricos y verificación de ausencia de tensión antes de instalar el puente de cortocircuito (equipo de seguridad — no modelado en el 3D, ver §1).',
  ],
  s4: {
    intro: 'El lab reduce cada ensayo a su núcleo de decisión de ingeniería: excitar el devanado correcto, tratar el otro devanado como exige el ensayo (abierto o en corto), leer los tres instrumentos y calcular la rama del circuito equivalente correspondiente. En un banco real se añaden pasos de control y seguridad que el modelo no reproduce.',
    items: [
      'Incremento gradual de la tensión aplicada en el ensayo de cortocircuito hasta alcanzar la corriente nominal, vigilando que no se exceda — aquí la tensión de prueba (Vsc) es una constante fija ya calibrada para producir exactamente la corriente nominal.',
      'Verificación de ausencia de tensión antes de instalar o retirar el puente de cortocircuito — aquí el puente aparece/desaparece automáticamente según el ensayo seleccionado.',
      'Corrección de Req por temperatura de referencia (norma vs. temperatura de ensayo real) — no modelada; Req se usa tal como resulta del ensayo, sin corrección térmica.',
      'Separación de pérdidas dispersas (stray losses) de las pérdidas óhmicas puras dentro de Psc — no modelada; Req agrupa toda la componente resistiva medida en el ensayo de cortocircuito.',
      'En un informe de ensayo real, Rc y Xm se reportan a veces como funciones no lineales de la tensión de excitación (por saturación del núcleo) — aquí se tratan como constantes obtenidas de un solo punto de operación.',
    ],
  },
  s5: {
    modela: 'el procedimiento de ensayo de vacío (excitación en BT con AT abierto) y su triángulo de potencias S0=Voc·Ioc, Q0=√(S0²−Poc²), Rc=Voc²/Poc, Xm=Voc²/Q0, referidos al lado de AT multiplicando por a²=(N1/N2)²; el procedimiento de ensayo de cortocircuito (excitación en AT con BT en corto hasta corriente nominal) y su triángulo de impedancias Zeq=Vsc/Isc, Req=Psc/Isc², Xeq=√(Zeq²−Req²); la fórmula aproximada de regulación de voltaje con corrección de 2° orden %VR=%Req·cosθ+%Xeq·sinθ+(%Xeq·cosθ−%Req·sinθ)²/200 para FP en atraso; la fórmula de eficiencia η(x)=x·S·FP/(x·S·FP+Poc+x²·Psc) y la condición de eficiencia máxima x_máx=√(Poc/Psc), obtenida al igualar pérdidas fijas y variables.',
    noModela: 'la ubicación exacta aproximada-vs-exacta de la rama de magnetización (shunt) dentro del circuito equivalente — se usa el modelo aproximado estándar, sin comparar contra el circuito exacto con la rama shunt del lado de la fuente; la variación de Rc y Xm con el nivel de saturación del núcleo — se tratan como constantes obtenidas de un único punto de ensayo; la separación de pérdidas dispersas dentro de Psc; la corrección de Req por temperatura de referencia normativa; ni la equivalencia de la norma mexicana NMX-J-116/169 con IEC o ANSI — ANCE la declara explícitamente NO equivalente directa.',
  },
  s6: [
    '<b>IEC 60076-1</b> — Transformadores de potencia, Parte 1: Generalidades. Cláusula 11.4 (medición de la impedancia de cortocircuito y la pérdida de carga) y Cláusula 11.5 (medición de la pérdida y corriente en vacío).',
    '<b>ANSI/IEEE C57.12.90</b> — Test Code for Liquid-Immersed Distribution, Power, and Regulating Transformers. Cláusula 8 (ensayos de rutina de vacío y cortocircuito).',
    '<b>CFE K0000-04</b> — Especificación de transformadores de distribución y potencia (práctica mexicana, convención de terminales H1/H2-X1/X2, misma unidad de ejemplo que d5-01).',
    '<b>NMX-J-116-ANCE / NMX-J-169-ANCE</b> — normas mexicanas de transformadores de distribución y potencia; ANCE las declara NO equivalentes directas a IEC ni a ANSI/IEEE.',
  ],
});
