# Ficha de práctica — Corrección de Factor de Potencia: Diseña el Banco de Capacitores (`mecanica-71`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** quinta práctica del hueco D1-CA, y la primera que es un problema de
> **diseño** en vez de medición. `mecanica-67..70` caracterizan o miden un circuito ya
> dado; aquí el estudiante recibe el diagnóstico (P y FP₁ de una carga inductiva real,
> calculados exactamente como en `mecanica-70`) y debe **decidir** qué banco de
> capacitores comerciales instalar para corregirlo — cerrando el ciclo medición→diseño
> del sub-dominio de potencia en CA antes de que `d1-14` introduzca sistemas trifásicos.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-71
sector: mecanica-electronica
practica_maestra: "d1-13 🔴 — Diseña el banco de capacitores para corregir el FP a 0.95 (molde S)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ELE-III"   # LISTA-MAESTRA-200-PRACTICAS.md, fila d1-13: "Qc=P(tan φ₁−tan φ₂)" · "ELE-III"
modulo: "Circuitos eléctricos CD y CA (D1)"
submodulo: "Corriente alterna: corrección de factor de potencia y bancos de capacitores"   # ⚑ heredado por analogía del submódulo de mecanica-67..70; confirmar clave exacta
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ heredado sin cambio de mecanica-60..70; confirmar que sigue aplicando a diseño de corrección de FP
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de calcular la potencia reactiva de corrección
  Qc=P·(tan φ₁−tan φ₂) requerida para llevar una carga inductiva real de un factor de
  potencia inicial FP₁ (atrasado) a un factor de potencia objetivo FP₂=0.95, reconocer
  que los bancos de capacitores comerciales solo existen en pasos discretos de catálogo
  (no como un valor continuo), y seleccionar la combinación de pasos que cumple la meta
  con el menor kVAR total instalado, evitando tanto la sub-corrección (sigue fuera de
  norma) como la sobre-corrección (aleja el FP de 1 en sentido capacitivo y cuesta
  equipo de más sin beneficio).
actividad_clave: >
  Explora libremente la potencia activa P y el factor de potencia inicial FP₁ de una
  carga industrial, y mueve un control continuo de compensación Qc para observar en el
  triángulo de potencias cómo el ángulo total colapsa hacia FP=1 a medida que Qc crece
  hacia el valor calculado, y cómo se aleja de nuevo (en sentido capacitivo) si se
  excede; en el modo Banco, con P y FP₁ de la planta ya conocidos y visibles, ensambla
  un banco real conectando/desconectando pasos estándar de capacitores (5 a 50 kVAR)
  hasta que el factor de potencia resultante entre en la banda de cumplimiento
  (FP₂≥0.95), con lectura de cumplimiento en vivo, sin calificación; en el reto, con
  una nueva planta (nuevo P y FP₁ aleatorios), encuentra la combinación de pasos que
  cumple la meta con el MENOR kVAR total instalado posible, no solo cualquier
  combinación que cumpla.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modo Explora: potencia activa P seleccionable de un catálogo P_CANDS=[50,75,100,150,200] kW y factor de potencia inicial FP₁ seleccionable de FP1_CANDS=[0.65,0.70,0.75,0.80,0.85,0.90] (todas inductivas/atrasadas, consistente con el enunciado de LISTA-MAESTRA que solo pide corregir FP atrasado). Con P y FP₁ fijos se calcula φ₁=acos(FP₁), Q₁=P·tan φ₁, S₁=P/FP₁. Un control continuo de Qc_instalado (0 a un máximo que cubre holgadamente el rango de sobre-corrección) resta reactivo capacitivo del triángulo: Q_neto=Q₁−Qc_instalado, S_result=√(P²+Q_neto²), FP_result=P/S_result. El pizarrón dibuja el triángulo de potencias original (P,Q₁) y el resultante (P,Q_neto) superpuestos, mostrando el colapso hacia el eje P cuando Qc_instalado→Q₁·(el valor exacto de corrección a FP₂=0.95) y la divergencia de nuevo si Qc_instalado sigue creciendo más allá."
  - "Modelo de corrección: Qc=P·(tan φ₁−tan φ₂), con φ₂=acos(FP2_TARGET), FP2_TARGET=0.95 fijo (el objetivo declarado en LISTA-MAESTRA, fila d1-13). Este es el mismo triángulo de potencias validado en mecanica-70 (S=P+jQ, verificado ahí con discrepancia máxima 3.553e-15 entre dos métodos independientes de cómputo); aquí se reutiliza sin cambios, solo restando un Qc capacitivo al Q₁ original."
  - "Catálogo de pasos comerciales: CAP_STEPS=[5,10,15,20,25,30,40,50] kVAR, 8 unidades independientes conmutables (cada una se conecta o no, sin múltiplos — un paso de 50 kVAR no puede duplicarse). El banco instalado es la suma de los pasos activos; 2⁸−1=255 combinaciones no vacías posibles por escenario."
  - "Banda de cumplimiento: una combinación de pasos con suma Qc_banco cumple la meta si |Q₁−Qc_banco|≤P·tan φ₂ (el resultado cae dentro de ±tan φ₂ del eje P, banda simétrica alrededor de Q_neto=0 medida contra el ángulo objetivo, no un único valor de Qc). Esto modela correctamente que tanto la sub-corrección como la sobre-corrección alejan el FP resultante de 1 — sobre-corregir lleva el FP a territorio capacitivo/adelantado, que también incumple la meta de FP≥0.95 en magnitud."
  - "Barrido de verificación numérica: las 30 combinaciones de P_CANDS×FP1_CANDS (5×6) tienen entre 6 y 26 combinaciones de pasos válidas (que cumplen la banda) de las 255 posibles por escenario — ningún escenario queda sin solución. El banco de menor kVAR total (minSum) se calcula por búsqueda exhaustiva sobre las 255 combinaciones de cada escenario."
  - "Modo Banco: P y FP₁ del escenario dados y visibles (no aleatorios en cada visita — fijos para practicar), el estudiante conecta/desconecta pasos individuales del catálogo mediante controles tipo interruptor; lectura en vivo de Qc_banco, Q_neto, FP_result y si cumple o no la banda de cumplimiento (sin calificación, modo de práctica libre)."
  - "Modo Reto: se sortea un nuevo par (P,FP₁) de los mismos catálogos P_CANDS/FP1_CANDS. El estudiante debe entregar una combinación de pasos cuya suma Qc_banco (a) cumpla la banda de cumplimiento Y (b) esté dentro de una tolerancia de casi-óptimo respecto al mínimo real: Qc_banco≤minSum+5 kVAR (TOL_KVAR=5). Verificado numéricamente: esta tolerancia deja entre 3 y 23 combinaciones aceptables por escenario (nunca menos de 3), evitando que el reto tenga una única solución exacta imposible de acertar por prueba y error razonada."
  - "Pizarrón: triángulo de potencias (P eje X, Q eje Y, S hipotenusa) mostrando el vector original (P,Q₁), el vector de corrección capacitiva (Qc_banco, negativo/hacia abajo) y el vector resultante (P,Q_neto), con una banda sombreada indicando la zona de cumplimiento (FP≥0.95) — reutiliza el patrón de dibujo vectorial polar validado en mecanica-70."
normatividad:          # 🔒 verificar clave y vigencia
  - "CFE — factor de potencia mínimo 0.90 en cargas menores a 1 MW, 0.95 a 0.97 en cargas de 1 MW o mayores; penalización económica por debajo del mínimo (LISTA-MAESTRA-200-PRACTICAS.md, fila d1-13). ⚑ Confirmar cita exacta del documento tarifario/contractual de CFE vigente (no localizado un número de norma único, a diferencia del Código de Red)."
  - "Código de Red — RES/550/2021 (Comisión Reguladora de Energía / Código de Red del Sistema Eléctrico Nacional), citado en LISTA-MAESTRA como referencia del requisito de factor de potencia. ⚑ Confirmar sección/artículo específico aplicable a cargas industriales (el código regula principalmente la interconexión de centrales de generación; su aplicabilidad directa a la corrección de FP en cargas de consumo debe verificarla el experto)."
  - "ELE-III — anclaje curricular tomado del mapeo interno (LISTA-MAESTRA-200-PRACTICAS.md, fila d1-13); confirmar clave y vigencia exacta con el plan de estudios."
simulador_modela:      # 🔒
  - "Modelo exacto de corrección de factor de potencia por inyección de reactivo capacitivo: Qc=P·(tan φ₁−tan φ₂), reutilizando sin cambios el triángulo de potencias P+jQ validado en mecanica-70 (S=P+jQ)."
  - "Catálogo discreto de 8 pasos comerciales de capacitor (5–50 kVAR) conmutables individualmente, sin múltiplos por paso — modela correctamente que un banco real se arma por combinación de unidades de catálogo, no por un valor continuo de diseño."
  - "Banda de cumplimiento simétrica |Q₁−Qc_banco|≤P·tan φ₂ (no un único Qc exacto): modela que tanto la sub-corrección como la sobre-corrección (hacia FP capacitivo/adelantado) incumplen la meta de FP≥0.95, verificado con 6–26 combinaciones válidas de 255 posibles en cada uno de los 30 escenarios P×FP1."
  - "Modo Reto calificado por cercanía al banco de menor kVAR real (minSum, hallado por búsqueda exhaustiva de las 255 combinaciones del escenario), con tolerancia de casi-óptimo Qc_banco≤minSum+5 kVAR calibrada numéricamente para dejar siempre 3–23 combinaciones aceptables por escenario."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Pérdidas dieléctricas, resistencia serie equivalente (ESR) ni envejecimiento del capacitor real — cada paso del banco se modela como una reactancia capacitiva ideal y constante."
  - "Resonancia armónica entre el banco de capacitores fijo y cargas no lineales (variadores de frecuencia, rectificadores) — un riesgo real de sobretensión en instalaciones industriales con bancos fijos, pero fuera del alcance de este modelo de régimen permanente senoidal puro."
  - "Bancos automáticos conmutados (controlador APFC) que ajustan los pasos activos en tiempo real según la carga — esta práctica modela solo el diseño ESTÁTICO de cuántos pasos instalar para un escenario de P y FP₁ dados, no el control dinámico de conmutación."
  - "Perfil de carga variable en el tiempo (horario/diario) — P y FP₁ son fijos por escenario; el diseño real de un banco óptimo promedio consideraría la variación de la carga a lo largo del día, no un único punto de operación."
  - "Sistemas trifásicos — P se trata como una potencia activa total equivalente monofásica; el desglose por fase y el efecto de un banco de capacitores en configuración estrella/delta trifásica es el alcance de la siguiente práctica del backlog (d1-14, sistemas trifásicos Y/Δ)."
  - "Costo económico real en moneda ($/kVAR, instalación, mantenimiento) — el criterio de optimalidad del Reto es kVAR total instalado como proxy de costo, no una tabla de precios de catálogo real."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte del reto: la combinación de pasos de capacitor (de los 8 disponibles, 5–50 kVAR) que el estudiante ensambla para un escenario nuevo de P y FP₁, calificada por el sistema como correcta si cumple la banda de cumplimiento (FP₂≥0.95) Y su kVAR total está dentro de 5 kVAR del banco óptimo real (mínimo kVAR que cumple)."
evidencia_desempeno: "Guía de observación de la aplicación correcta de Qc=P·(tan φ₁−tan φ₂) para calcular la corrección necesaria, y del criterio de selección del banco de menor kVAR total que aún cumple la meta (no solo 'cualquier banco que cumpla'), incluyendo el reconocimiento explícito de que sobre-instalar capacitor es tan incorrecto como no instalar suficiente."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué CFE penaliza el bajo factor de potencia, qué hace físicamente un capacitor en paralelo con una carga inductiva, y por qué el diseño real es una combinatoria de pasos discretos de catálogo, no un valor exacto (briefing.ts)."
desarrollo: "Práctica en el simulador: explora (ajusta P y FP₁ de la carga, mueve un control continuo de compensación y observa el colapso/divergencia del triángulo de potencias) → banco (con P y FP₁ dados, conecta pasos reales de catálogo hasta cumplir la meta, sin calificación) → reto (nueva planta con nuevo P y FP₁, encuentra el banco de menor kVAR total que cumple)."
cierre: "Ficha técnica (capa 2) con el modelo completo de corrección de factor de potencia, la banda de cumplimiento simétrica y su justificación física, y el catálogo de pasos comerciales usado como base del diseño."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Hayt, W. H., Kemmerly, J. E. y Durbin, S. M. — Análisis de circuitos en ingeniería (McGraw-Hill): potencia compleja, triángulo de potencias, corrección de factor de potencia."
  - "Boylestad, R. — Introductory Circuit Analysis (Pearson): corrección de factor de potencia mediante bancos de capacitores en paralelo."
  - "Enríquez Harper, G. — El ABC de las instalaciones eléctricas industriales (Limusa): dimensionamiento de bancos de capacitores comerciales por pasos estándar de catálogo. ⚑ Verificar edición/capítulo exacto con el experto."
  - "LISTA-MAESTRA-200-PRACTICAS.md, fila d1-13: CFE FP mín. 0.90 (<1 MW), 0.95→0.97 (≥1 MW); Código de Red RES/550/2021."
  - "Verificación numérica propia (sesión de construcción, node -e sobre script standalone): 30 escenarios P_CANDS×FP1_CANDS con 6–26 combinaciones válidas de 255 posibles cada uno (ningún escenario sin solución); tolerancia de casi-óptimo del Reto (minSum+5 kVAR) calibrada para dejar 3–23 combinaciones aceptables por escenario."
banderas_incertidumbre:
  - "⚑ Catálogo de pasos CAP_STEPS=[5,10,15,20,25,30,40,50] kVAR: son valores representativos de catálogos comerciales típicos de bancos de baja tensión, no tomados de una lista de precios de fabricante específico. Confirmar con el experto si estos pasos son representativos de lo que se instala realmente en plantas mexicanas de este rango de potencia (50–200 kW)."
  - "⚑ Tolerancia de casi-óptimo en Reto (minSum+5 kVAR, no un porcentaje relativo): se eligió un valor absoluto porque el espaciamiento entre pasos de catálogo (5 kVAR mínimo) hace que una tolerancia relativa sea inconsistente entre escenarios pequeños y grandes de P. Confirmar si el experto prefiere una tolerancia relativa (p. ej. ±10% del minSum) en su lugar."
  - "⚑ FP2_TARGET fijo en 0.95 en los tres modos (no seleccionable): LISTA-MAESTRA especifica '0.95' explícitamente en el título de la fila d1-13 ('corregir el FP a 0.95'), así que se fijó como constante de diseño en vez de exponerlo como variable — confirmar que esto no oculta el caso de cargas ≥1 MW donde CFE exige 0.95–0.97 (rango, no un único valor)."
  - "⚑ P tratado como potencia activa monofásica equivalente sin desglose trifásico: heredado de la simplificación de mecanica-67..70; confirmar que es pedagógicamente aceptable dejar el tratamiento trifásico completo para d1-14."
  - "⚑ Aplicabilidad exacta del Código de Red RES/550/2021 a cargas de consumo (no de generación): citado en LISTA-MAESTRA pero el código regula principalmente interconexión de centrales; confirmar con el experto si la cita es correcta o si existe un instrumento normativo más directo (p. ej. condiciones generales para prestación del servicio de CFE) para el requisito de FP en cargas industriales."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (quinta práctica del hueco D1-CA, primera de diseño en vez
   de medición):** `d1-13` cierra el ciclo medición→diseño de potencia en CA: `d1-12`
   enseña a MEDIR P, Q, S y FP de una carga real combinada; `d1-13` toma ese mismo
   triángulo de potencias y pregunta qué hacer al respecto — diseñar el banco de
   capacitores que corrige el factor de potencia a la meta regulatoria. El modelo físico
   (S=P+jQ) es idéntico al ya validado en `mecanica-70`; lo nuevo es la capa de
   combinatoria de catálogo discreto y el criterio de optimalidad (menor kVAR que
   cumple).
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/correccion-factor-potencia.html](../../../public/labs/correccion-factor-potencia.html))
   mostrará el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) igual que el
   resto de la familia, declarando explícitamente que el capacitor es ideal (sin
   pérdidas ni ESR), que no se modela resonancia armónica con cargas no lineales, y que
   el control dinámico de bancos automáticos (APFC) queda fuera de alcance — siguiendo
   la regla de honestidad del proyecto (rangos y catálogos representativos, no cifras
   inventadas).
3. **Petición concreta al experto:** (a) confirmar que el catálogo de 8 pasos
   (5–50 kVAR) es representativo de bancos comerciales reales para el rango de potencia
   de planta usado (50–200 kW); (b) validar la tolerancia de casi-óptimo del Reto
   (minSum+5 kVAR absoluto) frente a una alternativa relativa; (c) confirmar la cita
   normativa exacta aplicable a FP en cargas de consumo (Código de Red vs. condiciones
   de suministro de CFE); (d) confirmar las claves curriculares ⚑ heredadas por
   analogía (submódulo, ocupación SINCO).
