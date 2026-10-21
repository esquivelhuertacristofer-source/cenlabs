/* Ficha técnica · Ciclo Atkinson/Miller del motor híbrido: comprimir menos, expandir más — contenido específico del lab */
fichaTecnica({
  title: 'Ciclo Atkinson/Miller del motor híbrido: comprimir menos, expandir más',
  intro: 'Este laboratorio muestra, en un <b>corte didáctico</b> de un cilindro de gasolina, qué pasa cuando la válvula de admisión <b>cierra tarde</b>: el pistón ya sube y devuelve parte del aire al tubo, así que el gas se <b>comprime menos</b> de lo que luego se <b>expande</b>. Es el principio de los ciclos Atkinson y Miller de los motores híbridos. El modelo es un ciclo de aire con calor liberado por una ley de Wiebe, integrado con la primera ley de la termodinámica a lo largo del giro del cigüeñal; con él se calculan el trabajo, el rendimiento, el trabajo de bombeo, el golpeteo (autoencendido) y el consumo, y el motor eléctrico del híbrido pone el par que el motor de gasolina deja de dar. Todo lo que se mueve en pantalla sale del modelo; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> la geometría biela-manivela de cuatro cilindros de 449 cm³ (diámetro 80,5 mm, carrera 88,3 mm, biela de 140 mm) con el volumen y su derivada en cada ángulo; el cierre tardío de la admisión (CAA, en grados después del punto muerto inferior) y la <b>relación de compresión efectiva</b>, que es el volumen atrapado entre el volumen de la cámara; la masa atrapada m = p·V<sub>cierre</sub>/(R·T); la combustión como una ley de Wiebe (encendido a 12° antes del punto muerto superior, 40° de duración) con una fracción de calor al gas que baja con la relación superficie/volumen (pérdida de calor por las paredes); la integración con Runge-Kutta de cuarto orden de dp/dθ = [−γ·p·V′ + (γ−1)·dQ/dθ]/V; el trabajo del ciclo cerrado, el trabajo de admisión y escape (bombeo) y la fricción FMEP = 0,45 + 0,15·n/1000 bar; el límite de golpeteo con la integral de Livengood-Wu y un retardo de autoencendido de tipo Douaud-Eyzat; la mariposa que estrangula hasta el par pedido; el reparto híbrido (el motor eléctrico pone lo que falta) y un consumo equivalente que cuenta cada kWh eléctrico como 3,0 kWh de gasolina; y el mapa de consumo (régimen contra par).',
    omitidos: [
      '<b>La dinámica de gases en los conductos</b>: no hay ondas de presión, inercia de la columna de aire ni sintonía de admisión; el aire que se devuelve es el que dice el volumen, sin pérdidas de carga en la válvula.',
      '<b>La combustión real</b>: la ley de Wiebe tiene parámetros fijos (no cambian con la turbulencia, la mezcla ni el EGR); no hay estructura de llama ni NOx; la mezcla es siempre estequiométrica (14,7).',
      '<b>Las propiedades variables</b>: el gas es aire con γ = 1,32 constante y calor liberado «equivalente»; un motor real tiene γ variable con la temperatura y la composición.',
      '<b>El eje de levas con fase variable real y su control</b>: la apertura de la admisión se deja fija y sólo se mueve el cierre; en un motor real se mueve la fase completa (VVT) o se usa un ciclo con levas distintas.',
      '<b>El ciclo Atkinson «puro»</b> de 1882 (con biela articulada que da carrera de expansión mayor que la de admisión): aquí el efecto es el de la válvula (llamado también ciclo Miller o Atkinson «de válvula»); la relación de expansión real sale de la geometría y no cambia.',
      '<b>La batería, el control del híbrido y el motor eléctrico real</b>: el motor eléctrico es un disco con un par máximo y un rendimiento fijos; no hay estado de carga ni pérdidas de la correa.'
    ]
  },
  s2: {
    title: 'Propiedades y parámetros del modelo',
    warn: '⚠ Es un <b>modelo didáctico</b>: las cifras de consumo y de golpeteo sirven para comparar entre sí los ajustes de la pantalla, no para predecir un motor de un fabricante. El umbral de golpeteo está calibrado para que el motor normal a plena carga con 91 octanos quede cerca de su límite.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Motor', 'cuatro cilindros, ciclo de cuatro tiempos', '449 cm³ por cilindro · 80,5 × 88,3 mm · biela 140 mm'],
      ['Gas', 'ciclo de aire con calor liberado por Wiebe', 'γ = 1,32 · T de admisión 320 K · mezcla 14,7 · 43 MJ/kg'],
      ['Combustión', 'ley de Wiebe', 'encendido 12° antes del PMS · 40° de duración · ξ = 0,65 con corrección por pérdida de calor (10 %)'],
      ['Válvulas', 'distribución', 'admisión abre 350° · cierra 540° + CAA · escape abre 180° y cierra 370° · alzada 9 mm'],
      ['Motor normal (referencia)', 'Otto convencional, plena carga a 91 octanos', 'relación 10,5 · cierre a 45° · comprime 9,5 veces · rinde 28,7 % en la carretera'],
      ['Mandos del alumno', 'cierre de la admisión · relación de expansión', '30° a 110° · 9 a 17'],
      ['Escenarios', 'régimen · par pedido · octanaje · ahorro a lograr', 'carretera 2 400 rpm, 100 N·m, 91, 5,0 % · cuesta 2 000 rpm, 100 N·m, 87, 4,0 % · ciudad 1 600 rpm, 85 N·m, 87, 5,5 %'],
      ['El reto', 'tres condiciones a la vez', 'ahorro frente al motor normal, golpeteo ≤ 80 % del límite, motor eléctrico ≤ 15 N·m']
    ]
  },
  s3: [
    'Un banco de pruebas con motor y freno dinamométrico para medir el par y el consumo a distintos cierres de admisión y regímenes.',
    'Un indicador de presión en el cilindro (sensor piezoeléctrico y codificador del cigüeñal) para obtener el diagrama p–V real y su trabajo.',
    'Un motor de investigación de relación variable para medir el límite de golpeteo con combustibles de octanaje conocido.'
  ],
  s4: {
    intro: 'El orden del laboratorio (cálculo, ajuste, diagnóstico) es una <b>descomposición pedagógica</b>. La calibración real de un motor de ciclo Atkinson o Miller añade:',
    items: [
      'Medir el mapa de consumo completo en el banco, con la distribución variable en cada punto, y no sólo en tres puntos de trabajo.',
      'Ajustar el límite de golpeteo con el combustible peor que se vaya a vender y con la temperatura ambiente más alta, y dejar un margen de seguridad.',
      'Validar el reparto con el motor eléctrico y la batería en ciclos de conducción, con su estado de carga y sus límites.',
      'Comprobar las emisiones y el arranque en frío, donde el cierre tardío empeora la combustión.'
    ]
  },
  s5: {
    modela: 'un <b>ciclo de aire</b> con la primera ley integrada sobre el giro del cigüeñal; con la combustión casi instantánea y sin pérdidas, el modelo reproduce el rendimiento ideal 1 − 1/r<sup>γ−1</sup> del ciclo Otto (se comprueba con 344 comprobaciones), y el trabajo de la traza coincide con ∮p·dV. Con las cifras de la pantalla: el motor normal (relación 10,5, cierre a 45°) comprime 9,5 veces y rinde 28,7 % en la carretera; con relación de expansión 13 y cierre a 75° comprime 9,5 veces igualmente y rinde 30,1 %, pero a plena carga da 103 N·m en vez de 131. El reto pide un ahorro de 5,0 % (carretera), 4,0 % (cuesta) o 5,5 % (ciudad) frente al motor normal; sobre la rejilla de 9 a 17 de relación y 30° a 110° de cierre sólo lo cumplen el 7,1 %, el 5,6 % y el 6,0 % de las combinaciones, y la ventana del cierre está en el <b>interior</b> del mando (en la carretera con relación 15: de 64,5° a 83,5°); el mayor ahorro que alcanza es de 6,6 % (carretera), 5,6 % (cuesta) y 7,3 % (ciudad).',
    noModela: 'la dinámica de gases en los conductos, la combustión real (turbulencia, EGR, óxidos de nitrógeno), las propiedades variables del gas, la fase variable completa de las levas, el ciclo Atkinson mecánico de biela articulada, la batería y el control del híbrido. La <b>constante de calibración del golpeteo</b> (C<sub>K</sub> = 1,4) y la <b>pérdida de calor</b> (10 %) están ajustadas para que el motor normal quede cerca de su límite, y la fórmula del retardo de autoencendido se cita de memoria <b>(a verificar con la fuente)</b>. Los escenarios son sintéticos. El <b>dibujo no está a escala</b>: la cámara de combustión, los conductos y el motor eléctrico se simplifican para que se lean, y el movimiento va en <b>cámara lenta</b> (el motor real gira de 1 600 a 2 400 vueltas por minuto). No es el motor de un fabricante.'
  },
  s6: [
    'Heywood, J. B., <i>Internal Combustion Engine Fundamentals</i>, McGraw-Hill, 1988 (ciclos de aire, combustión de Wiebe, golpeteo) — a verificar.',
    'Livengood, J. C. y Wu, P. C., «Correlation of autoignition phenomena in internal combustion engines and rapid compression machines», <i>Symposium (International) on Combustion</i>, 1955 — a verificar.',
    'Douaud, A. M. y Eyzat, P., «Four-octane-number method for predicting the anti-knock behavior of fuels and engines», SAE 780080, 1978 — a verificar.',
    'Miller, R. H., patente estadounidense 2 817 322 (1957) y Atkinson, J., patente británica 1882 (ciclos de expansión mayor que compresión) — a verificar.'
  ]
});
