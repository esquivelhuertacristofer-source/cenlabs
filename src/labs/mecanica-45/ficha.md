# Ficha de práctica — Circuito Equivalente por Ensayos de Vacío y Cortocircuito (`mecanica-45`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** segunda práctica del dominio D5 (Transformadores) — d5-02 de 16.
> Es una práctica de **molde S+P** (esquemático + panel de instrumentos virtual, sin
> objeto físico de inspección detallada como su pareja d5-01): el elemento central es
> el esquemático interactivo que alterna entre el diagrama del ensayo activo y el
> circuito equivalente resultante, con cada rama (Rc, Xm, Req, Xeq) identificable al
> tocarla. Reutiliza deliberadamente el mismo transformador de control de 500 VA /
> 220-24 V que d5-01 (mecanica-44) como unidad de ejemplo, para reforzar la continuidad
> narrativa de que ambas prácticas ensayan la misma unidad con propósitos distintos.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-45
sector: mecanica-electronica
practica_maestra: "d5-02 — Obtiene el circuito equivalente por ensayos de vacío y cortocircuito (molde S+P) — tomado literalmente de la fila d5-02 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ELE-II; UAX Máquinas — tomado literalmente de la columna 'Asignatura(s)' de la fila d5-02 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
norma_ancla_lista_maestra: "IEC 60076 — tomado literalmente de la columna 'Norma ancla' de la fila d5-02; la lista maestra cita solo la familia de norma sin cláusula, por lo que las cláusulas específicas (11.4 para el ensayo de vacío, 11.5 para el de cortocircuito) son investigación propia de esta sesión, no una cita textual de la tabla."
modulo: "Transformadores (D5)"
submodulo: "Ensayos de rutina de transformadores monofásicos: circuito equivalente, regulación de voltaje y eficiencia"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ código reutilizado de d5-01/D2/D10 (mismo perfil ocupacional general de electricidad/electrónica); confirmar si existe una clave SINCO más específica de ensayos de transformadores/subestaciones antes de publicar la trazabilidad
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de ejecutar el ensayo de vacío (excitación en
  baja tensión con el devanado de alta en circuito abierto) y calcular la rama de
  magnetización Rc=Voc²/Poc, Xm=Voc²/Q0 (Q0=√(S0²−Poc²), S0=Voc·Ioc), referida al lado
  de alta tensión con a²=(N1/N2)²; ejecutar el ensayo de cortocircuito (excitación en
  alta tensión hasta la corriente nominal con el devanado de baja en cortocircuito) y
  calcular la rama serie Zeq=Vsc/Isc, Req=Psc/Isc², Xeq=√(Zeq²−Req²); estimar la
  regulación de voltaje a plena carga con la fórmula aproximada de 2° orden
  %VR=%Req·cosθ+%Xeq·sinθ+(%Xeq·cosθ−%Req·sinθ)²/200 para un factor de potencia dado en
  atraso; y calcular la eficiencia a una fracción de carga x con
  η(x)=x·S·FP/(x·S·FP+Poc+x²·Psc), identificando la fracción de carga x_máx=√(Poc/Psc)
  que produce la eficiencia máxima (IEC 60076-1, Cláusulas 11.4 y 11.5; ANSI/IEEE
  C57.12.90, Cláusula 8).
actividad_clave: >
  Resuelve 4 casos sobre la misma escena 3D persistente (banco de tensión reducida con
  variac, el transformador de control de 500 VA / 220-24 V ya conocido de d5-01, puente
  de cortocircuito conmutable, banco de carga conmutable y un esquemático interactivo
  que alterna entre el diagrama de ensayo y el circuito equivalente): Caso 1, ensayo de
  vacío (excitación en BT, AT abierto) para obtener Rc/Xm; Caso 2, ensayo de
  cortocircuito (excitación en AT hasta corriente nominal, BT en corto) para obtener
  Req/Xeq; Caso 3, regulación de voltaje a plena carga con FP=0.80 en atraso, usando
  Req/Xeq ya obtenidos; Caso 4, eficiencia a plena carga y fracción de carga de
  eficiencia máxima, usando directamente Poc y Psc medidos en los dos ensayos previos.
  Cada caso se resuelve con una pregunta de opción múltiple con distractores derivados
  de errores conceptuales reales.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Identifica los cuatro terminales del transformador (H1, H2 al frente, alta tensión, bujes rojos; X1, X2 atrás, baja tensión, bujes azules), el puente de cortocircuito entre X1-X2 (visible solo en el caso de cortocircuito) y el banco de carga (visible solo en los casos de regulación de voltaje y eficiencia)."
  - "Caso 1 · Ensayo de vacío: con AT (H1-H2) en circuito abierto, excita BT (X1-X2) con Voc=24.00 V, lee Ioc=1.04 A y Poc=8.00 W. Calcula S0=Voc·Ioc=24.96 VA, Q0=√(S0²−Poc²)≈23.64 VAR, Rc(BT)=Voc²/Poc=72.00 Ω, Xm(BT)=Voc²/Q0≈24.36 Ω; referidos a AT con a²=(220/24)²≈84.03: Rc(AT)≈6050.0 Ω, Xm(AT)≈2047.10 Ω."
  - "Caso 2 · Ensayo de cortocircuito: con BT (X1-X2) en cortocircuito, excita AT (H1-H2) hasta la corriente nominal Isc=kVA·1000/V1n=500/220≈2.27 A, aplicando Vsc=13.20 V y leyendo Psc=12.90 W. Calcula Zeq=Vsc/Isc≈5.81 Ω, Req=Psc/Isc²≈2.50 Ω, Xeq=√(Zeq²−Req²)≈5.24 Ω; %Z=Vsc/V1n×100=6.00%."
  - "Caso 3 · Regulación de voltaje: con Req/Xeq del Caso 2 expresados como %Req≈2.58% y %Xeq≈5.42% (referidos a la impedancia base Zbase=V1n/Isc≈96.8 Ω), y FP=0.80 en atraso (cosθ=0.80, sinθ=0.60), calcula %VR=%Req·cosθ+%Xeq·sinθ+(%Xeq·cosθ−%Req·sinθ)²/200≈5.35%."
  - "Caso 4 · Eficiencia: usa directamente Poc=8.00 W (pérdidas fijas, del Caso 1) y Psc=12.90 W (pérdidas a corriente nominal, del Caso 2). A plena carga (x=1, FP=1.0): η≈95.99%. La fracción de carga de eficiencia máxima es x_máx=√(Poc/Psc)≈0.79, con η_máx≈96.10% — NO ocurre a plena carga."
  - "En cada uno de los 4 casos, responde la pregunta de opción múltiple eligiendo entre la conclusión correcta y distractores derivados de errores conceptuales reales (confundir impedancia total Zeq con la parte resistiva Req, usar Poc en vez de Q0 para la reactancia de magnetización, dividir en vez de multiplicar por a² al referir de BT a AT, invertir cosθ/sinθ en la fórmula de %VR, aplicar el signo de FP en adelanto a un caso en atraso, asumir que la eficiencia máxima siempre ocurre a plena carga, invertir la razón Poc/Psc dentro de la raíz de x_máx, o tratar las pérdidas variables como proporcionales a la corriente en vez de su cuadrado)."
  - "Usa 'Ensayo automático (guiado)' para ver la secuencia completa de cada caso narrada paso a paso (preparar el devanado no excitado según exige el ensayo, energizar, leer los tres instrumentos, calcular) como referencia antes o después de resolverlo por cuenta propia."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60076-1 'Power transformers — Part 1: General' — norma ancla explícita de la fila d5-02 en la lista maestra; Cláusula 11.4 (medición de la impedancia de cortocircuito y la pérdida de carga) y Cláusula 11.5 (medición de la pérdida y corriente en vacío)."
  - "ANSI/IEEE C57.12.90 'Test Code for Liquid-Immersed Distribution, Power, and Regulating Transformers' — Cláusula 8 (ensayos de rutina de vacío y cortocircuito). No citada en la columna 'Norma ancla' de la lista maestra, pero es el código de ensayo que define el procedimiento paso a paso — sin él, el ensayo quedaría sin método verificable de referencia norteamericana."
  - "CFE K0000-04 — Especificación de transformadores de distribución y potencia (práctica mexicana, convención de terminales H1/H2-X1/X2 usada en este lab, misma unidad de ejemplo que d5-01)."
  - "NMX-J-116-ANCE / NMX-J-169-ANCE — normas mexicanas de transformadores de distribución y potencia; ANCE las declara NO equivalentes directas a IEC ni a ANSI/IEEE, dato citado explícitamente en la ficha in-app para no sobre-afirmar equivalencia normativa."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "El procedimiento del ensayo de vacío (excitación en BT con AT abierto) y su triángulo de potencias S0=Voc·Ioc, Q0=√(S0²−Poc²), Rc=Voc²/Poc, Xm=Voc²/Q0, calculado en tiempo real por vacioStats() a partir de constantes de caso, referido al lado de AT multiplicando por a²=(N1/N2)² — verificado por recomputación exacta de vacioStats() en Node antes de escribir esta ficha: S0=24.96 VA, Q0≈23.64321 VAR, Rc(BT)=72.00 Ω, Xm(BT)≈24.3622 Ω, Rc(AT)≈6050.00 Ω, Xm(AT)≈2047.10 Ω."
  - "El procedimiento del ensayo de cortocircuito (excitación en AT hasta corriente nominal con BT en corto) y su triángulo de impedancias Zeq=Vsc/Isc, Req=Psc/Isc², Xeq=√(Zeq²−Req²), calculado en tiempo real por cortoStats() — verificado manualmente: Isc≈2.2727 A, Zeq≈5.808 Ω, Req≈2.497 Ω, Xeq≈5.244 Ω, %Z=6.00%."
  - "La fórmula aproximada de regulación de voltaje con corrección de 2° orden %VR=%Req·cosθ+%Xeq·sinθ+(%Xeq·cosθ−%Req·sinθ)²/200 para FP=0.80 en atraso, calculada en tiempo real por regulacionStats() a partir de %Req y %Xeq referidos a la impedancia base del ensayo de cortocircuito — verificado manualmente: %Req≈2.580%, %Xeq≈5.417%, %VR≈5.353%."
  - "La fórmula de eficiencia η(x)=x·S·FP/(x·S·FP+Poc+x²·Psc) y la condición de eficiencia máxima x_máx=√(Poc/Psc) (donde pérdidas fijas Poc igualan a las variables x²·Psc), calculadas en tiempo real por eficienciaStats() reutilizando Poc y Psc de los dos ensayos previos — verificado manualmente: η(x=1)≈95.987%, x_máx≈0.7875, η_máx≈96.096%."
  - "Un esquemático interactivo (canvas 2D sobre un panel 3D) que alterna entre el diagrama del ensayo activo (fuente, amperímetro, wattmetro, voltímetro, devanado excitado, devanado tratado según el ensayo) y el diagrama del circuito equivalente resultante (Rc, Xm, Req, Xeq, carga), con cada elemento identificable al tocarlo y sus valores numéricos ya calculados mostrados en el propio esquemático."
  - "Tres instrumentos de panel (voltímetro, amperímetro, wattmetro) con aguja y lectura digital que responden al valor calculado de cada caso, con escala de despliegue ajustada por caso (campos cosméticos vScale/iScale/pScale, no una afirmación de física)."
  - "Generador de opciones de quiz derivado de errores conceptuales reales por caso (impedancia total confundida con la parte resistiva, Poc usado en vez de Q0, signo invertido al referir por a², cosθ/sinθ intercambiados, signo de FP en adelanto aplicado a un caso en atraso, eficiencia máxima asumida siempre a plena carga, razón Poc/Psc invertida, pérdidas variables tratadas como lineales en vez de cuadráticas), con retroalimentación explicativa específica por distractor, referenciando los valores numéricos ya calculados del caso activo."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "La ubicación exacta aproximada-vs-exacta de la rama de magnetización (shunt) dentro del circuito equivalente — se usa el modelo aproximado estándar (rama shunt en un extremo), sin comparar contra el circuito exacto con la rama shunt en el punto intermedio real entre Req/2 y Xeq/2 de cada lado."
  - "La variación de Rc y Xm con el nivel de saturación del núcleo — se tratan como constantes obtenidas de un único punto de ensayo (Voc de referencia), no como funciones no lineales de la tensión aplicada."
  - "La separación de pérdidas dispersas (stray losses) de las pérdidas óhmicas puras dentro de Psc — Req agrupa toda la componente resistiva medida en el ensayo de cortocircuito, sin desagregar."
  - "La corrección de Req por temperatura de referencia normativa (temperatura de ensayo real vs. temperatura de referencia de diseño) — Req se usa tal como resulta del ensayo, sin corrección térmica."
  - "El incremento gradual y monitoreado de la tensión de cortocircuito hasta alcanzar la corriente nominal — Vsc es una constante fija ya calibrada para producir exactamente la corriente nominal, sin modelar el proceso de ajuste progresivo con vigilancia de sobrecorriente."
  - "La equivalencia de la norma mexicana NMX-J-116/169 con IEC o ANSI — ANCE las declara explícitamente NO equivalentes directas, dato citado en la ficha in-app para no sobre-afirmar equivalencia normativa."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte de los 4 casos con sus valores numéricos (Rc/Xm, Req/Xeq/%Z, %VR, η y x de eficiencia máxima) para el transformador de control ensayado."
evidencia_desempeno: "Guía de observación de la ejecución correcta del procedimiento de cada ensayo (tratamiento correcto del devanado no excitado — abierto en vacío, en corto en cortocircuito —, lectura de los tres instrumentos, cálculo correcto de cada rama del circuito equivalente) y de la justificación de cada respuesta del quiz con el criterio o fórmula correspondiente."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué dos ensayos de baja potencia (vacío y cortocircuito) bastan para predecir el comportamiento del transformador bajo carga real sin necesidad de ensayarlo bajo esa carga, y qué revela cada uno (rama de magnetización vs. rama serie) (briefing.ts)."
desarrollo: "Práctica en el simulador: ensayo de vacío → ensayo de cortocircuito → regulación de voltaje a plena carga → eficiencia y condición de eficiencia máxima, cada uno con su esquemático interactivo (diagrama de ensayo / circuito equivalente) → quiz de opción múltiple con distractores de error conceptual real por caso → modo automático guiado como referencia."
cierre: "Ficha técnica (capa 2) con la tabla de los dos ensayos y sus lecturas, el contrato de fidelidad completo (SÍ/NO modela, incluyendo la aclaración explícita sobre la simplificación del circuito aproximado y la no-corrección térmica de Req) y las normas de referencia (IEC 60076-1, ANSI/IEEE C57.12.90, CFE K0000-04, NMX-J-116/169-ANCE con su no-equivalencia declarada)."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "IEC 60076-1 — norma ancla de las cláusulas de medición de vacío y cortocircuito, confirmada explícitamente por la columna 'Norma ancla' de la fila d5-02 en la lista maestra."
  - "ANSI/IEEE C57.12.90, Cláusula 8 — código de ensayo de rutina; no citada en la lista maestra pero indispensable para el método paso a paso de referencia norteamericana."
  - "CFE K0000-04 — convención de terminales H1/H2-X1/X2 de práctica mexicana, misma unidad de ejemplo que d5-01."
  - "NMX-J-116-ANCE / NMX-J-169-ANCE — normas mexicanas, declaradas NO equivalentes directas a IEC/ANSI por ANCE."
banderas_incertidumbre:
  - "⚑ La clave SINCO 2641/7541 se reutiliza de d5-01/D2/D10 — confirmar si existe una clave SINCO más específica de ensayos de transformadores/subestaciones antes de publicar la trazabilidad."
  - "⚑ Decisión de ingeniería sobre el lado de referencia: el ensayo de vacío se excita deliberadamente en BT (más seguro y práctico en banco de laboratorio con tensión reducida) y el de cortocircuito en AT (donde la corriente nominal es menor y más fácil de alcanzar con una fuente de banco), y ambos resultados se refieren al lado de AT para un circuito equivalente único — esta es una decisión pedagógica común en la práctica de laboratorio, pero confirmar con el experto si el orden/lado de excitación esperado por el programa oficial (ELE-II; UAX Máquinas) coincide con esta elección antes de escalar el patrón."
  - "⚑ El circuito equivalente se modela con la simplificación 'aproximada' estándar (rama shunt Rc‖Xm en un extremo, rama serie Req+jXeq en el otro) en vez del circuito 'exacto' con la rama shunt en el punto intermedio real — es la simplificación de uso más común en cursos de máquinas eléctricas, pero confirmar con el experto si el programa oficial exige presentar también el circuito exacto para contraste."
  - "✅ Corrección post-commit (2026-07-15): la asignación original de Cláusulas 11.4/11.5 de IEC 60076-1 estaba invertida (decía 11.4=vacío, 11.5=cortocircuito). Confirmado contra el texto primario de IEC 60076-1:2011 Ed.3.0 (extracción pdftotext de dos copias independientes del estándar, TOC y cuerpo verbatim coincidentes): **11.3** = 'Measurement of voltage ratio and check of phase displacement' (combinada, no separada de la relación de transformación); **11.4** = 'Measurement of short-circuit impedance and load loss' (ensayo de cortocircuito); **11.5** = 'Measurement of the no-load loss and current' (ensayo de vacío). Corregido en esta ficha, en el comentario de cabecera de circuito-equivalente-transformador.body.js y en _ficha-circuito-equivalente-transformador.js. Año de edición (2011, Ed.3.0) ahora confirmado; no se verificó si existe una edición 2023 posterior — confirmar antes de publicar la trazabilidad con año si eso importa."
  - "⚑ Los valores de ensayo (Voc, Ioc, Poc, Vsc, Psc) y el factor de potencia de 0.80 en atraso del Caso 3 son constantes ilustrativas elegidas a mano para que Xeq resulte claramente dominante sobre Req (relación de imagen razonable de un transformador de control pequeño) — no provienen de una hoja de datos de fabricante específico; confirmar si conviene anclarlas a un caso de placa real antes de escalar el patrón a otras prácticas de D5."
  - "⚑ Este es d5-02, segunda práctica de D5, y reutiliza deliberadamente la unidad de 500 VA / 220-24 V ya presentada en d5-01 (mecanica-44) como decisión de continuidad narrativa — los valores de placa (kVA, V1n, V2n) coinciden entre ambas prácticas, pero los valores de ensayo (Voc/Ioc/Poc/Vsc/Psc) son específicos de esta práctica y no aparecen en d5-01."
  - "✅ Verificación de implementación: completa — recomputación manual de vacioStats()/cortoStats()/regulacionStats()/eficienciaStats() (acuerdo exacto con el código fuente), Jest completo tras `npm run gen:labs` (ver conteo exacto en la sección de notas abajo), y verificación funcional con Playwright contra el HTML construido y servido localmente (los 4 casos, el ciclo de quiz, y el modo 'Ensayo automático (guiado)', 0 errores de consola/página). Ver sección de notas abajo para el detalle numérico."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (segunda práctica de D5):** d5-02 continúa el dominio de
   Transformadores con una práctica de molde S+P (esquemático + panel de instrumentos)
   que reutiliza deliberadamente la misma unidad de ejemplo de d5-01 (transformador de
   control 500 VA, 220/24 V) para reforzar que ambas prácticas ensayan la misma unidad
   con propósitos de ingeniería distintos: d5-01 verifica si el devanado está sano y
   conoce su polaridad; d5-02 caracteriza su comportamiento eléctrico completo (circuito
   equivalente) sin necesidad de ensayarlo bajo carga real. La decisión de diseño más
   importante de esta práctica es usar el **circuito equivalente aproximado estándar**
   (rama shunt en un extremo) en vez del exacto, y **no separar** las pérdidas dispersas
   ni corregir Req por temperatura — simplificaciones de nivel introductorio explícitas
   en el contrato de fidelidad.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/circuito-equivalente-transformador.html](../../../public/labs/circuito-equivalente-transformador.html))
   muestra el panel "🔒 Contrato de fidelidad" con las fórmulas de Rc/Xm/Req/Xeq, la
   fórmula de %VR, la fórmula de eficiencia, y la declaración explícita de las
   simplificaciones del circuito aproximado — documentado en la sección 5 de la ficha
   técnica in-app
   ([_ficha-circuito-equivalente-transformador.js](../../../public/labs/_ficha-circuito-equivalente-transformador.js))
   y en el encabezado de fidelidad del propio archivo fuente
   (`circuito-equivalente-transformador.body.js`).
3. **Verificación de implementación:** ✅ **Verificado.** Recomputación numérica exacta
   de `vacioStats()`/`cortoStats()`/`regulacionStats()`/`eficienciaStats()` (script Node
   independiente ejecutado con `node -e`, reimplementando las funciones desde el
   entendimiento documentado de las fórmulas, no copiando el código fuente) contra los
   valores esperados: S0=24.96 VA, Q0≈23.64321 VAR, Rc(BT)=72.00 Ω, Xm(BT)≈24.3622 Ω,
   Rc(AT)≈6050.00 Ω, Xm(AT)≈2047.10 Ω (ensayo de vacío); Isc≈2.2727 A, Zeq≈5.808 Ω,
   Req≈2.497 Ω, Xeq≈5.244 Ω, %Z=6.00% (ensayo de cortocircuito); %Req≈2.580%,
   %Xeq≈5.417%, %VR≈5.353% (regulación de voltaje, FP=0.80 atraso); η(x=1)≈95.988%,
   x_máx≈0.7875, η_máx≈96.095% (eficiencia) — acuerdo exacto con las funciones reales
   del código fuente (`circuito-equivalente-transformador.body.js`). Nota de proceso:
   una primera recomputación manual (a mano, sin ejecutar código) había arrastrado un
   error de redondeo en Xm(AT) (2047.5 Ω en vez de 2047.10 Ω); se detectó y corrigió
   al reemplazarla por una recomputación ejecutada literalmente con `node -e` contra
   las fórmulas de origen, antes de dar la ficha por cerrada. Corrida completa de Jest
   tras `npm run gen:labs`: todas las pruebas y snapshots dorados pasan (snapshots
   actualizados a mano en los puntos de inserción exactos, nunca con `jest -u`).
   Verificación funcional con Playwright contra el HTML construido y servido localmente
   (`python -m http.server` + navegación real con clics de botones, no evaluación
   directa de funciones JS): los 4 casos energizados y leídos coinciden exactamente con
   los valores esperados, el esquemático alterna correctamente entre diagrama de ensayo
   y circuito equivalente por caso, el ciclo de quiz responde y actualiza el reporte
   correctamente, el modo "Ensayo automático (guiado)" corre sin error, y no se capturó
   ningún error de consola ni de página (`pageerror`) en toda la sesión de prueba.
4. **Petición concreta al experto:** (a) confirmar que la Cláusula 8 de ANSI/IEEE
   C57.12.90 sigue siendo la referencia vigente para el procedimiento de ensayo de
   vacío/cortocircuito, y su edición actual; (b) confirmar la edición vigente de IEC
   60076-1 aplicable a las Cláusulas 11.4/11.5 (esta ficha cita solo cláusulas, sin año,
   por falta de confirmación de alta confianza); (c) confirmar si el programa oficial
   (ELE-II; UAX Máquinas) espera también la presentación del circuito equivalente
   "exacto" (rama shunt en el punto intermedio) además del aproximado usado aquí; (d)
   confirmar si el lado de excitación elegido para cada ensayo (vacío en BT,
   cortocircuito en AT) coincide con la convención de laboratorio esperada por el
   programa; (e) confirmar si existe una clave SINCO más específica para ensayos de
   transformadores que la reutilizada de la familia D2/D10/d5-01.
