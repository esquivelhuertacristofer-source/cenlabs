/* Ficha técnica — Motor de Inducción: Deslizamiento y Curva Par-Velocidad */
fichaTecnica({
  title: 'Motor de inducción trifásico: deslizamiento y curva par-velocidad (jaula de ardilla)',
  intro: 'El modelo arma, pieza por pieza, un <b>motor de inducción trifásico de jaula de ardilla</b> — el motor más común en la industria, donde el estátor (fijo) recibe la alimentación trifásica y el rotor (jaula de barras cortocircuitadas) gira por inducción, sin ninguna conexión eléctrica externa a él. Al cerrarlo, la máquina se abre en corte: en la cara de sección se ve el <b>campo giratorio</b> que crean las tres corrientes del devanado, el rotor girando detrás de él (el deslizamiento) y las barras de la jaula encendidas con su corriente inducida. Tres controles — frecuencia de línea f, número de polos p y par de carga TL — mueven el punto de operación, que el panel de la derecha dibuja sobre la curva par–velocidad de Kloss junto con ns, n, s, T, f₂ y la potencia; un solo reloj mueve la escena, las corrientes del panel y el campo.',
  s1: {
    presentes: 'Carcasa de fundición con aletas (TEFC), patas, caja de bornes con prensaestopas y cáncamo de izado; estátor de chapa laminada con 36 ranuras semicerradas, devanado trifásico de doble capa con sus cuñas de cierre y las cabezas de bobina de cada fase (esmalte rojo, ámbar y verde, los mismos colores que las tres corrientes del panel); rotor de jaula de ardilla con 28 barras inclinadas un paso de ranura, dos anillos de cortocircuito con aletas y eje torneado con chavetero; tapas trasera y delantera con nervios, tornillos y rodamientos 6206 (pistas y bolas), retén del lado de acople; ventilador externo de palas radiales y su cubierta con rejilla. Todo se arma en un banco de montaje (tablero, placa base ranurada, soportes en V para el rotor y aro de apoyo para el estátor). Al terminar, la máquina queda en corte: una ventana de un cuarto de vuelta del lado del ventilador (para ver la jaula, las cabezas de bobina y el rodamiento) y un plano de sección transversal en el paquete, donde se pinta el campo.',
    omitidos: [
      '<b>Circuito eléctrico equivalente del motor (R1, X1, R2\', X2\', Xm)</b>: esta práctica se concentra en la relación cinemática ns–s–n y en la curva par-velocidad; la derivación del circuito equivalente a partir de ensayos de vacío y rotor bloqueado es el objetivo del laboratorio de circuito equivalente del motor de inducción y no se repite aquí.',
      '<b>Aislamiento de ranura, barniz de impregnación del devanado y detalle del rodamiento</b>: los rodamientos se dibujan en las tapas (pista, bolas y jaula) porque centran el rotor, pero no se modelan su fricción, lubricación ni vida útil; tampoco el aislamiento eléctrico interno. Nada de eso entra en la física par–velocidad–deslizamiento.',
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
      ['Campo giratorio', 'B(θ,t) ∝ Σ iₖ·cos(Pθ − k·120°) = 1,5·Im·cos(Pθ − ωt)', 'iₖ = Im·cos(ωt − k·120°); módulo constante 1,5·Im, gira a ω/P = ns (P = p/2 pares de polos)'],
      ['Corriente de una barra', 'i ∝ s/√(s² + sm²), retrasada φ₂ = atan(s/sm)', 'sumado barra a barra, el par en ese campo reproduce exactamente la curva de Kloss'],
      ['Frecuencia del rotor', 'f₂ = s·f', 'la corriente de cada barra oscila a f₂: unos pocos hercios en régimen, f con el rotor bloqueado'],
      ['Estroboscopio', 'velocidad aparente = −s·ns', 'destellando a f, el campo se congela y el rotor se ve retroceder al ritmo del deslizamiento'],
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
      'Métodos de arranque reducido (estrella-delta, autotransformador, arrancador suave) usados en la práctica para limitar esa corriente de arranque — no se modelan; el simulador solo permite variar f y p como si el motor ya estuviera girando en régimen permanente. Por eso, con el par de carga por encima del par de arranque T(s=1) = 7,67 N·m (p. ej. el TL inicial de 10 N·m) el motor real no arrancaría desde reposo: el punto mostrado es el de un motor que ya gira y al que se le aplicó la carga.',
      'Calibración y ajuste del tacómetro o encoder antes de tomar lecturas — aquí la telemetría es instantánea y exacta.',
      'Verificación de que el motor está mecánicamente alineado y acoplado a la carga antes de energizar — el acoplamiento motor-carga se da por hecho, no se modela como paso de ensamble aparte.',
    ],
  },
  s5: {
    modela: 'el campo giratorio como suma exacta de las tres corrientes en el devanado real de 36 ranuras (su onda fundamental gira a ns con módulo constante, y se redibuja para 2, 4, 6 u 8 polos); el rotor girando a n = ns·(1 − s) con el MISMO reloj que el campo y que las corrientes del panel; el brillo de cada conductor del estátor con su corriente instantánea y el de cada barra del rotor con la corriente inducida, que crece con s y oscila a f₂ = s·f; el estroboscopio a la frecuencia de red (el campo quieto, el rotor retrocediendo a s·ns); la relación cinemática ns=120·f/p entre la frecuencia de línea, el número de polos y la velocidad síncrona; la definición de deslizamiento s=(ns−n)/ns; la curva par-deslizamiento simplificada de Kloss T(s)=2·Tmáx/(s/sm+sm/s), que reproduce correctamente la forma característica del par de un motor de inducción (arranque, par máximo o "de vuelco", y la rama descendente hacia el deslizamiento nominal); y, de forma matemáticamente derivada de esa ecuación (no una regla añadida aparte), el hecho de que <b>para cada TL≤Tmáx existe exactamente un punto de operación estable en la rama 0<s≤sm</b>, mientras que para TL>Tmáx no existe ninguno y el motor se cala (s=1, n=0, par igual al par de arranque).',
    noModela: 'las ranuras en el cálculo del campo: las líneas de flujo son las de la onda fundamental en hierro lineal sin ranuras (las reales se apiñan en los dientes y el hierro se satura); los armónicos espaciales del devanado; en el estátor sólo se dibuja la corriente magnetizante que crea el campo, no la componente de carga que equilibra a la del rotor; el circuito eléctrico equivalente del motor (resistencias e impedancias de estátor y rotor, rama de magnetización) — eso es el objeto de la práctica siguiente del programa; la relación V/f de un variador de frecuencia ni el debilitamiento de campo a frecuencias altas — Tmáx y sm se tratan aquí como constantes fijas, independientes de f; la corriente de línea, el factor de potencia ni la potencia eléctrica de entrada — por eso el lab no reporta ni puede reportar una eficiencia (Pmec/Pin), solo potencia mecánica de salida; inductancias ni transitorios eléctricos de arranque; calentamiento del devanado; ni la rama inestable del deslizamiento (sm<s<1) como un punto de operación real y sostenible — se muestra en la curva únicamente como referencia teórica de por qué esa zona no es un régimen de trabajo válido para una carga de par constante.',
  },
  s6: [
    '⚑ Los parámetros del motor (Tmáx=22 N·m, sm=0.18) son valores <b>ilustrativos del simulador</b>, elegidos para que el rango de controles produzca resultados físicamente consistentes y pedagógicamente claros — no corresponden a la placa de un motor comercial real; no deben citarse como dato de un fabricante.',
    '⚑ El control deslizante de frecuencia cubre únicamente 50-60 Hz (los dos estándares de red eléctrica más comunes en el mundo) — deliberadamente no se amplía a un rango típico de variador de frecuencia (VFD), porque el simulador no modela la relación V/f necesaria para que esa exploración sea físicamente correcta.',
    '⚑ Geometría a escala de un motor TEFC de unos 2 kW (carcasa IEC 100L): 36 ranuras en el estátor y 28 barras en el rotor. El entrehierro se dibuja de 0,8 mm para que se vea (el real ronda 0,3 mm) y el devanado se rehace al cambiar los polos, cosa que un motor real no hace: sus polos vienen fijos de fábrica.',
    '⚑ Todo gira en cámara lenta (rotulada: ×1/20 a ×1/1000 según ns, o la que elija el alumno) para que el ojo pueda seguir el campo; con movimiento reducido el lab arranca en pausa. Las cifras del panel son siempre las de la velocidad real.',
    'Referencias normativas generales del tema: IEEE 112 (procedimiento de prueba de motores de inducción polifásicos) e IEC 60034 (máquinas eléctricas rotativas). Se citan como referencia general, no como fuente literal de los valores numéricos usados en el simulador; no se remite a cláusulas concretas.',
    'Referencia curricular: programa ELE-II.1 / EM-II.1 (máquinas de inducción), dentro del eje de máquinas eléctricas del plan de estudios del sector.',
  ],
});
