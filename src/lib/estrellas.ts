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
  prefijo: 'ACT' | 'CTL' | 'PLC' | 'CNC' | 'ELA' | 'SEM' | 'ING' | 'CAP' | 'MAN';
  nombre: string;
  /** Qué abarca el área, en una frase. */
  resumen: string;
};

export const AREAS_INDUSTRIALES: AreaIndustrial[] = [
  { prefijo: 'ACT', nombre: 'Actuadores', resumen: 'Cilindros de aire y de aceite, arranque de motores, variadores, servos y motores a pasos.' },
  { prefijo: 'CTL', nombre: 'Controladores', resumen: 'Lazos de presión, nivel, temperatura y velocidad: medir, sintonizar y defender el ajuste.' },
  { prefijo: 'PLC', nombre: 'PLC', resumen: 'Programar, probar y poner en servicio controladores lógicos, redes y paneles de operador.' },
  { prefijo: 'CNC', nombre: 'CNC', resumen: 'Preparar el torno y el centro de maquinado, escribir el código y comprobar la pieza.' },
  { prefijo: 'ELA', nombre: 'Electrónica avanzada', resumen: 'Acondicionar señales, convertidores de potencia, microcontroladores, lógica programable y tarjetas impresas.' },
  { prefijo: 'SEM', nombre: 'Semiconductores', resumen: 'Medir dispositivos contra su hoja de datos y entender cómo se fabrican y se prueban los chips.' },
  { prefijo: 'ING', nombre: 'Robótica e integración', resumen: 'Marcos, cinemática, trayectorias, seguridad e integración de robots industriales y móviles en una celda.' },
  { prefijo: 'CAP', nombre: 'Capacitores', resumen: 'Caracterizar, dimensionar y diagnosticar capacitores, desde un circuito RC hasta un banco de planta.' },
  { prefijo: 'MAN', nombre: 'Manufactura', resumen: 'Medir con instrumentos, controlar procesos con estadística y calcular procesos de conformado y unión.' },
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
  practica('PLC-09', 'Control de acceso de un estacionamiento',
    'Programas la pluma de un estacionamiento con sus sensores, cuentas los lugares libres y detectas por el bit cuando un fin de carrera miente.'),
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
  practica('PLC-17', 'Mando de un variador desde el PLC',
    'Mandas un variador desde el PLC con sus palabras de control y de estado: arrancas, cambias la velocidad y atiendes sus fallas.'),
  practica('PLC-18', 'Control PID de un horno en el PLC',
    'Configuras el bloque PID_Compact de un S7-1200 para que un horno llegue a su temperatura y la mantenga, y lo pruebas en el banco.'),
  practica('PLC-19', 'Gemelo digital antes de la puesta en marcha',
    'Pruebas el programa del PLC contra un gemelo digital de la máquina, ajustas dónde frena cada eje y lo dejas listo antes de tocar la real.'),
  practica('PLC-20', 'Horómetro de un motor en el PLC',
    'Programas el horómetro de una bomba: horas, arranques y fallas con su hora, sin perder la cuenta en un corte de luz.'),
  // ── CNC ──
  practica('CNC-01', 'Preparación del torno: cero de pieza y herramientas',
    'Preparas un torno CNC para correr un programa ya escrito: fijas el cero de tu barra y la medida de cada herramienta.'),
  practica('CNC-03', 'Coordenadas absolutas e incrementales en el torno',
    'Dices la misma trayectoria de una pieza de seis tramos con absolutas, con incrementales y mezcladas, y mides cuánto error se junta al redondear.'),
  practica('CNC-04', 'Del CAM al código: posprocesar y comparar',
    'Traduces la ruta de un CAM al código del torno, ajustas el posprocesador y descubres qué defecto tiene cada salida antes de correrla.'),
  practica('CNC-05', 'Ciclos fijos de desbaste en el torno',
    'Desbastas una pieza con un ciclo fijo que repite las pasadas, eliges la profundidad y el sobrematerial y compruebas que no toque el perfil final.'),
  practica('CNC-06', 'Roscado en el torno con G76 y G92',
    'Calculas una rosca métrica, la cortas con el ciclo G76 y pasada por pasada con G92, y mides con el calibre de flancos la que quedó.'),
  practica('CNC-07', 'Compensación del radio de la fresa',
    'Programas un contorno con compensación de radio, eliges el lado correcto y ves qué pasa si la fresa real no es la que declaraste.'),
  practica('CNC-08', 'Cero de pieza en el centro de maquinado',
    'Fijas el cero de pieza G54 en un centro de maquinado, pruebas el programa en vacío y arrancas la primera pieza sin chocar.'),
  practica('CNC-09', 'Taladrado y machueleado con ciclos fijos',
    'Eliges el ciclo de cada barreno, calculas las picadas y el avance de la rosca y ves qué les pasa a la viruta y al machuelo si te equivocas.'),
  practica('CNC-10', 'Cajeras y contornos en el centro de maquinado',
    'Fresas una cajera y un contorno, decides cuánto morder según el material y compruebas que la pieza quede en medida.'),
  practica('CNC-11', 'Velocidad de corte, avance y remoción de material',
    'Calculas las revoluciones, el avance y el material removido de cada herramienta, y compruebas que la máquina tenga potencia para el corte.'),
  practica('CNC-14', 'Primera pieza y liberación del lote',
    'Corres la primera pieza con precaución, la mides, corriges los desgastes y decides con datos si se libera el lote.'),
  practica('CNC-16', 'Subprogramas y patrones de barrenos',
    'Barrenas una placa con rejilla y círculo de pernos usando subprogramas, corriges un programa de fábrica y mides dónde cayó cada barreno.'),
  practica('CNC-18', 'Compensación del radio de la punta en el torno',
    'Torneas conos y radios con y sin compensación de la punta, mides el error que deja una punta redonda y lo corriges.'),
  // ── Electrónica avanzada ──
  practica('ELA-01', 'Medir con el osciloscopio sin engañarte',
    'Ajustas la punta ×10, eliges acoplamiento, escala y disparo, y descubres cuándo el osciloscopio muestra algo que la señal no tiene.'),
  practica('ELA-02', 'Báscula con galgas en puente',
    'Armas una báscula con galgas, puente de Wheatstone y amplificador de instrumentación, la calibras en kilogramos y compruebas que el calor no la engañe.'),
  practica('ELA-03', 'Amplificador de dos etapas: seguir la señal y reparar',
    'Sigues una señal de 1 kHz por un amplificador de dos etapas, ves hasta dónde llega sin deformarse y encuentras el componente dañado.'),
  practica('ELA-04', 'Filtros activos de segundo orden',
    'Diseñas un filtro activo, lo armas con piezas reales, ves cómo lo deforma el amplificador y cuentas cuántos de 200 salen buenos.'),
  practica('ELA-05', 'Convertidor reductor (buck)',
    'Armas un convertidor reductor que da los voltios pedidos, mides el rizo de su corriente, ves qué pasa con poca carga y cuentas sus pérdidas.'),
  practica('ELA-06', 'Convertidor elevador (boost)',
    'Calculas, armas y mides un elevador de voltaje: cuánto sube, hasta dónde, cuándo se corta la corriente y dónde se pierde la energía.'),
  practica('ELA-07', 'Convertidor buck-boost',
    'Armas un convertidor que baja o sube el voltaje, eliges el diodo y el inductor y compruebas qué esfuerzo aguantan sus piezas.'),
  practica('ELA-08', 'Encendido y apagado de un transistor con PWM',
    'Mides cómo enciende y apaga un transistor de potencia, encuentras la meseta de la compuerta y calculas cuánta energía se pierde en cada cambio.'),
  practica('ELA-09', 'Inversor monofásico',
    'Diseñas un inversor que da la tensión alterna pedida sin el armónico prohibido y sin destruir el puente de transistores.'),
  practica('ELA-10', 'Inversor con PWM senoidal',
    'Ajustas la modulación de un inversor para que dé la tensión de tu hoja con una onda limpia, y mides sus armónicos.'),
  practica('ELA-11', 'Rectificador controlado trifásico',
    'Ajustas el ángulo de disparo de un rectificador trifásico para alimentar un motor y ves hasta dónde puede devolver energía a la red.'),
  practica('ELA-12', 'Leer un sensor con el ADC del microcontrolador',
    'Configuras el convertidor analógico-digital para leer un sensor con la resolución pedida, sin saturarlo y sin alias.'),
  practica('ELA-13', 'PWM de un microcontrolador para un motor de CD',
    'Eliges el temporizador, la frecuencia y el límite de corriente para que un motor de CD llegue a su velocidad sin silbar.'),
  practica('ELA-14', 'Sensor por I²C y lectura de tramas',
    'Haces que un sensor conteste por I²C, compruebas que el bus aguante y conviertes sus bytes en grados.'),
  practica('ELA-15', 'Convertidor sigma-delta',
    'Ajustas el sobremuestreo y el filtro de un convertidor sigma-delta para que cumpla la calidad pedida sin saturarse.'),
  practica('ELA-16', 'Interrupciones y tiempo real en un microcontrolador',
    'Ordenas prioridades e interrupciones para que ningún evento se pierda y cada uno se atienda a tiempo.'),
  practica('ELA-17', 'Contador y máquina de estados en una FPGA',
    'Describes en VHDL un contador, un antirrebote y una máquina de estados, y compruebas que cumplen sus tiempos.'),
  practica('ELA-18', 'Diseño de una tarjeta de circuito impreso',
    'Eliges el ancho y la separación de las pistas, la línea y el capacitor de desacoplo para que la tarjeta pase cuatro pruebas de diseño.'),
  // ── Semiconductores ──
  practica('SEM-02', 'El diodo y su curva real',
    'Mides un diodo con una fuente-medidor, sacas los números de su curva, ves cómo lo mueve el calor y decides si sirve para una aplicación.'),
  practica('SEM-03', 'Curvas de un transistor bipolar',
    'Trazas las curvas de un transistor, mides su ganancia y su calentamiento, y eliges un punto de trabajo que no lo queme.'),
  practica('SEM-04', 'Curvas de un MOSFET y su punto de temperatura cero',
    'Mides un MOSFET con pulsos y una placa caliente, ves cómo el calor mueve sus curvas, encuentras el punto ZTC y decides si sirve.'),
  practica('SEM-05', 'IGBT: caída de tensión y calor',
    'Mides la rodilla y la caída de un IGBT a varias temperaturas, ves cómo se calienta al medirlo y decides si cumple su hoja de datos.'),
  practica('SEM-06', 'Diodos de una fuente rectificada con filtro',
    'Mides el pulso de corriente, la resistencia del capacitor y el calor de los diodos de una fuente, y eliges las piezas que sí aguantan.'),
  practica('SEM-07', 'Diodo Zener como regulador',
    'Mides un Zener real, ves hacia dónde lo corre el calor, cuidas que no se queme y decides si sirve como regulador.'),
  practica('SEM-08', 'Polarización y ganancia de un amplificador con transistor',
    'Cambias de pieza y de temperatura, mides cuánto se mueven el voltaje de colector y la ganancia, y eliges el circuito que cumple.'),
  practica('SEM-09', 'Mando de compuerta de un MOSFET de potencia',
    'Eliges cómo encender y apagar un MOSFET de potencia para que sea rápido, no rebote y no encienda por error a su pareja.'),
  practica('SEM-10', 'SCR y TRIAC: regular cargas de corriente alterna',
    'Enciendes y regulas cargas con un SCR y un TRIAC, y diseñas la red RC para que el TRIAC no se quede pegado con una bobina.'),
  practica('SEM-11', 'Optoacoplador: transferencia, retardo y aislamiento',
    'Mides cuánta corriente pasa por un optoacoplador, cómo se pierde con el calor y las horas, cuánto tarda en apagar, y pruebas su aislamiento.'),
  practica('SEM-12', 'Pérdidas de un MOSFET y su disipador',
    'Mides cuánto sube la resistencia con el calor, sigues el calor capa por capa y eliges el montaje que aguanta el día más caliente.'),
  practica('SEM-13', 'Prueba de producción de una oblea',
    'Lees la hoja, tocas los chips con la aguja, fijas los límites de prueba y corres la oblea hasta ver su mapa de buenos y malos.'),
  practica('SEM-14', 'Rendimiento por defectos y pedido de obleas',
    'Cuentas defectos y chips buenos, ajustas cuatro modelos de rendimiento, predices un chip más grande y calculas cuántas obleas pedir.'),
  practica('SEM-16', 'Curva C-V de un capacitor MOS',
    'Lees la curva capacitancia-voltaje de un capacitor MOS, sacas de ella el óxido, el dopaje y la carga, y decides si el capacitor sirve.'),
  practica('SEM-17', 'Oxidación térmica del silicio',
    'Oxidas obleas en el horno, mides el óxido con dos instrumentos y diseñas la receta para el espesor pedido.'),
  practica('SEM-18', 'Difusión e implantación de dopantes',
    'Mides perfiles de dopante, sacas los dos números que describen al horno de difusión y diseñas el proceso para la unión pedida.'),
  practica('SEM-19', 'Fotolitografía por contacto',
    'Ajustas la dosis de exposición y el revelado, mides el ancho de las líneas y encuentras la ventana de proceso que respeta el diseño.'),
  practica('SEM-20', 'Dibujo de un inversor CMOS con reglas de diseño',
    'Ajustas a tus reglas el dibujo de un inversor CMOS hecho para otro proceso, hasta dejar la revisión de reglas en cero y el circuito idéntico.'),
  // ── Robótica e integración ──
  practica('ING-01', 'Marcos de referencia del robot',
    'Llevas el robot hasta una pieza que solo ve la cámara, encadenando marcos sin equivocarte de orden, de signo ni de unidad.'),
  practica('ING-03', 'Cinemática inversa de un brazo',
    'Eliges la postura correcta del brazo, compruebas que llega al punto y lo mueves sin que el controlador lo pare.'),
  practica('ING-04', 'Calibración de la herramienta y la mesa del robot',
    'Calibras la punta de una herramienta y el marco de la mesa, y decides cuándo creerle al controlador.'),
  practica('ING-05', 'Tomar piezas de una banda en movimiento',
    'Bajas el robot justo sobre una pieza que avanza por la banda, la sujetas y la llevas a su caja.'),
  practica('ING-06', 'Movimiento articular y lineal del robot',
    'Eliges la instrucción de movimiento de cada tramo, mides cuánto tarda en tu celda y ves qué pasa si eliges mal.'),
  practica('ING-07', 'Planeación de trayectorias del robot',
    'Planeas cómo arranca, viaja y llega cada eje, y compruebas tiempos, velocidades y aceleraciones contra los límites del robot.'),
  practica('ING-08', 'Carga útil del robot',
    'Mides la masa y el centro de gravedad de la herramienta con su pieza y se los declaras bien al controlador.'),
  practica('ING-09', 'Puesta en marcha de una celda robotizada',
    'Dejas una celda lista para producir: intentas arrancar, lees el registro de eventos, corriges y mides el ciclo en automático.'),
  practica('ING-10', 'Interrupciones del robot por señal o temporizador',
    'Programas al robot para atender avisos externos sin perder ninguno, atendiendo cada uno una sola vez y sin llenar la fila.'),
  practica('ING-11', 'Protección de una celda robotizada',
    'Eliges y colocas barreras de luz, tapetes y puertas en una celda, calculas sus distancias de seguridad y compruebas que el robot pare a tiempo.'),
  practica('ING-12', 'Velocidades del brazo y singularidades',
    'Calculas cómo se mueve la punta cuando giran los ejes y encuentras dónde el brazo pierde una dirección de movimiento.'),
  practica('ING-13', 'Visión artificial para el robot',
    'Calibras la cámara, localizas las piezas en la imagen y le pasas al robot dónde tomarlas.'),
  practica('ING-14', 'Ruta de un robot móvil en planta',
    'Planeas con A* la ruta de un robot móvil entre los obstáculos de la planta y compruebas que sea corta y segura.'),
  practica('ING-15', 'Paletizado: acomodo de cajas en la tarima',
    'Diseñas el acomodo de las cajas en una tarima, cuidas el peso y la estabilidad y programas el orden en que el robot las coloca.'),
  practica('ING-16', 'Cordón continuo con un robot',
    'Programas un cordón parejo sobre un contorno con esquina y arcos, ajustando la velocidad para que no salga más ancho en las curvas.'),
  practica('ING-17', 'Gemelo digital de una celda de envasado',
    'Construyes un gemelo digital de la celda, compruebas que se parece a la planta y lo usas para decidir qué cambio sube la producción.'),
  practica('ING-18', 'Anclaje de un robot al piso',
    'Calculas las fuerzas y los momentos en la base del robot, incluido un paro de emergencia, y eliges las anclas que aguantan.'),
  // ── Capacitores ──
  practica('CAP-01', 'Carga y descarga de un capacitor',
    'Mides la constante de tiempo de un circuito RC, sacas la capacitancia de la curva y descubres cuánta corriente le roba el instrumento.'),
  practica('CAP-02', 'Energía guardada y descarga segura',
    'Mides un capacitor real de dos maneras, sacas su resistencia interna y diseñas el resistor que lo descarga hasta un voltaje seguro.'),
  practica('CAP-03', 'Capacitor conmutado',
    'Mides el resistor equivalente de un capacitor conmutado, ves cuándo deja de comportarse como resistor y diseñas un filtro con el reloj.'),
  practica('CAP-04', 'Capacitor de filtro de una fuente',
    'Dimensionas el capacitor de filtro de una fuente ya armada para que el rizo y el calor de sus piezas queden dentro de su hoja.'),
  practica('CAP-05', 'Capacitor de salida de un convertidor',
    'Eliges el capacitor de salida de un convertidor para cumplir el rizo y la corriente que pide, sin pasarte de su hoja de datos.'),
  practica('CAP-07', 'Banco automático de capacitores por pasos',
    'Ajustas el regulador de un banco de capacitores para que siga la carga de la planta sin oscilar y sin dejar recargo.'),
  practica('CAP-09', 'Motor monofásico con capacitor',
    'Mides el arranque de un motor monofásico, eliges su capacitor y ves qué pasa si el interruptor centrífugo se queda pegado.'),
  practica('CAP-10', 'Potencia activa, reactiva y aparente',
    'Mides una resistencia, una bobina, un capacitor y un motor, sumas sus potencias y decides si la instalación cabe en su interruptor.'),
  practica('CAP-11', 'Desfase y reactancia de un capacitor en CA',
    'Mides el adelanto del voltaje en un circuito RC, sacas la reactancia y la capacitancia, y decides si el capacitor cumple su tolerancia.'),
  practica('CAP-14', 'Resonancia en una red de capacitores',
    'Mides dos capacitores, los pones en paralelo, encuentras el pico de impedancia que forman y lo amortiguas.'),
  // ── Manufactura ──
  practica('MAN-01', 'Del plano a la ruta de fabricación',
    'Eliges cómo desbastar y acabar una espiga en el torno, compruebas tu plan con un corte de prueba y armas la hoja de ruta de un lote.'),
  practica('MAN-04', 'Estudio R&R del sistema de medición',
    'Mides diez piezas con tres operadores, separas de dónde sale la variación y decides si el sistema de medición sirve.'),
  practica('MAN-05', 'Medición con máquina de coordenadas',
    'Calificas el palpador, alineas la pieza, ajustas un círculo, un plano y un cilindro a los puntos palpados y decides si la pieza cumple.'),
  practica('MAN-06', 'Cartas de control de medias y rangos',
    'Con 25 subgrupos de lecturas sacas los límites de control, quitas lo que tiene causa conocida y decides si el proceso está en control.'),
  practica('MAN-07', 'Capacidad de proceso: Cp y Cpk',
    'Compruebas primero que el proceso es estable, luego decides si cumple su tolerancia y, si no, si hay que centrarlo o reducir su variación.'),
  practica('MAN-08', 'Cartas de control por atributos',
    'Con 25 lotes armas la carta de defectuosos o de defectos, sacas sus límites, depuras y decides si el proceso está en control.'),
  practica('MAN-09', 'Muestreo de aceptación',
    'Diseñas el plan de muestreo para los lotes de un proveedor, calculas sus riesgos con la curva característica y decides si se aceptan.'),
  practica('MAN-10', 'Análisis de modo y efecto de falla (AMEF)',
    'Conviertes la evidencia del proceso en severidad, ocurrencia y detección, calculas el número de prioridad y decides qué atacar primero.'),
  practica('MAN-13', 'Doblado de lámina',
    'Calculas cuánta lámina plana hace falta, cuánto se abre la pieza al soltarla, qué fuerza pide la prensa y a qué ángulo doblar.'),
  practica('MAN-14', 'Fundición: mazarota y sistema de llenado',
    'Calculas el módulo de una barra de aluminio, dimensionas su mazarota y su sistema de llenado, la cuelas y la cortas para buscar el rechupe.'),
];

/** Todas las prácticas del hub de Ingeniería Avanzada: las siete estrellas y las de formación industrial. */
export const TOTAL_PRACTICAS_HUB = ESTRELLAS.length + PRACTICAS_INDUSTRIALES.length;
