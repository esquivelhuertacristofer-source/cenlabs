fichaTecnica({
  title: 'Ficha técnica · Lubricación del motor: grado SAE, película y presión',
  intro:
    'Este laboratorio monta el circuito de aceite pieza a pieza y demuestra una cosa incómoda: <b>el manómetro no mide la lubricación</b>. Mide la resistencia del circuito. Lo que protege al motor es el espesor mínimo de película, que el conductor no ve nunca. Todas las cifras que siguen son del arquetipo 1.6 DOHC con 5W-30 salvo donde se indique otra cosa. ' +
    '(1) <b>La presión y la película no se implican.</b> A 100 °C y 2 000 rpm con carga, la galería marca 3,04 bar y la película vale 5,73 µm (λ = 6,83). A 130 °C y 1 200 rpm con el pie a fondo, la presión cae a 1,03 bar —un 66 % menos— y la película a 3,37 µm (λ = 4,02) —un 41 %—. Son dos magnitudes distintas que responden distinto a lo mismo. ' +
    '(2) <b>A excentricidad alta, la holgura casi no cambia h mínima.</b> Es la asíntota exacta de la solución de cojinete corto: la capacidad de carga va con 1/c² y el espesor con c(1−ε), así que duplicar la holgura mueve h mínima menos de un 10 %. Lo que sí se dispara es el CAUDAL, que va con el <b>cubo</b>. Por eso un solo cojinete gastado apenas mueve el manómetro —0,032 bar en caliente a ralentí, de 0,93 a 0,89— y un motor gastado entero sí lo hunde: 0,472 bar, de 0,93 a 0,45. La caída es <b>catorce veces</b> mayor. ' +
    '(3) <b>La recta de Walther no se extrapola al frío.</b> Extrapolar la recta de catálogo a −35 °C da un número que no cumpliría su propio grado SAE. El modelo ancla el tramo frío en el punto <b>medido</b> del ensayo CCS y traza un segundo tramo entre 0 °C y ese punto. En la gráfica, el punto gordo del extremo izquierdo de cada aceite es ese dato de ensayo, no un punto de la recta. ' +
    '(4) <b>La pendiente de Walther no es el índice de viscosidad.</b> El 0W-20 tiene mejor IV que el 10W-40 (168 contra 154) y <b>mayor</b> pendiente (3,142 contra 2,972). Sólo ordena dentro del mismo grado de verano, y ésa es exactamente la razón de que ASTM D2270 defina el IV contra aceites de referencia de la misma KV100. ' +
    '(5) <b>El grado no ordena la protección.</b> El 15W-40 tiene MENOS viscosidad a 100 °C que el 10W-40 (14,30 contra 14,50 mm²/s) y MÁS HTHS (3,85 contra 3,65 mPa·s). El número de verano se mide a cizalla baja; lo que aguanta el cojinete es el HTHS, a 150 °C y 10⁶ s⁻¹. Hay que mirarlo aparte. ' +
    '(6) <b>Los dos límites de invierno de J300 miden cosas distintas y hacen falta los dos.</b> El CCS garantiza que el motor de arranque GIRE el motor; el MRV, que la bomba lo ASPIRE. A −20 °C, en el 1.6, sólo el 0W-20 (185 rpm) y el 5W-30 (140 rpm) superan las 120 rpm que ese motor necesita; el 10W-40 se queda en 91, el 15W-40 en 64, el 20W-50 en 29 y el SAE 30 monogrado en 18. Y hay un caso que pasa el primero y falla el segundo —aceite gelificado— en el que el motor arranca y <b>gira en seco</b>: es la avería más cara del laboratorio. ' +
    '(7) <b>Las vueltas en seco al arrancar casi no dependen del frío.</b> Con 0W-20 el cebado tarda 0,64 s a 20 °C y 1,20 s a −20 °C, y sin embargo son 3,7 vueltas en los dos casos. La bomba y el cigüeñal giran juntos y el cociente se cancela: girar más despacio no protege, cebar antes sí. ' +
    '(8) <b>Dos averías son invisibles con el motor en marcha.</b> El filtro obstruido con su derivación abierta deja las tres presiones del protocolo <b>idénticas</b> a las del motor sano —hasta el último dígito— y el antirretorno roto también; ése sólo se paga en cada arranque, donde las vueltas en seco pasan de 3,7 a 18,6. ' +
    '(9) <b>La limitadora no protege al motor: protege al circuito.</b> Agarrotada cerrada no recorta nada, y en frío la presión de galería llega a 17,3 bar en el 1.6 y a 20,4 bar en el diésel, muy por encima de lo que aguanta la carcasa del filtro. En caliente, en cambio, no se nota. ' +
    '(10) <b>El punto crítico del cojinete está a régimen BAJO con el pie a fondo</b>, no arriba: sin par pedido, el pico del cilindro es el de compresión —la misma cifra que publica la práctica de sellado de este dominio— y la inercia alternativa DESCARGA el cojinete al subir de vueltas. En el 1.6, λ vale 6,83 a 2 000 rpm con carga y 8,47 a 3 000 rpm con la misma carga. ' +
    '(11) <b>Teorema del censo:</b> con las tres presiones del protocolo se resuelven 8 de los 13 escenarios en el 1.6, el 1.8 y el V8, y 7 en el diésel. Con TODO lo que se puede medir sin abrir el motor —presiones, luz roja y vueltas en seco— se llega a 9 y a 8, y <b>ningún</b> subconjunto formado sólo con observaciones de taller pasa de ahí en ninguna de las cuatro máquinas. Con las siete observaciones, 13 de 13. El subconjunto mínimo que lo resuelve todo tiene cuatro o cinco observaciones e incluye <b>siempre</b> el análisis de aceite; el plastigage hace falta en tres de las cuatro máquinas y en el 1.8 no, porque allí el desgaste de la bomba y el de los cojinetes ya se separan por las presiones. Hay averías de lubricación que no se diagnostican con el motor montado. ' +
    'Si una cifra de esta ficha no coincide con la del simulador, la ficha está mal.',

  s1: {
    presentes:
      '<b>Presentes en la maqueta 3D, a escala (una unidad de escena = 100 mm):</b> bloque en corte por el eje del cigüeñal, con el tabique de cada bancada, su casquillo antifricción, su sombrerete y sus tornillos; cigüeñal completo con sus muñones de bancada, sus muñequillas desfasadas, sus brazos y el volante con la corona dentada. ' +
      'El diámetro y la carrera, el diámetro del muñón, el ancho del cojinete y el número de bancadas salen del mismo objeto que usa el modelo numérico, así que cambiar de motor cambia la geometría y las cifras a la vez. ' +
      'Las siete piezas del circuito se montan una a una: cárter con su colador de aspiración y su nivel de aceite, bomba volumétrica con su rotor, válvula limitadora con su émbolo y su muelle, filtro con su antirretorno y su derivación, radiador de aceite, galería principal con un taladro por bancada y manocontacto con su esfera y su luz roja. Cada tramo de conducción sólo existe si sus dos piezas están montadas: mientras falte una, se ve exactamente por dónde está cortado el circuito. ' +
      'El aceite circula: la velocidad de las gotas es proporcional al caudal que calcula el modelo y su color dice si está filtrado —ámbar— o si la derivación está abierta y circula sucio —pardo—. El casquillo de cada bancada se tiñe con el régimen de lubricación de ESA bancada. El émbolo de la limitadora se levanta cuando la válvula abre y la luz roja late cuando el manocontacto la enciende. ' +
      'En el modo de película hay un <b>cojinete ampliado en sección</b>: dorso de acero, casquillo antifricción, película de aceite y muñón. El muñón se desplaza con la excentricidad que resuelve la ecuación de cojinete corto y la corona de aceite se estrecha por abajo: esa media luna es h mínima. La holgura está dibujada multiplicada por un factor que la propia escena publica en pantalla.',
    omitidos: [
      'El cojinete se analiza en RÉGIMEN ESTACIONARIO, con la carga media equivalente del ciclo (factor 0,34 del pico). Un cojinete real trabaja bajo carga variable y el efecto de película exprimida le levanta h mínima por encima de este valor: el modelo es conservador, y está declarado. Meter el pico como carga estática daría un h mínima muy por debajo del real.',
      'La solución de cojinete corto (Ocvirk) se ajusta bien hasta ε ≈ 0,90. Por encima sigue siendo del lado conservador pero ya extrapola, y el simulador lo AVISA en pantalla en vez de callarlo. En el diésel a 130 °C y 1 200 rpm con carga se llega a ε = 0,909 y el aviso aparece.',
      'Las averías se declaran por lo que CAMBIAN físicamente —la holgura de un cojinete, la holgura de todos, el resbalamiento de la bomba, el tarado de la limitadora, la derivación del filtro, la viscosidad del aceite, el volumen que se drena— y no por su síntoma. El síntoma sale del modelo.',
      'La gelificación en frío es un dato DECLARADO de cada aceite, no una consecuencia de su viscosidad. Un aceite puede pasar el ensayo CCS —que se mide a cizalla alta, como el motor de arranque— y gelificar a cizalla baja, que es lo que ve la aspiración de la bomba. Por eso J300 pide dos ensayos y no uno.',
      'El nivel del cárter se dibuja bajo cuando el escenario lo dice, pero lo que el modelo simula es la FRACCIÓN DE AIRE que la bomba llega a aspirar, que es un dato declarado del escenario. No hay superficie libre, ni oleaje, ni deflectores.',
      'No se modela el circuito de biela ni el de árbol de levas por separado: los surtidores de refrigeración del pistón y los apoyos del árbol se resumen en una restricción auxiliar única, que sí se lleva una parte nada despreciable del caudal.',
      'El aceite se supone a una temperatura única en todo el circuito. En un motor real la película del cojinete está bastante más caliente que el cárter, y ésa es una de las razones de que exista el ensayo HTHS.',
      'El radiador de aceite se monta pero no se simula su transferencia: la temperatura del aceite es un MANDO del banco, no una consecuencia del enfriamiento. Es exactamente el mismo reparto de papeles que en un ensayo de banco con termostatado externo.',
      'El corte del motor va del eje del cigüeñal hacia abajo: esta práctica no toca la combustión, así que no hay pistones, ni bielas, ni culata. Y los cuatro arquetipos se dibujan con sus bancadas EN LÍNEA, también el 5.0 V8, que en realidad es una V: ninguna cifra depende de la disposición de los cilindros.',
      'La escena gira el cigüeñal a 0,030 veces la velocidad real, porque a 2 000 rpm serían 33 vueltas por segundo y no se vería nada. El régimen que entra en TODAS las cifras es el real, no el de la escena.',
      'Los cuatro motores son ARQUETIPOS declarados cuyas cotas caen dentro de las bandas publicadas para su familia. No son modelos comerciales: la holgura de montaje, la presión mínima admisible y el aceite recomendado de un motor concreto están en su manual de taller y en ningún otro sitio.',
    ],
  },

  s2: {
    title: 'Cifras del banco — arquetipo 1.6 DOHC, 5 bancadas de 48,0 × 20,0 mm, holgura 44 µm diametral',
    warn: 'La presión de galería es RELATIVA, que es lo que marca un manómetro. Los tres puntos del protocolo son: frío a ralentí (20 °C), caliente a ralentí (110 °C) y caliente a 3 000 rpm (110 °C). El asterisco marca los puntos en los que la limitadora está abierta y por tanto la presión es su tarado, no el equilibrio del circuito.',
    rows: [
      ['Estado del motor', 'Frío ralentí', 'Cal. ralentí', 'Cal. 3 000', 'λ peor', 'Vueltas en seco', 'Familia'],
      ['Motor sano', '4,50 bar*', '0,93 bar', '3,72 bar', '6,69', '3,7', 'nada que reparar'],
      ['Un cojinete de bancada gastado', '4,50 bar*', '0,89 bar', '3,61 bar', '6,69', '3,7', 'holgura de cojinete'],
      ['Todos los cojinetes al límite', '4,50 bar*', '0,45 bar', '1,84 bar', '6,86', '3,7', 'holgura de cojinete'],
      ['Bomba de aceite desgastada', '4,50 bar*', '0,46 bar', '1,83 bar', '6,69', '3,7', 'bomba'],
      ['Limitadora agarrotada abierta', '1,89 bar*', '0,93 bar', '1,89 bar*', '6,69', '3,7', 'limitadora'],
      ['Limitadora agarrotada cerrada', '17,27 bar', '0,93 bar', '3,72 bar', '6,69', '3,7', 'limitadora'],
      ['Filtro obstruido, derivación abierta', '4,50 bar*', '0,93 bar', '3,72 bar', '6,69', '3,7', 'filtro'],
      ['Aceite diluido con combustible', '4,50 bar*', '0,51 bar', '2,04 bar', '5,04', '3,7', 'aceite equivocado o degradado'],
      ['Nivel de aceite bajo', '4,50 bar*', '0,82 bar', '3,30 bar', '6,69', '3,7', 'nivel'],
      ['Antirretorno del filtro estropeado', '4,50 bar*', '0,93 bar', '3,72 bar', '6,69', '18,6', 'antirretorno del filtro'],
      ['Aceite pasado de intervalo', '4,50 bar*', '1,25 bar', '4,50 bar*', '7,69', '3,7', 'aceite equivocado o degradado'],
      ['Aceite demasiado fino (0W-20)', '4,50 bar*', '0,70 bar', '2,82 bar', '5,87', '3,7', 'aceite equivocado o degradado'],
      ['Aceite demasiado grueso (20W-50)', '4,50 bar*', '1,64 bar', '4,50 bar*', '8,70', '3,7', 'aceite equivocado o degradado'],
    ],
  },

  s3: [
    'Los seis aceites del banco, con sus datos de catálogo: 0W-20 (44,5 / 8,30 mm²/s, IV 168, HTHS 2,65) · 5W-30 (63,0 / 11,00, IV 168, HTHS 3,05) · 10W-40 (97,0 / 14,50, IV 154, HTHS 3,65) · 15W-40 (108,0 / 14,30, IV 136, HTHS 3,85) · 20W-50 (168,0 / 19,50, IV 128, HTHS 4,45) · SAE 30 monogrado (88,0 / 10,60, IV 98, HTHS 3,10). Los seis cumplen los cuatro criterios de su grado; el monogrado no tiene grado de invierno y su casilla se declara vacía en vez de inventarle un límite: a −20 °C pide 26 000 mPa·s, casi el triple de lo que J300 admite al 20W.',
    'El mismo motor 1.6 a 100 °C y 2 000 rpm con carga, cambiando sólo el aceite: 0W-20 da 2,28 bar y 5,00 µm; 5W-30, 3,04 bar y 5,73 µm; 10W-40, 4,07 bar y 6,55 µm; 15W-40, 4,08 bar y 6,56 µm; 20W-50, 4,50 bar —ahí la limitadora ya está abierta y ése es su tarado, no el equilibrio del circuito— y 7,59 µm. El aceite más espeso da más presión, más película y también más pérdida por rozamiento: 0,37 kW contra 0,18 kW del 0W-20, en las cinco bancadas solas.',
    'Presión mínima admisible de cada arquetipo (dato del fabricante, no de la física): 0,55 bar en el 1.6, 0,50 en el 1.8, 0,80 en el diésel 2.0 y 0,40 en el V8. Tarado de la limitadora: 4,5 · 4,0 · 5,5 · 4,2 bar. Máximo que aguanta la carcasa del filtro: 11,0 · 10,5 · 13,0 · 10,0 bar.',
    'Rugosidad compuesta de las dos superficies: √(Rq muñón² + Rq casquillo²). En el 1.6, √(0,25² + 0,80²) = 0,838 µm. Ése es el metro con el que se mide λ, y por eso un mismo espesor de película significa cosas distintas en dos motores con acabados distintos.',
    'Los trece escenarios del banco caen en ocho familias de diagnóstico. Dos de ellas —filtro y antirretorno— no mueven la presión de galería en absoluto.',
  ],

  s4: {
    intro: 'Qué mirar, en qué orden y qué debería chirriar:',
    items: [
      'Monta el circuito y fíjate en que la presión no aparece al montar la bomba: aparece cuando hay por dónde salir. La presión es el equilibrio entre lo que entra y lo que sale, no una propiedad de la bomba.',
      'En viscosidad, pon los seis aceites en los ejes de ASTM D341 y comprueba que son rectas. Después compara el 10W-40 con el 15W-40: el segundo tiene menos KV100 y más HTHS. Decide cuál protege más y justifica con cuál de los dos números.',
      'En presión, sube la temperatura de 20 a 130 °C con el motor a ralentí y anota dónde se apaga la limitadora y dónde se enciende la luz roja. Son dos temperaturas distintas y la distancia entre ellas es el margen real del motor.',
      'En película, deja el régimen fijo y cambia sólo la carga. Verás que la presión no se entera (menos de un 2 %) y que la película sí. Ése es el experimento central de la práctica.',
      'Después ve a 1 200 rpm con el pie a fondo y compara con 5 000 rpm con el pie a fondo. Si esperabas que el cojinete sufriera más arriba, el modelo te va a contradecir: la inercia alternativa lo descarga.',
      'En arranque, prueba los seis aceites a −20 °C en el mismo motor y cuenta cuántos lo giran. Después baja a −30 °C y vuelve a contar.',
      'Monta el escenario «filtro obstruido» y busca la diferencia en el manómetro. No la vas a encontrar: es idéntica. Después mira el color del aceite que circula.',
      'Monta «antirretorno estropeado» y haz lo mismo. Tampoco se ve nada con el motor en marcha; ve al modo de arranque y mira las vueltas en seco.',
      'Monta «limitadora agarrotada cerrada» con el motor a 20 °C y mira la fila de la carcasa del filtro. Después ponlo a 110 °C y comprueba que la avería desaparece de la vista.',
      'En censo, mira la barra de un solo instrumento y la de siete. Después pregúntate qué hace un taller que no tiene ni análisis de aceite ni plastigage, que son la mayoría.',
      'En el reto, intenta primero diagnosticar con las tres presiones solas. Cuando te quedes atascado, el censo ya te había avisado de en qué casos iba a pasar.',
    ],
  },

  s5: {
    modela:
      'Viscosidad contra temperatura por la ecuación de Walther (ASTM D341) con el tramo frío anclado en el punto medido del ensayo de arranque en frío; verificación de los cuatro criterios de SAE J300 (banda de KV100, HTHS, CCS y MRV); cojinete corto de Ocvirk con excentricidad por bisección, h mínima = c(1−ε) y espesor específico contra la rugosidad compuesta; circuito resuelto por balance de caudales entre una bomba volumétrica con resbalamiento dependiente de la presión y la viscosidad, la fuga de cada cojinete —proporcional al cubo de su holgura— y las restricciones auxiliares, con la limitadora recortando por arriba; carga del cojinete compuesta de fuerza de gas y de inercia alternativa, dependiente del par pedido; arranque en frío con su par resistente, su régimen de giro, su bombeabilidad y su tiempo de cebado; trece escenarios de avería y el censo exhaustivo de los 127 subconjuntos de observaciones.',
    noModela:
      'Carga variable del cojinete y efecto de película exprimida (análisis estacionario con la carga media equivalente); validez de la solución de cojinete corto por encima de ε = 0,90, que se avisa en pantalla; gradiente de temperatura dentro del circuito; transferencia del radiador de aceite, que aquí es un mando; circuito de biela y de árbol de levas por separado; superficie libre del cárter. Los cuatro motores son arquetipos declarados, no modelos comerciales.',
  },

  s6: [
    'SAE J300 — Engine Oil Viscosity Classification. Grados de invierno con sus límites de CCS y MRV, bandas de KV a 100 °C de los grados de verano y HTHS mínima.',
    'ASTM D341 — Standard Practice for Viscosity-Temperature Equations and Charts for Liquid Petroleum Products. La ecuación de Walther y sus ejes.',
    'ASTM D2270 — Standard Practice for Calculating Viscosity Index. El índice de viscosidad se define contra aceites de referencia de la misma KV100, no por la pendiente de la recta.',
    'ASTM D5293 (CCS) y ASTM D4684 (MRV) — los dos ensayos de invierno que J300 exige, y que miden cosas distintas: cizalla alta y cizalla baja.',
    'B. J. Hamrock, S. R. Schmid y B. O. Jacobson, <i>Fundamentals of Fluid Film Lubrication</i>, 2.ª ed., Marcel Dekker, 2004 — solución de cojinete corto, espesor específico y regímenes de lubricación.',
    'A. Cameron, <i>Basic Lubrication Theory</i>, 3.ª ed., Ellis Horwood, 1981 — ecuación de Reynolds y caudal lateral de un cojinete.',
    'Manual de taller del fabricante — única fuente de la holgura de montaje, de la presión mínima admisible y del aceite que le corresponde a un motor concreto.',
  ],
});
