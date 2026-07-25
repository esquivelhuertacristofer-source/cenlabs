fichaTecnica({
  title: 'Desbalance Trifásico y Corriente por el Conductor de Neutro',
  intro: 'En un sistema trifásico de cuatro hilos (estrella con neutro), tres cargas independientes —una por fase— rara vez drenan la misma corriente. Cuando están desbalanceadas, sus corrientes de fase ya no se cancelan y el conductor de neutro transporta la diferencia de retorno. Esta práctica muestra que esa corriente de neutro es la suma FASORIAL de las tres corrientes de fase (IN=IA+IB+IC), no su suma aritmética: como los fasores están a 120°, se cancelan en parte, y el neutro real es mucho menor que la suma de magnitudes. Solo con carga perfectamente balanceada el neutro no conduce (IN=0). La práctica introduce además las componentes simétricas de Fortescue —secuencia positiva (I1), negativa (I2) y cero (I0)— con la relación central IN=3·I0.',
  s1: {
    presentes: [
      'Corriente de neutro como suma fasorial exacta de tres corrientes de fase resistivas a 0°/−120°/+120°: IN=IA+IB+IC, con IA=Ia∠0°, IB=Ib∠−120°, IC=Ic∠+120° (verificado node -e)',
      'Contraste con la trampa clásica de la suma aritmética (Ia+Ib+Ic): en el catálogo del Reto la suma aritmética queda SIEMPRE ≥15 A del valor real de |IN| y jamás dentro de la tolerancia de la predicción',
      'Caso balanceado (Ia=Ib=Ic ⇒ IN=0, el neutro no lleva corriente) y desbalanceado (IN≠0, el neutro conduce), incluido el extremo de fase abierta (una corriente en cero)',
      'Descomposición en componentes simétricas: I0=(IA+IB+IC)/3 (secuencia cero), I1=(IA+a·IB+a²·IC)/3 (positiva, igual al promedio de las tres para cargas resistivas), I2=(IA+a²·IB+a·IC)/3 (negativa), con a=1∠120°',
      'Relación central IN=3·I0 (la corriente de neutro es exactamente tres veces la componente de secuencia cero) y factor de desbalance de corriente |I2|/|I1|',
      'Reconstrucción exacta IA=I0+I1+I2 (verificada numéricamente), que cierra el ciclo terna desbalanceada ↔ componentes simétricas',
      'Reto verificado: corrientes ∈{5,10,15,20,25,30} A con desbalance visible (max−min≥10) → 180 escenarios, |IN|∈[8.66,25] A (nunca trivial), tolerancia tol=máx(1.5 A, 6%·|IN|)',
    ],
    omitidos: [
      'Desfase de las corrientes por cargas reactivas: aquí cada carga es resistiva (corriente en fase con su tensión de fase); con cargas RL/RC los ángulos individuales cambiarían la suma fasorial',
      'Impedancia del conductor de neutro y el corrimiento del punto de estrella que aparecería sin neutro o con neutro impedante (aquí el neutro se supone ideal, sin caída de tensión)',
      'Elevación de la tensión en las fases con carga ligera que produce un neutro impedante o abierto (sobretensiones peligrosas en instalaciones reales)',
      'Armónicos de orden triple (3ª, 9ª, 15ª…) de cargas no lineales, que se SUMAN en el neutro (son de secuencia cero) y en la práctica real son la otra gran causa de sobrecarga del neutro',
      'Efectos térmicos del conductor y su dimensionamiento (calibre del neutro): se estudian en la práctica de ampacidad y caída de tensión',
      'La fuente se supone rígida y perfectamente balanceada (VF=127 V constante en las tres fases)',
    ],
  },
  s2: {
    title: 'Elementos del sistema de cuatro hilos',
    warn: 'En Explora y Componentes las tres corrientes de fase son ajustables (misma carga, dos lecturas: fasorial y en componentes simétricas). En el Reto las corrientes vienen dadas por el escenario y el desafío es predecir la magnitud de la corriente de neutro |IN|. No hay componente sellado que recuperar: el reto es de análisis fasorial, no de lectura instrumental.',
    rows: [
      ['Fuente trifásica de 4 hilos', 'Tres fases a 120° (VF=127 V) más neutro', 'Rígida y balanceada', 'Se supone ideal: VF constante en las tres fases'],
      ['Carga fase A / B / C', 'Tres cargas resistivas independientes fase-neutro', 'Ia, Ib, Ic ∈{0,5,…,30} A', 'Cada una drena su propia corriente; el brillo del módulo indica su magnitud'],
      ['Punto de estrella de la carga', 'Une los retornos de las tres cargas', '—', 'De aquí sale el conductor de neutro hacia la fuente'],
      ['Conductor de neutro (4º hilo)', 'Transporta la suma fasorial de retorno IN=IA+IB+IC', '|IN|∈[0,30] A según desbalance', 'Su brillo ámbar es proporcional a |IN|; balanceado ⇒ apagado (IN=0)'],
      ['Pinza amperimétrica', 'Mide directamente la corriente por el neutro', 'Lectura |IN| en A', 'Confirma que el neutro conduce mucho menos que la suma aritmética'],
      ['Pizarrón fasorial', 'Suma punta-cola de las 3 corrientes y componentes simétricas', 'IN=3·I0 · |I2|/|I1|', 'Hace visible por qué la suma es fasorial y no aritmética'],
    ],
  },
  s3: [
    'Selectores de las tres corrientes de fase Ia, Ib, Ic (en Explora y Componentes)',
    'Selector de modo: Explora (suma fasorial), Componentes (simétricas) y Reto (predicción)',
    'Pizarrón con el diagrama fasorial: cadena punta-cola IA→IB→IC y la resultante IN que cierra el polígono',
    'Vista de componentes simétricas: ternas positiva (I1), negativa (I2) y cero (I0), con IN=3·I0',
    'Pinza amperimétrica con lectura digital de |IN| sobre el conductor de neutro',
    'Telemetría en vivo: Ia/Ib/Ic, suma aritmética (trampa), |IN|, ángulo, I0/I1/I2 y factor de desbalance',
    'Controles de predicción (−/+) y botón de comprobación en el modo Reto',
  ],
  s4: {
    intro: 'Procedimiento para explorar el desbalance, las componentes simétricas y resolver el reto:',
    items: [
      'En Explora, ajusta las tres corrientes de fase. Igualalas (por ejemplo 20/20/20 A) y verifica que la corriente de neutro cae a cero: en balanceado los tres fasores a 120° se cancelan. Luego desbalancéalas (30/15/10 A) y observa cómo el neutro conduce —pero mucho menos que la suma aritmética 55 A—: en el pizarrón, la cadena punta-cola IA→IB→IC muestra por qué la resultante IN es pequeña.',
      'En Componentes, mira la misma carga descompuesta en secuencia positiva (I1, giro normal), negativa (I2, que mide el desbalance y calienta motores) y cero (I0). Comprueba la relación central IN=3·I0 y que, al balancear, tanto I2 como I0 se anulan y solo queda la secuencia positiva útil.',
      'En Reto, se sortea una carga desbalanceada con las tres corrientes fijas. Suma los fasores punta-cola en el pizarrón, estima la magnitud de la corriente de neutro |IN| con los botones −/+ y pulsa "Comprobar predicción". El sistema califica correcto si tu predicción cae dentro de la tolerancia (±máx(1.5 A, 6%·|IN|)); cuidado con caer en la suma aritmética.',
    ],
  },
  s5: {
    modela: 'Corriente de neutro de un sistema trifásico de cuatro hilos con tres cargas resistivas desbalanceadas como suma fasorial exacta IN=IA+IB+IC (IA=Ia∠0°, IB=Ib∠−120°, IC=Ic∠+120°); caso balanceado (IN=0) y desbalanceado (IN≠0); descomposición en componentes simétricas de Fortescue I0/I1/I2 con la relación IN=3·I0, el factor de desbalance |I2|/|I1| y la reconstrucción exacta IA=I0+I1+I2. El contraste con la suma aritmética está verificado numéricamente: la trampa queda siempre ≥15 A del valor real en el catálogo del Reto, que tiene 180 escenarios con |IN|∈[8.66,25] A.',
    noModela: 'Desfase de las corrientes por cargas reactivas (aquí resistivas puras); impedancia del neutro y corrimiento del punto de estrella; sobretensiones por neutro impedante o abierto; armónicos de orden triple que se suman en el neutro (otra causa real de sobrecarga); efectos térmicos y dimensionamiento del conductor de neutro. La fuente se supone rígida y perfectamente balanceada (VF=127 V constante).',
  },
  s6: [
    'Fortescue, C. L. — Method of Symmetrical Coordinates Applied to the Solution of Polyphase Networks (1918): fundamento de las componentes simétricas positiva, negativa y cero.',
    'Hayt, W. H., Kemmerly, J. E. y Durbin, S. M. — Análisis de circuitos en ingeniería (McGraw-Hill): sistemas polifásicos desbalanceados y corriente de neutro.',
    'Enríquez Harper, G. — El ABC de las instalaciones eléctricas industriales (Limusa): sistemas de cuatro hilos, desbalance y conductor de neutro.',
    'Grainger, J. y Stevenson, W. — Análisis de sistemas de potencia (McGraw-Hill): componentes simétricas y su aplicación a fallas y desbalances.',
    'NOM-001-SEDE-2022 (Instalaciones eléctricas — utilización): Art. 220, cálculo del conductor de neutro y cargas desbalanceadas; consideración de armónicos triples en el neutro.',
    'Verificación numérica propia (sesión de construcción, node -e): IN=3·I0 exacto; reconstrucción IA=I0+I1+I2 exacta; 180 escenarios de Reto con |IN|∈[8.66,25] A y la suma aritmética siempre ≥15 A del valor real, fuera de la tolerancia.',
  ],
});
