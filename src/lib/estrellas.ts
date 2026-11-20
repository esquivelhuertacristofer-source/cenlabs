// =============================================================================
// Ingeniería Avanzada: las siete prácticas estrella.
//
// Cada práctica es un paquete estático y autónomo (public/estrellas/E#/, copiado por
// `node scripts/estrellas/copiar-estrellas.mjs`). No pasa por /alumno/simulador ni por la
// tabla `intentos`: se abre en su propia pestaña y guarda su avance en el navegador.
// Por eso aquí solo está lo que el catálogo necesita para presentarlas.
//
// Los títulos y las frases salen del `index.html` y del `experiencia-datos.js` de cada
// paquete (capítulos «Portada» y «Tu misión»), dichos en llano: los lee gente no especialista.
// =============================================================================

export type Estrella = {
  /** Carpeta del paquete: E1 … E7. */
  id: string;
  titulo: string;
  /** Qué hace el alumno, en una frase. */
  frase: string;
  area: string;
  /** Archivo estático de la práctica; se abre en pestaña nueva. */
  href: string;
  /** Captura de la escena 3D de la propia práctica (16:10). */
  portada: string;
};

const estrella = (n: number, titulo: string, area: string, frase: string): Estrella => ({
  id: `E${n}`,
  titulo,
  frase,
  area,
  href: `/estrellas/E${n}/index.html`,
  portada: `/estrellas/portadas/E${n}.webp`,
});

export const ESTRELLAS: Estrella[] = [
  estrella(1, 'Mezcladora de tres silos con PLC', 'Automatización',
    'Programas el controlador que dosifica tres silos sobre una banda y demuestras con pruebas que funciona, también cuando algo falla.'),
  estrella(2, 'Robot industrial de 6 ejes', 'Robótica',
    'Compruebas con cálculo y con medición si el robot alcanza todos los puntos de trabajo de una celda, antes de que el cliente la compre.'),
  estrella(3, 'Torneado CNC: de la primera pieza a la capacidad del proceso', 'Manufactura',
    'Programas el torno, ajustas la primera pieza, mides dos lotes y decides con datos si se libera la producción.'),
  estrella(4, 'Corrección del factor de potencia y recibo de CFE', 'Energía',
    'Mides el consumo de una planta, diseñas el banco de capacitores que quita el recargo del recibo y demuestras cuánto ahorra.'),
  estrella(5, 'Motor de inducción: arranque directo, estrella-delta, arrancador suave y variador', 'Máquinas eléctricas',
    'Comparas cuatro formas de arrancar un motor y eliges con números la que no hunde la tensión de la red ni dispara la protección.'),
  estrella(6, 'Semiconductores contra su hoja de datos', 'Electrónica',
    'Mides una muestra de piezas electrónicas como lo pide su fabricante y decides si se acepta un lote de 2000.'),
  estrella(7, 'Sintonía de un lazo de temperatura con PID', 'Control',
    'Ensayas un horno industrial, ajustas su controlador de temperatura y demuestras que el ajuste nuevo es mejor y es seguro.'),
];

/** Ilustración de la ficha y del encabezado: mosaico de las siete escenas, con fondo transparente. */
export const MOSAICO_ESTRELLAS = '/estrellas/portadas/mosaico.webp';

// =============================================================================
// Formación industrial: las prácticas del catálogo de 200 que ya están construidas y validadas.
//
// Mismo tipo de paquete que las estrellas (public/estrellas/<COD>/, copiado por
// `node scripts/estrellas/copiar-practicas.mjs`, que lee ESTA lista: cada `practica('XXX-NN', …)`).
// Solo entra aquí una práctica en VERDE, con su manifiesto al día y cerrada en su ESTADO; la copia
// se niega a publicar una lista con alguna que no lo esté.
//
// Los títulos y las frases salen del `index.html`, del capítulo «Tu misión» y del manual de cada
// paquete, dichos en llano.
// =============================================================================

export type AreaIndustrial = {
  /** Prefijo del código de sus prácticas. */
  prefijo: 'ACT' | 'CTL' | 'PLC' | 'CNC' | 'ELA';
  nombre: string;
  /** Qué abarca el área, en una frase. */
  resumen: string;
};

export const AREAS_INDUSTRIALES: AreaIndustrial[] = [
  { prefijo: 'ACT', nombre: 'Actuadores', resumen: 'Cilindros de aire y de aceite, arranque de motores, variadores, servos y motores a pasos.' },
  { prefijo: 'CTL', nombre: 'Controladores', resumen: 'Lazos de presión, nivel, temperatura y velocidad: medir, sintonizar y defender el ajuste.' },
  { prefijo: 'PLC', nombre: 'PLC', resumen: 'Programar, probar y poner en servicio controladores lógicos, redes y paneles de operador.' },
  { prefijo: 'CNC', nombre: 'CNC', resumen: 'Preparar el torno y el centro de maquinado, escribir el código y comprobar la pieza.' },
  { prefijo: 'ELA', nombre: 'Electrónica avanzada', resumen: 'Acondicionar la señal de un sensor hasta que el instrumento diga la verdad.' },
];

export type PracticaIndustrial = {
  /** Código del catálogo de 200 y carpeta del paquete: ACT-01, PLC-20… */
  id: string;
  titulo: string;
  /** Qué hace el alumno, en una frase. */
  frase: string;
  area: string;
  /** Archivo estático de la práctica; se abre en pestaña nueva. */
  href: string;
  /** Captura de la escena 3D de la propia práctica (16:10). */
  portada: string;
};

const NOMBRE_AREA = Object.fromEntries(AREAS_INDUSTRIALES.map((a) => [a.prefijo, a.nombre])) as Record<string, string>;

const practica = (id: string, titulo: string, frase: string): PracticaIndustrial => ({
  id,
  titulo,
  frase,
  area: NOMBRE_AREA[id.slice(0, 3)],
  href: `/estrellas/${id}/index.html`,
  portada: `/estrellas/portadas/${id}.webp`,
});

export const PRACTICAS_INDUSTRIALES: PracticaIndustrial[] = [
  // ── Actuadores ──
  practica('ACT-01', 'Circuito neumático de una marcadora',
    'Armas con mangueras el circuito de aire que mueve el cilindro de una marcadora, lo pruebas simulado entero y ajustas el tiempo de su carrera lenta.'),
  practica('ACT-02', 'Fuerza de un cilindro de aire para sujetar una pieza',
    'Calculas cuánta fuerza hace falta para que la pieza no resbale, eliges el cilindro y la presión, y revisas qué pasa si cae la red de aire.'),
  practica('ACT-03', 'Estación de taladrado con cilindros y PLC',
    'Programas por pasos la estación que sujeta, taladra y expulsa la pieza, y ensayas qué pasa cuando un sensor se pierde o se queda pegado.'),
  practica('ACT-04', 'Cilindros de simple y doble efecto',
    'Subes la presión, calculas cuánta fuerza da cada cilindro, armas su mando con mangueras y predices qué pasa si cruzas una manguera.'),
  practica('ACT-05', 'Velocidad de un cilindro neumático',
    'Cronometras la carrera de un cilindro, calculas a cuánto abrir el regulador de caudal y ves qué pasa cuando la carga frena o empuja.'),
  practica('ACT-06', 'Motor y cilindro hidráulicos con una sola bomba',
    'Programas un PLC para que un motor y un cilindro hidráulicos hagan sus ciclos con la misma bomba y ajustas la válvula que da prioridad al motor.'),
  practica('ACT-07', 'Unidad hidráulica: presión, caudal y potencia',
    'Subes la presión por pasos, mides caudal y par, calculas eficiencias y decides si la bomba se cambia y qué motor le hace falta.'),
  practica('ACT-08', 'Arranque directo e inversión de giro de un motor',
    'Arrancas directo un motor de 25 hp, mides cuánto jala de la red, eliges sus protecciones con la NOM-001-SEDE e inviertes su giro.'),
  practica('ACT-09', 'Arranque estrella-triángulo',
    'Arrancas un motor de 25 hp en estrella, eliges el momento justo para pasarlo a triángulo y calculas el pico de corriente del cambio.'),
  practica('ACT-10', 'Arrancador suave',
    'Arrancas un motor de 25 hp con un arrancador suave en una red débil y entregas un ajuste que no hunde la tensión de la planta.'),
  practica('ACT-12', 'Puesta en marcha de un variador de frecuencia',
    'Capturas la placa del motor en el variador, eliges cómo arranca tu carga y fijas los límites para que el motor gire a la velocidad pedida.'),
  practica('ACT-13', 'Curva par-velocidad del motor de inducción',
    'Cargas un motor de 25 hp con un dinamómetro, mides deslizamiento y rendimiento, y calculas su curva para cruzarla con la de tu carga.'),
  practica('ACT-14', 'Ahorro de energía con variador en una bomba',
    'Comparas dar menos agua cerrando una válvula o bajando la velocidad de la bomba, y decides si el variador se paga en menos de tres años.'),
  practica('ACT-15', 'Servomotor y eje posicionado con PLC',
    'Mueves un eje con servomotor, calculas lo que le cuesta al motor cada ciclo, lo referencias con una leva y programas una secuencia que aguanta interrupciones.'),
  practica('ACT-16', 'Sintonía de un servo de posición',
    'Mides un servo, calculas las ganancias de su controlador, las ensayas en el servo real y pasas a un control de dos lazos que la carga no mueve.'),
  practica('ACT-17', 'Motor a pasos',
    'Das pulsos a un motor a pasos, mides cómo cae su fuerza con la velocidad y diseñas una rampa que mueve la carga sin perder ni un paso.'),
  practica('ACT-18', 'Motor de corriente directa: modelo y respuesta',
    'Sacas con tres ensayos los números que describen un motor de corriente directa y compruebas con ellos cómo responde a un escalón de tensión.'),
  practica('ACT-19', 'Motor y reductor para una banda transportadora',
    'Calculas la fuerza y el par que pide una banda en cada tramo de su ciclo y escoges del catálogo el motor y el reductor más pequeños que aguantan.'),
  // ── Controladores ──
  practica('CTL-01', 'Medición en un lazo de presión',
    'Revisas el lazo de presión de un tanque de aire: etiquetas los instrumentos, mides el lazo de 4 a 20 mA y calibras el transmisor.'),
  practica('CTL-02', 'Control P, PI y PID de presión',
    'Pruebas el control proporcional, el PI y el PID sobre un tanque de aire y entregas una sintonía que mantiene la presión aunque cambie el consumo.'),
  practica('CTL-04', 'Control de dos posiciones de un compresor',
    'Ajustas la banda del presostato de un compresor y mides cuánto varía la presión del tanque y cuántas veces arranca el motor.'),
  practica('CTL-05', 'Identificación de una planta de dos tanques',
    'Das un escalón a la bomba de dos tanques, sacas un modelo de tres números del registro de nivel y decides cuánto confiar en él.'),
  practica('CTL-06', 'Sintonía de un controlador PI con reglas',
    'Ajustas el controlador de un calentador de agua con cinco recetas conocidas y entregas la sintonía que cumple el criterio de tu instalación.'),
  practica('CTL-07', 'Saturación del controlador y anti-windup',
    'Ves qué le pasa a un controlador con integral cuando la potencia de una estufa llega a su tope y eliges la protección que cumple tu criterio.'),
  practica('CTL-08', 'Prealimentación en un calentador con vapor',
    'Mides el flujo de agua que entra al calentador y mueves la válvula de vapor antes de que la temperatura se desvíe.'),
  practica('CTL-10', 'Control de nivel de un tanque',
    'Averiguas midiendo cómo sale el agua de tu tanque, sintonizas el control de nivel de dos maneras y entregas la que conviene al proceso.'),
  practica('CTL-11', 'Dos lazos que se estorban: caudal y temperatura',
    'Mides cuánto se estorban los lazos de caudal y temperatura de una mezcla, eliges qué válvula controla qué y corriges la interacción.'),
  practica('CTL-12', 'Control en cascada de un intercambiador de calor',
    'Comparas un lazo de temperatura solo con una cascada que vigila el caudal de vapor, y sintonizas los dos lazos en orden.'),
  practica('CTL-13', 'Control de relación: dos líquidos en proporción',
    'Calibras la estación de relación de una mezcla y pruebas dos esquemas para que el líquido adicional siga siempre al principal.'),
  practica('CTL-15', 'Respuesta en frecuencia de un servo',
    'Inyectas senos a un servo con acople elástico, trazas su diagrama de Bode y lees sus márgenes de fase y de ganancia.'),
  practica('CTL-16', 'Control digital: muestreo y discretización',
    'Descubres la frecuencia real de una señal mal muestreada y eliges con números el periodo y el método digital que conservan el margen de fase.'),
  practica('CTL-17', 'Lazo de velocidad de un motor de corriente directa',
    'Mides la inercia de lo que gira, diseñas el PI de velocidad de un motor con tope de corriente y lo pruebas con carga.'),
  practica('CTL-18', 'Instrumentos de un proceso con ISA 5.1',
    'Pones su etiqueta a cada instrumento de una planta con vapor, unes sus señales y lees lo que dicen sus transmisores.'),
  // ── PLC ──
  practica('PLC-01', 'Prueba punto por punto de un tablero con PLC',
    'Pruebas cada entrada y salida de un tablero con un S7-1200 antes de entregarlo y anotas cuáles fallan y por qué.'),
  practica('PLC-02', 'Puerta de garaje con PLC',
    'Programas una puerta de garaje con fotocelda, reversa, cierre automático y aviso de mantenimiento, y la pruebas con lo que sale mal.'),
  practica('PLC-03', 'Banda clasificadora con PLC',
    'Programas la banda que distingue piezas metálicas y de plástico, expulsa a tiempo la clase que se rechaza y cuenta cada pieza en su caja.'),
  practica('PLC-08', 'Forzados en el PLC: diagnóstico y retirada',
    'Averiguas qué dejó forzado otro técnico en una estación de empaque, qué esconde cada forzado y cómo quitarlos sin poner a nadie en riesgo.'),
  practica('PLC-10', 'Semáforo de un crucero con GRAFCET',
    'Mides tu cruce, calculas el ámbar y el todo rojo, y programas en GRAFCET un semáforo con paso peatonal que nunca da dos verdes cruzados.'),
  practica('PLC-11', 'Dosificadora por peso en texto estructurado',
    'Escribes en texto estructurado el programa de una dosificadora de tres tolvas, con receta, vuelo compensado y atención de fallas.'),
  practica('PLC-12', 'Panel de operador de una estación de bombeo',
    'Configuras el panel de una estación de bombeo: etiquetas, pantalla, alarmas, permisos, tendencia y qué pasa si se cae la comunicación.'),
  practica('PLC-13', 'Comunicación entre dos PLC',
    'Enlazas el PLC de una estación de bombeo con su tablero de supervisión y haces que un cable cortado no deje la bomba mandada por un dato viejo.'),
  practica('PLC-14', 'Puesta en servicio de una red PROFINET',
    'Pones en servicio una red con controlador, periferia, variador y panel, das a cada equipo su nombre y lees qué falla cuando algo se cae.'),
  practica('PLC-15', 'Datos del PLC a la supervisión con OPC UA',
    'Enciendes y proteges el servidor OPC UA de un S7-1200, eliges qué publica y configuras el cliente del SCADA para que no se pierda una alarma.'),
  practica('PLC-18', 'Control PID de un horno en el PLC',
    'Configuras el bloque PID_Compact de un S7-1200 para que un horno llegue a su temperatura y la mantenga, y lo pruebas en el banco.'),
  practica('PLC-20', 'Horómetro de un motor en el PLC',
    'Programas el horómetro de una bomba: horas, arranques y fallas con su hora, sin perder la cuenta en un corte de luz.'),
  // ── CNC ──
  practica('CNC-01', 'Preparación del torno: cero de pieza y herramientas',
    'Preparas un torno CNC para correr un programa ya escrito: fijas el cero de tu barra y la medida de cada herramienta.'),
  practica('CNC-03', 'Coordenadas absolutas e incrementales en el torno',
    'Dices la misma trayectoria de una pieza de seis tramos con absolutas, con incrementales y mezcladas, y mides cuánto error se junta al redondear.'),
  practica('CNC-04', 'Del CAM al código: posprocesar y comparar',
    'Traduces la ruta de un CAM al código del torno, ajustas el posprocesador y descubres qué defecto tiene cada salida antes de correrla.'),
  practica('CNC-06', 'Roscado en el torno con G76 y G92',
    'Calculas una rosca métrica, la cortas con el ciclo G76 y pasada por pasada con G92, y mides con el calibre de flancos la que quedó.'),
  practica('CNC-16', 'Subprogramas y patrones de barrenos',
    'Barrenas una placa con rejilla y círculo de pernos usando subprogramas, corriges un programa de fábrica y mides dónde cayó cada barreno.'),
  // ── Electrónica avanzada ──
  practica('ELA-02', 'Báscula con galgas en puente',
    'Armas una báscula con galgas, puente de Wheatstone y amplificador de instrumentación, la calibras en kilogramos y compruebas que el calor no la engañe.'),
];

/** Todas las prácticas del hub de Ingeniería Avanzada: las siete estrellas y las de formación industrial. */
export const TOTAL_PRACTICAS_HUB = ESTRELLAS.length + PRACTICAS_INDUSTRIALES.length;
