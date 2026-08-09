fichaTecnica({
  title: 'Ficha técnica · Sincronización de la distribución y puesta a punto',
  intro:
    'Este laboratorio monta un tren de distribución pieza a pieza y luego lo descala contando DIENTES, que es como se equivoca un taller de verdad: nadie se salta medio grado. ' +
    '(1) Un diente del piñón vale 360/Z vistos en el piñón y 720/Z medidos en el cigüeñal. En el 1.6 DOHC (Z 40) son 9,00° en el piñón y 18,00° en el cigüeñal; en el 1.8 SOHC (Z 38), 9,47° y 18,95°; en el V8 de cadena (Z 36), 10,00° y 20,00°. Por eso un diente se pasa por alto mirando el piñón. ' +
    '(2) El mismo árbol publica TRES juegos de ángulos según el alzado al que se declare abierta la válvula. El 1.6 DOHC da 55,0° de traslape leído a 0,15 mm, 14,0° leído a 1,00 mm y 6,3° leído a 1,27 mm (0,050 in). Ninguno miente: cambia la convención, y comparar dos fichas escritas con criterios distintos es el error más caro de este tema. ' +
    '(3) El traslape no se calcula sumando AAA + RCE: se MIDE recorriendo el entorno del PMS y comprobando dónde los dos alzados netos superan a la vez la referencia. En el 1.6 DOHC el barrido devuelve 13,95° contra los 14,00° de la suma, con 39,56 mm·° de área y 1,52 mm de alzado simultáneo máximo. ' +
    '(4) El traslape negativo existe y no es un error de medida: el V8 de 5.0 leído a 1,00 mm da −17,0° de suma y el barrido confirma un HUECO de 17,05° entre el cierre del escape y la apertura de la admisión. Es el carácter de un árbol suave, de par abajo y ralentí limpio. ' +
    '(5) Ser interferente es una propiedad de la GEOMETRÍA; chocar depende del calado. El 1.6 DOHC es interferente (8,80 mm de alzado neto contra 3,20 mm de hueco en la corona, 5,60 mm de penetración) y sin embargo bien calado le quedan 1,33 mm de holgura. El 1.8 SOHC y el V8 no son interferentes ni saltando dos dientes. ' +
    '(6) Un diente de admisión adelantado en el 1.6 DOHC lleva la holgura de +1,33 mm a −0,66 mm: la válvula TOCA. En el 2.0 TDI basta un diente de escape retrasado (−0,28 mm) o uno de admisión adelantado (−0,55 mm). ' +
    '(7) La presión de compresión sólo ve el cierre de la ADMISIÓN. Mueve el árbol de escape un diente en el 1.6 DOHC o en el 2.0 TDI y el manómetro sigue marcando 15,0 bar y 28,4 bar, exactamente lo mismo que con el calado correcto. En los motores de un solo árbol la pregunta ni siquiera se puede plantear: admisión y escape van en el mismo eje. Una compresión correcta NO absuelve a la distribución. ' +
    '(8) El manómetro tiene volumen muerto y eso no es un ajuste cosmético: en el 1.6 DOHC la relación dinámica del motor desnudo es 9,52 y la que ve el útil, 8,16. El mismo motor leído con otro comprobador da otra cifra. ' +
    'Si una cifra de esta ficha no coincide con la del simulador, la ficha está mal.',

  s1: {
    presentes:
      '<b>Presentes en la maqueta 3D, a escala 1:1 (una unidad de escena = 100 mm):</b> bloque en corte con su camisa, cigüeñal con contrapesos y piñón de mando, pistón con bulón, segmentos y cazoletas, biela de longitud real, culata con cámara, conductos y guías, válvulas con muelle y taqué, árbol o árboles de levas y correa o cadena con tensor. ' +
      'El lóbulo NO es un dibujo: su radio en cada ángulo es el alzado que devuelve la ley de leva del motor sellado, así que el perfil que se ve es el perfil que se integra. El camino de la correa se traza por las tangentes exteriores comunes a las poleas, que es la banda tensa de verdad. ' +
      'Las marcas del cigüeñal y de cada piñón se enfrentan a índices fijos; al saltar un diente la marca se desplaza exactamente un paso de piñón, ni más ni menos.',
    omitidos: [
      'El juego de taqués entra en el alzado neto, en la duración, en el traslape y en todas las cifras, pero NO se dibuja: a escala 1:1 son centésimas de milímetro en pantalla y fingirlas sería mentir sobre el tamaño del efecto.',
      'El balancín de las arquitecturas de un solo árbol se dibuja con relación 0,62/0,38. El motor sellado publica el alzado medido en el VÁSTAGO, con la relación de balancín ya incluida, así que el lóbulo se dibuja dividido por esa relación para que el dibujo cierre.',
      'La holgura pistón-válvula se evalúa sobre el EJE de la válvula, en un punto. La cazoleta real es una superficie 3D y el contacto ocurre en el borde de la válvula: el modelo da la tendencia y el orden de magnitud, no un permiso para no medir con plastilina.',
      'No hay flexión del árbol, ni juego de casquillos, ni alargamiento de la correa, ni error de paso acumulado, ni desalineación de poleas. El calado sólo cambia en pasos enteros de diente.',
      'No hay distribución variable ni desfasadores: los cuatro arquetipos llevan un calado fijo. El efecto del cruce se explora moviendo el árbol, no un actuador de VVT.',
      'No hay cilindros múltiples ni orden de encendido: se resuelve UN cilindro y se escala al número de cilindros para el par y la potencia.',
      'No se modela el desgaste del lóbulo, ni el asentamiento de válvulas, ni la deriva del juego con el kilometraje o la temperatura.',
      'Los cuatro motores son ARQUETIPOS declarados cuyas cifras caen dentro de las bandas publicadas para su familia. No son modelos comerciales y ninguna de sus cotas sirve para calar un motor real.',
    ],
  },

  s2: {
    title: 'Los cuatro arquetipos del banco, medidos por el propio motor',
    warn: 'Ángulos en grados de cigüeñal y leídos al alzado neto de 1,00 mm salvo donde se indique. Para calar un motor concreto hay que consultar el manual de taller de ESE motor: los ángulos, el juego de taqués y la holgura mínima son datos del fabricante.',
    rows: [
      ['Arquetipo', 'Cilindrada · rc', 'Z cig / Z leva · 1 diente', 'AAA · RCA / AAE · RCE', 'Traslape 0,15 / 1,00 / 1,27 mm', 'Holgura mín. adm / esc'],
      ['1.6 DOHC 16 V, correa', '1 598 cm³ · 10,5', '20 / 40 · 18,00° cig (9,00° piñón)', '8,0° · 44,0° / 42,0° · 6,0°', '55,0° / 14,0° / 6,3°', '1,33 mm / 1,94 mm — INTERFERENTE'],
      ['1.8 SOHC 8 V, correa', '1 801 cm³ · 9,5', '19 / 38 · 18,95° cig (9,47° piñón)', '6,0° · 34,0° / 34,0° · 2,0°', '35,5° / 8,0° / 1,9°', '9,58 mm / 10,53 mm — no interferente'],
      ['2.0 DOHC 16 V turbo, correa', '1 968 cm³ · 18,5', '20 / 40 · 18,00° cig (9,00° piñón)', '0,0° · 44,0° / 47,0° · 3,0°', '42,3° / 3,0° / −4,3°', '1,35 mm / 1,62 mm — INTERFERENTE'],
      ['5.0 V8 OHV, cadena', '4 942 cm³ · 9,0', '18 / 36 · 20,00° cig (10,00° piñón)', '−8,0° · 32,0° / 43,0° · −9,0°', '15,5° / −17,0° / −23,0°', '11,91 mm / 12,67 mm — no interferente'],
    ],
  },

  s3: [
    'Comparador de esfera con soporte magnético y punta de extensión, para llevar el pistón al PMS por el método de los dos topes y para medir alzado en el vástago.',
    'Disco graduado de 360° montado en la nariz del cigüeñal más un puntero fijo: es la única forma de leer AAA, RCA, AAE y RCE en un motor concreto.',
    'Galgas de espesor o galga de cuña para el juego de taqués en trenes de válvulas mecánicos; en los hidráulicos, comprobador de recuperación del empujador.',
    'Plastilina o masilla calibrada y micrómetro para medir la holgura pistón-válvula real: es la comprobación obligatoria tras rectificar la culata, cambiar de árbol o rebajar el plano de junta.',
    'Manómetro de compresión con adaptador roscado del motor. Anotar SIEMPRE qué comprobador se usó: su volumen muerto cambia la lectura.',
    'Útiles de bloqueo del cigüeñal y de los árboles del motor concreto (pasadores, reglas de cola de árbol), más el tensor nuevo cuando el fabricante lo exija.',
    'Llave dinamométrica con el procedimiento del fabricante. Muchos tornillos de culata, de biela y de piñón de árbol son de apriete angular y de un solo uso.',
  ],

  s4: {
    intro: 'El orden del laboratorio es el orden real de una puesta a punto, con la diferencia de que aquí se puede descalar a propósito y volver atrás sin romper nada:',
    items: [
      'Montar el tren completo. Hasta que no están las siete piezas no hay nada que medir, igual que en el banco no se cala media distribución.',
      'Llevar el cigüeñal a su marca y comprobar que las marcas de los piñones caen sobre sus índices. En un motor real esto se hace SIEMPRE en el sentido de giro y dando dos vueltas completas antes de dar nada por bueno.',
      'Saltar un diente y leer la consecuencia en los cuatro sitios a la vez: diagrama de distribución, curva de alzado, holgura pistón-válvula y banco de pruebas.',
      'Cambiar el criterio de alzado de lectura sin tocar el árbol y ver cómo cambian los ángulos publicados. Es el paso que evita comparar peras con manzanas entre dos fichas técnicas.',
      'Abrir juego de taqués por encima del nominal y comprobar que se acorta la duración, se estrecha el traslape y se ABRE la holgura pistón-válvula, todo sin haber movido el árbol.',
      'Diagnosticar a ciegas: cuatro lecturas de banco y un calado oculto. El reto sólo propone calados que este banco puede separar; el censo de cada máquina lo comprueba antes de proponer nada.',
    ],
  },

  s5: {
    modela:
      'perfil de leva polinómico de continuidad C² (sin escalón de aceleración en el arranque de rampa), con la duración geométrica deducida de la duración PUBLICADA a un alzado de referencia; cinemática exacta de biela finita, no armónico simple; alzado neto = máx(0, alzado bruto − juego), que es lo que hace que el juego recorte duración por los dos extremos; traslape medido por barrido a 0,05° y devuelto CON SIGNO, de modo que un hueco se informa como hueco y no como cero; holgura C(θ) = C₀ + s(θ)·cos α − L(θ) recorrida en las 720°, con velocidad de aproximación en el cruce; criterio exacto de motor interferente (alzado neto máximo contra el hueco de la corona, independiente del calado); relación de compresión dinámica desde el cierre REAL de admisión y presión de arranque como BANDA politrópica declarada entre 1,28 y 1,35, con el volumen muerto del manómetro; e intercambio de gases por integración paso a paso a 0,25° durante catorce ciclos, con combustión de Wiebe, transferencia de Woschni y rendimiento volumétrico referido a la densidad del COLECTOR.',
    noModela:
      'química de la combustión ni emisiones; multizona; dinámica de la correa o de la cadena; resonancia de admisión y escape (el rendimiento volumétrico no tiene ondas de presión, sólo el efecto del cruce y del cierre de admisión); flexión, torsión ni vibración del árbol; lubricación; y ningún transitorio: cada punto es un régimen estacionario. La holgura pistón-válvula es axial y de un punto.',
  },

  s6: [
    'Manual de taller del fabricante del motor concreto — es el ÚNICO documento que fija ángulos de distribución, juego de taqués, holgura mínima pistón-válvula, pares de apriete y procedimiento de bloqueo. Nada de esta ficha lo sustituye.',
    'SAE J604 — nomenclatura y definiciones de motores alternativos: PMS, PMI, carrera, diámetro, cilindrada y relación de compresión.',
    'Criterios de alzado de referencia en uso simultáneo en la industria: 0,15 mm («a la cota de reglaje», habitual en fichas europeas), 1,00 mm (el más publicado) y 0,050 in = 1,27 mm (norteamericano, típico de fichas de árboles de altas prestaciones).',
    'ISO 6789 — herramientas dinamométricas: exigencias y verificación. Los pares concretos, siempre del manual del motor.',
    'J. B. Heywood, <i>Internal Combustion Engine Fundamentals</i>, McGraw-Hill (1988) — llenado y vaciado del cilindro, rendimiento volumétrico, Wiebe y Woschni.',
    'C. Taylor, <i>The Internal-Combustion Engine in Theory and Practice</i>, MIT Press — geometría de biela-manivela y diagramas de distribución.',
  ],
});
