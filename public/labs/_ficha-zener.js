/* Ficha técnica · Diodo Zener: Regulador Shunt de Voltaje — contenido específico del lab */
fichaTecnica({
  title: 'Diodo zener como regulador shunt de voltaje',
  intro: 'Este laboratorio modela un diodo zener operando en <b>avalancha controlada (polarización inversa)</b> como elemento regulador de voltaje en configuración <b>shunt</b> (en paralelo con la carga), alimentado a través de un resistor serie Rs. El motor de cálculo usa el <b>modelo lineal por tramos</b> (piecewise-linear) estándar de hoja de datos — corte, codo y avalancha — anclado a los parámetros VZ@IZT, ZZT, IZK, ZZK e IZM publicados por el fabricante, y resuelve el punto de operación del circuito por <b>bisección numérica exacta</b>, no por aproximación lineal de un solo tramo. El esquema usa símbolos <b>IEC 60617</b>. El montaje 3D es <b>procedural y didáctico</b>; donde el modelo simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> modelo zener lineal por tramos con tres regiones físicas (corte Iz=0, codo con resistencia dinámica ZZK, avalancha con resistencia dinámica ZZT); voltaje de codo VZK y de intersección V0 <b>derivados por fórmula</b> de los parámetros de hoja de datos (VZ, IZT, ZZT, IZK), no valores arbitrarios; solución del circuito Rs–zener–RL por <b>bisección monótona</b> sobre la ecuación de nodo exacta (Vin−V)/Rs − Iz(V) − V/RL = 0, válida para cualquier combinación de Rs, RL y Vin dentro del rango de la gráfica; verificación de márgenes de seguridad de corriente (IZK como mínimo de regulación, IZM como máximo absoluto) y de potencia (Pz = Vz·Iz contra PD del dispositivo); modo Barrido que mide la <b>regulación de línea</b> (dVout/dVin) por regresión sobre puntos simulados y la compara contra la fórmula teórica de pequeña señal Rp/(Rp+Rs), con Rp = ZZT ∥ RL.',
    omitidos: [
      '<b>Coeficiente de temperatura αVZ</b>: las hojas de datos de la familia consultada no reportan un valor único y confiable de αVZ por parte (varía con VZ e Iz de forma no trivial); el efecto se muestra solo como <b>nota cualitativa</b> (VZ tiende a bajar con T en zeners de VZ&lt;5 V y a subir en VZ&gt;5 V) — el deslizador de temperatura de este lab no desplaza ningún número.',
      '<b>Corriente de fuga sub-codo</b>: para V ≤ V0 el modelo idealiza Iz = 0 exacto; un zener real conduce una fuga inversa pequeña pero no nula incluso antes del codo.',
      '<b>Capacitancia de unión y respuesta AC/transitoria</b>: el zener del modelo es un elemento puramente resistivo por tramos en CD; no se modela su capacitancia de unión (relevante en aplicaciones de supresión de transitorios) ni la velocidad de respuesta ante escalones rápidos de Vin.',
      '<b>Ruido de avalancha</b>: la avalancha zener es una fuente conocida de ruido eléctrico de banda ancha, usada incluso deliberadamente en generadores de ruido; este modelo entrega un Iz determinista sin componente de ruido.',
      '<b>Fuente y resistores ideales</b>: Vin se trata como fuente de voltaje ideal sin resistencia interna, y Rs/RL como resistencias ideales sin tolerancia ni coeficiente térmico — en la práctica real ambas cosas afectan la precisión de Vout.',
      '<b>Derrateo térmico de IZM y PD</b>: el límite de corriente/potencia se compara contra el rating de hoja de datos a temperatura de referencia del fabricante; un zener real pierde capacidad de disipación al subir la temperatura ambiente o de encapsulado (curva de derrateo).',
      '<b>Rs como limitador de arranque</b>: el modelo resuelve directamente el punto de operación en régimen permanente; no simula el transitorio de encendido de la fuente ni posibles picos de corriente de arranque.'
    ]
  },
  s2: {
    title: 'Dispositivos y parámetros del modelo',
    warn: 'Los parámetros de cada zener son <b>valores de hoja de datos a la corriente de prueba estándar (IZT)</b> ⚑ — VZK, V0 e IZM mostrados en pantalla son <b>derivados por fórmula</b> a partir de ellos, no medidos de una pieza física. Contrastar siempre con la hoja de datos de la parte real antes de usar en diseño.',
    rows: [
      ['Dispositivo', 'Parámetros de hoja de datos (@ 25 °C)', 'Comportamiento típico'],
      ['1N4728A', 'VZ = 3.3 V @ IZT = 76 mA · ZZT = 10 Ω · IZK = 1 mA · ZZK = 400 Ω · IZM = 276 mA · PD = 1 W', 'Codo suave, corriente de prueba alta — típico de zeners de bajo voltaje'],
      ['1N4733A', 'VZ = 5.1 V @ IZT = 49 mA · ZZT = 7 Ω · IZK = 1 mA · ZZK = 500 Ω · IZM = 178 mA · PD = 1 W', 'Familia de 1 W — mismo VZ nominal que el 1N5231B pero mayor IZM'],
      ['1N5231B', 'VZ = 5.1 V @ IZT = 20 mA · ZZT = 17 Ω · IZK = 1 mA · ZZK = 1600 Ω · IZM = 95 mA · PD = 500 mW', 'Mismo VZ que el 1N4733A pero encapsulado de 500 mW — menor IZM: el rating de potencia del chip, no solo VZ, define la corriente máxima admisible'],
      ['Región de corte', 'V ≤ V0 → Iz = 0 (idealizado)', 'El zener no conduce; Vout sigue a Vin a través de Rs y RL como divisor resistivo'],
      ['Región de codo', 'V0 < V ≤ VZK → Iz = (V−V0)/ZZK', 'Transición suave hacia la avalancha; resistencia dinámica alta (ZZK)'],
      ['Región de avalancha', 'V > VZK → Iz = IZK + (V−VZK)/ZZT', 'Región de regulación útil; resistencia dinámica baja (ZZT) — Vout casi constante']
    ]
  },
  s3: [
    'Diodos zener físicos de las familias <b>1N4728A–1N4764A</b> (1 W) y <b>1N5221B–1N5281B</b> (500 mW), con sus hojas de datos para contrastar VZ, ZZT, IZK, ZZK e IZM.',
    'Fuente de alimentación de CD variable (para reproducir Vin), resistores serie Rs de precisión (47 Ω – 220 Ω) y resistores de carga RL (100 Ω – 1 kΩ, más la condición de carga abierta).',
    'Multímetro en modo CD para medir Vout, y en modo miliamperímetro (en serie) para medir Iz — ver la práctica del multímetro.',
    'Fuente de alimentación variable con límite de corriente ajustable, para poder barrer Vin de forma segura sin exceder IZM del dispositivo bajo prueba.'
  ],
  s4: {
    intro: 'Simular el regulador shunt es el <b>inicio</b>; construir y medir el circuito físico cierra el aprendizaje. Un procedimiento real añade:',
    items: [
      'Verificar la polaridad del zener con el modo diodo del multímetro antes de energizar: la banda catódica debe quedar hacia el lado positivo de Vin (polarización inversa).',
      'Calcular Rs con margen antes de energizar, nunca conectar el zener directamente a la fuente sin resistor serie — sin Rs, la corriente de avalancha no tiene límite y el dispositivo se destruye en milisegundos.',
      'Medir Iz insertando el amperímetro en serie con el zener (no con Rs), para no confundir Iz con la corriente total entregada por Rs (Ir = Iz + Il).',
      'Verificar experimentalmente el efecto de RL: al desconectar la carga (RL → abierto), toda la corriente de Rs pasa por el zener — confirmar que no se exceda IZM en esa condición, el peor caso de corriente para el dispositivo.',
      'Contrastar la pendiente medida de Vout contra Vin (regulación de línea) con la fórmula teórica Rp/(Rp+Rs), y notar que a mayor ZZT (peor zener) o menor RL, la regulación empeora — esto es más fácil de ver en el laboratorio real, donde ningún zener tiene ZZT = 0.'
    ]
  },
  s5: {
    modela: 'el modelo zener lineal por tramos (corte, codo, avalancha) con VZK, V0 e IZM derivados por fórmula de parámetros reales de hoja de datos (VZ, IZT, ZZT, IZK, ZZK, IZM, PD); la solución exacta del circuito regulador shunt (Rs, zener, RL) por bisección numérica; la verificación de márgenes de seguridad de corriente y potencia contra los ratings del dispositivo; y la medición de regulación de línea (dVout/dVin) por barrido numérico, comparada contra la fórmula teórica de pequeña señal.',
    noModela: 'el coeficiente de temperatura αVZ (sin valor único confiable en las hojas de datos consultadas — se muestra solo como nota cualitativa), la corriente de fuga sub-codo (idealizada en 0), la capacitancia de unión y la respuesta AC/transitoria del zener, el ruido de avalancha, la fuente y los resistores como elementos no ideales (sin resistencia interna ni tolerancia), ni el derrateo térmico de IZM y PD con la temperatura ambiente o de encapsulado.'
  },
  s6: [
    '<b>Millman y Halkias</b>, <i>Electronic Devices and Circuits</i> (McGraw-Hill): modelo lineal por tramos del diodo zener y análisis del regulador shunt.',
    '<b>Boylestad y Nashelsky</b>, <i>Electronic Devices and Circuit Theory</i> (Pearson): ecuaciones de diseño de Rs para reguladores zener, incluyendo el análisis de los dos casos extremos (Vin mínimo con carga máxima, Vin máximo sin carga).',
    '<b>Sedra y Smith</b>, <i>Microelectronic Circuits</i> (Oxford): resistencia dinámica del zener (rz o ZZT) y su papel en la regulación de línea y de carga.',
    '<b>IEC 60617</b>: símbolos gráficos para esquemas eléctricos (diodo zener, fuente CD, resistor) — el estándar de representación de este lab.',
    '<b>Hoja de datos ON Semiconductor 1N4728A–1N4764A</b>: familia de 1 W — VZ, ZZT, IZK, ZZK, IZM y PD de los dispositivos 1N4728A y 1N4733A modelados aquí.',
    '<b>Hoja de datos Vishay General Semiconductor 1N5221B–1N5281B</b>: familia de 500 mW — VZ, ZZT, IZK, ZZK, IZM y PD del dispositivo 1N5231B modelado aquí.',
    '<b>Nota sobre αVZ</b> ⚑: distintos fabricantes reportan el coeficiente de temperatura de forma no uniforme entre partes de una misma familia (algunas hojas de datos lo omiten, otras lo dan solo para valores de VZ seleccionados); por eso este lab lo trata únicamente de forma cualitativa y no lo incluye en el motor de cálculo numérico.'
  ]
});
