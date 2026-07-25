# Ficha de práctica — Desbalance Trifásico y Corriente por el Neutro (`mecanica-73`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** séptima práctica del sub-dominio D1-CA y complemento directo de
> `mecanica-72`. Mientras `mecanica-72` estudia el sistema trifásico BALANCEADO ideal
> (In=0 por construcción, tres ramas idénticas), esta práctica levanta exactamente esa
> restricción: modela tres cargas independientes DESBALANCEADAS, donde el conductor de
> neutro sí conduce, y muestra que su corriente es la suma FASORIAL (no aritmética) de las
> tres corrientes de fase. Introduce además las componentes simétricas de Fortescue
> (I0/I1/I2) con la relación central IN=3·I0, cumpliendo la especificación de la lista
> maestra ("ΣI fases; intro a componentes simétricas").

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-73
sector: mecanica-electronica
practica_maestra: "d1-15 🔴 — Analiza el desbalance trifásico y la corriente por el neutro (molde S)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ELE-V"   # LISTA-MAESTRA-200-PRACTICAS.md, fila d1-15: "ΣI fases; intro a componentes simétricas" · "ELE-V"
modulo: "Circuitos eléctricos CD y CA (D1)"
submodulo: "Corriente alterna: sistemas trifásicos desbalanceados, corriente de neutro y componentes simétricas"   # ⚑ heredado por analogía del submódulo de mecanica-67..72; confirmar clave exacta
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ heredado sin cambio de mecanica-60..72; confirmar que sigue aplicando a análisis de sistemas trifásicos desbalanceados
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de analizar un sistema trifásico de cuatro hilos
  con cargas desbalanceadas: calcular la corriente del conductor de neutro como la suma
  FASORIAL de las tres corrientes de fase (IN=IA+IB+IC, con IA=Ia∠0°, IB=Ib∠−120°,
  IC=Ic∠+120°) y distinguirla de la suma aritmética Ia+Ib+Ic; reconocer que solo el
  sistema balanceado (Ia=Ib=Ic) anula la corriente de neutro; descomponer una terna
  desbalanceada en sus componentes simétricas de secuencia positiva (I1), negativa (I2) y
  cero (I0), y aplicar la relación central IN=3·I0 y el factor de desbalance |I2|/|I1|; y
  predecir la magnitud de la corriente de neutro de una carga dada sin caer en la trampa de
  la suma aritmética.
actividad_clave: >
  Explora libremente las tres corrientes de fase Ia, Ib, Ic observando en el pizarrón
  fasorial cómo la cadena punta-cola de los tres fasores de corriente define, con el vector
  que cierra el polígono, la corriente de neutro (suma fasorial), y cómo al igualar las tres
  corrientes el neutro cae a cero; en el modo Componentes ve la misma carga descompuesta en
  las ternas positiva (I1), negativa (I2) y cero (I0), comprobando IN=3·I0 y el factor de
  desbalance; en el Reto, con una carga desbalanceada sorteada y las corrientes fijas,
  predice la magnitud de la corriente de neutro |IN| dentro de una tolerancia, evitando la
  trampa de sumar las magnitudes.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modo Explora: tres corrientes de fase Ia, Ib, Ic seleccionables de EXP_STEPS=[0,5,10,15,20,25,30] A (el 0 permite el caso de fase abierta). Modelo puro: cargas resistivas fase-neutro alimentadas por una fuente rígida y balanceada (VF=127 V), corrientes en fase con su tensión de fase, IA=Ia∠0°, IB=Ib∠−120°, IC=Ic∠+120°. La corriente de neutro es la suma fasorial IN=IA+IB+IC. El pizarrón dibuja los tres fasores desde el origen y la cadena punta-cola IA→IB→IC, con la resultante ámbar (IN) que cierra el polígono; a la derecha, tabla de magnitudes y el contraste explícito con la suma aritmética (la trampa)."
  - "Resultado central verificado numéricamente (node -e): IN=3·I0 exacto y reconstrucción IA=I0+I1+I2 exacta. El caso balanceado (Ia=Ib=Ic) da IN=0, I2=0, I0=0; el caso de una sola fase cargada (Ib=Ic=0) da IN=Ia con las tres componentes iguales a Ia/3."
  - "Modo Componentes: la misma carga (comparte Ia/Ib/Ic con Explora) descompuesta en componentes simétricas de Fortescue con a=1∠120°: I0=(IA+IB+IC)/3 (secuencia cero, tres corrientes en fase), I1=(IA+a·IB+a²·IC)/3 (positiva, igual al promedio (Ia+Ib+Ic)/3 para cargas resistivas), I2=(IA+a²·IB+a·IC)/3 (negativa, mide el desbalance). El pizarrón muestra las tres ternas y el panel de relaciones clave: IA=I0+I1+I2, IN=3·I0, factor de desbalance |I2|/|I1|, y que balanceado ⇒ I2=0, I0=0, IN=0."
  - "Conductor de neutro 3D: la escena representa la fuente de 4 hilos, tres módulos de carga (uno por fase, con brillo proporcional a su corriente), el punto de estrella de la carga y el conductor de neutro (ámbar) cuyo brillo es proporcional a |IN|; una pinza amperimétrica con lectura digital muestra |IN| medido directamente sobre el 4º hilo. Balanceado ⇒ neutro apagado."
  - "Modo Reto: se sortea una carga desbalanceada con las tres corrientes fijas de RETO_STEPS=[5,10,15,20,25,30] A garantizando desbalance visible (max−min≥10). El estudiante estima la magnitud de la corriente de neutro |IN| con controles −/+ y comprueba dentro de la tolerancia tol=máx(1.5 A, 6%·|IN|). Verificado numéricamente: 180 escenarios válidos, |IN|∈[8.66,25] A (nunca trivial), y la suma aritmética Ia+Ib+Ic queda SIEMPRE ≥15 A del valor real y jamás dentro de la tolerancia (la trampa nunca 'acierta' por casualidad)."
  - "Recorrido guiado (runAuto): muestra el caso balanceado (20/20/20 A ⇒ IN≈0), lo desbalancea (30/15/10 A ⇒ IN≈18 A ≠ 55 A aritméticos), pasa a Componentes para verificar IN=3·I0, y resuelve el Reto fijando la predicción al valor real; responde el quiz correcto de cada modo."
normatividad:          # 🔒 verificar clave y vigencia
  - "NOM-001-SEDE-2022 (Instalaciones Eléctricas — utilización): Art. 220, cálculo de cargas y del conductor de neutro; consideración de cargas desbalanceadas y de armónicos de orden triple que se suman en el neutro (LISTA-MAESTRA-200-PRACTICAS.md, fila d1-15). ⚑ Confirmar artículo/sección específica aplicable al dimensionamiento del neutro por desbalance y por armónicos."
  - "Método de las componentes simétricas — C. L. Fortescue (1918), Method of Symmetrical Coordinates: base teórica de la descomposición I0/I1/I2. Estándar en el análisis de sistemas de potencia."
  - "ELE-V — anclaje curricular tomado del mapeo interno (LISTA-MAESTRA-200-PRACTICAS.md, fila d1-15); confirmar clave y vigencia exacta con el plan de estudios."
simulador_modela:      # 🔒
  - "Corriente de neutro de un sistema trifásico de cuatro hilos con tres cargas resistivas desbalanceadas como suma fasorial exacta IN=IA+IB+IC (IA=Ia∠0°, IB=Ib∠−120°, IC=Ic∠+120°); caso balanceado (IN=0) y desbalanceado (IN≠0), incluida la fase abierta (una corriente en cero)."
  - "Contraste con la suma aritmética (la trampa clásica): verificado numéricamente que en el catálogo del Reto la suma Ia+Ib+Ic queda siempre ≥15 A del valor real de |IN|."
  - "Componentes simétricas de Fortescue: I0=(IA+IB+IC)/3, I1 (positiva, = promedio de las tres para cargas resistivas), I2 (negativa), con reconstrucción exacta IA=I0+I1+I2, la relación IN=3·I0 y el factor de desbalance |I2|/|I1| (todo verificado con node -e)."
  - "Reto verificado numéricamente: 180 escenarios de carga desbalanceada con |IN|∈[8.66,25] A; predicción calificada con tolerancia tol=máx(1.5 A, 6%·|IN|); la trampa aritmética nunca cae dentro de la tolerancia."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Desfase de las corrientes por cargas reactivas: cada carga es resistiva (corriente en fase con su tensión de fase). Con cargas RL/RC los ángulos individuales cambiarían la suma fasorial; aquí se aísla el efecto del desbalance de magnitudes."
  - "Impedancia del conductor de neutro y el corrimiento del punto de estrella que aparecería sin neutro o con neutro impedante: el neutro se supone ideal, sin caída de tensión."
  - "Elevación de la tensión en fases con carga ligera por neutro impedante o abierto (sobretensiones reales en instalaciones defectuosas)."
  - "Armónicos de orden triple (3ª, 9ª, 15ª…) de cargas no lineales que se SUMAN en el neutro (son de secuencia cero) y en la práctica real son la otra gran causa de sobrecarga del neutro. Se mencionan en el briefing y en el quiz pero no se simulan cuantitativamente."
  - "Efectos térmicos del conductor de neutro y su dimensionamiento (calibre): se estudian en la práctica de ampacidad y caída de tensión (d1-16)."
  - "La fuente se supone rígida y perfectamente balanceada (VF=127 V constante en las tres fases)."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte del reto: la predicción de la magnitud de la corriente de neutro |IN| que el estudiante estima para una carga desbalanceada sorteada, calificada por el sistema como correcta si cae dentro de la tolerancia tol=máx(1.5 A, 6%·|IN|) del valor fasorial real."
evidencia_desempeno: "Guía de observación del uso correcto de la suma fasorial (no aritmética) para la corriente de neutro, del reconocimiento del caso balanceado (IN=0), de la descomposición en componentes simétricas y de la aplicación de la relación IN=3·I0."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué el neutro conduce en un sistema desbalanceado, por qué la corriente de neutro es la suma fasorial y no aritmética de las tres fases, qué son las componentes simétricas y de dónde sale la relación IN=3·I0 (briefing.ts)."
desarrollo: "Práctica en el simulador: explora (ajusta Ia, Ib, Ic; observa la cadena fasorial punta-cola y la resultante de neutro; iguala las corrientes para ver IN→0) → componentes (descompone la carga en I0/I1/I2 y verifica IN=3·I0) → reto (carga desbalanceada sorteada, predice |IN| dentro de la tolerancia)."
cierre: "Ficha técnica (capa 2) con la definición fasorial de la corriente de neutro, el contraste con la suma aritmética, las componentes simétricas completas y la relación IN=3·I0."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Fortescue, C. L. — Method of Symmetrical Coordinates Applied to the Solution of Polyphase Networks (Trans. AIEE, 1918): fundamento de las componentes simétricas."
  - "Hayt, W. H., Kemmerly, J. E. y Durbin, S. M. — Análisis de circuitos en ingeniería (McGraw-Hill): sistemas polifásicos desbalanceados y corriente de neutro."
  - "Grainger, J. y Stevenson, W. — Análisis de sistemas de potencia (McGraw-Hill): componentes simétricas y su aplicación a desbalances y fallas."
  - "Enríquez Harper, G. — El ABC de las instalaciones eléctricas industriales (Limusa): sistemas de cuatro hilos, desbalance y conductor de neutro. ⚑ Verificar edición/capítulo exacto con el experto."
  - "LISTA-MAESTRA-200-PRACTICAS.md, fila d1-15: ΣI fases; intro a componentes simétricas; NOM-001-SEDE-2022; ELE-V."
  - "Verificación numérica propia (sesión de construcción, node -e): IN=3·I0 exacto; reconstrucción IA=I0+I1+I2 exacta; 180 escenarios de Reto con |IN|∈[8.66,25] A y la suma aritmética siempre ≥15 A del valor real, fuera de la tolerancia."
banderas_incertidumbre:
  - "⚑ Catálogo de corrientes EXP_STEPS=[0,5,…,30] A y RETO_STEPS=[5,…,30] A: elegido para producir desbalances visibles y didácticos con |IN| no trivial. Confirmar con el experto si el rango es representativo o si conviene otra escala."
  - "⚑ Cargas resistivas puras (φ=0 por fase): se aísla deliberadamente el efecto del desbalance de MAGNITUDES sin mezclarlo con desfases por reactancia. Confirmar si el experto desea introducir cargas con ángulo distinto por fase (aumentaría la complejidad del cálculo fasorial y del catálogo del Reto)."
  - "⚑ Tolerancia del Reto tol=máx(1.5 A, 6%·|IN|): calibrada numéricamente para que la trampa aritmética jamás caiga dentro de la tolerancia (verificado sobre los 180 escenarios). Confirmar si el experto prefiere otra tolerancia (se revisaría con node -e antes de cambiarla)."
  - "⚑ Relación IN=3·I0 y factor de desbalance |I2|/|I1|: son las definiciones estándar de componentes simétricas; confirmar que la profundidad de 'intro a componentes simétricas' pedida por la lista maestra es la adecuada para el nivel (se presentan como resultado y visualización, sin exigir el álgebra compleja al estudiante)."
  - "⚑ Aplicabilidad exacta de NOM-001-SEDE-2022 (Art. 220) al dimensionamiento del neutro por desbalance y por armónicos: confirmar el artículo/sección específico con el experto."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (séptima práctica del hueco D1-CA, complemento del balanceado):**
   `d1-15` levanta la restricción central de `mecanica-72` (tres ramas idénticas, In=0 por
   construcción) para modelar el caso real de cargas desbalanceadas, donde el conductor de
   neutro es protagonista. Su valor pedagógico está en desmontar la trampa más común
   —sumar aritméticamente las corrientes de fase— y en introducir las componentes
   simétricas de Fortescue con la relación IN=3·I0, todo verificado numérica y
   dinámicamente.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/desbalance-trifasico.html](../../../public/labs/desbalance-trifasico.html))
   muestra el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) igual que el resto
   de la familia, declarando explícitamente que las cargas son resistivas puras (se aísla
   el desbalance de magnitudes), que el neutro se supone ideal, y que no se simulan los
   armónicos de orden triple (aunque se mencionan como la otra causa real de sobrecarga del
   neutro) — siguiendo la regla de honestidad del proyecto.
3. **Petición concreta al experto:** (a) confirmar la cita normativa exacta de
   NOM-001-SEDE-2022 aplicable al dimensionamiento del neutro por desbalance y por
   armónicos triples; (b) validar que la profundidad de "intro a componentes simétricas" es
   la adecuada para el nivel; (c) opinar sobre si conviene introducir cargas con ángulo
   distinto por fase; (d) confirmar las claves curriculares ⚑ heredadas por analogía
   (submódulo, ocupación SINCO).
