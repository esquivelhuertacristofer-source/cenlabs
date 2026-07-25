fichaTecnica({
  title: 'Dimensionamiento de Conductores y Protecciones de un Circuito Derivado',
  intro: 'Elegir el calibre de un conductor no se reduce a "que aguante la corriente". Un conductor de un circuito derivado monofásico debe cumplir dos criterios simultáneos: (1) su ampacidad —la corriente máxima que soporta sin sobrecalentarse— debe ser mayor o igual que la corriente de la carga; y (2) la caída de tensión a lo largo de la corrida debe quedar por debajo del 3 % para que a la carga le llegue tensión suficiente. La caída se calcula con e=2·ρ·L·I/S, donde el factor 2 representa los dos conductores (ida y retorno) que la corriente recorre. El calibre correcto es el MÁS DELGADO que cumple ambos criterios: ni se sobrecalienta, ni deja a la carga a media tensión, ni desperdicia cobre. En corridas largas la caída de tensión, no la ampacidad, es la que obliga a subir el calibre —una trampa clásica de diseño (verificado: en 30 de 36 escenarios del Reto la caída manda).',
  s1: {
    presentes: [
      'Criterio de ampacidad: el conductor debe cumplir ampacidad ≥ corriente de la carga, con ampacidad tomada de la Tabla 310-15(b)(16) del cobre THW a 75 °C (14 AWG a 4/0)',
      'Criterio de caída de tensión de circuito derivado: %e = e/V·100 ≤ 3 %, con e=2·ρ·L·I/S (ρ_Cu=0.0175 Ω·mm²/m, V=127 V), factor 2 por los conductores de ida y retorno (verificado node -e)',
      'Selección por AMBOS criterios a la vez: el calibre correcto es el mínimo del catálogo que satisface ampacidad Y caída ≤3% (no el que solo pasa uno)',
      'Tope de protección del Art. 240.4(D): 14/12/10 AWG limitados a 15/20/30 A de protección independientemente de su ampacidad de tabla — por eso un circuito de 20 A usa calibre 12, no 14',
      'Dominancia de la caída en corridas largas: cálculo verificado de que en 30/36 escenarios del Reto la caída obliga a un calibre mayor que el que pediría la ampacidad sola (la "trampa" de dimensionar solo por corriente)',
      'Tensión que realmente llega a la carga V_carga = V − e, medida con un voltímetro en la carga; la carga se atenúa visualmente cuando la caída es excesiva',
      'Reto verificado: I∈{12,16,20,24,30,40} A, L∈{15,25,35,50,70,90} m → 36 escenarios, TODOS con solución en catálogo, respuestas correctas AWG 14→2, con y sin trampa de caída',
    ],
    omitidos: [
      'Factor de 125 % para cargas continuas (3 h o más) del Art. 210.19/210.20: aquí la corriente dada es la de diseño ya considerada',
      'Factores de corrección por temperatura ambiente distinta de 30 °C y por agrupamiento de más de tres conductores portadores en un mismo tubo (Art. 310.15(B))',
      'Sistemas trifásicos (que usan e=√3·ρLI/S) y cargas con factor de potencia bajo o reactancia apreciable del cable (aquí solo resistencia, válido en calibres pequeños/medios y FP≈1)',
      'Variación de la resistividad del cobre con la temperatura real de operación (se usa un ρ fijo de ingeniería = 0.0175 Ω·mm²/m; la resistencia sube con la temperatura)',
      'Calibres en kcmil superiores a 4/0 y conductores de aluminio (menor conductividad, otra tabla de ampacidad)',
      'Coordinación de protecciones y curvas de disparo del interruptor termomagnético (se estudian en la práctica de coordinación de protecciones)',
    ],
  },
  s2: {
    title: 'Elementos del circuito derivado',
    warn: 'En Explora y Selección la corriente, la longitud y el calibre son ajustables (misma situación, dos lecturas: barras de criterios y tabla comparativa). En el Reto la corriente y la longitud vienen dadas por el escenario y el desafío es ELEGIR el calibre mínimo correcto. No hay valor sellado que recuperar: el reto es de criterio de diseño, calificado por selección exacta del calibre.',
    rows: [
      ['Tablero e interruptor', 'Origen del circuito derivado con protección termomagnética', 'V=127 V', 'La protección debe ser ≥ carga y ≤ límite del conductor (Art. 240.4)'],
      ['Conductor de fase (ida)', 'Lleva la corriente hacia la carga; su grosor crece con el calibre', 'S∈{2.08…107.2} mm²', 'Se calienta (rojo) si la corriente supera su ampacidad'],
      ['Conductor de retorno (neutro)', 'Devuelve la corriente a la fuente', 'misma S', 'Por eso la caída lleva factor 2: e=2ρLI/S (ida y vuelta)'],
      ['Carga (utilización)', 'Recibe V_carga = V − e', 'V_carga según caída', 'Se atenúa cuando la caída de tensión es excesiva (baja tensión)'],
      ['Voltímetro en la carga', 'Mide la tensión que realmente llega tras la caída', 'lectura en V', 'Verde si %e≤3%, rojo si la caída supera el límite'],
      ['Pizarrón de selección', 'Dos criterios (ampacidad, caída) y tabla comparativa de calibres', '%e≤3% · I≤amp', 'Resalta el calibre mínimo que cumple AMBOS criterios'],
    ],
  },
  s3: [
    'Selectores de corriente de carga I y longitud de la corrida L (en Explora y Selección)',
    'Selector de calibre AWG del conductor (catálogo de cobre THW, 14 AWG a 4/0)',
    'Selector de modo: Explora (dos barras de criterio), Selección (tabla comparativa) y Reto (elección del calibre mínimo)',
    'Pizarrón con las dos barras de criterio (ampacidad y caída) frente a sus límites, y la tabla de selección por calibre',
    'Voltímetro digital sobre la carga con la tensión que realmente llega (V−e)',
    'Telemetría en vivo: conductor elegido, ampacidad vs I, caída %e, tensión en la carga, calibre mínimo válido',
    'Botones de calibre y botón de comprobación en el modo Reto',
  ],
  s4: {
    intro: 'Procedimiento para explorar los dos criterios, la selección por tabla y resolver el reto:',
    items: [
      'En Explora, fija una corriente y una longitud y cambia el calibre. Observa las DOS barras: la de ampacidad (corriente vs capacidad del cable) y la de caída (%e vs 3%). Busca el calibre más delgado con ambas en verde: ese es el óptimo. Prueba con una corrida corta (poca caída) y luego alárgala mucho: verás que la barra de caída se dispara y obliga a subir de calibre aunque la ampacidad siga de sobra.',
      'En Selección, la tabla evalúa TODOS los calibres para la misma corriente y longitud, con una columna por criterio (① ampacidad, ② caída). El calibre mínimo correcto queda resaltado. Compara cuál pediría la ampacidad sola y cuál exige la caída: en corridas largas hay una diferencia de varios calibres.',
      'En Reto, se sortea un circuito con corriente y longitud fijas. Elige con los botones el conductor MÁS DELGADO que cumpla ampacidad Y caída ≤3% y pulsa "Comprobar selección". El sistema califica correcto solo si eliges el calibre mínimo exacto; cuidado con la trampa de mirar solo la ampacidad (en corridas largas te quedará corto por caída) y con sobredimensionar (desperdicia cobre).',
    ],
  },
  s5: {
    modela: 'Selección del calibre de un conductor de cobre THW para un circuito derivado monofásico de 2 hilos (127 V) por los dos criterios simultáneos: ampacidad (I ≤ ampacidad de Tabla 310-15(b)(16) a 75 °C, con el tope de protección del Art. 240.4(D) para 14/12/10 AWG = 15/20/30 A) y caída de tensión e=2ρLI/S con límite del 3 %. El calibre correcto es el mínimo que cumple ambos. Muestra, verificado numéricamente, que en corridas largas la caída (no la ampacidad) decide el calibre (30/36 escenarios del Reto). Calcula la tensión que llega a la carga V−e. Catálogo real de 14 AWG a 4/0.',
    noModela: 'Factor de 125 % para cargas continuas; factores de corrección por temperatura ambiente y por agrupamiento (Art. 310.15(B)); sistemas trifásicos (e=√3ρLI/S) y reactancia del cable (solo resistencia, FP≈1); variación de la resistividad con la temperatura real (ρ fijo = 0.0175 Ω·mm²/m); calibres en kcmil >4/0 y conductores de aluminio; coordinación y curvas de disparo de la protección.',
  },
  s6: [
    'NOM-001-SEDE-2022 (Instalaciones eléctricas — utilización): Art. 310 (ampacidad de conductores), Tabla 310-15(b)(16) (ampacidad del cobre a 60/75/90 °C) y Art. 240.4(D) (protección de conductores pequeños 14/12/10 AWG).',
    'Enríquez Harper, G. — El ABC de las instalaciones eléctricas residenciales / industriales (Limusa): cálculo de la caída de tensión e=2ρLI/S y selección de calibre por caída y por ampacidad.',
    'NEC (NFPA 70), 310.16 y 240.4(D): tablas de ampacidad y límites de protección de conductores pequeños, base de la que deriva la NOM mexicana.',
    'IEC 60228 — Conductors of insulated cables: secciones nominales de los conductores y su correspondencia con los calibres AWG.',
    'Verificación numérica propia (sesión de construcción, node -e): fórmula e=2ρLI/S y selección por dos criterios; catálogo del Reto de 36 escenarios, todos con solución (AWG 14 a 4/0) y con la caída dominando en 30 de 36 (la trampa de dimensionar solo por ampacidad falla el 83 % de las veces).',
  ],
});
