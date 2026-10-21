/* Ficha técnica · Transmisión CVT de banda: relación continua, presión y deslizamiento — contenido específico del lab */
fichaTecnica({
  title: 'Transmisión CVT de banda: relación continua, presión y deslizamiento',
  intro: 'Este laboratorio muestra, a escala y con los giros en cámara lenta, cómo una transmisión de variación continua cambia de «marcha» sin escalones. Son dos <b>poleas de garganta cónica</b> (cada una, dos mitades que se acercan o se separan) unidas por una <b>banda metálica de empuje</b> de longitud fija: cuando una polea crece la otra encoge y la relación i = R<sub>s</sub>/R<sub>p</sub> cambia. La banda no tiene dientes: transmite por <b>fricción</b>, y el aceite a presión de un cilindro aprieta las poleas. Detrás hay un motor de gasolina de 1,6 L con su mapa de consumo y la carga de una ruta (rodadura, aire y pendiente). Todo lo que se mueve sale del modelo; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> la <b>geometría exacta</b> de dos poleas con banda de longitud fija L = 608 mm (tangentes exteriores, ángulos de abrazamiento π ∓ 2α, radios de rodadura de 23 a 60 mm y relación de 0,40 a 2,60); la <b>cinemática</b> ω<sub>p</sub>·R<sub>p</sub>·(1 − s) = ω<sub>s</sub>·R<sub>s</sub>; el equilibrio de la <b>cuña</b>: con semiángulo β = 11° y fricción μ = 0,09, el apriete axial necesario es F<sub>ax</sub> = F<sub>t</sub>·cosβ/(2μ) y la capacidad de par de una polea T<sub>cap</sub> = 2μR·F/cosβ; el <b>uso de la capacidad</b> u = F<sub>ax</sub>/(p·A) con A = 32 cm² en el cilindro de la secundaria; el <b>microdeslizamiento</b> s = 0,002·u/(1 − u) y el patinaje franco (30 %) con u ≥ 1; la <b>bomba</b> de aceite (3 L/min de caudal de control más fugas proporcionales a la presión, rendimiento 0,60); el rendimiento mecánico de la banda 0,970 − 0,015·(ln i)²; la <b>carga de la ruta</b> (m = 1 450 kg, C<sub>rr</sub> = 0,012, C<sub>d</sub>A = 0,66 m², ruedas de 0,31 m y reductora final 3,5); y un <b>motor de gasolina</b> de 1,6 L con par máximo de 150 N·m a 4 200 rpm, consumo por Willans (combustible = (P<sub>e</sub> + pérdidas por fricción y bombeo)/η<sub>i</sub>, con enriquecimiento a plena carga) y mapa de consumo específico con mínimo de 237 g/kWh. El óptimo de consumo se busca barriendo la relación con el apriete «justo» (u = 0,80) y se compara con un barrido independiente de 4 000 puntos.',
    omitidos: [
      '<b>El equilibrio de fuerzas entre poleas</b>: en una CVT real la relación se mantiene con una presión distinta en la primaria y en la secundaria (la razón de fuerzas depende de i). Aquí el apriete se calcula sobre la polea de salida y la de entrada se dibuja con el mismo aceite por esquema.',
      '<b>Los transitorios</b>: todo es régimen (velocidad y pendiente constantes). El cambio de relación se ve con un retardo visual de 0,55 s, pero la dinámica de cambio, el par de inercia y los golpes de par no se modelan.',
      '<b>La fuerza centrífuga del aceite</b> en los cilindros giratorios, que sube la presión efectiva en la primaria a régimen alto y obliga a compensarla, y la fricción real elemento a elemento de la banda (los 400 elementos y los anillos de acero se dibujan como una textura).',
      '<b>El mapa real de un motor</b>: la recta de Willans con pérdidas de fricción y bombeo es un modelo didáctico de orden de magnitud, no el mapa medido de un fabricante. Tampoco hay arranque en frío, temperatura, ni el cierre del convertidor o embrague de arranque.',
      '<b>La reductora final, el diferencial y las ruedas</b>: se resumen en la relación fija 3,5 y un rendimiento de 0,97; sólo se dibuja el eje de salida.'
    ]
  },
  s2: {
    title: 'Propiedades y parámetros del modelo',
    warn: '⚠ Una CVT mal presurizada <b>no avisa</b>: con poca presión patina sin ruido y se desgasta; con mucha, funciona perfecta y gasta de más. Los valores de aquí son didácticos, no los de un fabricante.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Poleas', 'radio de rodadura mín · máx · distancia entre ejes', '23 mm · 60 mm · 170 mm'],
      ['Banda', 'longitud · ancho · semiángulo de la garganta', '608 mm · 24 mm · 11°'],
      ['Relación', 'i = R<sub>s</sub>/R<sub>p</sub> (entrada/salida)', '0,40 a 2,60 (con 0,40: 59,3 y 23,7 mm; con 2,60: 23,0 y 59,8 mm)'],
      ['Fricción y apriete', 'μ · área del cilindro · rango de presión', '0,09 · 32 cm² · 0,5 a 7,0 MPa'],
      ['Deslizamiento', 's = s<sub>0</sub>·u/(1 − u) · tope del reto', '0,002 · u ≤ 0,85 (patinaje ≈ 1,1 %)'],
      ['Bomba', 'caudal de control · fugas · rendimiento', '3 L/min · 3·10⁻¹¹ m³/s por Pa · 0,60 (0,24 kW a 1,5 MPa; 3,0 kW a 7 MPa)'],
      ['Motor', 'cilindrada · par máximo · ralentí y régimen máximo', '1,6 L · 150 N·m a 4 200 rpm · 900 y 6 200 rpm'],
      ['Consumo', 'mínimo del mapa · poder calorífico · densidad', '237 g/kWh (≈ 2 660 rpm, 113 N·m) · 43 MJ/kg · 745 kg/m³'],
      ['Coche', 'masa · C<sub>rr</sub> · C<sub>d</sub>A · radio de rueda · reductora', '1 450 kg · 0,012 · 0,66 m² · 0,31 m · 3,5'],
      ['Mandos del alumno', 'relación · apriete · velocidad · pendiente', '0,40–2,60 · 0,5–7,0 MPa · 20–140 km/h · 0–10 %'],
      ['El reto', 'tres condiciones a la vez', 'uso del apriete ≤ 85 % · motor entre ralentí y régimen máximo sin ahogarse · consumo ≤ 105 % del mínimo'],
      ['Cámara lenta', 'giros de poleas, banda, volante y salida', '×1/40 (el mismo factor en todos: la relación entre ellos es exacta); eje de las poleas dibujado ×1,6']
    ]
  },
  s3: [
    'Un ensayo en banco de una CVT real con sensores de presión en los dos cilindros y de velocidad en las dos poleas, para medir el patinaje y la razón de fuerzas entre poleas en función de la relación.',
    'El mapa de consumo medido de un motor concreto en dinamómetro, para sustituir el modelo de Willans por tablas.',
    'Los datos de fricción del aceite de transmisión (fluido CVT) con la temperatura, que mueven μ más de un 20 %.'
  ],
  s4: {
    intro: 'El orden del laboratorio (cálculo, ajuste, diagnóstico) es una <b>descomposición pedagógica</b>. La puesta a punto de una CVT real añade:',
    items: [
      'Programar la <b>presión de línea</b> con el par que pide el conductor (no sólo con la velocidad) y con un margen de seguridad frente a golpes de par, que se paga en consumo de bomba.',
      'Controlar la <b>relación objetivo</b> con una línea de operación óptima del motor y límites de comodidad (ruido y la sensación de «goma»), no sólo con el mínimo de consumo.',
      'Medir el <b>patinaje real</b> con los sensores de velocidad de las dos poleas, y corregir el apriete cuando sube de un umbral (en el laboratorio se ve como el uso de la capacidad).',
      'Mantener la <b>calidad del aceite</b>: un fluido degradado cambia μ y el margen de seguridad sin que el sistema lo note.'
    ]
  },
  s5: {
    modela: 'la <b>geometría exacta</b> de las dos poleas y la banda de longitud fija, con una longitud de banda constante en todo el rango (error de 2·10⁻¹⁶ m en 121 relaciones) y la poligonal del recorrido de la misma longitud (error relativo menor de 2·10⁻⁷) con tangencias exactas; la cinemática de la relación; el equilibrio de la cuña F<sub>ax</sub> = F<sub>t</sub>·cosβ/(2μ) y su inversa, la capacidad de par; el microdeslizamiento y el patinaje; la bomba; y el balance de potencia completo (combustible ≥ motor ≥ salida ≥ rueda, con identidades exactas). A 80 km/h en llano el consumo mínimo es de 3,82 L/100 km con i = 0,51 y el motor a 1 240 rpm y 72 N·m; con la misma velocidad, i = 1,2 gasta 5,41 L/100 km y i = 0,42 ahoga el motor. El óptimo coincide con un barrido de 4 000 puntos y es interior al rango admisible en las cuatro rutas (llano 0,51; subida del 6 % 1,16; autopista 0,75; ciudad con repecho 0,93). El reto exige tres condiciones a la vez y sólo las cumple el 1,8 al 3,5 % de las combinaciones de la rejilla de 101 × 71; la ventana es interior en la relación y en el apriete (llano: i de 0,50 a 0,63 y p de 2,1 a 3,8 MPa; subida: i de 1,12 a 1,43 y p de 4,2 a 6,6 MPa). Se verifica con 237 comprobaciones.',
    noModela: 'el <b>equilibrio de fuerzas entre las dos poleas</b>, los transitorios, la fuerza centrífuga del aceite, la fricción elemento a elemento de la banda, el mapa real de un motor y el resto del tren motriz. El <b>motor, la bomba y el rendimiento de la banda</b> son modelos didácticos de orden de magnitud (la bomba, en particular, es algo más voraz que la de una CVT real para que su efecto se note). El <b>dibujo</b> mantiene el ángulo de 11° pero estira el eje de las poleas ×1,6, mueve las dos mitades de forma simétrica y muestra los giros a cámara lenta ×1/40; la mitad cercana de cada polea es de cristal para ver la banda posada en la garganta. No es el sistema de un fabricante ni una homologación.'
  },
  s6: [
    'Bonsen, B., Klaassen, T. W. G. L., van de Meerakker, K. G. O., Steinbuch, M., Veenhuizen, P. A., «Analysis of slip in a continuously variable transmission», ASME IMECE, 2003 (a verificar).',
    'Bosch, <i>Automotive Handbook</i>, Wiley / Robert Bosch GmbH, 10.ª ed. (capítulo de transmisiones de variación continua) (a verificar).',
    'Heywood, J. B., <i>Internal Combustion Engine Fundamentals</i>, McGraw-Hill, 2.ª ed., 2018 (consumo específico, fricción y bombeo; recta de Willans) (a verificar).',
    'Guzzella, L., Sciarretta, A., <i>Vehicle Propulsion Systems</i>, Springer, 3.ª ed., 2013 (carga de la ruta y transmisiones continuas) (a verificar).'
  ]
});
