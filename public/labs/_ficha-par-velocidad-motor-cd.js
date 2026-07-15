/* Ficha técnica — Motor de CD: Par y Velocidad */
fichaTecnica({
  title: 'Motor de corriente directa: par y velocidad (excitación independiente)',
  intro: 'El modelo arma, pieza por pieza, un <b>motor de CD de excitación independiente</b> — el arreglo clásico de laboratorio donde el circuito de campo (que crea el flujo Φ) se alimenta por separado del circuito de armadura (que recibe Va y gira). Una vez armado, el lab expone tres controles — tensión de armadura Va, corriente de campo If y par de carga TL — y calcula en tiempo real la corriente de armadura Ia, la fuerza contraelectromotriz Ea, el par entregado T y la velocidad n, mostrados tanto en un tablero de circuito equivalente como en una curva par–velocidad.',
  s1: {
    presentes: 'Yugo/carcasa con ventana de corte (pieza fija); polos de campo con su devanado de cobre; armadura (núcleo laminado + devanado + eje); conmutador de delgas; portaescobillas con escobillas de grafito; tapa delantera (lado de mando, con muñón de eje) y tapa trasera (lado del conmutador); banco de trabajo con pedestales numerados para el armado; un tablero esquemático que alterna entre el circuito equivalente y la curva par–velocidad.',
    omitidos: [
      '<b>Rodamientos, ventilador de enfriamiento y caja de terminales</b>: el modelo se concentra en las piezas que determinan la relación par–velocidad-corriente; los componentes de soporte mecánico y enfriamiento no aportan a esa física y se omiten para no saturar el ensamble.',
      '<b>Resortes reales de escobilla y su fuerza de contacto</b>: se representa la escobilla y su resorte como geometría fija; la fuerza de contacto (y su efecto en la caída de contacto escobilla-conmutador) no se modela — ver §5.',
      '<b>Devanado de campo como bobina discreta, no como número de espiras real</b>: los anillos de cobre representan el devanado de forma esquemática; el número de vueltas, el calibre del alambre y la resistencia de campo real (Rf) no se modelan — If se controla como parámetro directo (ver §5).',
    ],
  },
  s2: {
    title: 'Ecuaciones que gobiernan el motor',
    warn: 'Los valores de Ia, Ea, T, n, potencia y eficiencia se recalculan en vivo con las fórmulas de §5 a partir de los tres controles (Va, If, TL) — nunca se leen de una tabla fija.',
    rows: [
      ['Cantidad', 'Fórmula', 'Nota'],
      ['Flujo relativo', 'KΦ = KM · (If / If_nominal)', 'proporcional a If; sin saturación magnética (ver §5)'],
      ['Corriente de armadura', 'Ia = TL / KΦ', 'la fija la carga mecánica; independiente de Va'],
      ['FEM inducida', 'Ea = Va − Ia · Ra', 'cae al aumentar Ia por la resistencia de armadura'],
      ['Velocidad angular', 'ω = Ea / KΦ', 'n (rpm) = ω · 60 / (2π)'],
      ['Par electromagnético', 'T = KΦ · Ia', 'igual al par de carga TL en estado estacionario'],
    ],
  },
  s3: [
    'Fuente de tensión de armadura Va regulable (aquí, el control deslizante correspondiente).',
    'Fuente de corriente de campo If independiente (segundo devanado, alimentado por separado — de ahí "excitación independiente").',
    'Freno o carga mecánica capaz de imponer un par TL conocido (banco de pruebas de par–velocidad, sustituido aquí por el control deslizante de TL).',
    'Tacómetro o encoder para medir n, y un multímetro/pinza para medir Ia — en el lab, ambos se leen directamente en la telemetría en vez de instrumentarse.',
  ],
  s4: {
    intro: 'El lab reduce la caracterización de un motor de CD a fijar tres parámetros y leer el resultado en estado estacionario. Un ensayo de banco real añade pasos de manejo del equipo que el modelo no reproduce.',
    items: [
      'Arranque del motor: en la realidad, aplicar Va de golpe con el rotor detenido produce una corriente de arranque muy alta (Ea=0 en reposo) que exige un reóstato de arranque o un arrancador electrónico — el modelo solo muestra estados de operación ya establecidos (estacionarios), nunca el transitorio de arranque.',
      'Secuencia de energización segura: en un motor de excitación independiente real, el campo debe energizarse ANTES de aplicar Va (para evitar embalamiento por pérdida de campo) — el modelo no impone ni verifica ese orden; los tres controles son libres desde que se desbloquean.',
      'Ajuste y calentamiento del equipo de medición (tacómetro, pinza amperimétrica) antes de tomar lecturas — aquí la telemetría es instantánea y exacta.',
      'Verificación de que el motor está mecánicamente acoplado a la carga antes de energizar — el acoplamiento motor-carga se da por hecho, no se modela como paso de ensamble aparte.',
    ],
  },
  s5: {
    modela: 'la relación T=KΦ·Ia (par proporcional al flujo y a la corriente de armadura); la FEM inducida Ea=KΦ·ω; la malla de armadura en estado estacionario Va=Ea+Ia·Ra; que KΦ depende linealmente de If (KΦ=KM·If/If_nominal); y el hecho, matemáticamente derivado de estas ecuaciones y no una regla añadida aparte, de que <b>Ia queda fijada por TL y KΦ, no por Va</b> — Va solo determina la velocidad a la que gira el motor para esa Ia, no cuánta corriente circula. También marca como "no física" (Ea≤0) cualquier combinación de Va/If/TL que exigiría un motor detenido o girando en reversa, y como "sobrecorriente" cualquier Ia que exceda una corriente de referencia ilustrativa (9 A).',
    noModela: 'saturación magnética del hierro (KΦ es estrictamente lineal con If, cuando en un motor real se aplana a corrientes de campo altas); inductancias ni transitorios eléctricos (arranque, escalones de carga) — todo cálculo es de estado estacionario; fricción y ventilación (por eso TL=0 da Ia=0 exactamente, sin la corriente de vacío que un motor real siempre consume); reacción de armadura (distorsión del flujo de campo por la propia corriente de armadura); chispeo o desgaste del conmutador; ni el circuito de campo derivado de una tensión y resistencia reales (Vf, Rf) — If se fija aquí como parámetro directo, no como resultado de Vf/Rf.',
  },
  s6: [
    '⚑ Este código de práctica no tiene una norma ancla (IEC/NOM/ANSI) específica listada en la lista maestra del proyecto, a diferencia de otras prácticas de D5 — el modelo se apoya en teoría estándar de conversión electromecánica de motores de CD de excitación independiente, presente en cualquier texto de referencia del área (p. ej. Fitzgerald, Kingsley & Umans, "Electric Machinery"; Chapman, "Máquinas Eléctricas").',
    '⚑ Los parámetros del motor (Ra=1.2 Ω, KM=0.85 V·s/rad, If nominal=1.0 A, corriente de referencia≈9 A) son valores <b>ilustrativos del simulador</b>, elegidos para que el rango de controles produzca resultados físicamente consistentes y pedagógicamente claros — no corresponden a la placa de un motor comercial real; no deben citarse como dato de un fabricante.',
    'Referencia curricular: programa ELE-II.1 (control de motores de CD), dentro del eje de máquinas eléctricas del plan de estudios del sector.',
    '⚑ El límite inferior del control de If (0.4 A en vez de 0) es una decisión de diseño del simulador para evitar la división entre un flujo nulo (KΦ→0), que produciría una corriente de armadura infinita — no representa un límite físico documentado del motor de ejemplo.',
  ],
});
