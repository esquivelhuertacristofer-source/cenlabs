export const definitions=[{
 id:261,slug:'union-atornillada-precarga',title:'Unión atornillada: precarga y separación',longTitle:'Unión atornillada: rigidez de junta y carga externa',area:'ELEMENTOS DE MÁQUINA',eyebrow:'Orden de trabajo · elementos de máquina',
 intro:'Aprieta dos piezas y descubre por qué una carga exterior no pasa entera al tornillo.',
 explore:'Ajusta la precarga, observa el contacto y registra la carga que conserva la junta.',
 controls:[{id:'preload',label:'Precarga',min:8,max:36,step:1,unit:'kN',decimals:0},{id:'load',label:'Carga externa',min:10,max:45,step:1,unit:'kN',decimals:0}],
 metrics:[{label:'Tracción máxima tornillo',key:'Fb',unit:'kN',scale:.001,decimals:2},{label:'Compresión mínima junta',key:'Fc',unit:'kN',scale:.001,decimals:2},{label:'Carga de separación',key:'separation',unit:'kN',scale:.001,decimals:2},{label:'Abertura máxima',key:'gap',unit:'µm',scale:1e6,decimals:2}],
 task:'Transmite ≥24 kN, conserva ≥3 kN de compresión y limita el tornillo a 34 kN con precarga ≤28 kN.',
 job:'OT-261 · Ajusta una junta axial para transmitir carga sin perder contacto ni sobrecargar el tornillo.',
 equations:'Rigideces dadas: kb=200 MN/m, kj=800 MN/m; C=kb/(kb+kj)=0,2. Antes de separación: Fb=Fi+CP, Fc=Fi−(1−C)P. Psep=Fi/(1−C). Después: Fb=P, Fc=0 y abertura=(P−Psep)/kb. Extensión desde el estado precargado=(Fb−Fi)/kb. Área resistente didáctica 84,3 mm². Par orientativo T=K d Fi, K=0,20 y d=12 mm.',
 limits:'Carga axial concéntrica, dos rigideces constantes y contacto unilateral; sin palanca de brida, plastificación, asentamiento, dispersión de rozamiento ni aflojamiento. Parámetros de ejemplo, no certificación de un tornillo ni clase normativa. Las deformaciones axiales se amplían ×80 respecto de la escala geométrica (25 unidades/m). Rosca y herramienta ilustrativas; la precarga se prescribe, no se deduce del giro de la llave. Demostración cuasiestática de 8 s entre 50 y 100 % de carga.',
 quiz:'Antes de que se abra la junta, ¿qué fracción de un incremento de carga recibe el tornillo?',
 answers:['La fracción C, determinada por las rigideces del tornillo y de las piezas.','Toda la carga externa, además de la precarga.','Ninguna carga hasta que el tornillo gira.','Una fracción que depende sólo del color de las arandelas.'],
 faults:[['Precarga insuficiente','Las superficies pierden contacto al elevar la carga.','La compresión residual llega a cero.'],['Precarga excesiva','Se conserva contacto, pero el tornillo supera su límite didáctico.','La precarga también consume capacidad de tracción.'],['Modelo cerrado fuera de dominio','Se predice compresión negativa después de separarse.','El contacto no transmite tracción: se cambia de rama.']],
 labels:'Tornillo · tuerca · arandela · brida superior · brida inferior · actuador',caption:'Deformación axial ×80 · carga cuasiestática',
 tools:'Junta seccionada, tornillo con rosca helicoidal, arandelas, llave y actuador axial.',
 procedure:['Identifica tornillo, piezas comprimidas y sentido de la carga.','Compara la junta cerrada con la pérdida de contacto al aumentar la carga.','Prepara el ensayo, registra un ajuste conforme y explica cómo se reparte la carga.'],
 timeScale:1,signals:'Tracción del tornillo / compresión de la junta (kN)',
 sourceName:'NASA · Richard T. Barrett · Fastener Design Manual, RP-1228',source:'https://ntrs.nasa.gov/citations/19900009424',
 tour:[{title:'Dos caminos de carga',text:'El tornillo se estira y las piezas se comprimen. Mira qué ocurre cuando el contacto desaparece.',view:'assembly'},{title:'Mira la sección',text:'La abertura y la compresión están ampliadas ×80. La rosca muestra cómo se une el conjunto.',view:'inspection'},{title:'Entrega el ajuste',text:'Abre la orden, prepara el ensayo y valida un ajuste que cumpla todos los límites.',view:'assembly'}],
},{
 id:262,slug:'union-excentrica-soldadura-remache',title:'Soldadura y remaches: carga excéntrica',longTitle:'Unión excéntrica: reparto vectorial en soldaduras y remaches',area:'ELEMENTOS DE MÁQUINA',eyebrow:'Orden de trabajo · elementos de máquina',
 intro:'Alejar la carga retuerce la unión: el punto más cargado puede recibir mucho más que el promedio.',
 explore:'Compara dos uniones con el mismo alcance y la misma carga. Inspecciona las fuerzas locales.',
 controls:[{id:'load',label:'Carga exterior',min:2,max:12,step:.5,unit:'kN',decimals:1},{id:'eccentricity',label:'Alcance desde el centro',min:60,max:200,step:5,unit:'mm',decimals:0}],
 metrics:[{label:'Pico en soldadura',key:'weldPeak',unit:'MPa',scale:1e-6,decimals:2},{label:'Pico en remache',key:'rivetPeak',unit:'MPa',scale:1e-6,decimals:2},{label:'Momento aplicado',key:'M',unit:'N·m',scale:-1,decimals:1},{label:'Utilización máxima',key:'utilization',unit:'',scale:1,decimals:2}],
 task:'Transporta ≥7 kN con alcance ≥100 mm, cortante de soldadura ≤60 MPa y de remache ≤100 MPa.',job:'OT-262 · Compara dos alternativas para una ménsula cargada fuera del centro de su unión.',
 equations:'F vertical descendente aplicada en x=e; M=−Fe. Cuatro remaches iguales de d=8 mm en (±40,±60) mm; Jp=Σ(x²+y²). Fuerzas transmitidas: fx=−My/Jp, fy=−F/4+Mx/Jp; τ=|f|/(πd²/4). Dos cordones verticales de longitud L=120 mm en x=±40 mm y garganta a=4 mm; Jℓ=2Lx²+L³/6. τx=−My/(aJℓ), τy=−F/(2aL)+Mx/(aJℓ). Máximo en los extremos de los cordones. Utilización=max(τsold/60 MPa,τrem/100 MPa).',
 limits:'Método elástico de grupo, placa rígida y carga en su plano. Soldadura idealizada como líneas de garganta uniforme; remaches iguales en cortante simple. No se evalúan aplastamiento, desgarro de placa, fatiga, deslizamiento, tensiones residuales ni resistencia última por centro instantáneo. Los límites de 60 y 100 MPa son del escenario, no valores normativos. Cordón ampliado para mostrar su superficie; flechas locales proporcionales al esfuerzo en los cordones (1×10⁻⁸ unidades/Pa) y a la fuerza en los remaches (6×10⁻⁵ unidades/N); no se comparan sus longitudes entre sistemas. Demostración cuasiestática de 8 s entre 50 y 100 % de carga; no deformación de rotura.',
 quiz:'¿Por qué no basta dividir la fuerza entre cuatro remaches?',answers:['Porque la excentricidad añade un momento y sus fuerzas deben sumarse vectorialmente al cortante directo.','Porque cada remache recibe siempre toda la fuerza.','Porque el centro del grupo cambia de lugar con el color del acero.','Porque el momento elimina el cortante directo.'],
 faults:[['Brazo excesivo','La carga no cambia, pero crece el pico en los puntos exteriores.','El momento es F por el alcance.'],['Promedio engañoso','El cálculo F/4 parece seguro y el remache crítico excede el límite.','Falta sumar el cortante debido al momento.'],['Confundir fuerza y esfuerzo','Se comparan newtons de remache con megapascales del cordón.','Primero se divide cada fuerza por su área resistente.']],
 labels:'Cordones · remaches · ménsula · placa soporte · carga · bastidor',caption:'Grupo elástico · esfuerzo en cordón / fuerza en remache',tools:'Dos ménsulas equivalentes, cuatro remaches, dos cordones, brazo regulable y flechas vectoriales.',
 procedure:['Localiza el centro de cada grupo y la línea de aplicación de la carga.','Cambia el alcance y compara las flechas de los puntos superiores e inferiores.','Registra una solución que cumpla ambas alternativas y explica qué criterio gobierna.'],timeScale:1,signals:'Cortante pico en soldadura / remache (MPa)',
 source:'https://www.aisc.org/media/xj2jhret/nsba_routinebridgedesignguide.pdf',sourceName:'AISC/NSBA · Guide to Navigating Routine Steel Bridge Design · análisis elástico de grupos; NASA RP-1228 · grupos de fijaciones',
 originality:'Capacidad y equilibrio de uniones excéntricas; distinta de los laboratorios 165/212/234 de formación de soldadura, calor y procesos.',
 concepts:[{icono:'↗️',nombre:'Carga excéntrica',descripcion:'Una fuerza apartada del centro añade un momento a la unión.'},{icono:'🔩',nombre:'Reparto vectorial',descripcion:'El cortante directo y el debido al momento tienen direcciones que se suman.'},{icono:'🔎',nombre:'Comparación de alternativas',descripcion:'Comprueba soldadura y remaches con sus áreas resistentes y límites del escenario.'}],
 tour:[{title:'Misma carga, dos uniones',text:'A la izquierda hay cordones; a la derecha, remaches. Ambas reciben la misma fuerza y alcance.',view:'assembly'},{title:'No todos cargan igual',text:'Las flechas muestran el reparto local. Acerca la unión y observa qué punto exige más.',view:'inspection'},{title:'Compara con evidencia',text:'Prepara, ensaya y valida antes de consultar la curva de comparación.',view:'assembly'}],
},{
 id:263,inspectionDir:[.8,.45,1.4],slug:'engranes-helicoidales-empuje',title:'Engranes helicoidales: empuje y recubrimiento',longTitle:'Engranes helicoidales: fuerzas axiales y contacto de dientes',area:'ELEMENTOS DE MÁQUINA',eyebrow:'Orden de trabajo · elementos de máquina',
 intro:'Inclinar los dientes suaviza el contacto, pero también empuja los ejes hacia los lados.',explore:'Compara la inclinación y el ancho. Observa cómo las líneas de contacto recorren los dientes.',
 controls:[{id:'beta',label:'Ángulo de hélice',min:10,max:35,step:1,unit:'°',decimals:0},{id:'width',label:'Ancho de cara',min:10,max:40,step:1,unit:'mm',decimals:0}],
 metrics:[{label:'Empuje axial',key:'Fa',unit:'N',scale:1,decimals:1},{label:'Recubrimiento total',key:'total',unit:'',scale:1,decimals:2},{label:'Fuerza tangencial',key:'Ft',unit:'N',scale:1,decimals:1},{label:'Recubrimiento axial',key:'overlap',unit:'',scale:1,decimals:2}],
 task:'Consigue recubrimiento total ≥2,5, empuje axial ≤350 N y ancho entre 16 y 28 mm.',job:'OT-263 · Ajusta una pareja helicoidal para ganar continuidad de contacto sin sobrecargar el apoyo axial.',
 equations:'Engranes exteriores sin corrección: módulo normal mn=3 mm, αn=20°, z1=24, z2=48, T1=30 N·m, n1=600 rpm. mt=mn/cosβ; tanαt=tanαn/cosβ; Ri=mt zi/2, rai=Ri+mn, rbi=Ri cosαt. Ft=T1/R1, Fa=Ft tanβ, Fr=Ft tanαt. εα=[√(ra1²−rb1²)+√(ra2²−rb2²)−(R1+R2)sinαt]/(πmt cosαt); εβ=b sinβ/(πmn); εγ=εα+εβ. ω2=−ω1 z1/z2. Flancos por involuta barrida: giro de sección=±z tanβ/R. Las líneas nominales de contacto se recortan por ambos círculos de cabeza y por el ancho.',
 limits:'Geometría ideal de involuta y fuerzas estáticas sin pérdidas. No calcula flexión del diente, Hertz, lubricación, ruido ni vida de rodamientos. El recubrimiento es un promedio de pares en contacto, no el número instantáneo constante. Las líneas doradas indican contacto nominal; la malla incluye 0,05 mm de juego transversal para separar visualmente los flancos. Pie del diente radial simplificado, sin trocoide de herramienta. Giro mostrado ×1/100: 600/300 rpm reales, 6/3 rpm visibles. Fuerzas en el piñón: radial −X, tangencial −Y y axial +Z, escala común 0,00065 unidades/N. Banco abierto didáctico, no equipo comercial.',
 quiz:'¿Cómo puede aumentarse el recubrimiento axial sin elevar el empuje axial a par constante?',answers:['Aumentando el ancho de cara con el mismo ángulo de hélice.','Aumentando el ángulo de hélice sin cambiar ninguna otra dimensión.','Reduciendo el número de apoyos del eje.','Eliminando la fuerza tangencial.'],
 faults:[['Hélice excesiva','El contacto mejora, pero el apoyo axial recibe demasiado empuje.','Fa aumenta con la inclinación para este par y módulo normal.'],['Cara estrecha','El empuje es aceptable, pero falta continuidad de contacto.','El recubrimiento axial también depende del ancho.'],['Confundir módulo normal y transversal','La distancia entre ejes no coincide con los radios calculados.','mt=mn/cosβ; no se usan ambos módulos indistintamente.']],
 labels:'Piñón · rueda · apoyos · ejes · contacto nominal · fuerza axial',caption:'Involuta helicoidal · giro ×1/100 · contacto nominal dorado',tools:'Pareja de 24/48 dientes, ejes, apoyos con rodamientos y trazas de contacto nominal.',procedure:['Identifica los dos sentidos de hélice y sigue el contacto a través de la cara.','Compara ancho y ángulo: uno cambia el solape sin cambiar el empuje.','Ensaya un ajuste conforme y explica qué pedirías al seleccionar los apoyos.'],timeScale:1,signals:'Empuje axial / fuerza tangencial (N)',
 source:'https://www.kggear.co.jp/en/wp-content/themes/bizvektor-global-edition/pdf/TechnicalData_KGSTOCKGEARS.pdf',sourceName:'KG Gear · Stock Gears Technical Data · tabla16 y fuerzas, páginas36 y42',application:'Seleccionar la hélice y el ancho de una transmisión sin exceder el empuje admisible de los apoyos.',
 originality:'Frente a216 (inspección de juego) y236 (transmisión magnética), éste construye involutas helicoidales y comprueba empuje y continuidad de contacto.',
 concepts:[{icono:'⚙️',nombre:'Contacto progresivo',descripcion:'La hélice extiende el contacto a lo ancho del diente.'},{icono:'↔️',nombre:'Carga axial',descripcion:'La inclinación añade una fuerza que deben soportar los apoyos.'},{icono:'📐',nombre:'Compromiso de diseño',descripcion:'Elige ángulo y ancho para cumplir simultáneamente empuje y recubrimiento.'}],
 tour:[{title:'Sigue el contacto',text:'Las líneas doradas recorren flancos de involuta reales. Los engranes giran cien veces más lento para verlos.',view:'assembly'},{title:'Observa la hélice',text:'Las dos ruedas tienen manos opuestas. Arrastra una rueda para variar su ancho.',view:'inspection'},{title:'Selecciona el ajuste',text:'Registra la comparación y valida el equilibrio entre contacto y fuerza axial.',view:'assembly'}],
},{
 id:264,slug:'planetario-tabla-velocidades',title:'Planetario: bloqueos y tabla de velocidades',longTitle:'Tren planetario: elige el miembro fijo y compara velocidades',area:'ELEMENTOS DE MÁQUINA',eyebrow:'Orden de trabajo · elementos de máquina',inspectionDir:[.4,.3,1.7],
 intro:'Bloquear una pieza cambia la transmisión: los planetas giran sobre su eje y también alrededor del sol.',explore:'Sol: rueda central; corona: aro; portador: soporte de planetas. Con sol fijo entra por corona; en los otros montajes, por sol.',
 controls:[{id:'fixed',label:'Bloqueo',min:1,max:3,step:1,unit:'',decimals:0,format:n=>['Portador','Corona','Sol'][n-1]},{id:'speed',label:'Velocidad de entrada',min:200,max:1600,step:20,unit:'rpm',decimals:0}],
 metrics:[{label:'Portaplanetas',key:'carrier',unit:'rpm',scale:1,decimals:1},{label:'Sol',key:'sun',unit:'rpm',scale:1,decimals:1},{label:'Corona',key:'ring',unit:'rpm',scale:1,decimals:1},{label:'Planeta: giro absoluto',key:'planet',unit:'rpm',scale:1,decimals:1}],
 task:'Obtén entre 200 y 260 rpm en el portaplanetas con entrada entre 900 y 1000 rpm.',job:'OT-264 · Selecciona el bloqueo de un reductor y entrega la tabla de velocidades absolutas.',
 equations:'Sol zs=24, tres planetas zp=24 y corona zr=72; módulo 3 mm, ángulo de presión de 20°. Geometría: zr=zs+2zp y (zs+zr)/3=32 entero. Willis: zs ns+zr nr=(zs+zr) nc. Portador fijo: nc=0, entra ns; corona fija: nr=0, entra ns; sol fijo: ns=0, entra nr. Planeta: np=nc−(zs/zp)(ns−nc). Órbita de radio m(zs+zp)/2. Fase absoluta del planeta i: θp+(zs+zp)φi/zp+π/zp, φi=2πi/3. La corona tiene involuta interna; sol y planetas, externa. Rodillos exteriores: θrod=−Rexterior θcorona/Rrod.',
 limits:'Cinemática ideal sin juego dinámico, inercia, par, pérdidas ni análisis de resistencia. Giro mostrado ×1/100; los valores en rpm son reales. Pie de diente simplificado, sin trocoide; juego geométrico transversal de 0,05 mm para separar flancos. Cada cambio de mando reinicia la demostración; no simula un cambio de marcha con embragues bajo carga. Apoyos y jaula son didácticos, sin diseño de tolerancias ni certificación. Los rodillos exteriores ruedan idealmente sin deslizamiento.',
 quiz:'¿Por qué hace falta restar la velocidad del portador al comparar sol y corona?',answers:['Porque el tren visto desde el portador tiene los centros de los planetas inmóviles y se aplica la relación de engrane relativa.','Porque las velocidades absolutas de todos los elementos son iguales.','Porque el número de dientes cambia al bloquear una pieza.','Porque el portador siempre está detenido.'],
 faults:[['Bloqueo equivocado','El portador se detiene o gira mucho más rápido que la salida pedida.','El miembro inmovilizado determina la relación de transmisión.'],['Confundir giro y órbita','La animación de un planeta gira a la velocidad del portador sobre su propio eje.','El giro absoluto del planeta incluye la rotación relativa respecto del portador.'],['Ignorar el signo','La tabla marca un giro inverso como si fuera positivo.','Las velocidades de Willis se suman con signo.']],
 labels:'Sol · planetas · corona · portaplanetas · eje de entrada · salida hueca · rodillos',caption:'Giro ×1/100 · velocidades absolutas · tres montajes',tools:'Corona interna de 72 dientes, sol y tres planetas de 24, portador con pasadores, salida hueca y rodillos de apoyo.',procedure:['Identifica los tres miembros y observa giro y órbita de los planetas.','Prueba los bloqueos con la misma entrada y conserva el signo de cada velocidad.','Ensaya la configuración elegida, valida y compara la tabla de los tres montajes.'],timeScale:1,signals:'Portaplanetas / sol (rpm)',
 source:'https://mechanics.ju.se/MachineElements/planetary-gears.html',sourceName:'Jönköping University · Applied Mechanics · Planetary gears; KG Technical Data, página 117',application:'Elegir la configuración cinemática de un reductor coaxial y evitar confundir velocidades relativas y absolutas.',originality:'Frente al127 (tren híbrido y reparto de potencia), aquí se decide qué miembro inmovilizar y se construye una tabla de velocidades; no se simula gestión híbrida.',
 concepts:[{icono:'⚙️',nombre:'Giro y órbita',descripcion:'Un planeta gira sobre un pasador que a su vez puede recorrer una órbita.'},{icono:'🔒',nombre:'Miembro fijo',descripcion:'Bloquear sol, corona o portador produce transmisiones distintas.'},{icono:'📋',nombre:'Tabla con signos',descripcion:'Registra la velocidad absoluta de cada elemento y el sentido de giro.'}],
 tour:[{title:'Dos movimientos a la vez',text:'Mira un planeta: gira sobre su eje y orbita con el portador. Las rpm están ralentizadas cien veces.',view:'assembly'},{title:'Compara los bloqueos',text:'Elige qué elemento se queda quieto y observa cuál transmite la entrada.',view:'inspection'},{title:'Entrega la tabla',text:'Prepara el ensayo, valida el montaje y compara después las tres alternativas.',view:'assembly'}],
},{
 id:265,slug:'cojinete-hidrodinamico-pelicula',title:'Cojinete hidrodinámico: película y fricción',longTitle:'Cojinete de aceite: película mínima, presión y pérdidas viscosas',area:'ELEMENTOS DE MÁQUINA',eyebrow:'Orden de trabajo · elementos de máquina',inspectionDir:[.35,.25,1.7],
 intro:'El giro arrastra aceite y forma una cuña que mantiene separado el eje del casquillo.',explore:'Las flechas turquesa muestran la presión local. Compara viscosidad y régimen sin gastar demasiada potencia.',
 controls:[{id:'viscosity',label:'Viscosidad dinámica',min:10,max:65,step:1,unit:'mPa·s',decimals:0},{id:'speed',label:'Régimen del eje',min:600,max:3000,step:100,unit:'rpm',decimals:0}],
 metrics:[{label:'Película mínima',key:'minFilm',unit:'µm',scale:1e6,decimals:2},{label:'Coeficiente de fricción',key:'frictionCoefficient',unit:'',scale:1,decimals:4},{label:'Potencia viscosa',key:'power',unit:'W',scale:1,decimals:1},{label:'Presión máxima',key:'pressureMax',unit:'MPa',scale:1e-6,decimals:2}],
 task:'Conserva película ≥12 µm, pérdidas ≤90 W, régimen ≥1200 rpm y viscosidad ≤55 mPa·s.',job:'OT-265 · Selecciona viscosidad y régimen para separar el eje de un cojinete sin exceder las pérdidas.',
 equations:'Cojinete corto: R=25 mm, L=20 mm, holgura radial c=50 µm, carga W=2000 N, rugosidad RMS combinada de 4 µm. h=c(1+εcosθ). Para 0<θ<π: p=3µΩcεsinθ(L²/4−z²)/h³; p=0 en el resto y en z=±L/2. A=µΩRL³/c²; Wx=−Aε²/(1−ε²)², Wy=πAε/[4(1−ε²)^(3/2)]. Se resuelve √(Wx²+Wy²)=W por bisección. φ=atan2(Wy,−Wx), campo girado γ=π/2+φ para que la fuerza del aceite sea vertical ascendente. hmin=c(1−ε), λ=hmin/4µm. Fricción de perfil circunferencial lineal: Fv=2πµΩR²L/[c√(1−ε²)], f=Fv/W, par=RFv y pérdidas=par·Ω. Caudal lateral total Q=ΩRcLε. Flujo medio: dθ/dt=Ω/2, dz/dt=Ωcεsinθ·z/(2h); zh es constante a lo largo de una trayectoria.',
 limits:'Aproximación isoviscosa de Ocvirk con L/D=0,4 y holgura pequeña; presión positiva en media circunferencia, sin cavitación conservativa en masa. La fricción usa Couette integrada en 360° conforme al perfil lineal del informe NACA; no se añade una corrección de gradiente circunferencial de otra aproximación. Sin temperatura, elasticidad, presión de alimentación ni contacto de asperezas. λ<3 indica que no se cumple la separación objetivo, no un cálculo de desgaste. Se dibuja media longitud axial, desde z=−L/2 hasta la sección central z=0: ahí se ve la presión máxima. Holgura y excentricidad ampliadas ×60, giro ×1/200; esa ampliación distorsiona las proporciones radiales, no las cifras. Flechas turquesa: presión local en la sección central (6×10⁻⁸ unidades/Pa), no fuerzas integradas; flecha dorada: carga de 2000 N (0,0002 unidades/N). Color falso de presión: azul 0 a rojo 20 MPa, saturado por encima; no es el color real del aceite. La vista transparente muestra trazadores del flujo promediado a través del espesor, sólo en la región convergente: se reponen al salir por un extremo o alcanzar θ=π. No representan moléculas ni densidad de aceite. Límites didácticos, sin recomendar un aceite SAE real.',
 quiz:'Al aumentar la viscosidad con el mismo régimen y carga, ¿qué compromiso muestra este modelo?',answers:['La película aumenta, pero también crecen las pérdidas por fricción viscosa.','La película aumenta y las pérdidas desaparecen siempre.','El eje deja de necesitar giro para generar presión.','La carga cambia automáticamente aunque el soporte sea el mismo.'],
 faults:[['Aceite demasiado poco viscoso','La separación cae por debajo del objetivo para la carga aplicada.','La cuña necesita mayor excentricidad para sostener la misma carga.'],['Régimen insuficiente','La película se adelgaza al reducir la velocidad del eje.','Disminuye el arrastre viscoso que genera presión.'],['Viscosidad excesiva','La separación cumple, pero las pérdidas superan el límite.','La fricción viscosa también aumenta con la viscosidad.']],
 labels:'Muñón del eje · casquillo · aceite · sección central · carga · marca de giro',caption:'Media sección · holgura ×60 · giro ×1/200 · color 0–20 MPa',tools:'Cojinete seccionado, eje excéntrico, película de aceite con mapa y vectores de presión local, y marca de giro.',procedure:['Observa el aceite en la sección central y localiza el punto de menor separación.','Ajusta viscosidad y régimen; compara espesor, fricción y pérdidas para la misma carga.','Registra un ajuste conforme y comprueba el perfil de película y presión después de validar.'],timeScale:1,signals:'Película mínima / objetivo (µm)',
 source:'https://ntrs.nasa.gov/citations/19930083541',sourceName:'F. W. Ocvirk · NACA TN2808, Short-bearing approximation for full journal bearings, 1952',application:'Evaluar el compromiso entre separación de superficies y pérdidas viscosas de un apoyo lubricado.',originality:'Distinto del238: éste sostiene una carga mediante aceite arrastrado por el giro; no usa aire presurizado ni un restrictor aerostático.',
 concepts:[{icono:'💧',nombre:'Cuña de aceite',descripcion:'El giro arrastra aceite a una zona que se estrecha y genera presión.'},{icono:'📏',nombre:'Separación mínima',descripcion:'El espesor de película se compara con la rugosidad de las superficies.'},{icono:'⚙️',nombre:'Pérdidas viscosas',descripcion:'Más viscosidad puede separar mejor, pero también exige más potencia al eje.'}],
 tour:[{title:'El aceite sostiene la carga',text:'El eje gira dentro del aceite. El color muestra presión; la holgura está ampliada sesenta veces.',view:'assembly'},{title:'Mira la película',text:'La sección es la mitad de la longitud. En su frente se ve el plano central de mayor presión.',view:'inspection'},{title:'Entrega una selección',text:'Prepara el ensayo y cumple separación y pérdidas antes de comparar los perfiles.',view:'assembly'}],
},{
 id:266,inspectionDir:[.35,.3,1.6],slug:'rodamiento-carga-vida-l10',title:'Rodamientos: selección por carga y vida',longTitle:'Rodamientos de bolas: carga equivalente y vida nominal L10',area:'ELEMENTOS DE MÁQUINA',eyebrow:'Orden de trabajo · elementos de máquina',
 intro:'El mismo eje admite varios rodamientos. Elegir uno exige comprobar carga, vida y espacio disponible.',explore:'Cambia la serie y compara el tamaño. La jaula y las bolas ruedan a distinta velocidad del eje.',
 controls:[{id:'bearing',label:'Rodamiento · eje de 25 mm',min:1,max:3,step:1,unit:'',decimals:0,format:v=>['6005','6205','6305'][v-1]},{id:'radial',label:'Carga radial',min:400,max:2200,step:100,unit:'N',decimals:0}],
 metrics:[{label:'Vida nominal L10h',key:'L10h',unit:'h',scale:1,decimals:0},{label:'Carga equivalente P',key:'P',unit:'N',scale:1,decimals:0},{label:'Diámetro exterior',key:'D',unit:'mm',scale:1000,decimals:0},{label:'Ancho',key:'B',unit:'mm',scale:1000,decimals:0}],
 task:'Transporta ≥1000 N radiales con L10h ≥15.000 h, diámetro exterior ≤55 mm y ancho ≤16 mm.',job:'OT-266 · Selecciona un rodamiento para un eje de 25 mm, carga axial de 400 N y régimen de 1500 rpm.',
 equations:'Datos de NSK Industrial Motor Bearings, PDF p23, misma edición: 6005 d/D/B=25/47/12 mm, C=10.600 N, C0=5850 N, f0=14,5; 6205 25/52/15 mm, C=14.700 N, C0=7850 N, f0=13,9; 6305 25/62/17 mm, C=21.600 N, C0=11.200 N, f0=13,2. Fa=400 N, n=1500 rpm. Se interpolan linealmente e,Y de la tabla con u=f0Fa/C0. Si Fa/Fr≤e: P=Fr; si supera e: P=max(Fr,0,56Fr+YFa), cota conservadora para el redondeo de la tabla. L10=(C/P)³ en millones de vueltas; L10h=10⁶L10/(60n). P0=max(Fr,0,6Fr+0,5Fa), s0=C0/P0. Cinemática ilustrativa radial sin deslizamiento, contacto α=0: Rp=(d+D)/4, radio bola rb=0,14(D−d); Ωc=Ωi(1−rb/Rp)/2 y giro absoluto de bola Ωb=−ΩcRp/rb. Giro ×1/200.',
 limits:'L10 representa 90% de supervivencia de una población bajo carga constante y condiciones nominales, no fecha garantizada de fallo. No incluye contaminación, lubricación, confiabilidad modificada, juego, desalineación ni carga variable. Datos de una edición fija, sin mezclar capacidades actuales de otras variantes. El encabezado kN del PDF es inconsistente con sus cifras enteras: se usan como N (14.700 N=14,7 kN). Dimensiones exteriores y agujero a escala; interiores, número de bolas (10/9/8), pistas y jaula esquemáticos, no CAD del fabricante. La carga axial entra en P, pero la escena usa cinemática radial ideal con α=0; no muestra deformación Hertz ni ángulo de contacto bajo carga. Flecha dorada radial, escala0,00030 unidades/N; turquesa axial, escala0,0008 unidades/N. No se anima una rotura al alcanzar L10.',
 quiz:'¿Qué significa una vida nominal L10h de 15.000 horas?',answers:['Que el90% de una población alcanza esa vida de fatiga bajo las hipótesis del cálculo.','Que cada rodamiento fallará exactamente al cumplir15.000 horas.','Que el rodamiento funciona15.000 horas incluso sin lubricación.','Que el10% de la carga debe eliminarse antes de arrancar.'],
 faults:[['Vida insuficiente','El componente cabe, pero su carga equivalente consume demasiada vida nominal.','La vida de bolas varía con el cubo de C/P.'],['Envolvente incompatible','La capacidad aumenta, pero el rodamiento excede el alojamiento disponible.','Comprueba D y B además del agujero.'],['Ignorar el empuje axial','Se usa P=Fr aunque Fa/Fr supera el umbral de la tabla.','La rama combinada utiliza X e Y.']],
 labels:'Aro interior · aro exterior · bolas · jaula · eje · carga radial · empuje axial',caption:'Dimensiones exteriores a escala · interior esquemático · giro ×1/200',tools:'Tres series de rodamientos con agujero25mm, pistas perfiladas, jaula y bolas con marcas de giro, eje y flechas de carga.',procedure:['Compara dimensiones de las tres series sobre el mismo eje.','Comprueba la carga equivalente, el criterio de vida y la envolvente disponible.','Registra una selección conforme y justifica por qué mayor capacidad no siempre cabe.'],timeScale:1,signals:'Carga equivalente / radial (N)',
 source:'https://www.nsk.com/content/dam/nsk/am/en_us/documents/bearings-americas/Industrial-Motor-Bearings.pdf',sourceName:'NSK · Industrial Motor Bearings, PDF p23; Bearing ABC, Dynamic Load Ratings and Fatigue Life',application:'Seleccionar apoyos de motores y transmisiones mediante catálogo, carga equivalente, vida y dimensiones.',originality:'Distinto181 (FFT de daño) y215 (montaje térmico): selección de catálogo por capacidad y envolvente con la misma interfaz de eje.',
 concepts:[{icono:'⚙️',nombre:'Carga equivalente',descripcion:'Combina carga radial y axial mediante los factores de la tabla del fabricante.'},{icono:'⏱️',nombre:'Vida estadística',descripcion:'L10 es una medida de supervivencia de una población, no una garantía individual.'},{icono:'📏',nombre:'Selección compatible',descripcion:'Un rodamiento debe sostener la carga y caber en el espacio disponible.'}],
 tour:[{title:'Tres tamaños, el mismo eje',text:'El agujero conserva25mm. Cambian el diámetro, el ancho y la capacidad de carga.',view:'assembly'},{title:'Mira la rodadura',text:'Las marcas permiten distinguir el giro del aro, la órbita de las bolas y su giro propio. El interior es esquemático.',view:'inspection'},{title:'Entrega una selección',text:'Ensaya y valida vida, carga útil y dimensiones antes de comparar la curva del catálogo.',view:'assembly'}],
},{
 "id": 267,
 "inspectionDir": [
  0.2,
  0.45,
  1.6
 ],
 "slug": "resorte-helicoidal-rigidez-frecuencia",
 "title": "Resortes: rigidez, esfuerzo y frecuencia",
 "longTitle": "Selección de un resorte helicoidal por rigidez, esfuerzo y frecuencia propia",
 "area": "ELEMENTOS DE MÁQUINA",
 "eyebrow": "Orden de trabajo · elementos de máquina",
 "intro": "Un alambre más grueso endurece mucho el resorte. La geometría también cambia su esfuerzo y la rapidez con que oscila.",
 "explore": "Compara alambre y diámetro de espira. El carro oscila alrededor de su posición comprimida.",
 "controls": [
  {
   "id": "wire",
   "label": "Diámetro del alambre",
   "min": 2,
   "max": 3,
   "step": 0.1,
   "unit": "mm",
   "decimals": 1
  },
  {
   "id": "coil",
   "label": "Diámetro medio de espira",
   "min": 24,
   "max": 34,
   "step": 1,
   "unit": "mm",
   "decimals": 0
  }
 ],
 "metrics": [
  {
   "label": "Rigidez",
   "key": "k",
   "unit": "N/mm",
   "scale": 0.001,
   "decimals": 3
  },
  {
   "label": "Frecuencia propia",
   "key": "fn",
   "unit": "Hz",
   "scale": 1,
   "decimals": 2
  },
  {
   "label": "Esfuerzo cortante pico",
   "key": "stress",
   "unit": "MPa",
   "scale": 0.000001,
   "decimals": 1
  },
  {
   "label": "Compresión de equilibrio",
   "key": "deflection",
   "unit": "mm",
   "scale": 1000,
   "decimals": 2
  }
 ],
 "task": "Consigue frecuencia entre3 y3,6 Hz, compresión entre18 y28 mm, cortante pico ≤220 MPa y diámetro exterior ≤36 mm.",
 "job": "OT-267 · Selecciona el alambre y diámetro de un resorte para un carro horizontal de3 kg con precarga constante de30 N.",
 "equations": "Resorte helicoidal cercano a espira cerrada: G=78,5 GPa, densidad7850 kg/m³, Na=8 espiras activas y dos terminales de una vuelta sujetas en copas, Nt=10, longitud libre100 mm. k=Gd⁴/(8D³Na); índice C=D/d, Wahl K=(4C−1)/(4C−4)+0,615/C; τmax=K8FmaxD/(πd³). Área A=πd²/4, masa por vuelta m1=ρAπD, masa activa ma=8m1. Masa del carro3 kg; extremo móvil aporta m1, extremo fijo inmóvil. Rayleigh meff=3+m1+ma/3; fn=√(k/meff)/(2π). Precarga F=30 N; compresión de equilibrio δ=F/k. Pequeña oscilación de amplitud a=2 mm: longitud=L0−δ−a cos(ωt), fuerza de resorte=F+ka cos(ωt), Fmax=F+ka. Movimiento mostrado ×1/4; la frecuencia indicada es real. Terminales sin rectificar, altura sólida geométrica Hs=(Nt+1)d=11d.",
 "limits": "Modelo lineal de torsión, ocho espiras activas y terminales sujetos; sin fatiga, pandeo, rozamiento, amortiguamiento ni contacto entre espiras. Guía horizontal soporta el peso; no hay gravedad axial. Masa de alambre por longitud de espira cerrada, sin corrección de hélice. Masa efectiva ma/3 aproxima el modo de desplazamiento lineal; no es solución exacta del continuo ni frecuencia de surge con ambos extremos fijos. La masa del carro es concentrada e incluye el equipo movido, no se deduce del volumen dibujado. Dos terminales tienen paso d y las activas reparten el tramo restante; las copas sujetan las vueltas inactivas. En todo el rango se conserva holgura hasta bloque durante la oscilación. No se simula rotura ni plastificación:220 MPa y dimensiones son límites didácticos del escenario, no homologación de material. Geometría de resorte a30 unidades/m, sin amplificar la amplitud. Flecha dorada: precarga externa30 N, escala0,012 unidades/N.",
 "quiz": "Si duplicas el diámetro del alambre y mantienes lo demás, ¿cómo cambia la rigidez ideal?",
 "answers": [
  "Se multiplica por16 porque depende de la cuarta potencia del diámetro.",
  "Se duplica porque la fuerza siempre es proporcional al diámetro.",
  "Se divide entre16 porque el alambre pesa más.",
  "No cambia mientras el resorte conserve el mismo color."
 ],
 "faults": [
  [
   "Alambre demasiado fino",
   "La compresión y el cortante crecen y baja la frecuencia.",
   "La rigidez depende de d⁴ y el esfuerzo de1/d³."
  ],
  [
   "Resorte demasiado rígido",
   "La frecuencia supera la ventana y falta la carrera de equilibrio requerida.",
   "Aumentar d o reducir D aumenta k."
  ],
  [
   "Confundir diámetro medio y exterior",
   "El resorte elegido no cabe aunque D parezca aceptable.",
   "El diámetro exterior es D+d."
  ]
 ],
 "labels": "Alambre · espiras activas · terminal fijo · terminal móvil · carro · guía · precarga",
 "caption": "Resorte a escala · oscilación ×1/4 · masa efectiva aproximada",
 "tools": "Resorte helicoidal de ocho espiras activas, copas terminales, carro de masa concentrada y guía horizontal.",
 "procedure": [
  "Distingue alambre, diámetro medio y espiras activas.",
  "Compara frecuencia, compresión y esfuerzo al cambiar cada dimensión.",
  "Ensaya una selección conforme y justifica su carrera y margen de esfuerzo."
 ],
 "timeScale": 1,
 "signals": "Fuerza instantánea del resorte / precarga (N)",
 "source": "https://www.maruho-htj.co.jp/en/mnet/design/compression/",
 "sourceName": "Maruho Spring · ecuaciones3,5,6 y11; Tokai Spring · módulo G; Fox y Mahanty1970 · masa efectiva",
 "application": "Seleccionar un elemento elástico de una máquina por carrera, esfuerzo y respuesta dinámica.",
 "originality": "Distinto173 (volante bimasa),201 (identificación modal) y271 (amortiguamiento): dimensiona físicamente un resorte por alambre, diámetro, Wahl, masa de alambre y espacio entre espiras.",
 "concepts": [
  {
   "icono": "🌀",
   "nombre": "Rigidez geométrica",
   "descripcion": "El alambre trabaja principalmente a torsión; su diámetro cambia fuertemente la rigidez."
  },
  {
   "icono": "📐",
   "nombre": "Esfuerzo corregido",
   "descripcion": "El factor de Wahl incorpora curvatura y cortante directo del alambre."
  },
  {
   "icono": "⏱️",
   "nombre": "Frecuencia del conjunto",
   "descripcion": "La frecuencia depende de rigidez y masa móvil, con una pequeña contribución del resorte."
  }
 ],
 "tour": [
  {
   "title": "La geometría decide",
   "text": "El resorte ya oscila sobre la guía. Cambia el alambre y observa qué cambia junto con su forma.",
   "view": "assembly"
  },
  {
   "title": "Comprueba la separación",
   "text": "Las vueltas terminales están sujetas en copas. Las activas conservan espacio durante la compresión.",
   "view": "inspection"
  },
  {
   "title": "Entrega un diseño",
   "text": "Prepara y ensaya. La selección debe cumplir carrera, frecuencia, esfuerzo y espacio.",
   "view": "assembly"
  }
 ]
},{
 "id": 268,
 "inspectionDir": [
  0.3,
  0.3,
  1.7
 ],
 "slug": "freno-banda-autoenergizado",
 "title": "Freno de banda: fuerza que se amplifica",
 "longTitle": "Freno diferencial de banda: autoenergizado, tensiones y parada",
 "area": "ELEMENTOS DE MÁQUINA",
 "eyebrow": "Orden de trabajo · elementos de máquina",
 "intro": "El propio giro ayuda a apretar la banda. Un pequeño cambio de palanca puede multiplicar mucho el frenado.",
 "explore": "Ajusta fricción y brazo asistente. Observa el tambor detenerse y compara las tensiones límite.",
 "controls": [
  {
   "id": "friction",
   "label": "Coeficiente de fricción",
   "min": 0.1,
   "max": 0.3,
   "step": 0.01,
   "unit": "",
   "decimals": 2
  },
  {
   "id": "arm",
   "label": "Brazo asistente b",
   "min": 6,
   "max": 16,
   "step": 1,
   "unit": "mm",
   "decimals": 0
  }
 ],
 "metrics": [
  {
   "label": "Capacidad de frenado",
   "key": "torque",
   "unit": "N·m",
   "scale": 1,
   "decimals": 1
  },
  {
   "label": "Tensión límite mayor",
   "key": "T1",
   "unit": "N",
   "scale": 1,
   "decimals": 0
  },
  {
   "label": "Tiempo de parada",
   "key": "stopTime",
   "unit": "s",
   "scale": 1,
   "decimals": 2
  },
  {
   "label": "Calor transferido",
   "key": "heat",
   "unit": "kJ",
   "scale": 0.001,
   "decimals": 2
  }
 ],
 "task": "Consigue entre300 y400 N·m, tensión límite mayor ≤2800 N y parada en ≤3 s.",
 "job": "OT-268 · Ajusta una banda diferencial para frenar un rotor equivalente sin exceder el esfuerzo de banda.",
 "equations": "Escenario: radioR=200 mm, arcoθ=240°, fuerzaF=80 N hacia arriba, brazo de mando l=200 mm y brazo resistente a=60 mm. E=exp(μθ); T1/T2=E durante deslizamiento, T1 mayor en el extremo inicial del arco. Momentos alrededor del pivote: Fl+T1b−T2a=0. T2=Fl/(a−bE); M=(T1−T2)R. Giro inverso: Mrev=FlR(E−1)/(aE−b). La solución positiva exige a−bE>0; el motor rechaza el bloqueo fuera de dominio. Inercia equivalenteJ=12 kg·m² y velocidad inicialω0=60 rad/s. ω=max(0,ω0−Mt/J), ts=Jω0/M, ángulo mostrado=[ω0te−Mte²/(2J)]/40, te=min(t,ts). CalorQ=J(ω0²−ω²)/2, potenciaMω, energía inicial21.600 J. Temperatura media orientativa20°C+Q/(8kg·460J/kgK).",
 "limits": "Banda flexible ideal, deslizamiento de Coulomb con μ constante, tensiones cuasiestáticas y palanca rígida. Sin desgaste, deformación, calentamiento que cambie μ, elasticidad, holguras, motor ni control de accionamiento. Tras parar, las tensiones y M describen capacidad límite de deslizamiento, no un par que siga acelerando el rotor; la velocidad permanece cero. Inercia referida de máquina, no deducida sólo del tambor dibujado. Giro ralentizado ×1/40; el tiempo de parada conserva segundos reales. Demostración repuesta cada10s sin simular el motor de rearranque; adquisición de8s. Banda de espesor dibujado3–4mm, fórmula de banda delgada sobre radio nominal; las líneas de acción se trazan sobre ese radio. Palanca desplazada hacia el frente axialmente por claridad: equilibrio2D, sin flexión fuera del plano. El brazo b es distancia perpendicular a la tensión, no longitud del eslabón. Todo el rango de mandos conserva margen positivo hasta bloqueo. Temperatura uniforme orientativa, no mapa térmico superficial ni dictamen de seguridad.",
 "quiz": "¿Por qué el mismo esfuerzo puede frenar más en un sentido que en el opuesto?",
 "answers": [
  "Porque cambia qué extremo tiene mayor tensión y su momento puede ayudar u oponerse al mando.",
  "Porque el radio del tambor cambia al invertir el giro.",
  "Porque la energía cinética depende del color de la banda.",
  "Porque la banda elimina toda tensión al cambiar el giro."
 ],
 "faults": [
  [
   "Asistencia excesiva",
   "La capacidad crece, pero la tensión excede el límite del escenario.",
   "El denominador a−b exp(μθ) se hace pequeño."
  ],
  [
   "Fricción insuficiente",
   "El tambor tarda demasiado en detenerse con el mismo mando.",
   "La diferencia entre tensiones determina el par."
  ],
  [
   "Confundir brazo y longitud",
   "Se usan distancias entre pasadores y no equilibran los momentos.",
   "El brazo es perpendicular a la línea de acción."
  ]
 ],
 "labels": "Tambor · banda · extremo tenso · extremo flojo · pivote · mando · apoyo",
 "caption": "Giro ×1/40 · parada en tiempo real · tensiones límite de deslizamiento",
 "tools": "Tambor con radios, banda de240°, extremos tangentes y palanca con pivote regulable; flechas de tensiones y mando.",
 "procedure": [
  "Sigue los extremos de banda hasta la palanca y localiza el pivote.",
  "Ajusta fricción y brazo b; relaciona las tensiones con la capacidad y el tiempo de parada.",
  "Ensaya un ajuste conforme y compara el sentido inverso después de validar."
 ],
 "timeScale": 1,
 "signals": "Velocidad real del rotor (rad/s)",
 "source": "https://mechanics.ju.se/MachineElements/brakes-clutches.html",
 "sourceName": "Jönköping University · Applied Mechanics,9.19: ecuaciones9.19.6–7,12–17",
 "application": "Evaluar el efecto de la geometría y del sentido de giro en un freno de banda industrial.",
 "originality": "Distinto del CVT156 y frenos de disco: banda diferencial con capstan, momento de cada extremo y balance de energía de una parada.",
 "concepts": [
  {
   "icono": "🌀",
   "nombre": "Tensión por fricción",
   "descripcion": "La tensión cambia exponencialmente a lo largo del arco en deslizamiento."
  },
  {
   "icono": "⚖️",
   "nombre": "Asistencia de palanca",
   "descripcion": "El extremo tenso ayuda al mando y puede amplificar mucho la carga."
  },
  {
   "icono": "🔥",
   "nombre": "Energía de parada",
   "descripcion": "La energía cinética que pierde el rotor se transforma en calor."
  }
 ],
 "tour": [
  {
   "title": "El giro ayuda a apretar",
   "text": "La banda abraza el tambor. Sus extremos tiran de la palanca con fuerzas diferentes.",
   "view": "assembly"
  },
  {
   "title": "Mira el pivote",
   "text": "Moverlo cambia el brazo perpendicular de la tensión que ayuda al mando. La palanca está delante del tambor.",
   "view": "inspection"
  },
  {
   "title": "Entrega un ajuste",
   "text": "Ensaya, comprueba par y tensión y compara después con el giro inverso.",
   "view": "assembly"
  }
 ]
},{
 "id": 269,
 "inspectionDir": [
  0.25,
  0.3,
  1.7
 ],
 "slug": "cuatro-barras-sintesis-trayectoria",
 "title": "Cuatro barras: diseña una trayectoria",
 "longTitle": "Síntesis de trayectoria de un punto de acoplador y ángulo de transmisión",
 "area": "ELEMENTOS DE MÁQUINA",
 "eyebrow": "Orden de trabajo · elementos de máquina",
 "intro": "El punto de una barra puede dibujar una curva compleja. Cambiar dos longitudes transforma toda su trayectoria.",
 "explore": "Ajusta los eslabones para que el lápiz siga la plantilla dorada. Observa también cómo se transmite el movimiento.",
 "controls": [
  {
   "id": "coupler",
   "label": "Longitud del acoplador",
   "min": 110,
   "max": 150,
   "step": 2,
   "unit": "mm",
   "decimals": 0
  },
  {
   "id": "rocker",
   "label": "Longitud del balancín",
   "min": 90,
   "max": 120,
   "step": 2,
   "unit": "mm",
   "decimals": 0
  }
 ],
 "metrics": [
  {
   "label": "Error RMS por vuelta",
   "key": "rms",
   "unit": "mm",
   "scale": 1000,
   "decimals": 2
  },
  {
   "label": "Transmisión mínima",
   "key": "minAngle",
   "unit": "°",
   "scale": 1,
   "decimals": 1
  },
  {
   "label": "Error máximo",
   "key": "maxError",
   "unit": "mm",
   "scale": 1000,
   "decimals": 2
  },
  {
   "label": "Velocidad del lápiz",
   "key": "speed",
   "unit": "mm/s",
   "scale": 1000,
   "decimals": 1
  }
 ],
 "task": "Sigue la plantilla con RMS ≤2 mm, error máximo ≤3 mm y transmisión mínima ≥45° durante la vuelta completa.",
 "job": "OT-269 · Selecciona acoplador y balancín para reproducir una trayectoria de trazado sin degradar la transmisión.",
 "equations": "Mecanismo plano: apoyos O=(0,0),D=(140,0) mm; manivela r=40 mm, giro uniforme7,5 rpm (una vuelta real en8 s). A=r(cosθ,sinθ). B es la intersección positiva de círculos de radios a,b centrados en A,D. Con dvec=D−A,s=|dvec|,u=dvec/s: x=(a²−b²+s²)/(2s),h=√(a²−x²),B=A+xu+h(−uy,ux). Punto P=A+0,65(B−A)+25mm·nAB. Se comparan360 fases uniformes con la plantilla propia fija: RMS=√[Σ|P−Pobjetivo|²/360], además del error máximo. Ángulo de transmisión agudo μ=acos|[(A−B)·(D−B)]/(ab)|. Se toma el mínimo durante360°. Velocidades por derivación del cierre: vB=vA+αdot k×(B−A)=βdot k×(B−D); vP se deriva en el mismo sistema.",
 "limits": "Cinemática de barras rígidas y articulaciones ideales; sin pares, masas, elasticidad, fricción ni dinámica de motor. El objetivo es una trayectoria propia, no perfil de una máquina comercial. Error comparado en la misma fase de entrada, no distancia al punto más cercano ni ajuste libre de giro/escala. Rango completo Grashof estricto; las circunferencias se cortan sin tangencia durante toda la vuelta. El programa rechaza geometrías que no cierran fuera del rango. Planos axiales separados para evitar choques; pasadores unen las piezas y el soporte fijo. Longitudes a20 unidades/m; barras con chaflán y holgura ilustrativa. La línea dorada es la plantilla espacial objetivo, no una medida experimental. La línea turquesa acumula posiciones del lápiz durante una vuelta después de cada cambio de mandos; la predicción completa se reserva al instrumento después de validar. No se deducen fuerzas ni seguridad de máquina del ángulo por sí solo.",
 "quiz": "¿Por qué una postura que coincide con la plantilla no basta para aceptar el diseño?",
 "answers": [
  "Porque deben verificarse la trayectoria y la transmisión durante la vuelta completa.",
  "Porque todos los cuatro barras producen siempre la misma curva.",
  "Porque la longitud de los eslabones sólo importa al detenerse.",
  "Porque el error RMS ignora todas las posiciones excepto la primera."
 ],
 "faults": [
  [
   "Coincidencia en una sola postura",
   "El lápiz toca la plantilla una vez y se aparta en el resto del ciclo.",
   "Compara fases de la vuelta completa."
  ],
  [
   "Transmisión pobre",
   "La trayectoria mejora, pero acoplador y balancín se acercan a estar alineados.",
   "Comprueba el mínimo de μ, no sólo su valor instantáneo."
  ],
  [
   "Cambiar de rama de ensamble",
   "El punto salta bruscamente al otro lado de la línea entre centros.",
   "Mantén la misma intersección y comprueba continuidad."
  ]
 ],
 "labels": "Manivela · acoplador · balancín · apoyos · pasadores · lápiz · plantilla",
 "caption": "Giro real7,5 rpm · plantilla dorada / traza del lápiz turquesa",
 "tools": "Tres eslabones con ojos y chaflanes, apoyos, pasadores axiales, brazo port lápiz y plantilla espacial.",
 "procedure": [
  "Identifica qué eslabones ajustas y sigue el lápiz una vuelta.",
  "Compara error de trayectoria y ángulo mínimo al cambiar cada longitud.",
  "Ensaya un diseño conforme y comprueba la curva completa en el instrumento."
 ],
 "timeScale": 1,
 "signals": "Posición X / Y del lápiz (mm)",
 "source": "https://www.mechref.org/dyn/four_bar_linkages_applications/",
 "sourceName": "MechRef · Four-bar linkages; University of Arkansas · Mechanism Posture and Position Analysis",
 "application": "Sintetizar un mecanismo de trazado o transferencia por trayectoria y transmisión, verificando el ciclo completo.",
 "originality": "Distinto174 (limpiaparabrisas): síntesis de un punto de acoplador con plantilla, error porfase y mínimo de transmisión, no barrido de escobilla.",
 "concepts": [
  {
   "icono": "🔗",
   "nombre": "Cierre geométrico",
   "descripcion": "Las longitudes de los eslabones deben cumplirse simultáneamente en cada postura."
  },
  {
   "icono": "✏️",
   "nombre": "Trayectoria de acoplador",
   "descripcion": "Un punto fijo de la barra intermedia puede seguir una curva más compleja que un arco."
  },
  {
   "icono": "📐",
   "nombre": "Transmisión durante el ciclo",
   "descripcion": "La calidad de transmisión se comprueba en su peor postura, junto con el error de trazado."
  }
 ],
 "tour": [
  {
   "title": "Una barra dibuja una curva",
   "text": "El lápiz es un punto fijo del acoplador. La plantilla dorada conserva siempre la misma forma.",
   "view": "assembly"
  },
  {
   "title": "Inspecciona las articulaciones",
   "text": "Las barras ocupan planos separados y los pasadores las conectan. Sigue el brazo del lápiz.",
   "view": "inspection"
  },
  {
   "title": "Acepta el ciclo completo",
   "text": "Prepara y ensaya. Valida error RMS, error máximo y transmisión mínima, no sólo una postura.",
   "view": "assembly"
  }
 ]
},{
 "id": 270,
 "inspectionDir": [
  0.35,
  0.4,
  1.7
 ],
 "slug": "eje-cubo-chaveta-estriado-interferencia",
 "title": "Eje y cubo: tres formas de transmitir par",
 "longTitle": "Chaveta, estriado e interferencia: comparación de capacidad transmisible",
 "area": "ELEMENTOS DE MÁQUINA",
 "eyebrow": "Orden de trabajo · elementos de máquina",
 "intro": "Un eje puede arrastrar su cubo por una chaveta, varios dientes o presión de contacto. Cada unión tiene su límite.",
 "explore": "Compara las tres secciones. Ajusta la longitud útil y el exceso de diámetro del ajuste prensado.",
 "controls": [
  {
   "id": "length",
   "label": "Longitud útil común",
   "min": 20,
   "max": 60,
   "step": 2,
   "unit": "mm",
   "decimals": 0
  },
  {
   "id": "interference",
   "label": "Interferencia diametral efectiva",
   "min": 8,
   "max": 40,
   "step": 2,
   "unit": "µm",
   "decimals": 0
  }
 ],
 "metrics": [
  {
   "label": "Capacidad de chaveta",
   "key": "Tkey",
   "unit": "N·m",
   "scale": 1,
   "decimals": 1
  },
  {
   "label": "Capacidad de estriado",
   "key": "Tspline",
   "unit": "N·m",
   "scale": 1,
   "decimals": 1
  },
  {
   "label": "Capacidad de interferencia",
   "key": "Tfit",
   "unit": "N·m",
   "scale": 1,
   "decimals": 1
  },
  {
   "label": "Presión de contacto",
   "key": "pressure",
   "unit": "MPa",
   "scale": 0.000001,
   "decimals": 2
  }
 ],
 "task": "Las tres uniones deben reservar ≥1,5 veces250 N·m, con presión ≤45 MPa y longitud ≤50 mm.",
 "job": "OT-270 · Compara tres alternativas para transmitir250 N·m en un eje nominal de40 mm y cubo exterior de75 mm.",
 "equations": "Chaveta12×8 mm, apoyada4 mm en cada flanco resistente del eje/cubo; límite de cortante60 MPa y de aplastamiento100 MPa del escenario. Tkey=min(τadm bLd/2,σadm hLd/4). Estriado paralelo didáctico de12 dientes, diámetro medio40 mm y altura útil2 mm; número efectivo0,75×12=9: Tspline=σadm neff hflanco L d/2. Ajuste de eje macizo/cubo grueso del mismo acero: E=210 GPa,ν=0,30,μ=0,12,d=40 mm,D=75 mm. Exceso DIAMETRAL efectivoδ: p=δE/[d·2D²/(D²−d²)]. Capacidad de fricción Tfit=μpπd²L/2. Lamé en cubo: A=p a²/(b²−a²),B=p a²b²/(b²−a²); σr=A−B/r²,σθ=A+B/r²,ur=[(1−ν)Ar+(1+ν)B/r]/E, a=d/2,b=D/2. En eje us=−p(1−ν)a/E y δ=2[uh(a)−us(a)].",
 "limits": "Modelos estáticos ideales por cortante/aplastamiento, reparto equivalente de dientes y fricción uniforme. Sin resistencia de raíz de estriado, torsión global del eje, fatiga, concentraciones, efectos de extremos ni deformación plástica. Límites y factor de reparto propios del escenario; no perfil DIN/ISO ni ajuste de tolerancias homologado. δ es interferencia efectiva ideal tras posibles pérdidas, no tamaño medido ni selección H7/p6; se omiten rugosidad, temperatura y montaje. El modelo elástico es de tensión plana y materiales iguales. Diámetro nominal40 mm; estriado de raíz38 mm, cabeza radial21 mm y espesor tangencial3 mm, no se evalúa su reducción de sección. Chavetero con asiento centrado a√(20²−6²) mm para conservar4 mm de apoyo lateral por mitad; holgura de techo50µm. Estriado hembra con holgura radial50µm ilustrativa. Cubos muestran sólo la mitad axial trasera; contorno frontal indica la mitad omitida, pero las capacidades usan L completa. Geometría ensamblada nominal concéntrica; deformaciones micrométricas en instrumento, sin solapar los diámetros libres. Giro de inspección prescrito15 rpm sin carga, no simulación de deslizamiento ni rotura bajo250 N·m. Flechas en el ajuste: presión sobre el eje, escala5×10⁻⁹ unidades/Pa.",
 "quiz": "¿Qué dimensión se debe usar en la fórmula de presión si el exceso se midió como diferencia de diámetros?",
 "answers": [
  "La interferencia diametral completa; no volver a dividirla como si fuera un exceso radial.",
  "La mitad, y además dividir otra vez el diámetro del eje entre dos.",
  "La longitud de la chaveta en lugar de la interferencia.",
  "El diámetro exterior del cubo en micrómetros sin conversión."
 ],
 "faults": [
  [
   "Chaveta demasiado corta",
   "El ajuste por fricción cumple, pero la chaveta no reserva suficiente par.",
   "El aplastamiento puede gobernar antes que el cortante."
  ],
  [
   "Interferencia insuficiente",
   "Chaveta y estriado cumplen; el ajuste liso no transmite la reserva requerida.",
   "La fricción depende de presión y longitud de contacto."
  ],
  [
   "Exceso de presión",
   "Aumentar el exceso mejora el agarre, pero supera el límite de contacto.",
   "El cubo también recibe esfuerzo de aro al expandirse."
  ]
 ],
 "labels": "Chaveta · estriado · ajuste prensado · eje · cubo · contacto · media sección",
 "caption": "Giro de inspección15 rpm sin carga · mitad axial del cubo omitida",
 "tools": "Tres uniones en bancada escalonada: ranura y chaveta, estriado complementario y cubo prensado; sección axial y presión radial.",
 "procedure": [
  "Identifica cómo impide el giro cada alternativa y observa su sección.",
  "Compara capacidades al variar longitud e interferencia efectiva.",
  "Ensaya una selección que cumpla las tres uniones y justifica qué límite gobierna."
 ],
 "timeScale": 1,
 "signals": "Capacidad de fricción / chaveta (N·m)",
 "source": "https://mechanics.ju.se/MachineElements/shaft-hub.html",
 "sourceName": "Jönköping University · Shaft–hub joints y Shaft couplings; NPTEL Module4 Lesson1 · chavetas",
 "application": "Comparar uniones eje-cubo por capacidad, dimensiones y presión antes de detallar su fabricación.",
 "originality": "Comparación resistente de tres modos de unión; distinta del montaje térmico de rodamiento215. No repite el calentamiento de un aro: distingue geometría de contacto, aplastamiento y agarre por fricción.",
 "concepts": [
  {
   "icono": "🔑",
   "nombre": "Unión por forma",
   "descripcion": "La chaveta o los dientes transmiten fuerza lateral entre eje y cubo."
  },
  {
   "icono": "⭕",
   "nombre": "Unión por presión",
   "descripcion": "La interferencia genera presión radial; la fricción permite transmitir par."
  },
  {
   "icono": "📐",
   "nombre": "Capacidad y límites",
   "descripcion": "Una mayor capacidad también puede exigir longitud o presión que no están disponibles."
  }
 ],
 "tour": [
  {
   "title": "Tres soluciones para un eje",
   "text": "Abajo están chaveta y estriado. Arriba está el ajuste liso por presión. Los cubos están seccionados.",
   "view": "assembly"
  },
  {
   "title": "Mira el contacto real",
   "text": "La ranura y los dientes tienen su alojamiento. El contorno indica la mitad de cubo omitida por la sección.",
   "view": "inspection"
  },
  {
   "title": "Compara con reserva",
   "text": "Prepara y ensaya. Las tres alternativas deben cumplir la reserva y los límites de longitud y presión.",
   "view": "assembly"
  }
 ]
}];
