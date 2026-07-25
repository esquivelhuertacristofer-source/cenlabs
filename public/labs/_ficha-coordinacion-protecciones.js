fichaTecnica({
  title: 'Coordinación de Protecciones y Curvas Tiempo-Corriente (Interruptores Termomagnéticos)',
  intro: 'Un interruptor termomagnético no dispara siempre en el mismo tiempo: su curva tiempo-corriente indica cuánto tarda en abrir según la corriente que lo atraviesa. Tiene dos mecanismos: el térmico (bimetálico), que protege contra SOBRECARGAS con un retardo inverso —a más corriente, dispara más rápido—, y el magnético (electroimán), que protege contra CORTOCIRCUITOS abriendo casi al instante (~10 ms) al superar un umbral que define el TIPO DE CURVA: B (3–5× In), C (5–10× In) y D (10–20× In). Elegir bien la curva evita disparos molestos en cargas con alto pico de arranque (motores, transformadores) sin sacrificar la protección contra cortocircuito, que se mide con la energía pasante I²t=I²·t —a menor tiempo de disparo, menos energía deja pasar al cable—. Y cuando hay dos interruptores en serie (uno general aguas arriba y uno derivado aguas abajo) hay que COORDINARLOS: ante cualquier falla, el derivado debe abrir antes que el general para que solo se quede sin servicio el ramal afectado. La lección honesta del laboratorio es que la selectividad MCB-MCB en cortocircuito no es automática: si ambos superan su umbral magnético con la misma corriente de falla, disparan juntos (~10 ms) y se pierde la coordinación; la general necesita un umbral magnético bastante mayor (más In y/o curva más alta).',
  s1: {
    presentes: [
      'Curva tiempo-corriente de un interruptor termomagnético miniatura (MCB) según IEC 60898, con región térmica inversa t=kT/((I/In)²−1.13²) y región magnética instantánea (~10 ms) al alcanzar el umbral Im·In',
      'Anclaje verificado (node -e) a las compuertas de prueba de IEC 60898: 1.13× In NO dispara (<1 h); 1.45× In dispara en <1 h (modelo→133 s); 2.55× In dispara entre 1 y 60 s (modelo→21 s)',
      'Los tres tipos de curva por banda magnética: B (3–5× In, umbral garantizado 5×), C (5–10× In, 10×) y D (10–20× In, 20×), con sus usos típicos (resistivas/residencial, mixtas/uso general, alto arranque)',
      'Energía pasante I²t=I²·t_disparo como medida del estrés térmico del cable: en cortocircuito, disparar magnético (~10 ms) da I²t mínima; una curva innecesariamente alta que aún dispara térmico deja pasar mucha más energía',
      'Selección de la corriente nominal In por el criterio Ib ≤ In ≤ Iz (lleva la carga sin rebasar la ampacidad del cable), con catálogo normalizado 6/10/16/20/25/32/40 A',
      'Selección de la curva por el pico de arranque m: la más sensible cuyo umbral bajo supere m (m<3:B, 3≤m<5:C, 5≤m<10:D) — la más sensible que sobrevive al arranque minimiza la I²t en falla',
      'Coordinación/selectividad entre dos MCB en serie: el derivado debe disparar antes que el general en TODO el rango; verificación de un par selectivo (16A-C / 40A-D) y uno no selectivo (16A-C / 25A-C, que se solapan en cortocircuito)',
    ],
    omitidos: [
      'La curva exacta de un fabricante específico: se usa un ajuste didáctico anclado a las compuertas de prueba de la norma, no la banda mínima/máxima real de un catálogo comercial',
      'La tolerancia y dispersión de la banda magnética (se usa el umbral GARANTIZADO 5/10/20× In, no el rango estadístico completo de disparo)',
      'La dependencia de la temperatura ambiente y de la precarga del bimetal (una sobrecarga previa desplaza la curva térmica); se modela a temperatura de referencia',
      'El poder de corte (Icu/Ics) y la limitación de corriente real del dispositivo; se asume que el interruptor interrumpe la falla dada',
      'La selectividad energética (I²t) con fusibles aguas arriba y la coordinación con relés electrónicos ajustables (curvas L-S-I con retardos programables), propias de sistemas industriales',
      'El cálculo de la corriente de cortocircuito de la red (impedancia de fuente y de cables): se inyecta como dato; y cualquier efecto de corriente directa',
    ],
  },
  s2: {
    title: 'Elementos del tablero y del ensayo',
    warn: 'En Explora se ajusta un solo interruptor (In y curva) y una corriente de prueba expresada como múltiplo de In. En Coordinación se ajustan dos interruptores (derivado y general) y una corriente de falla. En el Reto la carga viene dada (Ib, Iz y pico de arranque) y el desafío es ELEGIR la In mínima válida y la curva correcta: dos objetivos calificados por separado. No hay valor sellado que recuperar; el reto es de criterio de diseño.',
    rows: [
      ['Interruptor general (aguas arriba)', 'Protege el alimentador; debe coordinar con los derivados', 'In·curva', 'Para selectividad, su umbral magnético debe superar claramente al del derivado'],
      ['Interruptor derivado (aguas abajo)', 'Protege el ramal y su cable; debe disparar primero ante una falla del ramal', 'In·curva', 'La palanca cae (DISPARADO) y la carga se apaga cuando actúa'],
      ['Conductor del ramal', 'Une el tablero con la carga; su grosor crece con la In del derivado', 'S∝In', 'La energía I²t que debe soportar depende del tiempo de disparo'],
      ['Carga (utilización)', 'Motor, tablero o carga final protegida', 'Ib, Iarranque', 'Su pico de arranque (m× In) determina la curva mínima que no dispara al arrancar'],
      ['Pizarrón de curvas', 'Plano log-log tiempo-corriente con la(s) curva(s) y los puntos de ensayo', 't vs I', 'Muestra región térmica, banda magnética y las compuertas 1 min / 1 h'],
    ],
  },
  s3: [
    'Selectores de corriente nominal In (6 a 40 A) y de tipo de curva (B/C/D) del interruptor',
    'Selector de corriente de prueba como múltiplo de In (1.2× a 18×) en Explora, y de corriente de falla (50 a 1500 A) en Coordinación',
    'Selector de modo: Explora (un interruptor), Coordinación (derivado + general) y Reto (selección In + curva)',
    'Pizarrón log-log tiempo-corriente con la curva, la banda magnética sombreada, el punto de disparo y las líneas de referencia (1 min, 1 h)',
    'Panel de lectura: tiempo de disparo, mecanismo (térmico/magnético/no dispara), energía I²t y veredicto de selectividad',
    'Carátulas 3D en cada interruptor (In, curva, estado ON/DISPARADO) y palanca que cae al disparar',
    'Botón de comprobación del Reto (califica In y curva por separado) y recorrido guiado automático',
  ],
  s4: {
    intro: 'Procedimiento para leer la curva, coordinar dos interruptores y resolver el reto de selección:',
    items: [
      'En Explora, fija In y una curva e inyecta corrientes de prueba crecientes. Con 1.45× o 2.55× verás disparo TÉRMICO con retardo inverso (sobrecarga); al superar el umbral de la curva (5/10/20×) el disparo pasa a MAGNÉTICO en ~10 ms (cortocircuito) y la I²t cae a su mínimo. Cambia de curva y observa cómo se desplaza el escalón vertical: una curva D tolera picos que a una B la harían disparar.',
      'En Coordinación, pon un derivado (p. ej. 16A-C) y una general (25A-C) e inyecta una falla grande: verás que ambas curvas se juntan en ~10 ms y disparan a la vez → NO selectivo. Sube la general a 40A-D y comprueba que ahora su curva queda por encima en todo el rango: la derivada dispara primero → SELECTIVO. El panel indica el veredicto global y el margen.',
      'En Reto, se sortea una carga con su Ib, su Iz y su pico de arranque. Elige ① la In mínima con Ib≤In≤Iz y ② la curva más sensible que no dispare al arrancar, y pulsa "Comprobar". El sistema califica los dos objetivos por separado: cuidado con quedarte corto de In (dispara en servicio) o pasarte (no protege el cable), y con elegir una curva que dispare al arrancar o una demasiado alta que deja pasar más energía en falla.',
    ],
  },
  s5: {
    modela: 'La característica tiempo-corriente de un interruptor termomagnético miniatura (MCB) según IEC 60898: región térmica inversa anclada numéricamente a las compuertas de prueba de la norma (1.13× no dispara; 1.45× dispara en <1 h; 2.55× entre 1 y 60 s) y región magnética instantánea (~10 ms) con los umbrales garantizados de las curvas B (5×), C (10×) y D (20× In). Calcula la energía pasante I²t, la selección de In por Ib≤In≤Iz, la selección de curva por el pico de arranque y la coordinación/selectividad entre dos MCB en serie, incluyendo su límite honesto en cortocircuito.',
    noModela: 'La curva exacta de un fabricante (ajuste didáctico anclado a la norma, no banda min/máx real); la tolerancia/dispersión de la banda magnética (umbral garantizado 5/10/20×); la dependencia de la temperatura ambiente y de la precarga del bimetal; el poder de corte Icu/Ics y la limitación de corriente real; la selectividad con fusibles y con relés electrónicos ajustables (curvas L-S-I); el cálculo de la corriente de cortocircuito de la red (se inyecta como dato); ni efectos de corriente directa.',
  },
  s6: [
    'IEC 60898-1 — Interruptores automáticos para instalaciones domésticas y análogas (MCB): definición de las curvas de disparo B, C y D y compuertas de prueba de la característica tiempo-corriente.',
    'NOM-001-SEDE-2022 (Instalaciones eléctricas — utilización): Art. 240 (protección contra sobrecorriente), coordinación entre la protección, el conductor y la carga.',
    'IEC 60947-2 — Interruptores automáticos de baja tensión (aparamenta industrial): protecciones ajustables y coordinación/selectividad en sistemas industriales.',
    'Enríquez Harper, G. — Protección de instalaciones eléctricas industriales y comerciales (Limusa): curvas de disparo, coordinación y selectividad de interruptores termomagnéticos.',
    'Verificación numérica propia (sesión de construcción, node -e): ajuste del modelo térmico a las compuertas 1.13/1.45/2.55× In de IEC 60898, comparación de I²t por curva ante una misma falla, y prueba de selectividad de pares (16A-C/40A-D selectivo; 16A-C/25A-C no selectivo en cortocircuito).',
  ],
});
