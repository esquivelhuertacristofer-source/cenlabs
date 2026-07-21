/* Ficha técnica · Curva V–I de resistores — contenido específico del lab */
fichaTecnica({
  title: 'Curva V–I de resistores — validación de tolerancias por mínimos cuadrados',
  intro: 'Este laboratorio representa una <b>sesión de caracterización eléctrica</b>: con una fuente regulada y un multímetro simulado de 6000 cuentas se toman 8 pares (V, I) sobre un resistor y se ajusta una recta por <b>mínimos cuadrados forzada por el origen</b> (Ley de Ohm, V = I·R) para obtener R̂. El veredicto — ¿el resistor cae dentro de su tolerancia declarada? — se decide comparando R̂ contra el nominal ± tolerancia del <b>código de colores IEC 60062</b>. El montaje 3D es <b>procedural y didáctico</b>; donde el modelo simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> multímetro simulado de 6000 cuentas con autorrango e incertidumbre ±(% de lectura + dígitos) en V e I (misma especificación que la práctica del multímetro); 8 puntos de tensión fijos del 15 % al 105 % de 12 V; ajuste lineal por mínimos cuadrados forzado por el origen; coloreado individual de cada punto (V/I propio vs. banda de tolerancia) para distinguir ruido puntual del ajuste agregado; modo Explora con 4 resistores conocidos (uno deliberadamente fuera de tolerancia) y modo Reto con un resistor «misterioso» generado al azar, calificado de forma autoconsistente contra los propios puntos medidos por el usuario; decodificación de bandas de color bajo demanda.',
    omitidos: [
      '<b>Coeficiente de temperatura y autocalentamiento (I²R)</b>: el modelo asume R constante en todo el rango de corriente. Un resistor real de película o composición cambia de valor con la temperatura del propio cuerpo al disipar potencia — más notorio cerca del punto de operación más alto.',
      '<b>Carga de los instrumentos</b>: el amperímetro se modela con resistencia cero y el voltímetro con impedancia infinita. En la vida real, la elección entre conexión «corta» (V mide antes del ampérmetro) o «larga» (V mide después) introduce un error sistemático que depende de si R es mucho mayor o menor que las resistencias internas del instrumento — aquí no aplica porque ambos son ideales.',
      '<b>Potencia máxima del componente</b>: no se modela el límite de disipación (P = V·I) del resistor; en un banco real, exceder el rating térmico degrada o destruye el componente antes de completar la curva.',
      '<b>Resistencia de cables y contactos</b>: las conexiones son equipotenciales perfectas, igual que en la práctica de Kirchhoff — en un protoboard real se suman décimas de ohm por punto de contacto.',
      '<b>Envejecimiento y deriva del componente</b>: el valor «verdadero» de cada resistor es fijo durante la sesión; no se modela la deriva por ciclos térmicos ni por envejecimiento del material resistivo.',
      '<b>Catálogo completo E12/E24</b>: el modelo usa 4 resistores fijos (modo Explora) y un generador acotado alrededor de esos mismos nominales (modo Reto), no un barrido de la serie normalizada completa.'
    ]
  },
  s2: {
    title: 'Especificaciones del instrumento y del muestreo',
    warn: 'La especificación del multímetro es la <b>misma</b> que en la práctica dedicada al DMM — aquí se reutiliza para que la incertidumbre de cada punto sea consistente entre prácticas. Los 8 puntos de tensión son fijos y conocidos por el modelo; en un banco real, el operador los elige.',
    rows: [
      ['Magnitud', 'Exactitud', 'Rangos (autorrango)'],
      ['V (CD)', '±(0.5 % + 2 dígitos)', '0.6 · 6 · 60 · 600 V'],
      ['I (CD)', '±(1.0 % + 3 dígitos)', '6 · 60 · 600 mA'],
      ['Resolución', 'rango / 6000 cuentas', 'igual formato que la práctica del multímetro'],
      ['Puntos de muestreo', '8 puntos fijos', '15 %, 30 %, 45 %, 60 %, 75 %, 85 %, 95 %, 105 % de 12 V'],
      ['Ajuste', 'mínimos cuadrados por el origen', 'R̂ = Σ(V·I) / Σ(I²)  (Gauss/Legendre, ca. 1805)']
    ]
  },
  s3: [
    'Fuente de alimentación de CD regulada y variable, con lectura de tensión propia o un multímetro adicional en sus bornes.',
    'Multímetro(s) digital(es) true-RMS — uno en modo V en paralelo, otro en modo mA en serie (o uno solo alternando conexión punto a punto).',
    'Juego de resistores de la serie <b>E12 o E24</b> (IEC 60063) con sus bandas de color legibles, más un decodificador o tabla IEC 60062 impresa.',
    'Protoboard o tarjeta de prácticas y puntas de prueba en buen estado (resistencia de contacto despreciable frente a R).'
  ],
  s4: {
    intro: 'Tomar 8 lecturas y ajustar una recta es el <b>final</b> del procedimiento, no el inicio. Un procedimiento real añade:',
    items: [
      'Leer y decodificar las bandas de color <b>antes</b> de conectar el resistor, para saber qué nominal y tolerancia se está validando (IEC 60062).',
      'Verificar el rating de potencia del resistor y calcular P = V·I en el punto más alto de la curva planeada, para no excederlo.',
      'Conectar el amperímetro en serie y el voltímetro en paralelo, decidiendo conscientemente entre conexión «corta» o «larga» según si R es mucho mayor o menor que las resistencias internas del instrumento.',
      'Graficar cada punto según se mide (no solo al final) para detectar un punto atípico — cable flojo, mal contacto — antes de invertir tiempo en los puntos restantes.',
      'Reportar R̂ con su banda de tolerancia y la <b>evidencia</b> (la gráfica V–I con el ajuste), no solo el veredicto PASA/FALLA.'
    ]
  },
  s5: {
    modela: 'la Ley de Ohm (V = I·R) como modelo lineal del resistor; el presupuesto de incertidumbre ±(% de lectura + dígitos) del multímetro de 6000 cuentas en cada punto V e I; el ajuste por mínimos cuadrados forzado por el origen para estimar R̂ a partir de varios puntos ruidosos; y el veredicto de tolerancia según el código de colores IEC 60062 / series preferidas IEC 60063.',
    noModela: 'el coeficiente de temperatura ni el autocalentamiento por I²R, la carga finita de los instrumentos (amperímetro y voltímetro se modelan ideales), el límite de potencia del componente, la resistencia de cables y contactos, ni el envejecimiento o deriva del material resistivo — el resistor es una R constante y exacta durante toda la sesión.'
  },
  s6: [
    '<b>G. S. Ohm (1827)</b>, <i>Die galvanische Kette, mathematisch bearbeitet</i>: enunciado original de V = I·R.',
    '<b>IEC 60062</b>: código de marcado (bandas de color) para resistores y capacitores de valor fijo.',
    '<b>IEC 60063</b>: series de valores normalizados E6/E12/E24/E96 y su relación con la tolerancia declarada.',
    '<b>C. F. Gauss (1809) / A.-M. Legendre (1805)</b>: método de mínimos cuadrados, la base del ajuste R̂ = Σ(V·I)/Σ(I²).',
    '<b>JCGM 100:2008 (GUM)</b>: guía para la expresión de la incertidumbre de medida — el mismo marco ±(% + dígitos) usado en la práctica del multímetro.'
  ]
});
