/* Ficha técnica · Carga bidireccional V2G/V2H — contenido específico del lab */
fichaTecnica({
  title: 'Carga bidireccional V2G/V2H: el coche como batería de la casa',
  intro: 'Este laboratorio muestra una <b>casa en corte</b> con su garaje, un <b>coche eléctrico de cristal</b> con la batería a la vista, un <b>cargador de pedestal</b> que funciona en los dos sentidos, el <b>medidor</b>, el poste de la red y un <b>semáforo de tarifa</b> (verde: valle, amarillo: intermedia, rojo: punta). Del enchufe de las 17:00 a las 07:00 decides en qué horas el coche carga y en cuáles le devuelve energía a la casa (V2H) o, si lo permites, a la red (V2G). La casa gasta según un perfil por horas; el coche debe salir con la reserva del trayecto de mañana; y cada kWh devuelto gasta un poco la batería. Todo sale de ecuaciones calculadas y verificadas: es un modelo para razonar, no el contrato de un cliente ni la garantía de un fabricante.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> el <b>inversor bidireccional</b> con pérdida P<sub>perd</sub> = P<sub>n</sub>·(a + b·p + c·p²), p = P/P<sub>n</sub>, con P<sub>n</sub> = 7,4 kW, a = 1,0 %, b = 1,5 % y c = 3,0 %: rendimiento de descarga η = P/(P + P<sub>perd</sub>) y de carga η = 1 − P<sub>perd</sub>/P, y sus inversas cerradas (de la potencia de continua a la de alterna); el <b>consumo en espera</b> de 0,02 kW cuando no se carga ni se devuelve; la <b>batería</b> de 96 celdas con V<sub>oc</sub> = 96·(3,35 + 0,75·s), resistencia R = 0,10 Ω, corriente de R·I² ± V<sub>oc</sub>·I = P y <b>carga que se frena</b> desde el 88 % hasta el tope del 90 %; el <b>límite de la red</b> (potencia contratada: al cargar, casa + coche no pasa de ese valor), el <b>límite del cargador</b> (7,4 kW) y el <b>piso</b> de descarga que eliges; la <b>tarifa por hora</b> en tres niveles (con dos tarifas, A y B), el <b>perfil de la casa</b> (tres casas con sus jorobas de mañana y noche), el <b>precio de venta</b> a la red si activas «Casa y red»; el <b>desgaste</b> D = Σ F<sub>1</sub>·(E<sub>química</sub>/E<sub>cap</sub>)·φ(s), con F<sub>1</sub> = 0,010 % por ciclo equivalente y φ(s) = 1 + 4·(1 − s)², sólo sobre la energía devuelta, valorado con un paquete de 2 500 $/kWh que se da por agotado al perder el 20 %; y el <b>balance de energía</b> de toda la noche. En el dibujo: el nivel y el color de la carga de la batería, los puntos que corren por los cables según la potencia y el sentido, el disco del medidor, el semáforo y las gráficas de potencias, batería y dinero.',
    omitidos: [
      '<b>Mapa real del inversor</b>: la curva de pérdidas es un polinomio de segundo grado con tres coeficientes didácticos. Un inversor real cambia con la tensión, la temperatura y la frecuencia de conmutación, y sus pérdidas no son tan suaves.',
      '<b>Batería real</b>: V<sub>oc</sub> lineal con la carga, resistencia fija, sin temperatura, sin histéresis ni envejecimiento propio. La capacidad no cambia en la noche.',
      '<b>Degradación real</b>: el modelo de desgaste es una regla simple y declarada (ciclos equivalentes por una profundidad que pesa más abajo). No separa envejecimiento por calendario, por temperatura ni por alta corriente, que en una celda real mandan tanto como la energía.',
      '<b>Red y mercado reales</b>: la tarifa es una tabla por horas y el precio de venta es un número fijo. No hay impuestos, cargos fijos, medición neta, límites de exportación ni reglas de la distribuidora.',
      '<b>Una sola noche</b>: el día siguiente no se simula; la reserva es un porcentaje que pides, no un cálculo de trayecto, clima o tráfico.'
    ]
  },
  s2: {
    title: 'Parámetros del modelo y cifras de referencia',
    warn: 'Valores didácticos de un coche mediano y una casa promedio. Un equipo real tiene otras curvas, otras tarifas y otras condiciones de garantía.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Inversor', 'P<sub>n</sub> = 7,4 kW', 'a = 1,0 % · b = 1,5 % · c = 3,0 % · mínimo 0,35 kW · espera 0,02 kW'],
      ['Rendimiento de descarga', 'según la potencia', '85,8 % a 0,5 kW · 91,5 % a 1 kW · 95,1 % a 3 kW · 94,8 % a 7,4 kW (el máximo, 95,3 %, queda en p = √(a/c) ≈ 0,58)'],
      ['Ida y vuelta completa', 'cargador + batería + batería + inversor', '90,0 % a 4 kW con la batería al 60 % · 82,9 % a 1 kW'],
      ['Batería', '96 celdas en serie', 'V<sub>oc</sub> de 321,6 V (0 %) a 393,6 V (100 %) · R = 0,10 Ω · tope de carga 90 % con taper desde el 88 %'],
      ['Tarifa A', '$/kWh', 'valle 1,20 (00–06 h) · intermedia 2,30 · punta 5,10 (18–22 h)'],
      ['Tarifa B', '$/kWh', 'valle 1,35 (00–05 h) · intermedia 2,50 · punta 5,60 (19–23 h)'],
      ['Desgaste', 'regla del modelo', 'F<sub>1</sub> = 0,010 % por ciclo equivalente · φ(s) = 1 + 4·(1 − s)² · paquete 2 500 $/kWh, 20 % de vida'],
      ['Noche del primer escenario', 'batería de 60 kWh, 45 %, sale con 60 %', 'cargar apenas se llega cuesta $194,8 (sin coche la casa gasta $69,0); un plan que carga y devuelve bien la hace en $58,3 con un desgaste de 0,43 % del paquete y sale con 67,6 %']
    ]
  },
  s3: [
    'Un cargador bidireccional se instala con un <b>electricista certificado</b>, con la protección y la desconexión que exige la norma local y <b>la autorización de la distribuidora</b>: devolver a la red sin esa autorización es peligroso para quienes trabajan en ella.',
    'Un inversor que sigue entregando energía cuando la red se cae puede <b>energizar la línea</b>. Los equipos reales se desconectan solos (anti-isla); esta práctica no lo simula.',
    'La batería de alta tensión no se abre ni se manipula sin formación y equipo de protección. Las cifras de este laboratorio no sustituyen las condiciones de garantía del fabricante: algunos <b>no permiten</b> usar el coche como batería de la casa.',
    'Un plan que deja la batería baja pone en riesgo el trayecto de mañana: la reserva es una necesidad, no un adorno.'
  ],
  s4: {
    intro: 'Esta práctica enseña a <b>razonar</b> sobre cuándo cargar y cuándo devolver; un proyecto real sigue otros pasos:',
    items: [
      '<b>Estudio de la factura y de la tarifa real</b>: leer los cargos, la demanda máxima y las reglas de medición neta de TU distribuidora; aquí la tarifa es un ejemplo de tres niveles.',
      '<b>Medición del consumo de la casa</b>: con un medidor inteligente durante semanas; aquí hay tres perfiles de ejemplo.',
      '<b>Revisión de la garantía y de la compatibilidad</b>: coche, cargador, protocolo de comunicación (por ejemplo ISO 15118-20) y condiciones del fabricante.',
      '<b>Pruebas de interconexión</b>: protecciones, anti-isla y puesta en marcha con la distribuidora; este laboratorio no las cubre.'
    ]
  },
  s5: {
    modela: 'el <b>rendimiento del inversor</b> en carga y en descarga con sus inversas, la <b>corriente, la carga y las pérdidas de la batería</b>, los <b>límites</b> del cargador, de la red y del tope de carga, la <b>tarifa por hora</b> y el <b>perfil de la casa</b>, el <b>costo</b> de la noche y el <b>desgaste</b> por la energía devuelta, y el <b>balance de energía</b> de toda la noche. La verificación (112 comprobaciones) revisa: la pérdida y el rendimiento del inversor contra su forma cerrada y sus inversas (1e-11), el máximo de rendimiento en p = √(a/c), la corriente de la batería contra su ecuación de bornes (1e-11), el cierre de la energía en 300 noches al azar (red = casa + espera + variación de la batería + pérdidas del inversor y de la batería, a menos de 1e-9 kWh) y el balance de cada paso de 10 minutos, que el cargador nunca pasa de 7,4 kW, que la red nunca pasa de su límite al cargar, que no se baja del piso ni se pasa del tope y que sin «Casa y red» no se exporta nada, el costo y el desgaste recalculados por separado, y que cada reto tiene una ventana de solución interior: el plan central cumple los tres criterios y sus 10 vecinos inmediatos también, los valores iniciales no, cargar al llegar no, y la ventana recalculada en la cuadrícula completa coincide con la declarada (acertar al azar: menos del 1 % de los planes).',
    noModela: 'el mapa real del inversor y su temperatura, la temperatura y el envejecimiento de la batería, la degradación por calendario y por alta corriente, impuestos y cargos reales, medición neta y reglas de exportación, la protección anti-isla, el trayecto de mañana (sólo una reserva en porcentaje) y todas las noches siguientes. <b>No es una cotización ni una garantía</b>: las cifras pertenecen a ESTE coche, ESTA casa y ESTA tarifa con leyes simplificadas; la ventana del reto no es una ley, es lo que sale del modelo para el escenario sorteado.'
  },
  s6: [
    'Kempton y Tomić (2005), <i>Vehicle-to-grid power fundamentals</i>, Journal of Power Sources, sobre el coche como recurso de la red.',
    'ISO 15118-20, comunicación entre vehículo y cargador con transferencia bidireccional de energía.',
    'IEEE 1547, interconexión de recursos distribuidos con la red (protecciones y anti-isla).',
    'Wang et al. (2011), <i>Cycle-life model for graphite-LiFePO4 cells</i>, Journal of Power Sources, como ejemplo de modelos de degradación por energía pasada.'
  ]
});
