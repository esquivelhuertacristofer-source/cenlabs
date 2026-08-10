import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: 'MEC-118',
  titulo: 'Formas de Onda de los Sensores del Motor',
  subtitulo: 'Motor de combustión interna · rueda fónica y razón entre periodos, captador inductivo contra efecto Hall, sincronía cigüeñal-árbol, alimentación contra masa, joroba de cierre del inyector y probabilidad de cazar un fallo',
  acento: '#5BD4E5',
  duracion: 45,
  videoUrl: '',
  bienvenida: `Sobre el banco hay una tapa de distribución abierta: la rueda fónica del cigüeñal con sus 60 posiciones de diente y su hueco de referencia, el captador enfrentado a ella con su entrehierro, la rueda dentada del árbol de levas girando a la mitad con su correa y su marca de reglaje, el tramo de admisión con el medidor de masa de aire, el cuerpo de mariposa y el sensor de presión de colector, un inyector con su testigo, y un osciloscopio con su pantalla. No hay nada que montar. Lo que se manipula son los MANDOS —máquina, avería, régimen, acelerador, canal y velocidad del barrido del pedal— y lo que hay que aprender a leer es la FORMA de seis señales.

La tesis de esta práctica es incómoda y conviene decirla desde el primer minuto: **el escáner no es un osciloscopio lento; es un muestreador**. Pide un dato, espera la respuesta por el enlace serie y vuelve a pedirlo, cada 80 ms. Entre una lectura y la siguiente no hay información, y no la hay por construcción. Si un fallo dura menos que ese periodo, cazarlo es cuestión de suerte —y la suerte se calcula.

Empieza por la rueda fónica, que es donde está el resultado más bonito del banco. La centralita no sabe dónde está el motor hasta que encuentra el hueco de referencia, y lo encuentra midiendo la RAZÓN entre periodos de diente consecutivos. Esa razón no depende del régimen —es un cociente de tiempos del mismo giro— y vale exactamente los dientes que faltan más uno. En una rueda de 60−2 el hueco abre **3,00** y un diente roto abre **2,00**, con el umbral de la centralita en 2,50 justo en medio: hay margen. En una de 36−1 el hueco abre **2,00** y un diente roto abre **2,00**: no hay margen ninguno.

Y de ahí sale la consecuencia. Pon un diente roto en la 60−2: la centralita sigue viendo 1 referencia por vuelta, el régimen del escáner sale perfecto —se promedia sobre la vuelta entera— y lo único que salta es un fallo de encendido sin cilindro identificado. Pon el MISMO diente roto en la 36−1: cree ver **2** referencias, se sincroniza en el sitio equivocado y el coche **no arranca**. La misma pieza rota, dos averías distintas, y la diferencia está escrita en el diseño de la rueda.

Después ve al captador. Uno de reluctancia variable genera tensión porque el flujo cambia, así que su señal es proporcional al régimen: el 1.6 sano da **1,364 V** con el motor de arranque y **4,836 V** a ralentí. Ahí está la clave de una avería que desespera a medio taller: con el captador flojo la señal cae al 27,3 %, o sea **0,373 V** al arranque contra un umbral de 0,45 V, y **1,321 V** a ralentí. El coche gira y no arranca; empujado, funciona sin una queja hasta que lo apagas.

Ahora cambia de máquina con esa misma avería puesta. En el 2.0 de efecto Hall el sensor deja de conmutar del todo: cero señal, ni al arranque ni a ralentí. Y en el V6 —también Hall, pero con más margen de entrehierro— **no pasa absolutamente nada**: 2,25 mm siguen cayendo dentro de los 2,30 mm que admite. Una avería mecánica idéntica, tres desenlaces distintos, y todos se deducen de cómo funciona cada captador.

Los tres sensores de tensión —mariposa, presión de colector y masa de aire— cuelgan de los mismos cinco voltios y de la misma masa, y eso tiene una consecuencia diagnóstica directa: una avería en la alimentación o en la masa mueve los TRES a la vez. Lo que queda es distinguir un factor de un sumando. Con la alimentación en 4,10 V, la razón contra la recta de fábrica vale **0,820** en todo el recorrido y la diferencia crece con la apertura. Con 0,62 V de masa, la DIFERENCIA vale **0,62 V** en todo el recorrido y la razón se acerca a uno según se abre. Con una sola lectura son la misma avería; con los dos extremos del pedal, no se parecen en nada.

Hay dos señales que engañan de formas opuestas. El hilo caliente sucio sub-declara el **28 %** del gasto de aire, pero su tensión va con la RAÍZ y baja sólo el **10,3 %**: por debajo del umbral del 15 % con el que la centralita decide que algo no cuadra, así que no salta ningún código y además la forma de la onda es impecable —una recta sigue siendo una recta, sólo que más baja—. Y la manguera del colector rajada da lo contrario: una tensión alta y perfectamente plausible, pero **sin rizado**. El rizado de la admisión —26,0 Hz a ralentí en el 1.6, una aspiración por cilindro cada dos vueltas— no lo contiene ningún número del escáner.

El inyector se mira con el osciloscopio y no con el escáner. La corriente sube contra L/R —constante 1,774 ms— hasta 0,930 A al corte, aparece el pico inductivo, y en su bajada hay una joroba pequeña a **1,15 ms** del corte: es la aguja sentándose. Con la aguja pegajosa se va a **2,30 ms** y ni la constante eléctrica ni la corriente al corte se mueven una milésima. La avería es MECÁNICA y sólo se ve en el tiempo de esa joroba.

Y al final, el resultado que da nombre a la práctica. La pista del acelerador gastada abre un hueco del 4 % del recorrido. En un pisotón de 0,30 s ese hueco dura **12,0 ms** contra los 80 ms del escáner, así que la probabilidad de que caiga una lectura dentro vale exactamente τ entre Ts: **15 %**. Hacen falta **19 pisotones** para estar seguro al 95 %. El osciloscopio en barrido continuo sube al 60 % y tampoco es seguro. Pero barre el pedal en **2,00 s** o más y el MISMO escáner lo caza siempre: la mejor mejora de instrumento de esta práctica no cuesta nada, y consiste en mover el pie despacio.

El censo lo cierra. Trece escenarios, trece observaciones, 8 191 juegos posibles. Con lo que hay en cualquier taller se llega a **9 de 13** y ahí se para: usar las siete observaciones de taller no mejora lo que ya dan 3, y lo que se queda pegado es siempre lo mismo —sistema sano ≡ aguja del inyector pegajosa; un diente de la rueda fónica roto ≡ apantallamiento del cable roto—. Añadiendo el osciloscopio se llega a 13 de 13, con un juego mínimo de **5 observaciones** de las que 2 piden osciloscopio. En el V6 el techo es 11, y lo que falta no es instrumento: es que ahí captador de cigüeñal flojo no cambia nada, y este banco lo declara en vez de fingir que sí.`,
  conceptos: [
    {
      icono: '🦷',
      nombre: 'El margen de la rueda fónica es un número',
      descripcion: 'La centralita busca la RAZÓN entre periodos consecutivos, y vale los dientes que faltan más uno. En la 60−2 el hueco abre 3,00 y un diente roto abre 2,00, con el umbral en 2,50 en medio. En la 36−1 los dos abren 2,00: el mismo diente roto para el coche.',
    },
    {
      icono: '🔋',
      nombre: 'La señal más débil es la del arranque',
      descripcion: 'Un captador inductivo da tensión proporcional al régimen: 1,364 V a 220 rpm contra 4,836 V a ralentí. Con el entrehierro doblado se queda en 0,373 V contra un umbral de 0,45 V: gira y no arranca, y arrancado funciona bien.',
    },
    {
      icono: '🎭',
      nombre: 'Tres desenlaces para la misma avería',
      descripcion: 'El mismo entrehierro doblado: en el inductivo no arranca y funciona arrancado; en un Hall pasado de margen no hay señal ninguna; y en un Hall con margen de sobra —2,25 mm contra 2,30 mm— no pasa absolutamente nada. El captador manda más que la avería.',
    },
    {
      icono: '⚙️',
      nombre: 'Un diente de árbol no vale un diente',
      descripcion: 'El árbol gira a la mitad, así que su rueda de 40 dientes vale 18,00 ° de CIGÜEÑAL por diente saltado; 22,50 ° en el tres cilindros. El código de correlación dice que los dos no cuadran; cuánto, sólo lo dice medir la fase con dos canales.',
    },
    {
      icono: '➕',
      nombre: 'La alimentación multiplica, la masa suma',
      descripcion: 'Los tres sensores de tensión cuelgan de la misma alimentación y de la misma masa. Una caída de alimentación deja la razón constante en 0,820; una masa con resistencia deja la DIFERENCIA constante en 0,62 V. Con una sola lectura son la misma avería.',
    },
    {
      icono: '√',
      nombre: 'La raíz esconde el error del hilo caliente',
      descripcion: 'Un 28 % de error en la MASA se queda en 10,3 % en la TENSIÓN, porque el hilo va con la raíz del gasto: 2,810 V contra 2,520 V. Por debajo del umbral del 15 % del autodiagnóstico, así que no salta ningún código.',
    },
    {
      icono: '📉',
      nombre: 'La ausencia de rizado es un dato',
      descripcion: 'La presión de colector lleva una aspiración por cilindro cada dos vueltas: 26,0 Hz a ralentí en el 1.6, 34,0 Hz en el V6. Con la manguera rajada la tensión sube a 4,519 V y el rizado desaparece. El escáner no tiene ese dato.',
    },
    {
      icono: '🩺',
      nombre: 'La joroba de cierre delata la aguja',
      descripcion: 'La corriente sube contra L/R —1,774 ms— y en la bajada del pico inductivo hay una joroba a 1,15 ms del corte: la aguja sentándose. Pegajosa, se va a 2,30 ms sin que la constante eléctrica ni la corriente al corte se muevan.',
    },
    {
      icono: '🎯',
      nombre: 'Cazar un fallo es aritmética, no suerte',
      descripcion: 'Un hueco de 12,0 ms contra un escáner de 80 ms: la probabilidad vale exactamente τ/Ts = 15 %, y hacen falta 19 pisotones para el 95 %. Barriendo el pedal en 2,00 s o más, el mismo escáner lo caza siempre.',
    },
    {
      icono: '🔍',
      nombre: 'El teorema del censo',
      descripcion: '8 191 juegos de observaciones sobre trece escenarios. El taller corriente llega a 9 de 13 y no pasa de ahí; con osciloscopio, 13. El juego mínimo tiene 5 observaciones e incluye la FORMA de la onda en las cuatro máquinas.',
    },
  ],
  mision: [
    'MIRA primero el sistema sano a ralentí en el modo de señales. Sin saber cómo es una onda sana, ninguna onda averiada dice nada. Fíjate en que el captador inductivo cruza por cero en el centro de cada diente y que su altura sube con el régimen.',
    'PON un diente roto y anota la razón que abre: 2,00. Cambia al 2.0 de rueda 36−1 con la misma avería y explica por qué ese coche no arranca y el otro sí. Escribe la condición que tiene que cumplir el umbral de razón para que una rueda tenga margen.',
    'PON el captador flojo y el régimen en «arranque». Anota 0,373 V contra el umbral de 0,45 V. Sube a ralentí y anótalo otra vez. Ya sabes por qué ese coche arranca empujado y después no vuelve a fallar.',
    'REPITE esa avería en las cuatro máquinas. Tres desenlaces distintos con la misma pieza floja. Escribe en una frase qué propiedad de cada captador explica cada desenlace.',
    'PON el conector intermitente del cigüeñal y cuenta las referencias que ve la centralita. Explica por qué dos pulsos perdidos SEGUIDOS son mucho peores que dos separados.',
    'MIDE la fase cigüeñal-árbol con la correa saltada en las cuatro máquinas y comprueba que en cada una vale 720 entre los dientes de su rueda de árbol: 18,00 °, 20,00 °, 22,50 ° y 16,36 °.',
    'COMPARA la alimentación caída con la masa con resistencia mirando la RAZÓN y la DIFERENCIA en los dos extremos del pedal. Decide cuál de las dos columnas separa las dos averías y por qué una sola lectura no basta.',
    'DEDUCE el exponente de la ley del hilo caliente a partir de sus dos porcentajes: 28 % de error en masa y 10,3 % en tensión.',
    'PON la manguera del colector rajada y busca el rizado. Comprueba que su frecuencia es el régimen por los cilindros entre 120, y explica de dónde sale ese 120.',
    'MIRA la joroba del inyector sano y la del pegajoso: 1,15 ms contra 2,30 ms. Comprueba que ni L/R ni la corriente al corte cambian, y decide si la avería es eléctrica o mecánica.',
    'CAZA el hueco de la pista con los cuatro barridos. Comprueba que la probabilidad es proporcional al tiempo de barrido hasta que satura, y calcula a mano a partir de qué barrido el escáner ya no puede fallar: 2,00 s.',
    'CENSA los instrumentos en las cuatro máquinas. Anota qué escenarios NO separa un taller sin osciloscopio y qué medida los separa. Y explica por qué el techo del V6 es menor que el de las otras tres.',
    'RETO · Un coche averiado en secreto. Toma las observaciones que necesites —las siete de taller son baratas, las seis de osciloscopio no— y entrega la FAMILIA de avería. Se te dirá si acertaste y, sobre todo, qué observación lo demostraba.',
  ],
  aplicaciones: [
    {
      area: 'Arranques que fallan en frío y no en caliente',
      ejemplo: 'Es la avería que más horas de taller cuesta y aquí se ve en dos pantallas. Un captador inductivo da tensión proporcional al régimen, y con el motor de arranque gira a 220 rpm: diez veces más despacio que a ralentí. Un entrehierro un poco grande deja la señal en 0,373 V contra un umbral de 0,45 V —no arranca— y en 1,321 V a ralentí —funciona perfecto—. Medir la señal con el motor en marcha no descarta nada: hay que medirla girando con el arranque.',
    },
    {
      area: 'Fallos intermitentes y el parte de taller',
      ejemplo: 'Este laboratorio da la aritmética para escribir un parte honesto. Con un hueco de 12,0 ms y un escáner que lee cada 80 ms, la probabilidad de cazarlo en un intento es 15 %: «lo probé tres veces y no salió» no significa que el coche esté bien, significa que hacían falta 19 intentos. Y da también la alternativa gratis: alargar el gesto hasta que la ventana del fallo supere el periodo de muestreo.',
    },
    {
      area: 'Puesta a punto de la distribución',
      ejemplo: 'Un código de correlación cigüeñal-árbol dice que los dos no se corresponden y no dice cuánto. La cifra sale de medir la fase entre el hueco de referencia y el flanco del árbol con dos canales, y hay que llevarla a grados de CIGÜEÑAL: un diente de una rueda de 40 son 18,00 °, no 9,00 °. Confundir los dos deja la distribución a mitad de camino y el motor sigue arrancando.',
    },
    {
      area: 'Por qué el osciloscopio no es un lujo',
      ejemplo: 'El censo lo demuestra en vez de afirmarlo: con escáner, multímetro y la llave de contacto se llega a 9 de 13 escenarios y ahí se para, porque sistema sano ≡ aguja del inyector pegajosa; un diente de la rueda fónica roto ≡ apantallamiento del cable roto dan exactamente la misma huella. El juego mínimo que cierra el caso tiene 5 observaciones y 2 de ellas sólo se pueden tomar con osciloscopio. Es el argumento técnico —y no comercial— para comprar el instrumento.',
    },
  ],
};

export default briefing;
