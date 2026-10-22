/* Ficha técnica · Soldadura por puntos robotizada: calor, fuerza y tamaño de la pepita — contenido específico del lab */
fichaTecnica({
  title: 'Soldadura por puntos robotizada: calor, fuerza y tamaño de la pepita',
  intro: 'Este laboratorio muestra cómo un <b>robot de seis ejes</b> une las chapas de una puerta con <b>puntos de soldadura</b>. La pinza aprieta dos chapas de 0,8 mm con una fuerza <b>F</b> y deja pasar una corriente <b>I</b> durante <b>n</b> ciclos de la red (60 Hz). El calor de Joule <b>Q = I²·R·t</b> calienta la zona bajo los electrodos y funde un volumen de acero, la <b>pepita</b>. La resistencia total es la del bulto más la del contacto, y <b>la de contacto baja al apretar más</b>; el calor se escapa por el cobre refrigerado, y sólo una parte pequeña llega a ser pepita. Se aprueba una pepita de al menos <b>4·√t = 3,6 mm</b>; si el baño fundido crece más de lo que la fuerza puede contener, <b>salpica</b>; si el pulso dura demasiado, el electrodo <b>se hunde</b>. Todo lo que se mueve o se colorea sale del modelo; donde el dibujo simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> el <b>calor de Joule</b> Q = I²·R·t con la corriente eficaz constante y R = R<sub>bulto</sub> + R<sub>contacto</sub>, donde R<sub>bulto</sub> = ρ·L/A (ρ = 1,1 µΩ·m del acero caliente, L = 1,6 mm, A = área de la cara del electrodo: 112 µΩ con electrodo nuevo de 4,47 mm) y R<sub>contacto</sub> = 70 µΩ·(3 kN/F)<sup>0,7</sup> (correlación didáctica: 151 µΩ a 1 kN y 49 µΩ a 5 kN); un <b>balance de energía de parámetros concentrados</b> para la zona calentada, C·dT/dt = P − G·(T − T₀), con solución exacta T = T₀ + (P/G)(1 − e<sup>−t/τ</sup>) (τ = C/G ≈ 53 ms) y fusión a 1 500 °C cuando T∞ = T₀ + P/G la supera (corriente umbral ≈ 4,6 kA en el punto); el <b>crecimiento de la pepita</b> una vez fundida la zona, κ·H<sub>pepita</sub>·dV/dt = P − G·(1 + β·V/V<sub>z</sub>)·ΔT, con solución exponencial V∞·(1 − e<sup>−t/τₙ</sup>) (τₙ ≈ 89 ms), donde la pérdida crece con la pepita; la <b>entalpía de fusión de la pepita</b> H<sub>pepita</sub> = ρ·(c·ΔT + L) = 1,0·10¹⁰ J/m³ (110 J para una pepita de 4 mm) y un anillo vecino calentado en proporción (κ = 4); la pepita como <b>elipsoide achatado</b>, V = (π/6)·d²·H con H = 80 % del espesor; el <b>criterio de calidad</b> d ≥ 4·√t (3,58 mm); la <b>salpicadura</b> cuando el diámetro del baño supera d<sub>exp</sub> = √(4F/(π·p)) con p = 100 MPa (6,2 mm a 3 kN, 5,0 mm a 2 kN: bajo ≈ 1,0 kN ninguna pepita buena cabe sin salpicar), tras lo cual queda el 85 % del volumen; el <b>hundimiento</b> 4 % + 0,9·t<sub>fundido</sub>·√(F/3 kN) con límite del 25 %; la <b>derivación de corriente</b> por el punto vecino, I<sub>punto</sub> = I·(1 − 1/(1 + paso/4,5 mm)) (23 % a 15 mm, 10 % a 40 mm); el <b>electrodo desgastado</b> con la cara un 45 % más ancha (6,5 mm); y la <b>cinemática inversa</b> exacta del robot (plano del brazo con ley de cosenos, base orientada al punto y muñeca que mantiene los electrodos a plomo, J5 = −(J2 + J3)) aplicada al modelo articulado real. Un solo reloj: el pulso se calcula en tiempo real (12 ciclos = 0,2 s) y se muestra en cámara lenta ×1/8.',
    omitidos: [
      '<b>La física completa del proceso</b>: no hay simulación de elementos finitos ni campos de temperatura y corriente; la zona calentada y la pepita son dos magnitudes concentradas con constantes de <b>orden de magnitud</b> para acero dulce de 0,8 + 0,8 mm (G = 2,6 W/K, β = 3, κ = 4, p = 100 MPa), calibradas para que la ventana de buena soldadura caiga en el orden real de 7–11 kA, no ajustadas a un ensayo.',
      '<b>La resistencia dinámica</b>: en la realidad la resistencia de contacto se desploma en los primeros ciclos y la de bulto cambia con la temperatura y con el crecimiento de la pepita; aquí R es constante durante el pulso. Tampoco hay la forma de onda (se usa el valor eficaz de la corriente, sin control de fase ni inversor de media frecuencia).',
      '<b>El material</b>: sin recubrimiento de zinc (galvanizado), sin aceros de alta resistencia, sin aluminio, sin apilados de tres chapas ni espesores distintos; la fusión es a una temperatura única, sin intervalo de solidificación ni microestructura (dureza de la zona afectada).',
      '<b>El electrodo</b>: el desgaste es un solo ensanchamiento fijo de la cara, no una evolución con el número de puntos; sin refrigeración variable ni aleación del cobre; la fuerza es constante, sin la dinámica del cilindro ni la rigidez de la pinza.',
      '<b>La normativa y el ensayo</b>: la regla 4·√t y las fuerzas típicas son de orden de magnitud (a verificar frente a AWS C1.1 / RWMA e ISO 14327); no es una calificación de procedimiento ni un ensayo de arrancamiento o de cortadura, y el hundimiento y la presión del baño son correlaciones didácticas.',
      '<b>El dibujo no está a escala en lo pequeño</b>: el robot (el modelo real, escalado ×3 ≈ 2,8 m) y la puerta están a escala entre sí, pero la brida es de 6 cm y las marcas de los puntos se ven ampliadas; el corte del dock se dibuja con el alto ×2. Las cifras (mm, kA, kN, J) son las del modelo.'
    ]
  },
  s2: {
    title: 'Propiedades y parámetros del modelo',
    warn: '⚠ Una receta que funciona con electrodos nuevos puede fallar con los gastados o con un punto vecino muy cerca: la corriente que llega al punto, la cara del electrodo y la fuerza cambian la ventana. Los valores de aquí son <b>didácticos</b>, no los de una línea de un fabricante.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Chapa', 'acero dulce, dos chapas', '0,8 + 0,8 mm · d<sub>mín</sub> = 4·√0,8 = 3,58 mm'],
      ['Electrodo', 'cara nueva · desgastada', '5·√0,8 = 4,47 mm · 6,48 mm (+45 %)'],
      ['Resistencia', 'bulto · contacto · total (3 kN, nuevo)', '112 µΩ · 70 µΩ·(3 kN/F)<sup>0,7</sup> · 182 µΩ'],
      ['Calor y fusión', 'capacidad de la zona · fuga · fusión', 'C = 0,138 J/K · G = 2,6 W/K (× área del electrodo) · 1 500 °C desde 20 °C'],
      ['Pepita', 'entalpía · forma · anillo · pérdida creciente', 'H = 1,0·10¹⁰ J/m³ · elipsoide con H = 1,28 mm · κ = 4 · β = 3'],
      ['Salpicadura', 'presión del baño · fuerza mínima', 'p = 100 MPa · d<sub>exp</sub> = √(4F/πp) · F ≳ 1,0 kN para poder aprobar'],
      ['Hundimiento', 'ley · límite', '4 % + 0,9·t<sub>fundido</sub>·√(F/3 kN) · 25 % del espesor total'],
      ['Derivación', 'por el punto vecino', 'R<sub>deriv</sub>/R<sub>punto</sub> = paso/4,5 mm → 23 % (15 mm), 10 % (40 mm), 7 % (60 mm)'],
      ['Mandos', 'corriente · tiempo · fuerza', '4 a 18 kA · 2 a 30 ciclos de 60 Hz (33 a 500 ms) · 1,0 a 5,0 kN'],
      ['Robot', 'modelo y escala · ejes', 'GLB articulado de 6 ejes ×3 (≈ 2,8 m) · base J1, hombro J2, codo J3, muñeca J5 que mantiene los electrodos a plomo'],
      ['El reto', 'tres escenarios · tres mandos · dos condiciones', 'Electrodos nuevos, desgastados o vecino a 22 mm · pepita ≥ 3,58 mm sin salpicar y con hundimiento ≤ 25 %'],
      ['Punto nominal', 'a 9 kA, 12 ciclos, 3 kN, nuevo, 40 mm', 'llegan 8,1 kA · 2 383 J · pepita 4,8 mm (6,5 % del calor) · se funde a los 1,2 ciclos']
    ]
  },
  s3: [
    'Un <b>ensayo de arrancamiento y de cortadura</b> de probetas soldadas (ISO 14327 / AWS C1.1; a verificar) con la curva carga–desplazamiento y la medición del botón arrancado, y un <b>corte metalográfico</b> con la pepita, la zona afectada y el hundimiento medidos con microscopio.',
    'La <b>resistencia dinámica</b> medida durante el pulso (tensión entre electrodos y corriente real a ~1 kHz), para sustituir la resistencia constante del modelo por la curva real y ajustar G, β y κ.',
    'La <b>carta de soldabilidad</b> (lóbulo corriente–tiempo) y la <b>vida del electrodo</b> medidas en la línea con el material y el espesor reales, no con constantes de orden de magnitud.'
  ],
  s4: {
    intro: 'El orden del laboratorio (cálculo, ajuste, diagnóstico) es una <b>descomposición didáctica</b>; un ajuste de producción incluye además:',
    items: [
      'Un <b>control adaptativo</b> que mide la resistencia dinámica, detecta la expulsión y compensa el desgaste aumentando la corriente por pasos («stepper») y vigilando el cambio de electrodos.',
      'La <b>física completa</b> con elementos finitos acoplados (eléctrico, térmico, mecánico) y un modelo de contacto rugoso, con la fusión de los recubrimientos y de la superficie.',
      'Materiales <b>galvanizados y de alta resistencia</b>, apilados de tres chapas y uniones con pegamento, que desplazan la ventana de corriente y la fuerza.',
      'La <b>planificación del robot</b>: tiempos de ciclo, colisiones con el utillaje, calibración del punto de la herramienta y la compensación del flexionado de la pinza bajo la fuerza.'
    ]
  },
  s5: {
    modela: 'el <b>reparto del calor de Joule</b> y la <b>ventana de buena soldadura</b>: Q = I²·R·t con R = R<sub>bulto</sub> + R<sub>contacto</sub>(F), una zona calentada que sigue la exponencial exacta T = T₀ + (P/G)(1 − e<sup>−t/τ</sup>) (verificada contra RK4 a 1e-9) y que funde si la corriente que llega al punto pasa de √(G·ΔT/R) = 4,6 kA; una pepita que crece V∞·(1 − e<sup>−t/τₙ</sup>) (verificada contra RK4 a 1e-6) y cuya energía cumple la conservación Q = fuga + zona + pepita; el límite de salpicadura d<sub>exp</sub> = √(4F/πp), la derivación por el vecino y el desgaste del electrodo; y la cinemática inversa exacta del robot (cierra contra una cinemática directa escrita aparte a menos de 1 nm). Con 9 kA, 12 ciclos, 3 kN, electrodo nuevo y vecino a 40 mm llegan 8,1 kA al punto, salen 2 383 J y la pepita mide 4,8 mm; a la pepita llega el 6,5 % del calor. A 3 kN la ventana de corriente es 7,7–10,8 kA con 12 ciclos (por debajo queda pegada, por encima salpica), con electrodo desgastado sube a 11,5–14,7 kA y con un vecino a 22 mm a 8,3–11,7 kA; el pulso se pasa de largo (hundimiento > 25 %) a partir de 16 ciclos con 9 kA. El ajuste inicial del reto (6 kA, 6 ciclos, 2 kN) no cumple en ningún escenario y la ventana es <b>interior</b>. Cada diagnóstico tiene su firma (poca corriente: llega casi toda y no llega a 3,6 mm; deriva: llega menos del 80 %; gastado: cara de 6,5 mm; salpicadura: el baño toca la línea roja; quemado: pepita buena con hundimiento del 41 %) y se arregla con su remedio. Se verifica con 201 comprobaciones.',
    noModela: 'un <b>proceso real de soldadura</b>: sin elementos finitos, sin resistencia dinámica ni forma de onda de la corriente, sin recubrimientos ni aceros de alta resistencia, sin desgaste progresivo del electrodo ni dinámica de la fuerza, y con constantes (G, β, κ, la presión del baño, la correlación del contacto y el hundimiento) de <b>orden de magnitud</b>, no calibradas con ensayos. <b>El dibujo</b> no está a escala en lo pequeño (brida de 6 cm, marcas ampliadas, corte con el alto ×2) y el pulso se muestra en cámara lenta ×1/8. No es una calificación de procedimiento de soldadura ni un ensayo normalizado.'
  },
  s6: [
    'AWS C1.1M/C1.1, <i>Recommended Practices for Resistance Welding</i> (diámetro mínimo de pepita 4·√t, fuerzas y corrientes típicas por espesor; a verificar las cifras y la edición).',
    'RWMA, <i>Resistance Welding Manual</i> (clases de electrodos, desgaste y pasos de corriente; a verificar el capítulo).',
    'ISO 14327, <i>Resistance welding — Procedures for determining the weldability lobe for resistance spot, projection and seam welding</i> (lóbulo de soldabilidad; a verificar el número y la edición).',
    'Zhang, H. y Senkara, J., <i>Resistance Welding: Fundamentals and Applications</i>, CRC Press (resistencia de contacto, balance térmico y expulsión; a verificar la edición y el capítulo).'
  ]
});
