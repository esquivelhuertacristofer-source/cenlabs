/* Ficha técnica · El neumático: Pacejka, círculo de fricción y límite de adherencia — contenido específico del lab */
fichaTecnica({
  title: 'El neumático: curva de Pacejka, círculo de fricción y límite de adherencia',
  intro: 'Este laboratorio muestra <b>una sola llanta en un banco de ensayo de cinta</b>: una llanta de 205/55 R16 con su horquilla, la celda que mide la carga vertical, el cilindro que la aprieta contra la cinta y una cinta móvil que hace de suelo. La llanta puede girar más lento que la cinta (frenar) o ir ladeada respecto a ella (girar). La fuerza que da sale de la <b>fórmula mágica de Pacejka</b> y de la <b>elipse de fricción</b>; la huella, las flechas de fuerza, la elipse dibujada sobre la cinta y las gráficas del dock usan el mismo estado en cada cuadro. Lo que el 3D simplifica se documenta aquí.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> la llanta con su dibujo, su aro y sus marcas de pintura para ver cuánto gira frente a la cinta; la horquilla y la columna que giran con el ángulo de desvío; la celda de carga y el cilindro vertical; la cinta con sus marcas transversales y su línea central (la dirección de avance); la huella a su tamaño real (área = carga entre presión) coloreada por el agarre usado; las flechas de fuerza (naranja al frenar, azul al girar, blanca la suma); la elipse de fricción en la misma escala (1 kN = 12 cm); el transportador del ángulo de desvío; y la salpicadura o el humo cuando el piso es mojado o la llanta resbala.',
    omitidos: [
      '<b>El interior de la llanta</b> (cinturones, carcasa, talón): se dibuja el exterior; la huella es un rectángulo del tamaño exacto de la fórmula A = F<sub>z</sub>/p, no la forma real con sus lóbulos.',
      '<b>La suspensión y la transferencia de carga</b> entre ruedas: el reto usa un cuarto de coche con masa m = F<sub>z</sub>/g, sin balanceo ni cabeceo.',
      '<b>El aquaplaning, la velocidad y la temperatura</b>: el agarre del mojado es el de un ensayo a velocidad moderada; no cambia con la velocidad ni con el calentamiento de la goma.',
      '<b>El desgaste y el dibujo</b>: la profundidad del dibujo y la edad de la goma no entran en el cálculo.'
    ]
  },
  s2: {
    title: 'Propiedades y parámetros del modelo',
    warn: '⚠ Una llanta con la presión equivocada o con carga de más puede calentarse, deformarse y reventar. Los valores de este laboratorio son didácticos, no de un fabricante; la presión y la carga de tu vehículo están en el manual y en la etiqueta de la puerta del conductor.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Llanta', 'medida · ancho de banda · radio bajo carga', '205/55 R16 · 205 mm · 0,316 m'],
      ['Carga y presión nominales', 'una llanta de un coche de 1 400 kg', '3,5 kN · 2,4 bar'],
      ['Agarre en seco (μ)', 'longitudinal · lateral, a la carga nominal', '1,00 · 0,92'],
      ['Agarre en mojado, nieve y hielo', 'longitudinal, como fracción del seco', '0,68 · 0,30 · 0,10'],
      ['Pico de frenado en seco', 'fuerza · resbalamiento del pico', '3,50 kN · 11,3 %'],
      ['Pico lateral en seco', 'fuerza · ángulo del pico', '3,22 kN · 8,5°'],
      ['Sensibilidad de carga', 'caída de μ al duplicar la carga', '16 % (dμ = −0,16)'],
      ['Presión', 'óptima · caída de μ ∝ (Δp/p)² · rigidez', '2,4 bar · 0,25 · +35 % por unidad relativa'],
      ['Huella nominal', 'A = F<sub>z</sub>/p', '146 cm² (7,1 × 20,5 cm)'],
      ['Rigidez al girar nominal', 'C<sub>α</sub> = B·C·D, en seco', '856 N/°']
    ]
  },
  s3: [
    'Manómetro de llantas y medidor de profundidad del dibujo para comprobar la presión (en frío) y el desgaste.',
    'Báscula de ruedas o etiqueta de carga máxima de la llanta para no sobrecargarla.',
    'Banco de ensayo de llantas de cinta plana (flat-trac) o de tambor, con celdas de carga de seis componentes, para medir las curvas reales.',
    'Termómetro infrarrojo para comparar la temperatura de la banda en los tres puntos (interior, centro y exterior) tras rodar.'
  ],
  s4: {
    intro: 'El orden del laboratorio (calcula, ajusta, diagnostica) es una <b>descomposición pedagógica</b>. Un diagnóstico real de una llanta que rinde mal añade:',
    items: [
      'Revisar la presión en frío contra la etiqueta del vehículo y repetirla cuando cambie la carga.',
      'Ver el desgaste: bordes gastados indican presión baja; centro gastado, presión alta; un lado, mala alineación.',
      'Comprobar la edad de la goma (código DOT) y la profundidad del dibujo, que manda en el mojado.',
      'Medir en un banco de ensayo la curva real de fuerza frente a resbalamiento y desvío, a la carga y presión del caso.'
    ]
  },
  s5: {
    modela: 'la <b>fórmula mágica de Pacejka</b>, F = D·sen(C·atan(B·x − E·(B·x − atan(B·x)))), para la fuerza al frenar según el resbalamiento y la fuerza lateral según el ángulo de desvío, con el pico <b>exactamente</b> D = μ·F<sub>z</sub> (se verifica con la forma cerrada x<sub>pico</sub> = tan(π/2C)/B para E = 0 y numéricamente para los cuatro pisos); el <b>deslizamiento combinado por elipse de fricción</b> (los dos deslizamientos se normalizan con los de su pico, la fuerza sigue la dirección del deslizamiento y su módulo recorre la curva pura), con (F<sub>x</sub>/D<sub>x</sub>)² + (F<sub>y</sub>/D<sub>y</sub>)² ≤ 1 en las 32 724 combinaciones probadas; la <b>sensibilidad de carga</b> μ(F<sub>z</sub>) = μ₀[1 + dμ(F<sub>z</sub> − F<sub>z0</sub>)/F<sub>z0</sub>], cóncava por construcción; la <b>presión</b> (óptimo interior de adherencia, rigidez creciente) y la <b>huella</b> A = F<sub>z</sub>/p; la <b>inversa</b> de la fuerza al deslizamiento (error de ida y vuelta de 4·10⁻¹⁶); y el reto del cuarto de coche, con la ventana de frenado [a<sub>min</sub>, a<sub>max</sub>] calculada en forma cerrada y comprobada con el modelo completo. Se verifica con 1 817 comprobaciones.',
    noModela: 'el <b>aquaplaning</b> ni el efecto de la velocidad, la <b>temperatura</b> y el desgaste de la goma, la <b>histéresis</b> y la deriva transitoria (la llanta responde al instante, sin longitud de relajación), el <b>momento autoalineante</b> ni la fuerza por caída (camber), y tampoco la <b>transferencia de carga</b> entre ruedas ni la suspensión. Los parámetros (B, C, E, μ) son <b>didácticos</b> de libro, no de un fabricante, y la combinación de frenar y girar usa la elipse de fricción, no las funciones de peso completas de Pacejka. Lo que se ve va a 1/10 de la velocidad real. No es CFD, FEM ni un ensayo normalizado.'
  },
  s6: [
    'Pacejka, <i>Tire and Vehicle Dynamics</i>, fórmula mágica y deslizamiento combinado.',
    'Milliken y Milliken, <i>Race Car Vehicle Dynamics</i>, sensibilidad de carga y círculo de fricción.',
    'Gillespie, <i>Fundamentals of Vehicle Dynamics</i>, fuerzas en el neumático y rigidez de deriva.',
    'Kamm (1934), círculo de fricción; ISO 8855 (convenios de ejes del vehículo).'
  ]
});
