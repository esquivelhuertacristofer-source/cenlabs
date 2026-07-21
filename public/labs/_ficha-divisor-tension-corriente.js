/* Ficha técnica · Divisores de Tensión y Corriente — contenido específico del lab */
fichaTecnica({
  title: 'Divisores de Tensión y Corriente — diseño con efecto de carga',
  intro: 'Este laboratorio representa una <b>sesión de diseño de circuitos</b>: un divisor de tensión (V1, R1, R2) y su hermano, un divisor de corriente (I0, R1c, R2c), declarados como datos y resueltos en vivo por el mismo motor de <b>análisis nodal modificado (MNA)</b> del laboratorio de Kirchhoff, extendido para permitir que una rama quede eléctricamente abierta (RL conectada/desconectada). El esquema usa símbolos <b>IEC 60617</b> y los resistores, código de colores <b>E12 (IEC 60063)</b>. El reto no pide predecir un valor: pide <b>diseñar</b> R1 y R2 dentro de un presupuesto de error de carga y de corriente de reposo.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> esquema normalizado con el divisor de tensión y, en un segundo circuito, el divisor de corriente; motor MNA extendido (permite abrir/cerrar la rama RL sin alterar la topología declarada); cálculo en vivo de Vo ideal vs. Vo cargado y del error de carga porcentual; contraste contra la equivalencia de Thévenin del propio divisor (Vth, Rth); reto de diseño con 6 escenarios fijos (voltaje objetivo, RL fija, presupuesto de error ≤5 % y de corriente de reposo ≤25 mA); código de colores real de cada resistor.',
    omitidos: [
      '<b>Tolerancias reales de los componentes</b>: la banda oro declara ±5 %, pero el motor usa el valor nominal exacto. En un divisor físico, R1 y R2 caen en algún punto de su banda de tolerancia y Vo se desvía del valor calculado — el efecto es más notorio cuanto más “rígido” (bajo valor de R) se diseñe el divisor para bajar el error de carga.',
      '<b>Resistencia interna de la fuente V1</b>: es ideal (impedancia cero) y de valor fijo (12 V) en todos los modos — una simplificación didáctica deliberada. Una fuente real cae bajo carga; ese efecto se modela añadiendo una R en serie, y el mismo motor MNA la resuelve.',
      '<b>Resistencia de conductores y contactos</b>: los cables del esquema son equipotenciales perfectos; en un protoboard real, contactos oxidados o flojos añaden décimas de ohm por punto, más notorio en el lazo de corriente de reposo del reto.',
      '<b>Impedancia de entrada del siguiente circuito</b>: aquí RL es una resistencia pura y fija por escenario. En un diseño real, la “carga” suele ser la impedancia de entrada de un amplificador, ADC o comparador, que puede variar con la frecuencia o el punto de operación.',
      '<b>Efectos térmicos</b>: el coeficiente de temperatura (típ. ±100 ppm/°C en resistores de película) y el autocalentamiento por I²R quedan fuera del modelo — relevante en el divisor de corriente si I0 es alta.',
      '<b>La medición física</b>: aquí Vo, I1 e I2 son la solución exacta del modelo; medirlos con un DMM real añade carga del instrumento (más grave cuanto mayor sea R1/R2) e incertidumbre ±(% + dígitos) — eso lo ejercita la práctica del multímetro.'
    ]
  },
  s2: {
    title: 'Redes canónicas y motor de cálculo',
    warn: 'Los valores de R1/R2/RL (divisor de tensión) y R1c/R2c/I0 (divisor de corriente) se eligen de listas comerciales E12 fijas, no de un generador aleatorio. Los voltajes y corrientes mostrados son la <b>solución exacta del modelo ideal</b> para la combinación elegida, no lecturas de instrumento.',
    rows: [
      ['Elemento', 'Rango disponible', 'Papel en la red'],
      ['V1', '12 V (ideal, fija)', 'Alimenta el divisor de tensión en los modos EXPLORA/CARGA/RETO'],
      ['R1 · R2', '470 Ω – 10 kΩ (7 valores E12)', 'Ramas serie del divisor: fijan Vo ideal = V1·R2/(R1+R2)'],
      ['RL', '1 kΩ – 10 kΩ (4 valores E12)', 'Carga conectable/desconectable en paralelo con R2 (modo CARGA y RETO)'],
      ['I0 · R1c · R2c', '5–20 mA · 1 kΩ – 10 kΩ', 'Fuente de corriente ideal y dos ramas en paralelo (modo CORRIENTE)'],
      ['Motor', 'MNA extendido + Gauss con pivoteo', 'Ho–Ruehli–Brennan (1975); una bandera on/off por resistor permite abrir la rama RL sin rehacer la topología']
    ]
  },
  s3: [
    'Protoboard o tarjeta de prácticas con resistores de la <b>serie E12</b> (±5 %) para montar físicamente el mismo divisor.',
    'Fuente de alimentación regulada de 12 V con límite de corriente, para reproducir V1.',
    'Fuente de corriente de laboratorio (o un circuito espejo de corriente simple) para reproducir I0 en el divisor de corriente.',
    'Multímetro digital para verificar Vo y las corrientes de rama predichas (ver la práctica del multímetro para su incertidumbre).',
    'Simulador SPICE (LTspice, ngspice — gratuitos) para contrastar: internamente usan el <b>mismo MNA</b> de este lab.'
  ],
  s4: {
    intro: 'Calcular el divisor en papel es el <b>inicio</b>; el diseño de verdad se cierra verificando la carga. Un procedimiento real añade:',
    items: [
      'Calcular primero Vo <b>ideal</b> (sin carga) y luego Vo <b>cargado</b> con la RL real del siguiente circuito — nunca asumir que coinciden.',
      'Si el error de carga excede el presupuesto, bajar los valores de R1/R2 (divisor más “rígido”) y volver a verificar la corriente de reposo I1 = V1/(R1+R2): siempre hay una disyuntiva entre ambas.',
      'Verificar con el DMM el Vo real contra la predicción y explicar cada desviación (tolerancias, carga del propio instrumento, contactos).',
      'Para el divisor de corriente, medir I1 e I2 con amperímetro en serie (desenergizando primero) o por el método indirecto: ΔV sobre cada resistor dividido entre su R.',
      'Documentar el diseño con su esquema normalizado (IEC 60617), los valores elegidos y la tabla Vo ideal / Vo cargado / error % / corriente de reposo: esa es la evidencia de la práctica.'
    ]
  },
  s5: {
    modela: 'el divisor de tensión resistivo en CD con fuente ideal, resuelto por análisis nodal modificado (MNA) extendido para abrir/cerrar una rama sin cambiar su declaración; el efecto de carga (Vo ideal vs. Vo cargado, error %) contrastado contra la equivalencia de Thévenin del propio divisor; el divisor de corriente con fuente ideal y dos ramas en paralelo; y un reto de diseño con presupuestos explícitos de error de carga y corriente de reposo, sobre 6 escenarios verificados numéricamente.',
    noModela: 'las tolerancias reales (±5 %) ni la deriva térmica de los componentes, la resistencia interna de la fuente V1 (fija en 12 V ideal), la resistencia de conductores y contactos, ni la impedancia de entrada variable de un circuito real conectado a la salida — es el circuito ideal de parámetros concentrados; la medición física con su incertidumbre es materia de la práctica del multímetro.'
  },
  s6: [
    '<b>Hayt, Kemmerly y Durbin</b>, <i>Análisis de circuitos en ingeniería</i> (McGraw-Hill): divisores de tensión y corriente, equivalencia de Thévenin, capítulos introductorios.',
    '<b>IEC 60617</b>: símbolos gráficos para esquemas eléctricos (resistor rectangular, fuentes de tensión y corriente, tierra) — el estándar de representación de este lab.',
    '<b>IEC 60063</b>: series de valores normalizados E6/E12/E24 para resistores — la serie E12 (±5 %) de la que se toman los valores disponibles.',
    '<b>Ho, Ruehli y Brennan (1975)</b>, «The Modified Nodal Approach to Network Analysis», IEEE Trans. CAS: el algoritmo MNA que resuelve ambos circuitos de este lab, extendido con una bandera on/off por rama.'
  ]
});
