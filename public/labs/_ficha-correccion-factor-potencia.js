fichaTecnica({
  title: 'Corrección de Factor de Potencia: Diseña el Banco de Capacitores',
  intro: 'En la práctica anterior se midió el triángulo de potencias P+jQ de una carga real. Aquí se resuelve el problema desde el otro lado: dada una carga industrial con potencia activa P y factor de potencia inicial FP₁ atrasado (inductivo), se calcula la potencia reactiva de corrección Qc=P·(tan φ₁−tan φ₂) necesaria para llevar el factor de potencia al objetivo regulatorio FP₂=0.95, y se traduce ese Qc ideal en un banco real armado con pasos comerciales discretos de catálogo (5 a 50 kVAR), buscando la combinación de menor kVAR total que aún cumple la meta.',
  s1: {
    presentes: [
      'Modelo exacto de corrección: φ₁=acos(FP₁), Q₁=P·tan φ₁, φ₂=acos(0.95), Qc=P·(tan φ₁−tan φ₂) — el mismo triángulo de potencias S=P+jQ validado en la práctica anterior, aquí restando un reactivo capacitivo Qc al Q₁ original: Q_neto=Q₁−Qc_banco, S_result=√(P²+Q_neto²), FP_result=P/S_result',
      'Catálogo de 8 pasos comerciales de capacitor conmutables individualmente (5, 10, 15, 20, 25, 30, 40 y 50 kVAR, sin múltiplos por paso) — el banco instalado es la suma de los pasos activos, con 255 combinaciones no vacías posibles por escenario',
      'Banda de cumplimiento simétrica |Q₁−Qc_banco|≤P·tan φ₂ (no un único valor exacto de Qc): modela que tanto instalar de menos como instalar de más aleja el factor de potencia resultante de 1 — sobre-corregir lleva el FP a territorio capacitivo/adelantado, que también incumple la meta en magnitud. Verificado numéricamente sobre 30 escenarios (5 valores de P × 6 de FP₁): entre 6 y 26 combinaciones de las 255 posibles cumplen la banda en cada escenario, sin ningún escenario sin solución',
      'Triángulo de potencias en el pizarrón: vector original (P,Q₁), vector de corrección capacitiva (Qc_banco) y vector resultante (P,Q_neto) superpuestos, con una banda sombreada marcando la zona de cumplimiento — reutiliza la máquina de renderizado polar validada en la práctica de potencia en CA',
      'Modo Reto calificado por cercanía al banco real de menor kVAR (minSum), hallado por búsqueda exhaustiva de las 255 combinaciones de cada escenario, con tolerancia de casi-óptimo Qc_banco≤minSum+5 kVAR calibrada numéricamente para dejar siempre entre 3 y 23 combinaciones aceptables por escenario',
    ],
    omitidos: [
      'Pérdidas dieléctricas, resistencia serie equivalente (ESR) o envejecimiento del capacitor real — cada paso del banco se modela como una reactancia capacitiva ideal y constante',
      'Resonancia armónica entre el banco fijo y cargas no lineales (variadores de frecuencia, rectificadores) — un riesgo real de sobretensión en plantas industriales con bancos fijos, fuera del alcance de este modelo de régimen permanente senoidal puro',
      'Bancos automáticos conmutados por controlador APFC que ajustan los pasos activos en tiempo real según la carga — aquí se modela solo el diseño estático de cuántos pasos instalar para un escenario de P y FP₁ dados',
      'Perfil de carga variable en el tiempo (horario o diario) — P y FP₁ son fijos por escenario, no un perfil que el banco deba seguir promedio',
      'Sistemas trifásicos — P se trata como potencia activa total equivalente monofásica; el desglose por fase queda para la siguiente práctica del backlog',
      'Costo económico real en moneda ($/kVAR, instalación, mantenimiento) — el criterio de optimalidad del Reto es kVAR total instalado como proxy de costo, no una tabla de precios de catálogo real',
    ],
  },
  s2: {
    title: 'Elementos del banco',
    warn: 'P y FP₁ siempre visibles en los tres modos — a diferencia de la práctica de medición, aquí no hay componente sellado que recuperar, el desafío es de diseño/selección, no de lectura instrumental.',
    rows: [
      ['Carga industrial (planta)', 'Potencia activa fija del escenario', 'P∈{50,75,100,150,200} kW', 'Siempre visible en los tres modos; define el punto de operación de la planta a corregir'],
      ['Factor de potencia inicial', 'Ángulo de potencia atrasado (inductivo) de la planta', 'FP₁∈{0.65,0.70,0.75,0.80,0.85,0.90}', 'Siempre visible; determina Q₁=P·tan(acos FP₁), el reactivo a corregir'],
      ['Meta regulatoria', 'Factor de potencia objetivo tras la corrección', 'FP₂=0.95, fijo', 'Constante en los tres modos, tomada del enunciado oficial de la práctica'],
      ['Banco de capacitores', '8 pasos comerciales conmutables en paralelo', '5, 10, 15, 20, 25, 30, 40, 50 kVAR', 'Explora: control continuo equivalente. Banco y Reto: pasos discretos conectables uno a uno'],
      ['Triángulo de potencias', 'Pizarrón', 'Vectores (P,Q₁), (Qc_banco) y (P,Q_neto), banda de cumplimiento sombreada', 'Muestra el colapso hacia FP=1 al acercarse a Qc, y la divergencia si se sobre-corrige'],
    ],
  },
  s3: [
    'Selectores de P y FP₁ de la planta (siempre visibles, no sellados)',
    'Panel de pasos del banco de capacitores con interruptores individuales por paso (5–50 kVAR)',
    'Pizarrón con el triángulo de potencias y la banda de cumplimiento (FP≥0.95) sombreada',
    'Telemetría en vivo: Q₁, Qc_banco, Q_neto, FP_result y kVAR total instalado',
    'Panel de reto con el kVAR objetivo mínimo oculto y verificación de casi-optimalidad',
  ],
  s4: {
    intro: 'Procedimiento para explorar, ensamblar el banco y resolver el reto de diseño óptimo:',
    items: [
      'En el modo Explora, elige P y FP₁ de una carga industrial y mueve el control continuo de compensación Qc. Observa cómo el vector resultante (P,Q_neto) colapsa hacia el eje P (FP→1) a medida que Qc se acerca al valor calculado, y cómo diverge de nuevo —hacia el otro lado, FP capacitivo— si sigues aumentando Qc más allá de lo necesario.',
      'En el modo Banco, con P y FP₁ ya dados, conecta y desconecta pasos individuales del catálogo (5 a 50 kVAR) hasta que la lectura de FP_result entre en la banda de cumplimiento (FP≥0.95). Este modo no califica: es para practicar la combinatoria de pasos antes del reto.',
      'En el modo Reto, se sortea una nueva planta con nuevos valores de P y FP₁. Ensambla la combinación de pasos que cumpla la meta con el MENOR kVAR total posible y presiona "Comprobar banco" — el sistema califica correcto si tu combinación cumple la banda de cumplimiento Y su kVAR total está dentro de 5 kVAR del banco óptimo real, no solo cualquier combinación que funcione.',
    ],
  },
  s5: {
    modela: 'Corrección de factor de potencia por inyección de reactivo capacitivo: Qc=P·(tan φ₁−tan φ₂), reutilizando el triángulo de potencias P+jQ ya validado. Catálogo discreto de 8 pasos comerciales conmutables (5–50 kVAR, sin múltiplos), modelando que un banco real se arma por combinación de unidades de catálogo, no por un valor continuo. Banda de cumplimiento simétrica |Q₁−Qc_banco|≤P·tan φ₂ que penaliza tanto la sub- como la sobre-corrección, verificada sobre 30 escenarios P×FP₁ (6–26 combinaciones válidas de 255 posibles, ningún escenario sin solución). Modo Reto calificado por cercanía al banco real de menor kVAR (minSum+5 kVAR de tolerancia, 3–23 combinaciones aceptables por escenario).',
    noModela: 'Pérdidas dieléctricas, ESR o envejecimiento del capacitor real (modelado como reactancia ideal); resonancia armónica con cargas no lineales; bancos automáticos conmutados en tiempo real (controlador APFC); perfil de carga variable en el tiempo; sistemas trifásicos (P es una potencia activa equivalente monofásica); costo económico real en moneda (el criterio de optimalidad es kVAR total, no precio de catálogo). Los pasos de catálogo (5–50 kVAR) son representativos de bancos comerciales típicos, no una lista de precios de fabricante específico.',
  },
  s6: [
    'Hayt, W. H., Kemmerly, J. E. y Durbin, S. M. — Análisis de circuitos en ingeniería (McGraw-Hill): potencia compleja, triángulo de potencias, corrección de factor de potencia.',
    'Boylestad, R. — Introductory Circuit Analysis (Pearson): corrección de factor de potencia mediante bancos de capacitores en paralelo.',
    'Enríquez Harper, G. — El ABC de las instalaciones eléctricas industriales (Limusa): dimensionamiento de bancos de capacitores comerciales por pasos estándar de catálogo.',
    'CFE — factor de potencia mínimo 0.90 en cargas menores a 1 MW, 0.95 a 0.97 en cargas de 1 MW o mayores; Código de Red RES/550/2021.',
    'Verificación numérica propia (sesión de construcción, node -e sobre script standalone): 30 escenarios P×FP₁ con 6–26 combinaciones válidas de 255 posibles cada uno; tolerancia de casi-óptimo del Reto (minSum+5 kVAR) calibrada para dejar 3–23 combinaciones aceptables por escenario.',
  ],
});
