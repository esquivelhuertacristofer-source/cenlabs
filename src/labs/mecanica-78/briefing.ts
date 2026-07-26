import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: 'MEC-78',
  titulo: 'Multiplexores, Decodificadores y Display de 7 Segmentos',
  subtitulo: 'Sistemas Digitales · Bloques combinacionales · Habilitación',
  acento: '#8AB4F8',
  duracion: 30,
  videoUrl: '',
  bienvenida: `Con las compuertas básicas puedes construir cualquier circuito, pero nadie diseña un sistema real conectando compuertas una por una: se usan BLOQUES prefabricados de mediana escala que resuelven tareas comunes. Este laboratorio te presenta los tres más usados, y una idea que los conecta y que sorprende a casi todo el que la ve por primera vez.

El primero es el MULTIPLEXOR (MUX). Imagínalo como un selector giratorio electrónico: tiene varias entradas de datos y una sola salida, y una palabra de SELECCIÓN decide cuál de las entradas se "conecta" a la salida. Con n bits de selección elige entre 2ⁿ datos: Y = D[sel]. Además tiene una señal de HABILITACIÓN (enable): si está apagada, la salida es 0 sin importar nada más —es el interruptor maestro, y la causa número uno de "está todo bien pero no sale nada"—. El segundo bloque es el DECODIFICADOR, que hace justo lo contrario: recibe un número de n bits y enciende UNA y solo una de sus 2ⁿ salidas, la que corresponde a ese número (patrón "one-hot"). Se usa para seleccionar un chip por su dirección, encender una línea, o —como verás— reconstruir cualquier función lógica. El tercero es el DISPLAY DE 7 SEGMENTOS: ese numerito rojo de los relojes y microondas. Un decodificador BCD→7seg traduce un dígito 0-9 al patrón de segmentos a-g que lo dibuja.

Ahora la idea sorprendente: un MUX 2ⁿ:1, poniendo las variables en la selección, puede realizar CUALQUIER función booleana de n variables sin una sola compuerta extra. ¿Cómo? Cableas en cada entrada de datos el valor que la función debe tener en esa fila: D_i = f(i). La selección recorre las filas de la tabla de verdad y la salida es, en cada una, justo el dato que pusiste. El MUX "es" la tabla de verdad hecha hardware. Lo mismo con el decodificador: como cada salida es un mintérmino, una OR de las salidas correctas reconstruye la función. Y el display cierra el círculo con el laboratorio de Karnaugh: la lógica de cada segmento es una función booleana de 4 bits que se minimiza con don\'t-care en los códigos 10-15. Verifiqué todo numéricamente —MUX y decodificador exhaustivos, 400 funciones aleatorias, y el SOP de los 7 segmentos— y coincide con Mano & Ciletti.`,
  conceptos: [
    { icono: '🔀', nombre: 'Multiplexor (Y = D[sel]·EN)', descripcion: 'Un conmutador controlado: la palabra de selección de n bits elige cuál de las 2ⁿ entradas de datos llega a la única salida. La habilitación (EN) es el interruptor maestro: con EN=0 la salida es 0 pase lo que pase. Es el bloque de enrutamiento de datos por excelencia.' },
    { icono: '📤', nombre: 'Decodificador (one-hot)', descripcion: 'Operación inversa al MUX: recibe un número de n bits y activa UNA y solo una de sus 2ⁿ salidas, la que corresponde a ese número. Cada salida es exactamente un mintérmino. Se usa para chip-select por dirección, encender líneas y, con una OR, realizar funciones SOP.' },
    { icono: '🔢', nombre: 'Display de 7 segmentos (BCD)', descripcion: 'Un decodificador BCD→7seg traduce cada dígito 0-9 al patrón de segmentos a-g que lo dibuja. La lógica de cada segmento es una función booleana de los 4 bits BCD; como los códigos 10-15 nunca ocurren, se tratan como don\'t-care y permiten simplificar más (mismo motor Quine-McCluskey del laboratorio de Karnaugh).' },
    { icono: '🌐', nombre: 'MUX y decodificador como lógica universal', descripcion: 'Un MUX 2ⁿ:1 con las variables en la selección realiza cualquier función de n variables cableando D_i = f(i): reproduce la tabla de verdad completa sin compuertas extra. Un decodificador + una OR de los mintérminos hace lo mismo por la vía SOP. Ambos verificados numéricamente (400 funciones aleatorias, one-hot exhaustivo).' },
  ],
  mision: [
    'EXPLORA · Elige un bloque y condúcelo en vivo. Con el MUX cambia la selección y ve que la salida sigue al dato elegido; apaga EN y comprueba que la salida cae a 0. Con el decodificador mueve la entrada y observa la única salida activa (one-hot). Con el display, recorre los dígitos 0-9 y mira qué segmentos encienden.',
    'APLICA · Comprueba las ideas potentes: que un MUX con D_i=f(i) reproduce la tabla de verdad completa de una función (XOR, mayoría, paridad) sin compuertas extra; que un decodificador+OR la reconstruye como suma de mintérminos; y que cada segmento del display tiene su SOP mínimo (Karnaugh con don\'t-care 10-15).',
    'RETO · Se te da una función objetivo F = Σm(...). Configura los datos del MUX (regla de oro: D_i = f(i), copia la columna F de la tabla) y activa la habilitación. El sistema califica por separado los datos correctos y la habilitación: el error clásico es dejar datos correctos pero EN=0 y no obtener salida.',
  ],
  aplicaciones: [
    { area: 'Enrutamiento y selección de datos', ejemplo: 'Un multiplexor elige qué sensor, qué canal o qué registro se lee en un instante (buses de datos, entradas de un ADC, teclados matriciales). Su inverso, el demultiplexor/decodificador, dirige una señal o selecciona qué chip de memoria responde según la dirección (chip-select). La habilitación permite compartir un bus entre varios dispositivos sin conflicto.' },
    { area: 'Realización de lógica combinacional', ejemplo: 'Antes de las FPGA, realizar una función con un solo MUX (D_i=f(i)) o un decodificador+OR ahorraba chips y simplificaba el diseño. La idea sigue viva: las LUTs (Look-Up Tables) de una FPGA son, en esencia, pequeños multiplexores que almacenan la tabla de verdad de la función que implementan.' },
    { area: 'Interfaces de visualización', ejemplo: 'Los displays de 7 segmentos muestran cifras en relojes, medidores, tableros de instrumentos y electrodomésticos. El decodificador BCD→7seg (como el 7447) convierte el número interno en el patrón de segmentos; entender su lógica por segmento y el multiplexado de varios dígitos es la base del diseño de tableros numéricos.' },
  ],
};

export default briefing;
