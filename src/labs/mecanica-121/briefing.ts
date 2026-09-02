import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: 'MEC-121',
  titulo: 'Eficiencia del Catalizador y Sondas de Oxígeno',
  subtitulo: 'Motor de combustión interna · ciclo límite del lazo cerrado, almacenamiento de oxígeno del cerio, índice de la sonda posterior, P0420 y su calibración contra la NOM-041',
  acento: '#F0A05A',
  duracion: 45,
  videoUrl: '',
  bienvenida: `Una línea de escape en alto sobre el elevador, con las dos sondas de oxígeno a la vista: la anterior en el colector y la posterior pasada el catalizador. Y tres instrumentos delante de la misma lata, que es lo que hace especial a esta práctica: el escáner de diagnóstico, que acaba en un P0420 o en nada; la prueba intrusiva de almacenamiento, que da un tiempo en segundos; y el analizador de gases de cola, que da el veredicto de la NOM-041.

La tesis cabe en una frase que en el taller cuesta cara: el monitor no mide lo que la ley mide. La ley mide hidrocarburos por el tubo; el monitor mide cuánto oxígeno guarda el cerio del recubrimiento. Son dos magnitudes distintas que envejecen juntas, y de esa correlación vive el sistema entero.

Empieza por lo que se ve. La sonda de delante oscila, y no porque esté estropeada: oscila porque el ordenador la hace oscilar. Rampa la mezcla a velocidad fija y da media vuelta cada vez que la sonda cruza los 0,45 voltios. Con el retardo de este motor —0,112 s de transporte por el colector más 0,09 s de la propia sonda— eso da un periodo de 0,808 s y una amplitud de ±0,0202 de λ. Ninguno de los dos números está escrito en el modelo: salen de integrar el lazo.

La de detrás, con el catalizador nuevo, se queda quieta en 0,63 voltios. No está alta porque la mezcla sea rica. Está alta porque el gas que sale de la lata viene equilibrado y lleva hidrógeno, y el circonio es hipersensible al hidrógeno. Una sonda posterior alta y quieta es la firma de que el catalizador está trabajando.

Y está quieta por una razón concreta: el cerio se traga el oxígeno que sobra en cada media oscilación. Con la lata nueva el depósito recorre seis centésimas de su carrera y por detrás no sale nada; con el catalizador gastado recorre nueve décimas y toca los dos topes. Cuando toca los topes, el oxígeno sale por el otro lado y la sonda de atrás empieza a copiar a la de delante. Eso es todo lo que el monitor sabe medir.

Aquí conviene pararse, porque hay algo que casi nadie cuenta. Ese almacén no es sólo lo que el monitor mide: es el mecanismo que hace posible la conversión de tres vías. Oxidar CO e hidrocarburos pide oxígeno y reducir NOx pide justo lo contrario; las dos por encima del 90 % sólo entre λ 0,9960 y λ 1,0090, trece milésimas. Mantenerse ahí con un motor real es imposible, así que lo que se hace es oscilar alrededor y dejar que el catalizador promedie. Quitando sólo el cerio y dejando los metales intactos, el HC de cola sube de 46 a 110 ppm sin que se envenene un átomo de platino.

Ahora la trampa, que organiza la práctica entera. El umbral que separa el aprobado del P0420 no es una propiedad del catalizador: es un número de calibración. Está elegido para que el monitor salte donde el HC de cola llega a 148 ppm, una vez y media el límite de 100 de la TABLA 1, porque eso es lo que la reglamentación de diagnóstico a bordo exige. Y de ahí sale una consecuencia inevitable: la ley rechaza este coche a los 82 000 km y el testigo no se enciende hasta los 122 000. En esos 40 000 km el vehículo reprueba la verificación con el tablero limpio, y no hay nada roto.

Después están las averías que rompen la correlación, y van en las dos direcciones. Una sonda ANTERIOR que lee una décima de voltio de más hacia rica hace que el ordenador empobrezca de más: el almacén se queda lleno para siempre, el índice se va a 0,737 y salta un P0420 con 37 ppm de hidrocarburos por el tubo. El catalizador está nuevo.

Y el caso contrario, que es peor porque no avisa. El fósforo del aceite tapa los metales preciosos y deja el cerio casi entero: índice 0,107, almacenamiento 2,95 s, los dos limpios, y 539 ppm de HC por el tubo. El envenenamiento del rodio es todavía más fino: el rodio es el metal del NOx y el primero que se envenena, así que el HC sale perfecto, el índice sale perfecto, y por la cola van 1 662 ppm de NOx. Ese coche pasa el monitor, pasa el método estático —que no tiene límite de NOx— y sólo lo caza el dinámico.

Queda el peor de todos, y es el que enseña a desconfiar del instrumento. El monitor y la prueba de almacenamiento leen los DOS por la sonda posterior. Con esa sonda lenta y el catalizador agotado, el índice sale 0,105 y el cronómetro 0,74 s —los dos dentro de lo normal— mientras por el tubo salen 374 ppm. El único instrumento que no se engaña es el analizador de gases, porque es el único que no pasa por ahí.

Todo eso se cuenta al final: nueve averías por cinco edades, 45 celdas. El ordenador acierta en 25 y falla en 20, cuatro acusando a un catalizador limpio y dieciséis callándose con un coche que reprueba. La conclusión no es que el monitor sea malo. Es que un P0420 es una pista sobre el almacén de oxígeno, no un diagnóstico sobre el catalizador, y que la ausencia de código no certifica nada.`,
  conceptos: [
    {
      icono: '〰️',
      nombre: 'La de delante oscila porque la hacen oscilar',
      descripcion: 'El ordenador rampa la mezcla y da media vuelta al cruzar 0,45 V. Con 0,202 s de retardo total salen 0,808 s de periodo y ±0,0202 de λ. No están escritos: salen de integrar el lazo.',
    },
    {
      icono: '🔋',
      nombre: 'El cerio guarda oxígeno',
      descripcion: '0,095 g de O₂ por litro de cilindrada cuando es nuevo. Ése es el amortiguador que aplana la señal de atrás, y es lo único que el monitor sabe medir.',
    },
    {
      icono: '⬆️',
      nombre: 'La sonda posterior sana vive ALTA',
      descripcion: '0,63 V y quieta. No porque la mezcla sea rica: el gas que sale del catalizador viene equilibrado y lleva hidrógeno, y el circonio lo lee como rica. Es la firma de que la lata trabaja.',
    },
    {
      icono: '📉',
      nombre: 'La ruptura no es suave',
      descripcion: 'Lo que se escapa va con Θ elevado a 6: hasta el 80 % de lleno no pasa casi nada. Por eso la señal de atrás está plana hasta que un día deja de estarlo.',
    },
    {
      icono: '⏱️',
      nombre: 'Segundos, no una nota',
      descripcion: 'La prueba intrusiva da 3,51 s en marcha mínima y 0,72 s en crucero con el MISMO catalizador. El tiempo es capacidad entre caudal: un número sin su régimen no significa nada.',
    },
    {
      icono: '🪟',
      nombre: 'Guardar no es convertir',
      descripcion: 'La ventana mide 0,0130 de λ, y además hace falta pasar de 230 °C. El monitor no mide ninguna de las dos cosas: mide el amortiguador y deduce el resto.',
    },
    {
      icono: '⚖️',
      nombre: 'El umbral está calibrado contra la ley',
      descripcion: 'El 0,32 hace que el monitor salte con 148 ppm de HC, 1,48 veces el límite de la TABLA 1. No es una constante física: es lo que la reglamentación de diagnóstico a bordo pide.',
    },
    {
      icono: '🕳️',
      nombre: 'La banda ciega es de diseño',
      descripcion: 'La ley rechaza a los 82 000 km y el testigo se enciende a los 122 000. En esos 40 000 km el coche reprueba con el tablero limpio, y no hay nada roto.',
    },
    {
      icono: '🎯',
      nombre: 'Un P0420 con la lata nueva',
      descripcion: 'La sonda ANTERIOR desviada 0,1 V deja el almacén lleno para siempre: índice 0,737 con 37 ppm de HC por el tubo. Cambiar el catalizador no lo arregla.',
    },
    {
      icono: '☠️',
      nombre: 'El rodio es el metal del NOx',
      descripcion: 'Envenenado: HC 46 ppm perfecto, índice 0,099 perfecto, NOx 1 662 ppm. Pasa el monitor, pasa el estático —que no limita NOx— y sólo lo caza el dinámico.',
    },
    {
      icono: '🙈',
      nombre: 'Dos instrumentos, una sola sonda',
      descripcion: 'El monitor y el cronómetro leen los dos por la posterior. Con esa sonda lenta, los dos dicen que todo va bien con 374 ppm de HC saliendo por el tubo.',
    },
    {
      icono: '🧮',
      nombre: '20 de 45 celdas',
      descripcion: 'Nueve averías por cinco edades. Cuatro veces acusa a un catalizador limpio y dieciséis se calla con un coche que reprueba. Sale de recorrer la rejilla, no está escrito.',
    },
  ],
  mision: [
    'MIRA el multipunto 1.6 nuevo y sano en la vista «sondas». Anota el periodo de la señal de delante y el recorrido de la de atrás. Escribe por qué la de atrás está en 0,63 V y no en 0,45.',
    'SUBE la edad del catalizador a «gastado» sin tocar nada más. La de delante hace exactamente lo mismo. Anota qué le pasa a la de atrás y explica cuál de los dos cambios lo causa.',
    'VE a «almacén» con la lata nueva y anota el recorrido ΔΘ. Repítelo con el catalizador gastado. Mira después la curva de abajo y explica por qué la señal de atrás no se degrada poco a poco.',
    'EN «prueba», anota los dos tiempos de almacenamiento —marcha mínima y crucero— del mismo catalizador. Calcula la razón y explícala sin usar la palabra «mejor».',
    'CAMBIA a la vista «ventana» y anota los dos bordes de la franja donde las tres conversiones van a la vez. Después pon «catalizador frío» y mira qué le pasa al índice del monitor. Escribe qué demuestra eso.',
    'EN «monitor», sube la edad de «nuevo» a «agotado» siguiendo las dos curvas. Anota en qué edad cruza cada una su raya y explica por qué cruzan casi juntas.',
    'PON la edad «medio» y localiza la franja amarilla. Anota el HC de cola, el límite de la norma y el estado del testigo. Escribe qué le dirías a alguien que reprueba la verificación con el tablero limpio.',
    'PON «anterior desviada» con el catalizador NUEVO. Anota el índice y el HC de cola. Escribe qué pieza hay que cambiar y cuánto habría costado equivocarse.',
    'PON «fósforo» con el catalizador nuevo y anota las TRES medidas. Explica cuál de las tres es la que no se deja engañar, y por qué.',
    'PON «plomo · rodio» y compara los dos métodos de verificación sobre el mismo coche sin tocar nada más. Anota el veredicto de cada uno y explica por qué difieren.',
    'PON «posterior lenta» con el catalizador «agotado» y anota el índice, el almacenamiento y el HC. Escribe qué tienen en común los dos instrumentos que se equivocan.',
    'COMPARA «fuga pequeña» y «fuga grande» con la misma edad. Anota el código de cada una y la tensión media de la sonda posterior. Explica por qué la misma avería da dos códigos distintos.',
    'VE a «censo» y cuenta las celdas rojas y las ámbar. Cambia después al TBI de 1992 y anota qué cambia en toda la rejilla y por qué.',
    'RETO · Llega un coche y no se dice qué tiene. Tienes tres instrumentos y cada uno cuesta tiempo. Decide QUÉ HAY QUE CAMBIAR, no qué avería es: y recuerda que un veneno tiene una causa aguas arriba.',
  ],
  aplicaciones: [
    {
      area: 'El catalizador que se cambió sin hacer falta',
      ejemplo: 'Es el error más caro de este dominio. Entra un coche con P0420, se cambia el catalizador, y a los tres días vuelve con el mismo código. En este banco, una sonda anterior desviada 0,1 V da índice 0,737 —P0420 de libro— con 37 ppm de hidrocarburos por el tubo, y una sonda anterior lenta da 1,265 con 47 ppm. Las dos veces la pieza cara está intacta. Medir los gases de cola antes de tocar nada cuesta diez minutos y descarta las dos.',
    },
    {
      area: 'El coche que reprueba con el tablero limpio',
      ejemplo: 'Un cliente llega indignado del centro de verificación: reprobó por hidrocarburos y el testigo de motor nunca se encendió. No hay nada que reclamar. El monitor de a bordo está calibrado para avisar a 1,5 veces el límite, así que entre una vez y una vez y media el coche está fuera de norma con el sistema en silencio. En este banco esa franja va de los 82 000 a los 122 000 km, y existe en todos los vehículos con diagnóstico a bordo.',
    },
    {
      area: 'La verificación por diagnóstico a bordo',
      ejemplo: 'La NOM-167-SEMARNAT-2017 permite verificar los modelos 2006 y posteriores leyendo el sistema de a bordo en vez de midiendo gases: monitores completos y sin códigos de emisiones. Este laboratorio enseña exactamente qué se está aceptando con eso. De 45 situaciones, el monitor se equivoca en 20, y en 16 de ellas se equivoca callándose. La ventaja del método es de tiempo y de coste, no de exactitud, y conviene saberlo.',
    },
    {
      area: 'Por qué un catalizador nuevo se muere en un año',
      ejemplo: 'Cuando la conversión se ha caído pero el almacén sigue dando sus segundos, eso no es edad: el cerio y los metales preciosos se van juntos con los kilómetros. Es un veneno, y viene de algún sitio —fósforo del aceite que pasa por los retenes, azufre del combustible, silicio de un anticongelante que se cuela—. Poner una lata nueva sin quitar la causa la mata en unos miles de kilómetros, y el cliente vuelve con la factura en la mano.',
    },
    {
      area: 'El instrumento que se engaña a sí mismo',
      ejemplo: 'El índice del monitor y la prueba intrusiva de almacenamiento parecen dos medidas independientes, y no lo son: las dos entran por la sonda posterior. Con esa sonda envejecida y lenta, las dos dicen que el catalizador está bien mientras por el tubo salen 374 ppm. Es el argumento de por qué un taller no puede diagnosticar emisiones sólo con un escáner, por bueno que sea el escáner.',
    },
  ],
};

export default briefing;
