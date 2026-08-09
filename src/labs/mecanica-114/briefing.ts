import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: 'MEC-114',
  titulo: 'Diagnostica el Sellado con Pruebas de Compresión y Fugas',
  subtitulo: 'Motor de combustión interna · compresión seca y húmeda, leak-down, corrección por altitud y diagnóstico a ciegas',
  acento: '#5BD4E5',
  duracion: 45,
  videoUrl: '',
  bienvenida: `Sobre el banco hay siete piezas del puesto de prueba —el útil de bloqueo del volante, el adaptador de bujía, el manómetro de compresión con su antirretorno, la aceitera, el fugómetro con su restrictor calibrado, la línea de aire regulada y el estetoscopio— y sobre el motor, siete huecos luminosos esperándolas. Hasta que el puesto no esté completo no hay nada que medir. El útil de bloqueo no es un capricho: sin él, la presión de la prueba de fugas hace girar el cigüeñal y el cilindro se sale del punto muerto superior, que es justo la hipótesis de la prueba.

Aquí se hacen las dos medidas con las que un taller decide si un motor se abre o no se abre, y lo primero que hay que entender es que no miden lo mismo. La COMPRESIÓN se mide con el motor girando: dice cuánta presión levanta el cilindro, pero no dice por dónde se pierde lo que falta. La prueba de FUGAS se hace con el motor parado y presión metida desde fuera: no dice cuánto comprime, dice POR DÓNDE se escapa. La primera detecta, la segunda localiza. Ninguna sustituye a la otra, y quien sólo tiene una de las dos sabe la mitad.

La aguja del manómetro sube golpe a golpe y no baja, porque hay una válvula antirretorno que hace de trinquete. En el 1.6 sano la secuencia es 13,1 · 15,7 · 16,1 · 16,1 bar y a partir del cuarto golpe ya no se mueve: lo que se lee no es la presión de un ciclo, es el techo de todos. Y aquí cae un mito de taller: el volumen muerto del comprobador NO cambia la lectura final. Con una manguera de 24 cm³ en vez de 8, el primer golpe se desploma de 15,9 a 8,5 bar y a los ocho golpes las dos lecturas coinciden. El volumen muerto cuesta GOLPES, no bares. La relación 9,52 contra 8,16 que publican las prácticas de ciclo y de distribución de este mismo dominio es cierta, pero es la de un solo golpe.

Lo segundo que hay que llevarse es la altitud. El mismo motor sano marca 16,1 bar a nivel del mar, 13,5 en el altiplano y 11,6 en el valle de Toluca: un 28 % menos sin estar peor. Y el factor de presión de Toluca (0,723) es casi exactamente la relación entre el límite de rechazo y el estándar que escribe un manual (11,6/16,1 = 0,72). Traducido: un motor perfectamente sano medido en Toluca cae JUSTO sobre el límite escrito a nivel del mar. Sin corregir el límite por la altitud del taller se condenan motores sanos. El porcentaje de fuga, en cambio, apenas se mueve —del 7,0 al 6,7 %—: en altitud, el fugómetro es el instrumento honesto.

Lo tercero es que la ruta localiza y el porcentaje sólo cuantifica. Todo motor sopla algo por el cárter —el 83 % del caudal en el motor sano—: el asiento puede ser perfecto, el aro nunca lo es, y eso no es un hallazgo. Lo que ningún motor sano hace es burbujear en el radiador. Por eso una junta de culata a la camisa de agua se condena aunque fugue un 17,6 %, por debajo del límite del 20 %: se condena por el SITIO, no por el número. Y ese porcentaje ni siquiera es sólo del motor: cambia el restrictor del fugómetro y cambia la cifra sin que el motor haya cambiado nada. Por dónde sale el aire no cambia con el útil.

Lo cuarto es el aceite como reactivo. Se echan unos centímetros cúbicos por el hueco de la bujía y se repite el golpeo: el aceite sella el hueco del aro, pero no llega ni a un asiento de válvula ni a una junta. Comparado contra la mediana del motor, un cilindro que sube MÁS que sus hermanos tiene los segmentos gastados; uno que sube MENOS tiene la fuga donde el aceite no puede llegar. Unos segmentos pegados saltan +4,3 bar, una válvula de escape quemada +1,2, y una pared rayada +3,2: a medias, porque el aceite no rellena un surco. El salto es un reactivo, no un interruptor.

Y lo quinto es el censo, que es donde está el teorema incómodo. Seis observaciones, sesenta y tres subconjuntos, once escenarios. Con las cuatro observaciones comparativas —las que un técnico ve sin la ficha del fabricante delante— se resuelven ocho de once: motor sano, distribución un diente retrasada y batería baja caen en la MISMA firma, porque los tres bajan todos los cilindros por igual y no hay nada dentro del motor contra lo que compararlos. Ningún subconjunto sin la compresión absoluta corregida por altitud resuelve los once escenarios, y está comprobado en las cuatro máquinas. Comparar cilindro contra cilindro encuentra el cilindro malo; nunca dice que el motor entero está bajo.`,
  conceptos: [
    {
      icono: '🔒',
      nombre: 'La antirretorno hace de trinquete',
      descripcion: 'La aguja sube golpe a golpe y no baja: 13,1 · 15,7 · 16,1 · 16,1 bar en el 1.6 sano. Lo que se lee es el máximo alcanzado, no la presión de un ciclo. Y el volumen muerto del útil no cambia esa cifra final: con 24 cm³ en vez de 8 el primer golpe cae de 15,9 a 8,5 bar y a los ocho golpes las dos lecturas coinciden. Cuesta golpes, no bares.',
    },
    {
      icono: '⛰️',
      nombre: 'La altitud hunde la compresión y no toca la fuga',
      descripcion: 'El mismo motor sano marca 16,1 bar a nivel del mar y 11,6 en Toluca: un 28 % menos sin estar peor. El factor de Toluca (0,723) es casi la relación límite/estándar de un manual (0,72), así que un motor sano allí cae justo sobre el límite escrito a nivel del mar. La fuga apenas se mueve, del 7,0 al 6,7 %.',
    },
    {
      icono: '🎯',
      nombre: 'La ruta localiza, el porcentaje sólo cuantifica',
      descripcion: 'Todo motor sopla por el cárter —el 83 % del caudal estando sano— y eso no es un hallazgo. Una junta al circuito de agua fuga un 17,6 %, por debajo del límite del 20 %, y se condena igual: no hay burbujeo aceptable en un radiador. Además el porcentaje depende del ÚTIL —otro restrictor, otra cifra— y la ruta no.',
    },
    {
      icono: '🧪',
      nombre: 'El signo del salto al mojar separa familias',
      descripcion: 'Contra la mediana del motor: sube MÁS que sus hermanos = segmentos, porque el aceite sella el hueco del aro; sube MENOS = válvula o junta, porque el aceite no llega ahí. Unos segmentos pegados saltan +4,3 bar y una válvula quemada +1,2. La pared rayada salta +3,2, a medias: el aceite no rellena un surco.',
    },
  ],
  mision: [
    'MONTA el puesto pieza a pieza: útil de bloqueo del volante, adaptador de bujía, manómetro con antirretorno y purga, aceitera, fugómetro con su restrictor calibrado, línea de aire regulada y estetoscopio. Hasta que no estén las siete no se abre ningún modo de medida.',
    'MIDE la compresión seca golpe a golpe y mira subir la aguja hasta que se estanca. Compara las tres reglas del manual —la cifra absoluta, la diferencia entre cilindros y el régimen de arranque— y comprueba que no son equivalentes: hay averías que sólo caza una.',
    'CAMBIA el volumen muerto del útil de 8 a 24 cm³ y comprueba que el primer golpe se desploma de 15,9 a 8,5 bar mientras la lectura a los ocho golpes no se mueve. Es el mito de taller más extendido de este tema.',
    'SUBE el banco a 1 500 y a 2 660 m y observa cómo el mismo motor sano pasa de 16,1 a 13,5 y a 11,6 bar sin haber tocado nada, mientras el porcentaje de fuga se queda en el 7 %. Corrige el límite por altitud antes de condenar a nadie.',
    'ECHA aceite en el cilindro sospechoso y lee el SIGNO del salto contra la mediana del motor. Prueba los segmentos desgastados (+3,3), los pegados (+4,3), la válvula de escape quemada (+1,2) y la pared rayada (+3,2), y comprueba que el rayado se queda a medio camino.',
    'PRESURIZA el cilindro y mira por dónde sale el aire: la boca de aceite, el cuerpo de aceleración, la cola del escape, el radiador o la bujía de al lado. Monta la junta al circuito de agua y comprueba que fuga menos que el límite y aun así se condena, por el sitio.',
    'CAMBIA el restrictor del fugómetro de 1,00 a 1,30 mm y comprueba que el porcentaje se mueve sin que el motor haya cambiado nada. Lo que no se mueve con el útil es por dónde sale el aire.',
    'CENSA los instrumentos: cuántos de los once escenarios separa cada observación por su cuenta, cuál es la mejor pareja y qué consiguen las seis juntas. Comprueba el teorema: sin la cifra absoluta corregida por altitud, motor sano, distribución movida y batería baja son el mismo caso.',
    'RETO · Un motor averiado en secreto. Mide lo que necesites, cumple las tres órdenes de trabajo y entrega la FAMILIA de avería. Se te dirá si acertaste y, sobre todo, QUÉ observación lo demostraba.',
  ],
  aplicaciones: [
    {
      area: 'Peritaje de un motor antes de comprarlo o de presupuestar su reparación',
      ejemplo: 'Es la decisión de más dinero de un taller: abrir o no abrir. Aquí se practica el orden completo —seca en todos los cilindros, húmeda sólo en el sospechoso, fugas para localizar— y se ve por qué la cifra sola no basta: dos motores con la misma compresión pueden tener uno los aros y el otro una válvula, y la reparación no se parece en nada.',
    },
    {
      area: 'Talleres en altura: el valle de Toluca, el altiplano, la Ciudad de México',
      ejemplo: 'Un manual de taller publica su límite a nivel del mar. Aplicarlo tal cual en un taller a 2 660 m condena motores perfectamente sanos, porque el factor de presión de esa altitud coincide casi exactamente con la relación límite/estándar. Este laboratorio deja verlo y da la salida: el fugómetro, cuyo porcentaje no se mueve con la altitud.',
    },
    {
      area: 'Diagnóstico de junta de culata sin desmontar nada',
      ejemplo: 'Una junta que sopla al circuito de agua puede no dar humo blanco todavía y puede quedarse por debajo del límite de fuga. Lo que la delata es el burbujeo en el radiador con el tapón quitado, y una junta entre dos cilindros contiguos se delata porque el aire de uno sale por la bujía del otro. Es la aplicación más directa de «la ruta localiza».',
    },
    {
      area: 'Verificación posterior a una reparación o a un rectificado',
      ejemplo: 'Después de montar aros, rectificar asientos o cambiar una culata, la pregunta no es si el motor arranca sino si sella. El par compresión + fugas da la cifra de entrega y deja constancia de por dónde queda soplando el motor reparado, que es el punto de partida del siguiente diagnóstico.',
    },
  ],
};

export default briefing;
