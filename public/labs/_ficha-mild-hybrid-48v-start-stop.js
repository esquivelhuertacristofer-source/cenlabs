/* Ficha técnica · Mild hybrid de 48 V y start-stop — contenido específico del lab */
fichaTecnica({
  title: 'Mild hybrid de 48 V y start-stop',
  intro: 'Este laboratorio representa el <b>alternador-arrancador de correa (BSG)</b> de un motor de gasolina con red de 48 V: el bloque en corte con pistón, biela, cigüeñal y válvulas, la correa que lo une al BSG, el paquete de iones de litio de 48 V, el convertidor CC-CC a 12 V, la batería de plomo y la carga eléctrica del coche. El motor se apaga en cada parada, el BSG lo rearranca, recupera energía al frenar y asiste al acelerar. Todo lo que se mueve y se colorea sale de un modelo con balance de energía exacto; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> el cilindro cortado con pistón, biela, cigüeñal, árboles de levas, válvulas de admisión y escape, bujía y colector de escape que se calienta; la polea del cigüeñal, la del BSG, el tensor y la correa; el BSG con estátor de ranuras y bobinas, rotor con imanes y cable trifásico; las celdas del paquete de 48 V con su nivel de carga, el convertidor CC-CC con aletas, la batería de 12 V y el ventilador que representa la carga de 12 V. Las flechas de energía y las partículas siguen el mismo reloj que las gráficas.',
    omitidos: [
      '<b>Los otros tres cilindros</b>, el turbo, el sistema de inyección y la gestión electrónica: se dibuja uno solo y el motor se modela con la línea de Willans.',
      '<b>Transmisión, embrague, diferencial y neumáticos</b>: sólo existen como relaciones de marcha y rendimiento global.',
      '<b>Gestión térmica del paquete de 48 V</b> y su envejecimiento: la celda es una fuente V<sub>oc</sub>(SOC) con resistencia fija.',
      '<b>El conductor y el tráfico real</b>: el ciclo urbano es un perfil de tramos de velocidad escalado por el tráfico elegido.'
    ]
  },
  s2: {
    title: 'Propiedades y parámetros del modelo',
    warn: '⚠ Una red de <b>48 V</b> está bajo el límite de 60 V que exige protección contra contacto, pero un paquete de iones de litio de 10 A·h almacena unos 1,7 MJ (≈ 0,5 kWh) y su corto circuito puede dar cientos de amperes. Sólo personal cualificado lo desconecta, con el procedimiento del fabricante. Los valores son didácticos, no de un fabricante.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Motor de gasolina', 'cilindrada · rendimiento indicado · ralentí', '1,5 L · 0,38 · 850 rpm'],
      ['Combustible', 'poder calorífico inferior', '32,0 MJ/L'],
      ['BSG', 'par máximo · potencia máxima · relación de correa', '55 N·m · 12 kW · 2,83'],
      ['Paquete de 48 V', 'capacidad · resistencia · ventana de SOC', '10 A·h · 40 mΩ · 35 a 80 %'],
      ['Vehículo', 'masa, C<sub>rr</sub>, C<sub>d</sub>A, rendimiento de línea', '1 350 kg · 0,011 · 0,62 m² · 0,92'],
      ['Carga de 12 V', 'por defecto · rendimiento del CC-CC', '450 W · 0,94'],
      ['Arranque en caliente (90 °C)', 'tiempo · energía eléctrica', '0,48 s · 1,32 kJ'],
      ['Ciclo urbano', 'ahorro start-stop · ahorro mild completo', '13,3 % · 22,2 % (9,08 → 7,07 L/100 km)'],
      ['Consumo equivalente', 'combustible que vale cada J de batería', 'C<sub>eq</sub> = 2,3 J de combustible por J químico']
    ]
  },
  s3: [
    'Escáner del vehículo para leer el estado del start-stop, la temperatura del motor, el SOC y la corriente del paquete de 48 V.',
    'Multímetro y pinza amperimétrica de CC para medir el paquete y el convertidor, con guantes y herramientas aislados.',
    'Osciloscopio con sonda de corriente para ver el arranque y los rizos de par del BSG.',
    'Medidor de consumo (caudalímetro o lectura de inyección) para comparar el mismo recorrido con y sin start-stop.'
  ],
  s4: {
    intro: 'El orden del laboratorio (predicción, ajuste, diagnóstico) es una <b>descomposición pedagógica</b>. Un diagnóstico real de un mild hybrid añade:',
    items: [
      'Leer los códigos y las condiciones que inhiben el start-stop (temperatura, SOC, carga de 12 V, cinturón y capó cerrados).',
      'Comprobar la tensión y el estado de la batería de 12 V, que es la causa más común de que el sistema se desactive.',
      'Revisar la tensión de la correa y su desgaste, y el aislamiento y los conectores naranjas de alta tensión.',
      'Medir el consumo en un recorrido repetible con el sistema activo y desactivado, a la misma temperatura.'
    ]
  },
  s5: {
    modela: 'el <b>consumo de un motor de gasolina por la línea de Willans</b> (combustible = (P + P<sub>fricción</sub>)/η<sub>i</sub>), el corte de inyección en deceleración, el <b>arranque del BSG</b> integrado con J·dω/dt = T − T<sub>res</sub> (con el rizo de compresión y un término viscoso), un paquete de iones de litio como fuente V<sub>oc</sub>(SOC) con resistencia R (P = V<sub>oc</sub>·I − R·I²), el convertidor CC-CC, el ciclo urbano casi estático con <b>balance de energía exacto</b> (el residuo es del orden de 10⁻¹⁴) y las reglas del start-stop (temperatura, SOC, tiempo mínimo encendido y demanda de tracción). El reto compara el <b>consumo equivalente</b> (combustible más el valor de la energía que falta en la batería) con el óptimo hallado por barrido y refinamiento, y exige terminar con el SOC a ±2 puntos de 60 % y sin saturar el paquete más de 1 s. Se verifica con 196 comprobaciones: pendiente de Willans, arranque contra su forma cerrada, inversa de la batería, balance de energía en 54 casos, la cota teórica del ahorro del start-stop y el óptimo interior del reto.',
    noModela: 'la <b>dinámica de la marcha</b> (el ciclo es casi estático, sin cambio de marchas real), la <b>térmica</b> del motor y del paquete, el <b>envejecimiento</b> de la celda, el desgaste de la correa y su deslizamiento, ni las emisiones. A −10 °C el BSG no puede arrancar el motor (par de compresión mayor que 55 N·m) y el start-stop se inhibe; no se modela el arranque en frío con el motor de arranque convencional. El valor C<sub>eq</sub> = 2,3 y los umbrales del reto son <b>correlaciones didácticas</b>. Los giros visuales van a 1/40 del real. No es CFD, FEM ni una certificación.'
  },
  s6: [
    'Heywood, <i>Internal Combustion Engine Fundamentals</i>, capítulos de fricción y de eficiencia del motor.',
    'Guzzella y Sciarretta, <i>Vehicle Propulsion Systems</i>, línea de Willans y gestión de energía de híbridos.',
    'Plett, <i>Battery Management Systems</i>, modelo de celda de resistencia en serie y energía almacenada.',
    'LV 148 y VDA 320, red de 48 V en el automóvil (niveles de tensión y límite de 60 V).'
  ]
});
