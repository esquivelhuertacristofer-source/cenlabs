/* Ficha técnica · Sistema de frenos ABS — contenido específico del lab */
fichaTecnica({
  title: 'Sistema de frenos ABS (antibloqueo)',
  intro: 'Este laboratorio enseña una <b>rueda delantera cortada por su eje</b> mientras frena y el <b>grupo hidráulico</b> que la regula, también cortado. La geometría tiene cotas reales; el comportamiento sale de un <b>modelo de cuarto de coche</b> que se integra paso a paso y que un script verifica. Donde el modelo o el dibujo simplifican, aquí se dice.',
  s1: {
    presentes: '<b>Presentes y calculados:</b> neumático 205/55 R16 con sus cinturones y aros de talón, llanta 16 × 6,5J ET40, disco ventilado Ø300 × 28 con 36 álabes curvos, buje con rodamiento de dos hileras, pinza flotante de un pistón Ø57 con junta y guardapolvo, pastillas, rueda fónica de 48 dientes y captador inductivo. En el grupo hidráulico (un canal): válvula de admisión EV (abierta en reposo), válvula de escape AV (cerrada en reposo), acumulador de baja, bomba de retorno de émbolo con su excéntrica y la ECU con las bobinas. La <b>presión</b> de cada tramo, la <b>posición de las válvulas</b>, el llenado del acumulador, el giro de la rueda y la <b>huella</b> que deja en la pista salen del modelo.',
    omitidos: [
      '<b>Las otras tres ruedas</b> y la transferencia de carga al eje delantero: un cuarto de coche con carga fija.',
      '<b>Fuerzas laterales</b>: no se modela la dirección ni el ESP; el aviso de «sin guiado» con la rueda bloqueada es cualitativo.',
      '<b>Cilindro maestro y servofreno</b>: el pedal es una rampa de presión de 1 000 bar/s hasta 120 bar.',
      '<b>Junta homocinética y palier</b>: la mangueta está atornillada a un banco de exposición.',
      '<b>Temperatura</b> de la goma, de las pastillas y del disco, y el desgaste.',
      '<b>Entrehierro, ruido y filtrado</b> de la señal del captador: la ECU mide el periodo entre dientes sin errores.'
    ]
  },
  s2: {
    title: 'Fijaciones y pares de apriete',
    warn: '⚠ Valores <b>representativos</b> de turismo. Varían por vehículo: usa siempre el manual de taller (FSM). No mezcles tipos de líquido DOT.',
    rows: [
      ['Unión', 'Fijación típica', 'Par (repr.)'],
      ['Captador de rueda ↔ mangueta', 'perno M6–M8', '7–12 N·m'],
      ['Grupo hidráulico ↔ soporte', 'pernos M6–M8', '8–12 N·m'],
      ['Tuberías ↔ grupo hidráulico', 'tuercas de tubería (flare)', '12–18 N·m'],
      ['Racor banjo ↔ pinza', 'tornillo hueco M10 × 1', '25–35 N·m'],
      ['Soporte de pinza ↔ mangueta', 'pernos M12', '85–130 N·m'],
      ['Tornillos de rueda', '5 × M14 × 1,5', '110–140 N·m']
    ]
  },
  s3: [
    'Escáner con función ABS: leer las velocidades de rueda en vivo y <b>activar bomba y válvulas</b> (muchos ABS exigen purga asistida por escáner).',
    'Kit de purga y líquido DOT nuevo del tipo especificado.',
    'Osciloscopio para ver la señal del captador; galgas para el entrehierro.',
    'Llave dinamométrica, limpiador de frenos, gato con torres.'
  ],
  s4: {
    intro: 'El orden del laboratorio es una <b>descomposición pedagógica</b>. Un servicio real añade:',
    items: [
      'Verificar el entrehierro y el estado de la rueda fónica (suciedad o un diente roto dan falsas lecturas).',
      'Purgar el circuito con la <b>secuencia del escáner</b> para incluir el grupo hidráulico.',
      'Leer códigos, borrarlos y hacer una <b>prueba dinámica</b> de la regulación.',
      'Apretar todo a par y respetar el patrón en estrella en las ruedas.'
    ]
  },
  s5: {
    modela: 'un cuarto de coche (m = 350 kg, R = 0,31 m, J = 1,2 kg·m²) integrado con Runge-Kutta de 4.º orden a 0,1 ms: m·dv/dt = −μ(λ)·N y J·dω/dt = μ(λ)·N·R − T<sub>freno</sub>, con λ = (v − ωR)/v. La adherencia sigue la <b>fórmula mágica simplificada de Pacejka</b>, μ = D·sen(C·atan(Bλ − E(Bλ − atan Bλ))), con coeficientes ajustados por mínimos cuadrados a las curvas medidas de <b>Burckhardt</b> para asfalto seco, asfalto mojado, nieve y hielo (error máximo 0,05 en μ). El par de la pinza es T = 2·μ<sub>p</sub>·p·A·r<sub>ef</sub> = 26,3 N·m/bar (pistón Ø57, μ<sub>p</sub> = 0,40, radio eficaz 128,8 mm con presión uniforme). Cada electroválvula es un orificio, dp/dt = K·√Δp, con 3 ms de retardo; la AV descarga a un acumulador de 2,5 cm³ que vacía una bomba de 5 cm³/s. La ECU lee la rueda fónica (periodo entre dientes), decide cada 5 ms con el deslizamiento previsto a 10 ms vista y aplica tres órdenes —sube, mantiene, baja— con una banda de histéresis ±h alrededor del λ objetivo y re-aplicación a escalones. El balance de energía (½mv² + ½Jω² = calor en el disco + deslizamiento de la goma) cierra en la verificación. El reto se valida con el mismo modelo: la distancia de la calibración entregada contra la mejor de un barrido de λ objetivo de 0,04 a 0,50.',
    noModela: 'la transferencia de carga, las fuerzas laterales y el ESP; la dinámica del cilindro maestro y del servofreno; la elasticidad de la pinza y de los latiguillos (la capacidad de la pinza es constante); la temperatura y el fading; el ruido del captador. El <b>grupo hidráulico se dibuja ampliado ×2 y como esquema</b> de un canal; las conducciones, más gruesas que las reales (×1,6) para que se vea el líquido, cuyo <b>color indica su presión</b> (azul ≈ 0 bar, ámbar ≈ 50 bar, rojo ≈ 120 bar). La carrera de los empujadores de las válvulas está exagerada para que se vea. La lógica de la ECU es un controlador de banda con anticipación, representativo pero no el de ningún fabricante. Una ECU real <b>estima la adherencia y adapta su objetivo</b>; aquí el λ objetivo es fijo (lo eliges tú): en nieve, con el pico en λ* ≈ 5,7 %, el 11 % de fábrica trabaja pasado el pico. Por debajo de 2,8 m/s (unos 10 km/h) la ECU deja de regular y la rueda puede bloquearse al final, como en los sistemas reales.'
  },
  s6: [
    '<b>Pacejka, H. B.</b> <i>Tire and Vehicle Dynamics</i>, 3.ª ed. (fórmula mágica).',
    '<b>Kiencke, U. y Nielsen, L.</b> <i>Automotive Control Systems</i>, 2.ª ed., Springer, 2005 (curvas de Burckhardt y control del ABS).',
    '<b>Bosch</b>: <i>Automotive Handbook</i> y <i>Brakes, Brake Control and Driver Assistance Systems</i> (grupo hidráulico, ciclo de regulación).',
    '<b>ECE R13-H</b> (ONU), anexo 6: ensayo del aprovechamiento de la adherencia ε ≥ 0,75 con ABS.',
    '<b>FMVSS 135</b> (frenos de vehículo ligero) y <b>ISO 26262</b> (seguridad funcional).',
    'Manual de taller del fabricante (FSM) para la secuencia de purga y los pares exactos.'
  ]
});
