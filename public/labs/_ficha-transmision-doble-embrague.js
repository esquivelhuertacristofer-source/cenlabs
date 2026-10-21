/* Ficha técnica · Caja de doble embrague (DCT) — contenido específico del lab */
fichaTecnica({
  title: 'Caja de doble embrague (DCT)',
  intro: 'Este laboratorio representa una <b>caja de doble embrague de seis marchas</b> cortada por la mitad: dos embragues concéntricos (C1 para las marchas impares, C2 para las pares), dos árboles de entrada concéntricos, pares de engranes de evolvente, manguitos sincronizadores que <b>preseleccionan</b> la marcha siguiente y el piñón del diferencial. Lo que gira, se calienta y se acelera sale de un modelo calculado y verificado; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> el volante y los dos embragues de discos múltiples con su tapa, el árbol macizo (marchas impares) dentro del árbol hueco (pares), los seis pares de engranes con dentado de evolvente de 20° y módulo 2,5 mm (la suma de dientes de cada par es 80), los manguitos de las horquillas, los dos árboles de salida con el piñón de reducción final, el carter de la caja, el motor como bloque de inercia y el banco de pruebas. El corte abre la mitad delantera y pinta la sección con rayado a 45°.',
    omitidos: [
      '<b>Sincronizadores con cono de fricción</b>: los manguitos se dibujan, pero la preselección se supone resuelta antes del cambio.',
      '<b>Mecatrónica hidráulica</b>: bomba, válvulas proporcionales y actuadores de los embragues; aquí el par de cada embrague es la orden.',
      '<b>Volante bimasa</b> y amortiguador de torsión; aquí el motor es una inercia rígida.',
      '<b>Diferencial, semiejes y neumáticos elásticos</b>: el tren de potencia es un cuerpo rígido, sin oscilación de transmisión.',
      '<b>Lubricación y refrigeración</b> del aceite de la caja y de los discos; la temperatura se sustituye por la energía disipada.'
    ]
  },
  s2: {
    title: 'Especificaciones representativas y seguridad',
    warn: '⚠ Una caja de doble embrague retiene <b>aceite caliente (≈ 80–120 °C)</b> y masas giratorias: se deja enfriar, se calza el vehículo y no se manipulan los embragues con el motor en marcha. Valores representativos, no del fabricante.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Relaciones de marcha', '1.ª a 6.ª, caja', '3,444 · 2,077 · 1,353 · 1,051 · 0,818 · 0,667'],
      ['Reducción final', 'piñón 16 · corona 64', '4,000'],
      ['Motor', 'inercia del volante y par máximo', 'J<sub>e</sub> = 0,12 kg·m² · 330 N·m a 3 400 rpm'],
      ['Vehículo', 'masa, rueda, inercia de ruedas', '1 520 kg · R = 0,317 m · 4,2 kg·m²'],
      ['Inercia reflejada al motor', 'J<sub>v</sub> en el eje de la caja', '9,81 kg·m²'],
      ['Cambio 1→2 de referencia', '3 500 rpm, pedal 85 %', 'régimen sincrónico 2 110 rpm'],
      ['Fase de par y de inercia', 'rampa 260 ms, reducción 22 %', 'tirón máx. ≈ 11,4 m/s³ · calor ≈ 16,2 kJ']
    ]
  },
  s3: [
    'Escáner de diagnóstico con lectura de <b>par y temperatura de los embragues</b> y adaptaciones de los puntos de mordida.',
    'Termómetro infrarrojo para la carcasa de la campana y manómetro del circuito hidráulico.',
    'Banco de pruebas o rodillos con registro de aceleración para evaluar el tirón en el cambio.',
    'Herramientas de calado del vehículo, aceite de especificación y recipiente de recogida.'
  ],
  s4: {
    intro: 'El orden del laboratorio (sincronismo, ajuste de la rampa, diagnóstico) es una <b>descomposición pedagógica</b>. Un diagnóstico real añade:',
    items: [
      'Leer los códigos de falla y los datos en vivo de temperatura y deslizamiento de ambos embragues con el escáner.',
      'Probar el vehículo con cambios 1→2 y 2→3 a distinta carga, anotando el tirón y el sonido.',
      'Ejecutar el procedimiento de <b>adaptación</b> de los puntos de mordida tras cambiar discos o la mecatrónica.',
      'Comprobar nivel y estado del aceite de la caja, que lleva las dos cargas térmicas de los embragues.'
    ]
  },
  s5: {
    modela: 'la <b>dinámica del cambio</b> como un cuerpo rígido: J<sub>e</sub>·dω<sub>e</sub>/dt = T<sub>e</sub> − T<sub>c1</sub> − T<sub>c2</sub> y J<sub>v</sub>·dω<sub>s</sub>/dt = i<sub>1</sub>·T<sub>c1</sub> + i<sub>2</sub>·T<sub>c2</sub> − T<sub>L</sub>; la <b>fase de par</b> (C2 sube y C1 baja manteniendo el par de salida), la <b>fase de inercia</b> (el motor cae al régimen sincrónico por la reducción de par), el <b>tirón</b> (derivada de la aceleración, filtrada a 30 ms) y la <b>energía disipada</b> E = ∫T<sub>c</sub>·Δω dt de cada embrague, con fricción de Coulomb regularizada T = C·tanh(s/ε). Se comprueba contra las soluciones cerradas de cada fase, el balance de energía y el engranaje real sin interferencias. Las tres fallas (sincronizador, C1 pegado, C2 débil) cambian el modelo.',
    noModela: 'las <b>oscilaciones del tren de potencia</b> (semiejes y volante bimasa), la dinámica hidráulica y térmica de los embragues, la dependencia del coeficiente de fricción con la temperatura y el deslizamiento, ni los transitorios del motor (el par del motor es una curva estática con reducción por retardo de encendido). Los umbrales de tirón y calor del reto son <b>didácticos</b>, no una norma. El cambio de un coche real dura unos 200–400 ms; aquí dura cerca de 1 s a plena carga y se reproduce a cámara lenta rotulada. Los giros visuales van a 1/40 de la velocidad real. No es CFD, FEM ni una certificación.'
  },
  s6: [
    'Naunheimer, Bertsche, Ryborz y Novak, <i>Automotive Transmissions: Fundamentals, Selection, Design and Application</i>.',
    'Kulkarni, Kapoor, Shim y Zhang, <i>Shift dynamics and control of dual-clutch transmissions</i> (Mechanism and Machine Theory, 2007).',
    'Goetz, Levesley y Crolla, <i>Dynamics and control of gearshifts on twin-clutch transmissions</i> (Proc. IMechE, 2005).',
    'Guzzella y Sciarretta, <i>Vehicle Propulsion Systems</i>.'
  ]
});
