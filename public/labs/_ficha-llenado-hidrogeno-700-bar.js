/* Ficha técnica · Llenado de un tanque de hidrógeno a 700 bar — contenido específico del lab */
fichaTecnica({
  title: 'Llenado de un tanque de hidrógeno a 700 bar: el calor de la compresión',
  intro: 'Este laboratorio muestra el <b>llenado rápido de un tanque tipo IV</b> (forro de polímero y envolvente de fibra de carbono) de 125 L en corte, con su surtidor, el pre-enfriador de serpentina y la manguera. El hidrógeno se trata como <b>gas real</b> (Abel–Noble): a 700 bar y 15 °C pesa unos 40,5 kg/m³, no los 59 que daría un gas ideal. Al llenar, el gas se <b>calienta</b> al comprimirse y por la entalpía con que entra, y el tanque no debe pasar de <b>85 °C</b>. Tú eliges la rapidez de subida de la presión y la temperatura de pre-enfriamiento.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> el gas real con p(v − b) = RT y b = 1,55·10<sup>−5</sup> m³/mol; el balance de energía del gas con la entalpía de entrada; la pared en dos nodos (forro y envolvente) con conducción entre ellos y pérdida al ambiente; la convección gas–forro que crece con el caudal; el límite de 85 °C, el de 87,5 MPa y el caudal máximo de 60 g/s; el pre-enfriador con su consumo de energía; y el estado de carga SOC = ρ/ρ<sub>nom</sub>, con ρ<sub>nom</sub> a 700 bar y 15 °C.',
    omitidos: [
      '<b>El protocolo SAE J2601</b> y su tabla de rampas: aquí la rampa y la temperatura se eligen libremente, sin comunicación infrarroja ni corrección por el tanque real.',
      '<b>La estratificación del gas</b>: todo el gas del tanque se toma a una sola temperatura (modelo de parámetros concentrados).',
      '<b>Las pérdidas en la manguera</b> más allá de una ganancia de calor fija del 10 % de la diferencia con el ambiente.',
      '<b>El efecto Joule–Thomson real</b>: Abel–Noble lo exagera (−0,054 K/bar frente a ≈ −0,03 K/bar medidos).',
      '<b>Las fugas, el venteo, el vaciado y los ciclos de uso</b> del tanque, y el cambio de propiedades de la fibra con la temperatura.'
    ]
  },
  s2: {
    title: 'Propiedades y parámetros del modelo',
    warn: '⚠ El <b>hidrógeno a 700 bar</b> es inflamable en un rango muy amplio y una fuga se enciende con muy poca energía; un tanque que pasa de 85 °C pierde resistencia en el forro. Los valores son didácticos: no sustituyen la norma ni los datos de un fabricante.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Gas real', 'Abel–Noble · covolumen b (a verificar)', 'p(v − b) = RT · 1,55·10<sup>−5</sup> m³/mol'],
      ['Compresibilidad', 'Z a 700 bar y 15 °C', '1,453'],
      ['Densidad nominal', '700 bar y 15 °C (100 % de carga)', '40,54 kg/m³ · 5,07 kg en 125 L'],
      ['Tanque', 'volumen · área · pared', '125 L · 1,6 m² · forro 8 kJ/K y envolvente 60 kJ/K'],
      ['Transferencia', 'h = 100 + 5000·ṁ<sup>0,8</sup> (correlación didáctica) · forro–envolvente · al ambiente', '60 W/K · 12 W/K'],
      ['Surtidor', 'caudal máximo · límite de presión · límite de temperatura', '60 g/s · 87,5 MPa · 85 °C'],
      ['Pre-enfriador', 'COP = 0,40·T<sub>f</sub>/(T<sub>c</sub> − T<sub>f</sub>), con T<sub>c</sub> = ambiente + 10 K', '−40 °C a 40 °C de salida'],
      ['Referencia 1', '25 MPa/min, gas a −40 °C, día de 25 °C, desde 50 bar', '191 s · 74 °C máx. · 4,58 kg · 0,208 kWh/kg'],
      ['Referencia 2', 'la misma rampa sin enfriar (25 °C)', 'corta a los 34 s con 29 % de carga'],
      ['Referencia 3', '60 MPa/min con gas a −40 °C', '87 s · 77 °C máx. · mismo 4,58 kg']
    ]
  },
  s3: [
    'Surtidor de hidrógeno con manómetro de 1 000 bar y válvula de cierre de emergencia.',
    'Termopar en la pared del tanque y en la boquilla para vigilar los 85 °C.',
    'Detector de fugas de hidrógeno y comprobación de las juntas del receptáculo antes de cada llenado.',
    'Báscula o medidor másico para comparar el hidrógeno entregado con el estado de carga que marca el surtidor.'
  ],
  s4: {
    intro: 'El orden del laboratorio (cálculo, ajuste, diagnóstico) es una <b>descomposición pedagógica</b>. En una estación real, el llenado añade:',
    items: [
      'Una prueba de presión y de fugas del receptáculo antes de abrir el flujo, y comunicación con el vehículo para conocer el volumen y la presión inicial del tanque.',
      'Una rampa de presión que se calcula en el surtidor según la temperatura ambiente y la del gas, siguiendo un protocolo normalizado.',
      'La vigilancia de la temperatura de salida del enfriador y su corrección si se desvía del valor pedido.',
      'El corte por temperatura, presión o caudal, y el registro del llenado para saber qué pasó si se interrumpe.'
    ]
  },
  s5: {
    modela: 'un <b>gas real concentrado</b> en el tanque: energía u = c<sub>v</sub>·T y entalpía de entrada h = c<sub>p</sub>·T + b·p, con la presión impuesta por el surtidor como rampa. El sistema en (ṅ, Ṫ) se resuelve en forma cerrada con tres iteraciones sobre h(ṁ) y se integra con Runge–Kutta de cuarto orden cada 0,5 s. La pared tiene dos nodos y la energía se conserva (residuo del orden de 10<sup>−8</sup>).',
    noModela: 'el <b>protocolo SAE J2601</b>, la <b>estratificación</b> del gas, las <b>pérdidas reales de la manguera</b>, el <b>efecto Joule–Thomson real</b> (Abel–Noble lo exagera), la <b>conducción térmica de la fibra</b> por capas, el <b>envejecimiento</b> del tanque ni la <b>forma exacta</b> de un tanque comercial: las proporciones del dibujo 3D están simplificadas. La correlación de convección y las capacidades térmicas son <b>didácticas</b>, ajustadas para que los tiempos de llenado queden en minutos, no medidas en un tanque real.'
  },
  s6: [
    'Abel–Noble: Z = 1 + b·p/(R·T); covolumen del hidrógeno b ≈ 1,55·10<sup>−5</sup> m³/mol (valor a verificar con la fuente usada).',
    'SAE J2601, <i>Fueling Protocols for Light Duty Gaseous Hydrogen Surface Vehicles</i> (a verificar la edición vigente).',
    'ISO 19881, <i>Gaseous hydrogen — Land vehicle fuel containers</i>, que fija los límites de presión y de temperatura de los tanques (a verificar).',
    'Dicken y Mérida, <i>Measured effects of filling time and initial mass on the temperature distribution within a hydrogen cylinder during refuelling</i>, Journal of Power Sources, 2007.'
  ]
});
