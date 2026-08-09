import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: 'MEC-115',
  titulo: 'Lubrica el Motor: Grado SAE, Película y Presión',
  subtitulo: 'Motor de combustión interna · SAE J300, recta de Walther, cojinete hidrodinámico, arranque en frío y censo de instrumentos',
  acento: '#E0A33E',
  duracion: 45,
  videoUrl: '',
  bienvenida: `Sobre el banco hay siete piezas del circuito de lubricación —cárter con su colador, bomba, válvula limitadora, filtro con su antirretorno y su derivación, radiador de aceite, galería principal y manocontacto— y en el motor, siete huecos luminosos esperándolas. Mientras falte una, el tramo que la necesita se dibuja apagado y no pasa aceite por él: el circuito es un lazo cerrado, y un lazo con un hueco no es un lazo.

La tesis de esta práctica es incómoda y hay que decirla desde el principio: **el manómetro no mide la lubricación**. Mide la resistencia del circuito. Lo que protege al motor es el espesor mínimo de la película de aceite entre el muñón y el casquillo, que el conductor no ve nunca, que ningún taller mide con el motor montado y que no está en ningún cuadro de instrumentos. Las dos cosas suben y bajan juntas casi siempre, y por eso se confunden; el laboratorio está construido para enseñarte los casos en los que no.

Empieza por el aceite. ASTM D341 dice que log₁₀log₁₀(ν+0,7) es una recta contra el logaritmo de la temperatura absoluta, y en esos ejes cada aceite del banco es literalmente una recta: su pendiente es lo que pierde al calentarse. Fíjate en que cada línea arranca en un punto gordo, que es el dato MEDIDO de su ensayo de arranque en frío. Por debajo de ahí el modelo no extrapola, y no es una precaución de manual: extrapolar la recta de catálogo hasta −35 °C da un número que no cumpliría ni su propio grado SAE.

Y ten cuidado con el grado. El número de verano ordena la viscosidad a 100 °C, medida a cizalla baja; lo que aguanta el cojinete es el HTHS, medido a 150 °C y a un millón de inversos de segundo. En este banco el 15W-40 tiene MENOS viscosidad a 100 °C que el 10W-40 (14,30 contra 14,50 mm²/s) y MÁS HTHS (3,85 contra 3,65 mPa·s). Y la pendiente de Walther tampoco es el índice de viscosidad: el 0W-20 tiene mejor IV que el 10W-40 (168 contra 154) y mayor pendiente. Ésa es exactamente la razón de que ASTM D2270 defina el índice contra aceites de referencia de la misma viscosidad a 100 °C, en vez de con la pendiente.

Después ve a la presión. No es una propiedad del aceite: es el equilibrio entre lo que la bomba mete y lo que el circuito deja salir. Y lo que sale por cada cojinete va con el CUBO de su holgura. De ahí sale el resultado que más cuesta creerse: en el 1.6, un solo cojinete de bancada gastado mueve el manómetro 0,032 bar en caliente a ralentí —de 0,93 a 0,89— y un motor gastado entero lo hunde 0,472 bar, hasta 0,45. La caída es catorce veces mayor. Un cojinete malo es una minoría del caudal; un motor gastado no.

Luego mira la película en el cojinete ampliado, que es un corte con la holgura multiplicada por un factor que la propia escena publica en pantalla: la holgura real son veintitantas micras y a escala no se vería. Ahí verás el muñón desplazado y la corona de aceite estrechándose por abajo. Esa media luna es h mínima. Deja el régimen fijo y cambia sólo el par pedido: la presión no se entera —menos de un 2 %— y la película sí. Y después compara 1 200 rpm a plena carga con 5 000 rpm a plena carga: si esperabas que el cojinete sufriera más arriba, el modelo te va a contradecir. Sin par pedido el pico del cilindro es el de compresión —la misma cifra que mide la práctica de sellado de este dominio— y la inercia alternativa DESCARGA el cojinete al subir de vueltas.

El arranque en frío es donde de verdad se gasta el motor. A régimen estacionario un motor sano va sobrado de película; el desgaste vive en los primeros segundos, mientras la galería se llena y el cojinete trabaja con el aceite residual. Por eso J300 pide DOS ensayos de invierno y no uno: el CCS garantiza que el motor de arranque lo GIRE y el MRV, que la bomba lo ASPIRE. A −20 °C, en el 1.6, sólo el 0W-20 y el 5W-30 superan las 120 rpm que ese motor necesita para encender; el 10W-40 se queda en 91 y el 20W-50 en 29. Y hay un caso peor que no arrancar: un aceite que pasa el CCS y falla el MRV deja al motor girando EN SECO, con el manómetro sin nada que medir. Fíjate también en que las vueltas en seco casi no dependen del frío —3,7 en todos los casos— aunque los segundos sí: la bomba y el cigüeñal giran juntos y el cociente se cancela. Girar más despacio no protege; cebar antes, sí.

Y al final está el censo, que es el teorema incómodo. Trece escenarios, siete observaciones, ciento veintisiete subconjuntos. Con las tres presiones del protocolo se separan ocho de trece en el 1.6; con TODO lo que se puede medir sin abrir el motor, nueve. Ninguna combinación de observaciones de taller pasa de ahí en ninguna de las cuatro máquinas. Dos averías son la razón: el filtro obstruido con su derivación abierta deja las tres presiones IDÉNTICAS a las del motor sano —hasta el último dígito— y el antirretorno roto también; ése sólo se paga en cada arranque, donde las vueltas en seco pasan de 3,7 a 18,6. Hay averías de lubricación que no se diagnostican con el motor montado, y eso no es una limitación del taller: es una limitación de lo observable.`,
  conceptos: [
    {
      icono: '🩸',
      nombre: 'El manómetro no mide la lubricación',
      descripcion: 'Mide la resistencia del circuito. Lo que protege es h mínima, el espesor de película entre muñón y casquillo, que nadie mide con el motor montado. A 100 °C y 2 000 rpm con carga el 1.6 marca 3,04 bar y 5,73 µm; a 130 °C y 1 200 rpm con carga, la presión cae un 66 % y la película sólo un 41 %. No son la misma magnitud.',
    },
    {
      icono: '📐',
      nombre: 'La recta de Walther, y dónde deja de valer',
      descripcion: 'En los ejes de ASTM D341 cada aceite es una recta y su pendiente es lo que pierde al calentarse. Pero la recta NO se extrapola al frío: extrapolar el catálogo a −35 °C da cifras que no cumplirían su propio grado SAE. El tramo frío se ancla en el punto medido del ensayo CCS, que en la gráfica es el punto gordo del extremo izquierdo.',
    },
    {
      icono: '🎚️',
      nombre: 'El grado no ordena la protección',
      descripcion: 'El 15W-40 tiene menos KV100 que el 10W-40 (14,30 contra 14,50 mm²/s) y más HTHS (3,85 contra 3,65 mPa·s). El número de verano se mide a cizalla baja; el cojinete trabaja a cizalla alta. Y la pendiente de Walther tampoco es el índice de viscosidad: el 0W-20 tiene mejor IV que el 10W-40 y mayor pendiente.',
    },
    {
      icono: '🧊',
      nombre: 'Dos ensayos de invierno, y no uno',
      descripcion: 'El CCS dice si el motor de arranque lo gira; el MRV, si la bomba lo aspira. A −20 °C sólo el 0W-20 (185 rpm) y el 5W-30 (140 rpm) superan las 120 rpm que pide el 1.6. Y un aceite que pasa el primero y falla el segundo deja al motor girando EN SECO: es la avería más cara del laboratorio, y el manómetro llega tarde por definición.',
    },
    {
      icono: '🧮',
      nombre: 'La fuga va con el CUBO de la holgura',
      descripcion: 'Por eso un solo cojinete gastado apenas mueve la aguja —0,032 bar en caliente a ralentí— y un motor gastado entero la hunde 0,472 bar: catorce veces más. Y por la asíntota del cojinete corto, a excentricidad alta duplicar la holgura casi no adelgaza la película: lo que se dispara es el caudal, no el contacto.',
    },
    {
      icono: '🔍',
      nombre: 'El teorema del censo',
      descripcion: 'Trece escenarios, siete observaciones, 127 subconjuntos. Con las tres presiones se separan 8 de 13; con todo lo que se mide sin abrir el motor, 9; con las siete, 13. Ninguna combinación de observaciones de taller resuelve los trece en ninguna de las cuatro máquinas: el filtro obstruido y el antirretorno roto dejan la presión idéntica a la del motor sano.',
    },
  ],
  mision: [
    'MONTA el circuito pieza a pieza: cárter con su colador, bomba, limitadora, filtro con su antirretorno y su derivación, radiador, galería con sus taladros y manocontacto. Mientras falte una pieza, el tramo que la necesita se dibuja apagado. Hasta que no estén las siete no se abre ningún modo de trabajo.',
    'DIBUJA los seis aceites en los ejes de ASTM D341 y comprueba que son rectas. Fíjate en dónde empieza cada una: ése es el dato medido de su ensayo de arranque en frío, y por debajo de ahí el modelo no extrapola.',
    'COMPARA el 10W-40 con el 15W-40 y decide cuál protege más a 150 °C. El segundo tiene MENOS viscosidad a 100 °C y MÁS HTHS: el número de verano no ordena la protección.',
    'SUBE la temperatura del aceite de 20 a 130 °C con el motor a ralentí y anota dos temperaturas distintas: aquella en la que la limitadora deja de recortar y aquella en la que se enciende la luz roja. La distancia entre las dos es el margen real del motor.',
    'DEJA el régimen fijo y cambia sólo el par pedido. La presión no se entera —menos de un 2 %— y la película sí. Ése es el experimento central de la práctica.',
    'COMPARA 1 200 rpm a plena carga con 5 000 rpm a plena carga en el cojinete ampliado. Si esperabas que el cojinete sufriera más arriba, el modelo te va a contradecir: la inercia alternativa lo descarga.',
    'ENSAYA el arranque en frío con los seis aceites a −20 °C y cuenta cuántos giran el motor. Después baja a −30 °C y vuelve a contar. Busca el caso en el que el motor arranca y la bomba no ceba.',
    'MONTA «filtro obstruido» y busca la diferencia en el manómetro. No la vas a encontrar: es idéntica hasta el último dígito. Después mira el color del aceite que circula. Repite con «antirretorno estropeado» y ve al modo de arranque.',
    'CENSA los instrumentos: cuántos de los trece escenarios separa cada observación por su cuenta, qué consiguen las cinco de taller y qué hace falta añadir para llegar a los trece. Comprueba el teorema en las cuatro máquinas.',
    'RETO · Un motor averiado en secreto. Compra las observaciones que necesites —las de taller son baratas; el análisis de aceite y el plastigage, no— y entrega la FAMILIA de avería. Se te dirá si acertaste y, sobre todo, qué observación lo demostraba.',
  ],
  aplicaciones: [
    {
      area: 'Elegir el aceite de un motor para un clima concreto',
      ejemplo: 'La etiqueta de la lata trae dos números y la mayoría de la gente sólo mira el segundo. Aquí se ve por qué el primero decide si el coche arranca en enero y por qué hacen falta los DOS ensayos de invierno: un aceite que el motor de arranque puede girar y que la bomba no puede aspirar deja el motor girando en seco, que es la peor combinación posible.',
    },
    {
      area: 'Diagnóstico de presión de aceite baja en taller',
      ejemplo: 'La luz roja encendida manda al taller, y el reflejo es condenar los cojinetes. Este laboratorio enseña que hay al menos cinco causas con la misma señal —bomba, limitadora, holguras, nivel y aceite diluido— y que separarlas exige medir en frío y en caliente, a ralentí y a régimen. La aguja sola no distingue una bomba gastada de un motor gastado.',
    },
    {
      area: 'Mantenimiento por intervalos: por qué se cambia el filtro aunque «no pase nada»',
      ejemplo: 'El filtro obstruido con su derivación abierta no mueve el manómetro ni un dígito y sigue mandando el mismo caudal a las bancadas. Lo único que cambia es que el aceite llega sin filtrar. No hay ninguna señal en el cuadro, y por eso el intervalo se escribe en kilómetros y no en síntomas.',
    },
    {
      area: 'Selección de holgura de montaje en una rectificación',
      ejemplo: 'Al rectificar un cigüeñal hay que decidir la holgura de montaje, y el reflejo es «un poco más ancho por si acaso». Aquí se ve la asíntota: a excentricidad alta, más holgura casi no engorda la película y sí dispara el caudal —con el cubo—, así que se paga en presión sin ganar protección. La holgura la escribe el manual, y ahora se entiende por qué.',
    },
  ],
};

export default briefing;
