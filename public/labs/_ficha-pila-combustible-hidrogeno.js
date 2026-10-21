/* Ficha técnica · Pila de combustible de hidrógeno (PEMFC) — contenido específico del lab */
fichaTecnica({
  title: 'Pila de combustible de hidrógeno (PEMFC)',
  intro: 'Este laboratorio representa el <b>stack de una pila de combustible de membrana de intercambio protónico</b> de un vehículo, cortado por la mitad: placas bipolares con sus canales de H₂ y de aire, capas de difusión, catalizador, membrana, refrigerante, colectores de cobre y tapas con tirantes, más el motor que consume la potencia. Lo que se mueve, se calienta o se colorea sale de un modelo calculado y verificado (Nernst, polarización, Faraday, balance de calor, compresor); donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> 10 de las N celdas (cada una con placa bipolar, GDL de ánodo, catalizador de ánodo, membrana, catalizador de cátodo y GDL de cátodo), los túneles de alimentación de H₂ (arriba) y de aire (abajo) con su cuello hacia los canales, el refrigerante dentro de cada placa bipolar, las juntas, los colectores de corriente de cobre con su borne, las placas aislantes, las tapas de aluminio con cuatro tirantes y los racores de entrada, el cable de alta tensión y el motor con su rotor.',
    omitidos: [
      '<b>El circuito de hidrógeno</b>: tanque a 700 bar, regulador, recirculación del ánodo (eyector o soplante) y válvula de purga. Se resume en una utilización de combustible del 98 %.',
      '<b>El humidificador, el turboexpansor y el intercooler del aire</b>: el compresor es un compresor isentrópico con rendimiento y no se recupera la energía del escape.',
      '<b>El convertidor CC–CC y el inversor</b>: sólo se conoce la ventana de tensión que admiten (220–420 V).',
      '<b>La batería de apoyo</b>, el control de arranque en frío (T < 0 °C), los sensores de tensión de celda y la monitorización de hidrógeno.'
    ]
  },
  s2: {
    title: 'Valores del modelo y seguridad',
    warn: '⚠ El <b>hidrógeno</b> arde en un rango de 4 a 75 % en aire y casi no se ve: una instalación real lleva detectores, ventilación y válvulas de corte. La pila trabaja con <b>cientos de voltios</b> en corriente continua y no puede «apagarse» abriendo el circuito: mientras haya H₂ y aire, hay tensión. Valores representativos.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Tensión reversible', 'E₀(25 °C), agua líquida, 1 atm', '1,229 V'],
      ['Tensión termoneutra', 'PCI / PCS, por celda', '1,2532 V / 1,4812 V'],
      ['Tensión en circuito abierto', '80 °C, 2 bar, gases al 90 %', '≈ 0,98 V (modelo)'],
      ['Tensión de celda a 1,4 A/cm²', 'mismo punto', '≈ 0,63 V'],
      ['Membrana', 'Nafion de 25 µm, λ de Springer', 'σ ≈ 0,12 S/cm a λ = 14 y 80 °C'],
      ['Poder calorífico del H₂', 'PCI (vapor) · PCS (líquido)', '119,96 MJ/kg · 141,9 MJ/kg'],
      ['Compresor', 'isentrópico 0,72 · motor 0,93 · λ aire = 1,8', 'PR de 1,2 a 3,0'],
      ['Reto', 'potencia neta · ventana de la CC–CC', '100 kW ± 2 % · 220–420 V']
    ]
  },
  s3: [
    'Banco de pruebas con carga electrónica, controladores de flujo másico, humidificadores y regulación de temperatura del refrigerante.',
    'Espectroscopía de impedancia (HFR) y voltametría para medir la resistencia óhmica, J<sub>n</sub> (cruce de H₂) y el área activa del catalizador.',
    'Medida de tensión de cada celda (un monitor de celdas) y de pérdida de presión entre la entrada y la salida del stack.',
    'Detectores de hidrógeno, analizador de gas de purga y balanza para el consumo de H₂.'
  ],
  s4: {
    intro: 'El orden del laboratorio es una <b>descomposición pedagógica</b>. Una instalación y una puesta en marcha reales añaden:',
    items: [
      '<b>Acondicionar la pila</b> (rodaje): ciclos de corriente hasta que la membrana y el catalizador alcanzan su rendimiento nominal.',
      '<b>Ensayo de estanqueidad</b> de los tres circuitos (H₂, aire y refrigerante) y de aislamiento eléctrico antes de energizar.',
      '<b>Curva de polarización medida</b> a varias temperaturas, presiones y humedades, y comparación con la de referencia del fabricante.',
      'Verificar el <b>arranque y el apagado</b> (purga con nitrógeno) y la respuesta a un escalón de potencia.'
    ]
  },
  s5: {
    modela: 'la <b>tensión de celda</b> V = E<sub>Nernst</sub> − V<sub>act</sub> − V<sub>óhm</sub> − V<sub>conc</sub> con la ecuación de Nernst de Larminie y Dicks (E₀ lineal en T y presiones parciales con la presión de vapor de Buck), la activación de Tafel con la pérdida interna J<sub>n</sub> (de ahí el OCV real), la resistencia de la membrana con la conductividad y el contenido de agua de <b>Springer</b>, la pérdida por concentración con corriente límite, el consumo de H₂ y la producción de agua por <b>Faraday</b>, el calor Q = N·I·(1,2532 − V), el compresor isentrópico, el balance de potencia (neta, auxiliares, calor y purga) y la potencia neta máxima de la pila; además el óptimo de presión del reto y cuatro fallas (membrana seca, cátodo inundado, cruce de H₂, catalizador degradado).',
    noModela: 'la <b>distribución de agua líquida</b> (la inundación es una correlación sobre la corriente límite, no un modelo de dos fases), los <b>gradientes a lo largo del canal</b> y entre celdas, la <b>dinámica</b> (doble capa, hidratación, térmica) y el arranque en frío, la degradación con el tiempo y las constantes de <b>una pila comercial</b> concreta: los parámetros (J₀ = 4·10⁻⁶ A/cm², α = 1, R<sub>el</sub> = 35 mΩ·cm², J<sub>L</sub> = 2,1 A/cm² a 2 bar) son valores de libro y de artículo, no un ajuste. El 3D es un esquema: se dibujan 10 de las N celdas, los espesores van ensanchados (la membrana real mide 25 µm), el número de partículas es fijo y su ritmo sigue a la corriente. El 98 % de utilización de H₂ y el rendimiento del compresor son supuestos.'
  },
  s6: [
    '<b>Larminie y Dicks</b>, <i>Fuel Cell Systems Explained</i> (Nernst, polarización, rendimiento) · <b>Barbir</b>, <i>PEM Fuel Cells: Theory and Practice</i>.',
    '<b>Springer, Zawodzinski y Gottesfeld</b>, «Polymer electrolyte fuel cell model», <i>J. Electrochem. Soc.</i> 138 (1991): contenido de agua y conductividad del Nafion.',
    '<b>Buck</b> (1996): presión de vapor del agua · <b>CODATA 2018</b>: constante de Faraday y de los gases.',
    '<b>IEC 62282-2</b>: módulos de pila de combustible · <b>SAE J2615</b> y <b>J2617</b>: ensayos de rendimiento y de arranque de sistemas de pila para vehículos · <b>ISO 14687</b>: calidad del hidrógeno.'
  ]
});
