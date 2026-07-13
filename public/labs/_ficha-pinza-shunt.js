/* Ficha técnica · Pinza amperimétrica y shunt — contenido específico del lab */
fichaTecnica({
  title: 'Pinza amperimétrica y shunt — medir corriente sin (o con) abrir el circuito',
  intro: 'Este laboratorio compara dos formas de medir corriente en <b>tres escenarios</b> (motor de arranque CD, calefactor CA con cordón dúplex, bobina de relevador CD): la <b>pinza</b>, que no toca el circuito y detecta el campo magnético del conductor, y el <b>shunt</b>, que se inserta EN SERIE y convierte la corriente en una caída de tensión. Ninguna de las dos es "la correcta" — cada una tiene un error característico que el escenario hace evidente.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> pinza con mordaza abrible, selector de modo (Hall para CD/CA vs. transformador de corriente TC solo-CA), botón de cero/tara, pantalla digital; shunt patrón (resistencia de bajo valor) intercambiable por un puente directo en el mismo par de terminales; tres circuitos de carga con su fuente correspondiente.',
    omitidos: [
      '<b>Respuesta en frecuencia y ancho de banda</b> de la pinza: aquí se asume plana; en un instrumento real cae a alta frecuencia (armónicos, PWM).',
      '<b>Saturación del núcleo</b> a corrientes muy por encima del rango: el modelo satura la lectura al máximo de rango, no reproduce el colapso no lineal real.',
      '<b>Deriva térmica del offset Hall</b>: el offset de cero aquí es fijo; en un sensor real cambia con la temperatura ambiente y con el autocalentamiento.',
      '<b>Sensibilidad a la posición del conductor</b> dentro de la mordaza: en la pinza real, un cable descentrado introduce error adicional; aquí la lectura no depende de dónde quede el conductor.',
      '<b>Disipación de potencia y calentamiento del shunt</b> a corriente nominal sostenida, y el consecuente error térmico de largo plazo.',
      '<b>Calibración trazable certificada</b>: el modelo aplica un presupuesto de exactitud fijo, no el proceso de calibración real contra un patrón.'
    ]
  },
  s2: {
    title: 'Especificaciones usadas por el modelo',
    warn: 'Valores <b>representativos</b> de una pinza y un shunt de gama industrial — no de una marca/modelo específico. Para trabajo real, usa la hoja de datos de <b>tu</b> instrumento: el formato ±(% de lectura + dígitos) es el mismo.',
    rows: [
      ['Instrumento', 'Exactitud', 'Rango / capacidad'],
      ['Pinza — modo Hall (CD y CA)', '±(2.0 % + 5 dígitos) · 6000 cuentas', '6 A · 60 A · 600 A (autorrango)'],
      ['Pinza — modo TC (solo CA)', 'mismo presupuesto que Hall en CA · <b>no mide CD</b>', '6 A · 60 A · 600 A (autorrango)'],
      ['Offset de cero (modo Hall, CD)', '≈ 1.2 A típico si no se tara antes de medir', 'dominante en corrientes pequeñas (< 1 A)'],
      ['Shunt patrón', '±(0.5 % + 2 dígitos) · 2000 cuentas', '75 mV a la corriente nominal (100 A / 10 A / 1 A según escenario)']
    ]
  },
  s3: [
    'Pinza amperimétrica con categoría CAT adecuada al punto de medición (y modo Hall si hay corriente CD).',
    'Shunt patrón calibrado, con certificado de trazabilidad, dimensionado a la corriente nominal del circuito.',
    'Multímetro o registrador para leer la caída de tensión del shunt (aquí integrado en el modelo).',
    'Puente/jumper de baja resistencia para dejar el lazo cerrado cuando el shunt no está en servicio.'
  ],
  s4: {
    intro: 'Elegir el instrumento correcto — y leerlo correctamente — es parte de la competencia, no un detalle. Un procedimiento real añade:',
    items: [
      'Tarar el cero de la pinza en modo Hall antes de medir corrientes pequeñas: el offset típico compite con la señal cuando esta es del orden de 1 A o menos.',
      'Confirmar si la carga es CD o CA <b>antes</b> de elegir modo Hall o TC: el modo transformador de corriente no mide CD, solo simula "0 A" o falla, no un error visible.',
      'Al insertar un shunt, considerar el efecto de carga: su resistencia se suma al lazo y puede reducir la corriente real, sobre todo en lazos de baja resistencia (motores de arranque, bobinas).',
      'En un cordón dúplex (vivo + neutro), verificar que la mordaza abrace SOLO el conductor de interés: abrazar ambos cancela la lectura por ley de Ampère, el mismo principio que usa un interruptor diferencial (GFCI/RCD).',
      'Registrar rango, resolución y U junto con la lectura — no solo el número que muestra la pantalla.'
    ]
  },
  s5: {
    modela: 'el presupuesto de exactitud ±(% de lectura + dígitos) de pinza y shunt con su resolución por rango, el efecto de carga por inserción en serie del shunt (R_shunt sumada al lazo), la cancelación de Ampère al abrazar vivo y neutro de un cordón dúplex, el offset de cero del sensor Hall en CD y la necesidad de tararlo, y la limitación del modo transformador de corriente para no medir CD.',
    noModela: 'la respuesta en frecuencia ni el ancho de banda real de la pinza, la saturación no lineal del núcleo a sobrecorriente, la deriva térmica del offset Hall, el efecto de la posición del conductor dentro de la mordaza, el calentamiento del shunt a corriente sostenida, ni la calibración trazable certificada — el certificado lo emite un laboratorio acreditado.'
  },
  s6: [
    '<b>IEC 61010-2-032</b>: requisitos particulares de seguridad para pinzas amperimétricas (complementa IEC 61010-1).',
    '<b>IEC 61010-1 / UL 61010-1</b>: requisitos generales de seguridad y categorías de medición CAT II–IV.',
    '<b>JCGM 100:2008 (GUM)</b> / <b>NMX-CH-140-IMNC-2002</b>: guía para la expresión de la incertidumbre de medida.',
    '<b>NOM-029-STPS-2011</b> (México): mantenimiento de instalaciones eléctricas — seguridad del trabajador.',
    'Hojas de datos de pinzas amperimétricas y shunts patrón industriales (formato ±(% + dígitos)) para las especificaciones 1:1 de cada instrumento.'
  ]
});
