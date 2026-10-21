/* Ficha técnica · Estacionamiento automático en paralelo: geometría y sensores ultrasónicos — contenido específico del lab */
fichaTecnica({
  title: 'Estacionamiento automático en paralelo: geometría y sensores ultrasónicos',
  intro: 'Este laboratorio muestra, vista desde arriba y en tiempo real, cómo un coche con asistente se estaciona solo entre dos coches parados. Primero <b>pasa despacio</b> y un sensor ultrasónico de su costado derecho mide el tiempo que tarda el eco; con eso estima dónde terminan un coche y dónde empieza el otro, y por tanto el <b>largo del hueco</b>. Luego se detiene en un punto, <b>retrocede con el volante a un lado y después al otro</b> (una «S» de dos arcos) y, si un vecino se lo impide, avanza y retrocede otra vez: cada cambio de marcha es una <b>maniobra</b>. Todo lo que se mueve (coche, ondas, huella y gráficas) sale del mismo reloj del modelo; el coche usa un modelo cinemático de bicicleta y los vecinos son polígonos de verdad contra los que se mide la distancia.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> la <b>cinemática de bicicleta</b> con el eje trasero como referencia (ẋ = v·cosθ, ẏ = v·senθ, θ̇ = v·tanδ/L, con L = 2,60 m y 33° como giro máximo de las ruedas, que son 528° de volante con una relación de 16:1), integrada con el <b>arco exacto</b> y no con pasos; el radio de giro R = L/tanδ (4,0 m a tope); la <b>«S»</b> de dos arcos iguales, con h = 2R(1 − cosα) y avance 2R·senα; el <b>sensor ultrasónico</b>: tiempo de vuelo d = c·t/2 con c = 331,3 + 0,606·T m/s, un haz cónico de ±30° (25 rayos contra los polígonos reales), alcance de 4,5 m, umbral de decisión a 2,0 m y un pitido cada 0,1 s, de modo que a v km/h cada lectura está a v/36 m de la anterior; la <b>estimación de los bordes</b> (punto medio de las dos lecturas que cruzan el umbral, corregido por lo que el cono «se come»), cuyo error es de hasta la mitad de la separación entre pitidos; el <b>frenado</b> al decidir (3 m/s², así que a más velocidad el coche se pasa más allá del punto pedido); un <b>planificador</b> que trabaja sobre el hueco que el sistema CREE haber medido y se ejecuta contra el hueco REAL (por eso un sensor engañado puede rozar a un vecino); la distancia exacta entre polígonos convexos con las esquinas del coche cortadas; el borde de la acera contra las ruedas; y el <b>número de maniobras</b> (1, 3, 5… tramos, más uno de centrado si hace falta) frente al largo del hueco.',
    omitidos: [
      '<b>La dinámica del coche</b>: no hay deslizamiento de neumáticos, ni inercia, ni la dirección real con su holgura. El volante gira con una rampa de 40°/s en las ruedas y el coche acelera y frena con perfiles fijos, pero las ruedas ruedan sin patinar.',
      '<b>Los sensores traseros y delanteros</b>: un coche real pasa de la lectura lateral a sonar con los de las defensas mientras maniobra. Aquí el plan se hace con el mapa de la pasada y no se corrige con lecturas nuevas durante la maniobra.',
      '<b>El eco real</b>: el eco se calcula con rayos geométricos contra las paredes de los coches, sin la reflexión especular que hace que un costado liso inclinado «no vuelva», sin ruido, sin lóbulos laterales y sin la zona ciega cercana de un sensor real.',
      '<b>La geometría de Ackermann completa</b> en la trayectoria: el coche se mueve con el modelo de bicicleta (una rueda equivalente); las dos ruedas delanteras con sus ángulos distintos sólo se dibujan.',
      '<b>Otros tipos de estacionamiento</b> (en batería, en línea inclinada) y la calle con tráfico, peatones o pendiente.'
    ]
  },
  s2: {
    title: 'Propiedades y parámetros del modelo',
    warn: '⚠ Un asistente de estacionamiento <b>no ve lo que no mide</b>: si pasas rápido, el sensor se equivoca de centímetros sin avisar y el coche puede rozar a un vecino; si el sensor está sucio o hace frío, la distancia que cree medir también es distinta. Los valores de aquí son didácticos, no los de un fabricante.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Coche', 'distancia entre ejes · voladizos delantero y trasero · ancho · largo', '2,60 m · 0,85 y 0,95 m · 1,80 m · 4,40 m'],
      ['Dirección', 'giro máximo de las ruedas · relación del volante · radio mínimo del eje trasero', '33° · 16:1 (528° de volante) · 4,00 m'],
      ['Vecinos', 'largo del de atrás y del de adelante · ancho · esquinas cortadas', '4,6 m y 4,2 m · 1,80 m · 0,22 m'],
      ['Calle', 'el coche al pasar · estacionado · corrimiento lateral h', 'a 0,90 m de los vecinos · a ras de ellos · 2,70 m'],
      ['Sensor', 'posición · haz · alcance · umbral · frecuencia', '3,0 m delante del eje y 0,90 m al costado · ±30° · 4,5 m · 2,0 m · 10 Hz'],
      ['Sonido', 'velocidad según la temperatura', 'c = 331,3 + 0,606·T m/s (343,4 m/s a 20 °C; el sistema supone 20 °C)'],
      ['Hueco mínimo', 'una sola maniobra, según el volante', '6,21 m a 528° · 6,40 m a 475° · 6,63 m a 420° · 7,00 m a 350° · 7,53 m a 280°'],
      ['Maniobras', 'con el volante a 470°', '1 con 6,5 m o más · 2 con 6,2 m · 4 con 5,9 m (según dónde se detenga)'],
      ['Seguridad', 'margen de planificación · hueco mínimo al terminar · contacto', '15 cm · 25 cm a cada lado · distancia < 5 cm cuenta como toque'],
      ['Movimiento', 'frenado al decidir · velocidad en maniobra · rampa del volante', '3 m/s² · 1,0 m/s máx. · 40°/s en las ruedas'],
      ['Mandos del alumno', 'velocidad al pasar · giro del volante · dónde se detiene', '4–20 km/h · 200–528° · −1,0 a +2,5 m respecto de la cara trasera del coche de adelante'],
      ['Los tres huecos', 'largo real · temperatura · maniobras y tiempo permitidos', 'amplio 7,4 m, 20 °C, 1 maniobra, 16 s · justo 6,9 m, 20 °C, 1 maniobra, 12 s · corto 6,4 m, 5 °C, hasta 3 maniobras, 10 s'],
      ['El reto', 'se cumple todo a la vez', 'detecta el hueco · no toca · maniobras permitidas · ≥ 15 cm libres al terminar · ≤ 90 % del volante · a tiempo']
    ]
  },
  s3: [
    'Un ensayo con un sensor ultrasónico real (con su ancho de haz medido y su zona ciega) frente a costados de coches de distintas formas, para sustituir los rayos geométricos por lecturas.',
    'El radio de giro y el avance de la dirección de un coche concreto medidos en pista, para contrastar R = L/tanδ con las ruedas reales.',
    'Las guías de largo mínimo de hueco de un fabricante concreto: la cifra de este laboratorio (≈ 1,4 veces el largo del coche con una maniobra) es el resultado del modelo y no una norma.'
  ],
  s4: {
    intro: 'El orden del laboratorio (cálculo, ajuste, diagnóstico) es una <b>descomposición pedagógica</b>. Un asistente real añade:',
    items: [
      'Usar <b>varios sensores</b> (laterales, de las esquinas y de las defensas) y una cámara, y corregir el plan con las lecturas mientras maniobra, no sólo con la pasada inicial.',
      'Comprobar <b>antes de ofrecer</b> el estacionamiento que el hueco sea, como mínimo, el largo del coche más un margen, y cancelar si algo (un peatón, una bicicleta) se cruza.',
      'Controlar la dirección y el freno con <b>actuadores reales</b>: el volante tarda en girar, el coche patina en el pavimento mojado y la pendiente cambia el frenado.',
      'Compensar la <b>temperatura</b> y la humedad en la velocidad del sonido y detectar un sensor sucio o tapado, que en el laboratorio se ve como un error de 3,6 % en la distancia cuando hace 0 °C.'
    ]
  },
  s5: {
    modela: 'la <b>cinemática de bicicleta</b> con arco exacto (comprobada contra una integración RK4 con diferencia menor de 10⁻⁹ m), el círculo de giro de radio R = L/tanδ, la «S» de dos arcos con sus fórmulas cerradas, la distancia exacta entre polígonos convexos (comprobada contra un muestreo de los contornos a 4 mm), el sensor con tiempo de vuelo, haz cónico y separación entre pitidos, y un <b>planificador</b> cuyo hueco mínimo para una sola maniobra (6,21 m a tope de volante) coincide con la fórmula cerrada S₀ = 0,25 + 0,95 + 2R·senα − a<sub>máx</sub>. Todo cuadra con un solo reloj: el coche, las ondas, la huella y las gráficas salen de la misma línea de tiempo, y el coche sólo cambia de marcha cuando está parado. Cada uno de los tres huecos tiene solución con ventanas interiores en el volante (por ejemplo, de 372° a 468° en el amplio) y en el punto de parada.',
    noModela: 'la <b>dinámica</b> de un coche real (neumáticos, inercia, dirección con holgura), los <b>otros sensores</b> y la corrección del plan durante la maniobra, el <b>eco real</b> (reflexiones especulares, ruido, zona ciega) y otros tipos de estacionamiento. El <b>planificador</b> es un método voraz sencillo (arcos y rectas con la regla «hasta enderezar»), no el de un fabricante; el número de maniobras que da es el de este método, no necesariamente el mínimo posible. Los vecinos son prismas con las esquinas cortadas, no coches con sus retrovisores; el <b>dibujo</b> añade ondas de sonido a cámara lenta (×1/40) para que se vean. No es el sistema de un fabricante ni sirve para dimensionar uno.'
  },
  s6: [
    'Siegwart, R., Nourbakhsh, I. R., Scaramuzza, D., <i>Introduction to Autonomous Mobile Robots</i>, MIT Press, 2.ª ed., 2011 (cinemática de un vehículo tipo coche y radio de giro) (a verificar).',
    'Rajamani, R., <i>Vehicle Dynamics and Control</i>, Springer, 2.ª ed., 2012 (modelo cinemático de bicicleta y geometría de Ackermann) (a verificar).',
    'Paromtchik, I. E., Laugier, C., «Autonomous parallel parking of a nonholonomic vehicle», IEEE Intelligent Vehicles Symposium, 1996 (maniobra de estacionamiento con arcos de círculo) (a verificar).',
    'Bosch, <i>Automotive Handbook</i>, Wiley / Robert Bosch GmbH, 10.ª ed. (sensores ultrasónicos para asistencia al estacionamiento) (a verificar).'
  ]
});
