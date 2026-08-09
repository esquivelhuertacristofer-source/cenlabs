fichaTecnica({
  title: 'Ficha técnica · Diagnóstico del sellado: compresión y fugas',
  intro:
    'Este laboratorio hace las dos pruebas con las que un taller decide si un motor se abre o no se abre, y demuestra que ninguna de las dos sustituye a la otra. Todas las cifras que siguen son del arquetipo 1.6 DOHC a nivel del mar salvo donde se indique otra cosa. ' +
    '(1) La válvula antirretorno del manómetro hace de trinquete: la aguja sube golpe a golpe y no baja. En el 1.6 sano la secuencia es 13,1 · 15,7 · 16,1 · 16,1 bar-g y a partir del cuarto golpe ya no se mueve. Lo que se lee no es la presión de un ciclo, es el techo de todos. ' +
    '(2) <b>El volumen muerto del útil NO cambia la lectura final.</b> Con 24 cm³ de manguera en vez de 8, el primer golpe cae de 15,9 a 8,5 bar y a los ocho golpes las dos lecturas coinciden. El volumen muerto cuesta GOLPES, no bares. Esto matiza —no contradice— lo que publican las prácticas de ciclo y de distribución de este mismo dominio: allí se compara la relación dinámica del motor desnudo (9,52) con la que ve el útil (8,16), y esa es la relación de UN SOLO golpe. Sostener las dos afirmaciones a la vez exige decir de cuál de las dos se habla. ' +
    '(3) <b>La altitud hunde la compresión y no mueve el porcentaje de fuga.</b> El mismo motor sano marca 16,1 bar-g a nivel del mar, 13,5 a 1 500 m y 11,6 en el valle de Toluca (2 660 m): un 28 % menos sin estar peor. La fuga apenas se mueve, del 7,0 al 6,7 %. En altitud el fugómetro es el instrumento honesto. ' +
    '(4) El factor de presión de Toluca (0,723) es prácticamente la relación límite/estándar que escribe un manual (11,6/16,1 = 0,72): un motor sano medido allí cae JUSTO sobre el límite de rechazo redactado a nivel del mar. Sin corregir el límite por la altitud del taller se condenan motores sanos. ' +
    '(5) <b>La ruta localiza; el porcentaje sólo cuantifica.</b> La ruta que señala la avería es la del mayor EXCESO sobre la fuga de base, no la que más aire lleva: todo motor sopla por el cárter —el 83 % del caudal en el motor sano— y eso no es un hallazgo. Una junta de culata al circuito de agua fuga un 17,6 %, por debajo del límite del 20 %, y se condena igual: no hay burbujeo aceptable en un radiador. ' +
    '(6) <b>El signo del salto al mojar separa familias.</b> Contra la mediana del motor, positivo = segmentos (el aceite sella el hueco del aro), negativo = válvula o junta (el aceite no llega hasta allí). Unos segmentos pegados saltan +4,3 bar y una válvula de escape quemada +1,2 bar, contra los +2,4 bar del cilindro sano. La pared rayada salta +3,2: a medias, porque el aceite no rellena un surco. El salto es un reactivo, no un interruptor. ' +
    '(7) <b>La regla del 10 % entre cilindros es ciega</b> a unos segmentos desgastados en tres de los cuatro arquetipos: en el 1.6 la dispersión queda en el 7 % y la regla no se dispara. En el diésel, con el doble de presión, sí los ve. ' +
    '(8) <b>Ningún subconjunto de observaciones sin la compresión ABSOLUTA corregida por altitud resuelve los once escenarios</b>, y está comprobado en las cuatro máquinas. Con sólo las cuatro observaciones comparativas quedan 8 de 11: motor sano, distribución un diente retrasada y batería baja caen en la misma firma, porque los tres bajan todos los cilindros por igual y no hay nada dentro del motor contra lo que compararlos. ' +
    '(9) Girar despacio cuesta mucho menos de lo que se cree: de 320 a 120 rpm la lectura sólo baja de 16,4 a 15,0 bar-g. Una batería floja no explica un motor bajo, pero sí explica que baje POR IGUAL. ' +
    'Si una cifra de esta ficha no coincide con la del simulador, la ficha está mal.',

  s1: {
    presentes:
      '<b>Presentes en la maqueta 3D, a escala (una unidad de escena = 100 mm):</b> bloque en corte con sus camisas, cigüeñal con volante y corona dentada, pistones con segmentos y bielas de longitud real, culata con válvulas de admisión y escape y los huecos de bujía, y los cinco destinos por los que puede salir el aire: boca de llenado de aceite, cuerpo de aceleración, cola de escape, radiador y bujía del cilindro contiguo. ' +
      'El diámetro, la carrera, la longitud de biela y el número de cilindros salen del mismo objeto que usa el modelo numérico, así que cambiar de motor cambia la geometría y las cifras a la vez. El pistón se coloca con la misma función <i>pistonS</i> que integra el volumen: no hay una animación paralela que pueda contradecir a una cifra. ' +
      'Las siete piezas del puesto de prueba se montan una a una: útil de bloqueo del volante, adaptador de bujía, manómetro de compresión con antirretorno y purga, aceitera, fugómetro con su restrictor calibrado, línea de aire regulada y estetoscopio. ' +
      'En la prueba de fugas, cada ruta con más del 2 % del caudal dibuja un chorro hacia su destino con el grosor y la velocidad proporcionales a la fracción que le asigna el modelo: si el pizarrón dice 70 % por el escape, el chorro grueso va al escape.',
    omitidos: [
      'La transferencia de calor a las paredes durante el arranque se resume en un exponente politrópico fijo (1,32). Un motor frío y uno caliente no dan la misma cifra en el taller, y aquí sí la dan.',
      'Cada avería se declara como un ÁREA EQUIVALENTE hacia un destino, no como la geometría de un asiento quemado o de un aro roto. Las áreas están calibradas para reproducir las bandas de fuga que se manejan en taller con el útil estándar, pero no se miden con un calibre en ningún motor real.',
      'El aceite de la prueba húmeda se resume en un factor de sellado por familia de avería. No hay película, ni escurrimiento, ni cantidad de aceite: echar el doble no cambia nada en este modelo, y en el taller sí lo cambia.',
      'La velocidad de giro se supone constante durante todo el golpeo. Un motor de arranque real pierde régimen al comprimir, y por eso el primer golpe de un motor con la batería justa no se parece al octavo.',
      'No se modela el paso de aire por el propio hueco de la bujía del cilindro medido, ni la fuga del adaptador, ni la calidad del roscado. En el taller esa es la primera causa de una lectura absurda.',
      'La prueba de fugas se resuelve en RÉGIMEN ESTACIONARIO. No hay transitorio de llenado ni oscilación de la aguja: el instrumento aquí es más limpio de lo que es.',
      'El pistón se supone exactamente en el PMS con las dos válvulas cerradas. En un motor real hay que buscar el PMS, y una válvula entreabierta por un calado mal hecho da un diagnóstico de válvula quemada que no existe.',
      'Los cuatro arquetipos se dibujan con sus cilindros EN LÍNEA, también el 5.0 V8, que en realidad es una V. Ninguna cifra de esta práctica depende de la disposición —cada cilindro se mide por separado, con su propio manómetro y su propio balance de fugas— y una V inclina el plano de corte hasta que deja de verse el interior, que es lo único que hay que ver aquí.',
      'La escena gira el cigüeñal a 0,55 veces la velocidad real, porque a 250 rpm un golpe dura 0,48 s y no da tiempo a ver subir la aguja. El régimen que entra en TODAS las cifras es el real, no el de la escena.',
      'Los cuatro motores son ARQUETIPOS declarados cuyas cifras caen dentro de las bandas publicadas para su familia. No son modelos comerciales: el estándar de compresión, el límite de rechazo, la diferencia admisible entre cilindros y el porcentaje de fuga aceptable de un motor concreto están en su manual de taller y en ningún otro sitio.',
    ],
  },

  s2: {
    title: 'Cifras del banco — arquetipo 1.6 DOHC a nivel del mar, salvo indicación',
    warn: 'Las columnas de compresión son presiones RELATIVAS (bar-g), que es lo que marca un manómetro. El porcentaje de fuga se mide con el restrictor estándar de 1,00 mm y 6,0 bar de suministro: es una propiedad del conjunto motor + fugómetro.',
    rows: [
      ['Estado del cilindro', 'Seca', 'Húmeda', 'Salto', 'Fuga', 'Sale sobre todo por'],
      ['Sano', '16,1 bar', '18,5 bar', '+2,4', '7,0 %', 'cárter (83 %) — normal'],
      ['Segmentos desgastados', '15,0 bar', '18,4 bar', '+3,3', '25,1 %', 'cárter (92 %)'],
      ['Segmentos pegados o rotos', '13,9 bar', '18,1 bar', '+4,3', '48,1 %', 'cárter (95 %)'],
      ['Pared del cilindro rayada', '12,3 bar', '15,5 bar', '+3,2', '72,0 %', 'cárter (97 %)'],
      ['Válvula de admisión mal asentada', '14,8 bar', '16,1 bar', '+1,3', '30,0 %', 'cuerpo de aceleración (60 %)'],
      ['Válvula de escape quemada', '14,0 bar', '15,2 bar', '+1,2', '45,0 %', 'cola de escape (70 %)'],
      ['Válvula de escape sin juego de taqué', '13,1 bar', '14,2 bar', '+1,1', '61,9 %', 'cola de escape (78 %)'],
      ['Junta de culata a la camisa de agua', '15,4 bar', '16,8 bar', '+1,4', '17,6 %', 'radiador (40 %) — condena'],
      ['Junta de culata entre dos cilindros', '14,5 bar', '15,8 bar', '+1,3', '35,0 %', 'bujía contigua (61 %)'],
      ['Sano a 1 500 m', '13,5 bar', '—', '—', '6,8 %', 'cárter — normal'],
      ['Sano a 2 660 m (Toluca)', '11,6 bar', '—', '—', '6,7 %', 'cárter — normal'],
      ['Sano, distribución +18° de cigüeñal', '13,9 bar', '—', '—', '7,0 %', 'cárter — normal'],
      ['Sano, arranque a 120 rpm', '15,0 bar', '—', '—', '7,0 %', 'cárter — normal'],
    ],
  },

  s3: [
    'Estándar del manual 16,1 bar-g · límite de rechazo 11,6 bar-g (el 72 % del estándar) · diferencia máxima entre cilindros 10 % · fuga admisible 20 %. Los cuatro son datos del fabricante, no propiedades de la física.',
    'Relación de compresión geométrica 10,5; dinámica desde el cierre real de admisión (44° ABDC) 9,52. La compresión de arranque la fija la dinámica, no la geométrica.',
    'Restrictor del fugómetro 1,00 mm (0,785 mm²) · suministro 6,0 bar relativos · fuga de base de un motor sano 0,48 mm² repartidos, que dan ese 7,0 %. El criterio de taller nunca es «0 %».',
    'Atmósfera ISA: 1,013 bar a nivel del mar, 0,846 bar a 1 500 m y 0,732 bar a 2 660 m.',
    'Los once escenarios del banco caen en siete familias de diagnóstico, dos de las cuales —distribución y arranque— no son averías de sellado.',
  ],

  s4: {
    intro: 'Qué se resuelve, con qué método y con qué hipótesis:',
    items: [
      '<b>Compresión de arranque:</b> integración golpe a golpe. En cada golpe se comprime politrópicamente el volumen del cilindro desde el cierre real de admisión, se resta lo que se fuga por los orificios equivalentes durante la carrera y, si la presión supera la de la manguera, la antirretorno abre y las dos se igualan sobre el volumen conjunto. La lectura es el máximo alcanzado.',
      '<b>Prueba de fugas:</b> balance de caudales en régimen estacionario. Se busca por bisección la presión de cilindro en la que lo que entra por el restrictor calibrado iguala a lo que sale por todas las rutas; el porcentaje es la caída relativa contra el suministro. El balance es monótono, así que la raíz es única.',
      '<b>Flujo por orificio:</b> compresible, con bloqueo sónico. Por debajo de la relación crítica (0,528 para el aire) el caudal deja de depender de la presión de abajo. Coeficiente de descarga 0,72 en las fugas —borde vivo y camino tortuoso— y 0,85 en el restrictor calibrado.',
      '<b>Ruta dominante:</b> la del mayor exceso sobre la fuga de base, no la del mayor caudal. Es la diferencia entre «por dónde sale más aire» y «por dónde sale aire que no debería salir».',
      '<b>Corrección por altitud:</b> el límite del manual se escala con la presión ambiente ISA. El porcentaje de fuga no se corrige, porque entrada y salida escalan casi igual.',
      '<b>Censo de instrumentos:</b> se recorren los 63 subconjuntos de las seis observaciones; cada escenario se reduce a una firma cuantizada por la RESOLUCIÓN del instrumento que la mide (0,5 bar, 5 %, 10 rpm), y se cuenta cuántos escenarios quedan dentro de una firma que mezcla dos diagnósticos distintos.',
    ],
  },

  s5: {
    modela:
      'Compresión golpe a golpe con el trinquete de la antirretorno y el volumen muerto del útil; relación de compresión dinámica desde el cierre real de admisión; cinemática exacta de biela finita; fugas como balance de orificios compresibles con bloqueo sónico; nueve averías declaradas como área equivalente hacia cinco destinos; once escenarios, incluidos dos que no son de sellado; corrección por altitud con atmósfera ISA; y el censo completo de subconjuntos de observaciones.',
    noModela:
      'Transferencia de calor durante el arranque (exponente politrópico fijo); geometría real de un asiento quemado o de un aro roto; física del aceite de la prueba húmeda; caída de régimen del motor de arranque al comprimir; fugas del propio adaptador; transitorios del fugómetro; y la búsqueda del PMS. Los cuatro motores son arquetipos declarados, no modelos comerciales.',
  },

  s6: [
    'Manual de taller del fabricante — única fuente del estándar de compresión, del límite de rechazo, de la diferencia admisible entre cilindros y del porcentaje de fuga aceptable de un motor concreto.',
    'SAE J604 — Engine Terminology and Nomenclature. Nomenclatura de motores alternativos.',
    'Atmósfera estándar internacional (ISA) — modelo de presión y temperatura con la altitud usado para corregir el límite.',
    'J. B. Heywood, <i>Internal Combustion Engine Fundamentals</i>, McGraw-Hill, 1988 — compresión politrópica, flujo por orificio y bloqueo sónico.',
    'C. R. Ferguson y A. T. Kirkpatrick, <i>Internal Combustion Engines: Applied Thermosciences</i>, 3.ª ed., Wiley, 2016 — cinemática de biela finita y relación de compresión dinámica.',
  ],
});
