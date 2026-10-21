/* Ficha técnica · Convertidor de par y transmisión automática — contenido específico del lab */
fichaTecnica({
  title: 'Convertidor de par y transmisión automática',
  intro: 'Este laboratorio representa un <b>convertidor de par hidrodinámico</b> (impulsor, turbina y estator con álabes, embrague de puenteo y aceite que circula) acoplado a una <b>caja automática planetaria de dos marchas</b> (solar de 20 dientes, satélites de 10, corona de 40) en un coche de 1 500 kg que arranca de 0 a 50 km/h. Se ve el corte con caras hachuradas, el aceite coloreado por temperatura y el pistón del embrague. Las curvas del convertidor son <b>correlaciones didácticas analíticas</b>, no resultados de CFD ni de un banco de pruebas; el resto (pares, velocidades, calor, tiempos) sale de ecuaciones integradas y verificadas.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> la <b>relación de velocidades</b> SR = ω<sub>t</sub>/ω<sub>i</sub>; el <b>par de entrada</b> T<sub>i</sub> = k·ω<sub>i</sub>²·(1 − SR²)<sup>q</sup> con factor de capacidad K = ω<sub>i</sub>/√T<sub>i</sub>; la <b>relación de par</b> TR que cae de 2,2 en el calado a 1 en el punto de acoplamiento (SR = 0,85), con η = SR·TR; el <b>punto de calado</b> como cruce entre la curva del motor y la parábola k·ω²; el <b>embrague de puenteo</b> con par T<sub>lu</sub> = T<sub>cap</sub>·tanh(Δω/ω<sub>0</sub>) y rampa de aplicación; el <b>calor</b> disipado en el aceite (convertidor: T<sub>i</sub>·ω<sub>i</sub> − T<sub>t</sub>·ω<sub>t</sub>; embrague: T<sub>lu</sub>·Δω) con un modelo de aceite de un solo nodo; el <b>planetario</b> por la ecuación de Willis (Z<sub>s</sub>·ω<sub>s</sub> + Z<sub>r</sub>·ω<sub>r</sub> = (Z<sub>s</sub> + Z<sub>r</sub>)·ω<sub>c</sub>); y la <b>dinámica longitudinal</b> del coche con un motor con regulador de ralentí y corte de régimen, integrada con RK4 a 1 ms. En el dibujo: el corte con caras hachuradas, los álabes reales de cada rueda, el estator con su rueda libre, el aceite como partículas, el pistón y el forro del embrague, y el planetario con los dientes que dicen los números.',
    omitidos: [
      '<b>Flujo del aceite</b>: no hay CFD. El toroide se representa con un campo de velocidad angular inventado para que se vea el sentido de la circulación; el caudal y las pérdidas del toro salen sólo de las curvas analíticas del convertidor.',
      '<b>Curvas del convertidor</b>: TR(SR) y K(SR) son correlaciones didácticas con parámetros fijos (TR<sub>0</sub> = 2,2; SR<sub>c</sub> = 0,85). Un convertidor real tiene su curva medida en banco, que depende de su diámetro, de la forma de los álabes y del aceite.',
      '<b>Caja automática</b>: dos marchas ideales sin pérdidas de engranes ni de rodamientos, con cambio instantáneo y sin control hidráulico de presiones. No hay mapa de cambios, kickdown ni lógica de la unidad de control.',
      '<b>Motor</b>: curva de par suavizada, sin temperatura, sin combustible ni emisiones. El coche es de un solo grado de libertad: resistencia a la marcha, sin deslizamiento de neumáticos ni cabeceo.',
      '<b>Térmica</b>: el aceite es un nodo concentrado (C = 6 500 J/K; UA = 45 W/K); no hay gradientes, ebullición ni degradación del aceite ni del forro.'
    ]
  },
  s2: {
    title: 'Parámetros del modelo y cifras de referencia',
    warn: 'Valores didácticos de un turismo con motor de gasolina; un convertidor y una caja reales tienen sus propios mapas medidos.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Motor', 'par máximo · régimen · corte', '190 N·m a 3 800 rpm · corte a 6 500 rpm'],
      ['Inercia del motor', 'integración', 'J<sub>e</sub> = 0,20 kg·m²'],
      ['Convertidor', 'relación de par · acoplamiento', 'TR<sub>0</sub> = 2,2 · SR<sub>c</sub> = 0,85'],
      ['Embrague de puenteo', 'capacidad · rampa', '420 N·m · 0,7 s'],
      ['Planetario', 'solar · satélite · corona', '20 · 10 · 40 dientes (módulo 4 mm, 3 satélites)'],
      ['Relaciones', '1.ª (corona fija) · 2.ª (embrague solar–portasatélites)', '3 : 1 · 1 : 1'],
      ['Grupo final · rueda', 'reducción final', '3,0 : 1 · r<sub>w</sub> = 0,31 m'],
      ['Masa del coche', 'según el reto', '1 350 a 1 800 kg'],
      ['Aceite', 'capacidad térmica · disipación · inicio', '6 500 J/K · 45 W/K · 50 °C'],
      ['Referencias de libro', 'ver Referencias', 'Gillespie · Wong · Heisler · Naunheimer et al.']
    ]
  },
  s3: [
    'Una caja automática se revisa con el motor apagado y el coche asegurado; no se dejan las manos cerca de las poleas ni del volante motor.',
    'Un convertidor que se mantiene en calado (pedal a fondo con el coche frenado) calienta el aceite muy rápido: no pasar de unos segundos.',
    'El aceite caliente de la transmisión quema; se deja enfriar antes de cambiarlo o de abrir la caja.'
  ],
  s4: {
    intro: 'Esta práctica enseña a <b>razonar</b> sobre el convertidor; el ensayo real sigue otros pasos:',
    items: [
      '<b>Prueba de calado (stall test)</b>: con el coche frenado y el pedal a fondo se lee el régimen del motor durante pocos segundos; compararlo con la especificación indica si el convertidor y el motor están sanos. Es una prueba de taller, no una simulación.',
      '<b>Curva del convertidor en banco</b>: se mide par y velocidad de entrada y de salida con distinta carga para trazar K, TR y η contra SR.',
      '<b>Presiones de línea y del embrague de puenteo</b>: con manómetro en los puertos de la caja y el escáner del módulo de control, siguiendo el procedimiento del fabricante.',
      '<b>Temperatura del aceite</b>: se monitorea con el escáner durante la prueba de calado y en remolque; un aceite oscuro u oliendo a quemado indica deslizamiento excesivo.'
    ]
  },
  s5: {
    modela: 'Un convertidor de par y una caja de dos marchas ideales, con curvas analíticas de convertidor, embrague de puenteo con par suave, calor del aceite con un modelo de un nodo y la dinámica de arranque de 0 a 50 km/h en un solo grado de libertad, con el planetario según Willis.',
    noModela: 'No modela el flujo del aceite (no es CFD), el control hidráulico de la caja, el mapa de cambios, las pérdidas por rozamiento de engranes y cojinetes, el comportamiento del motor con la temperatura, ni el patinamiento de los neumáticos. Las curvas del convertidor son correlaciones didácticas, no el ensayo de un convertidor concreto.'
  },
  s6: [
    'Gillespie, T. D. (1992). <i>Fundamentals of Vehicle Dynamics</i>. SAE International.',
    'Wong, J. Y. (2008). <i>Theory of Ground Vehicles</i> (4.ª ed.). Wiley.',
    'Heisler, H. (2002). <i>Vehicle and Engine Technology</i> (2.ª ed.). Butterworth-Heinemann.',
    'Naunheimer, H., Bertsche, B., Ryborz, J., Novak, W. (2011). <i>Automotive Transmissions</i> (2.ª ed.). Springer.'
  ]
});
