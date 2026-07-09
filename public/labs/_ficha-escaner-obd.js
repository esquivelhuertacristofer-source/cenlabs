/* Ficha técnica · Escáner OBD-II — contenido específico del lab */
fichaTecnica({
  title: 'Escáner OBD-II — diagnóstico a bordo',
  intro: 'Este laboratorio representa una <b>sesión de diagnóstico OBD-II</b>: la computadora del vehículo (ECU/PCM) detecta fallas, guarda <b>códigos (DTC)</b> y una <b>trama congelada</b>, y un escáner los lee por el conector estandarizado. La geometría es <b>procedural y didáctica</b>; donde el modelo simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> conector de diagnóstico (DLC), computadora (ECU/PCM), sensores de referencia, testigo de falla (MIL) y bus de datos.',
    omitidos: [
      '<b>Puerta de enlace de seguridad</b> (Security Gateway / SGW): en autos modernos filtra el acceso al bus y exige autenticación.',
      '<b>Múltiples ECU en el bus</b> (motor, transmisión, ABS, carrocería): el diagnóstico real navega varias unidades.',
      '<b>Arnés y pines reales</b>: cableado, terminaciones y las señales eléctricas del CAN.',
      '<b>Inmovilizador / antirrobo</b> y las funciones protegidas por seguridad.',
      '<b>PID de fabricante</b> (modo 22 / bidireccional): datos y actuadores propietarios más allá de los genéricos.',
      '<b>Monitores de disponibilidad</b> (readiness) y su ciclo de manejo real para volverlos “listos”.'
    ]
  },
  s2: {
    title: 'Conector, protocolos y modos de servicio',
    warn: 'Valores del estándar OBD-II. Los <b>PID de fabricante</b> y el pinout completo varían: consulta el manual de servicio (OEM / Mitchell1 / ALLDATA).',
    rows: [
      ['Elemento', 'Detalle', 'Ref.'],
      ['Conector DLC', '16 pines · pin 16 = +12 V · 4/5 = GND · 6/14 = CAN H/L', 'SAE J1962'],
      ['Protocolo actual', 'CAN a 500 kbps (obligatorio desde 2008)', 'ISO 15765-4'],
      ['Modos (services)', '01 datos en vivo · 02 freeze frame · 03 DTC · 04 borrar · 06 pruebas · 07 pendientes · 09 VIN', 'SAE J1979'],
      ['Formato de DTC', 'letra P/C/B/U + 4 dígitos (P0xxx = genérico)', 'SAE J2012']
    ]
  },
  s3: [
    'Escáner OBD-II (genérico para códigos; <b>bidireccional / de fabricante</b> para actuadores y datos ampliados).',
    'Multímetro y <b>osciloscopio automotriz</b> para ver las señales reales del bus y de cada sensor.',
    'Caja de ruptura (breakout box) y diagramas eléctricos del vehículo.',
    'Manual de códigos y boletines de servicio (TSB) del fabricante.'
  ],
  s4: {
    intro: 'Leer el código es el <b>inicio</b>, no el diagnóstico. Un procedimiento real añade:',
    items: [
      'Verificar el síntoma y revisar la <b>trama congelada</b> (condiciones cuando falló).',
      'Consultar el diagrama eléctrico y medir en el conector antes de sustituir piezas.',
      'Probar actuadores de forma <b>bidireccional</b> y confirmar la causa raíz.',
      'Borrar códigos y repetir un <b>ciclo de manejo</b> para dejar los monitores “listos”.'
    ]
  },
  s5: {
    modela: 'la lógica de diagnóstico (detección de falla → DTC), el concepto de trama congelada, el recorrido por los modos de servicio y el testigo MIL.',
    noModela: 'las señales eléctricas reales del CAN, la autenticación de la puerta de seguridad, los PID propietarios a bajo nivel ni la física de cada sensor.'
  },
  s6: [
    '<b>SAE J1979</b>: modos de servicio y PID de diagnóstico. <b>SAE J2012</b>: definición de los DTC.',
    '<b>SAE J1962</b>: conector físico de diagnóstico (DLC).',
    '<b>ISO 15765-4</b> (CAN) e <b>ISO 15031-5/-6</b>: comunicación y definición de datos OBD.',
    '<b>NOM-047-SEMARNAT-2014</b> (México): características del sistema de diagnóstico a bordo.',
    'Manuales OEM y bases técnicas (Mitchell1 / ALLDATA) para diagramas 1:1.'
  ]
});
