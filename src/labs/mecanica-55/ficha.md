# Ficha de práctica — Curvas V del Motor Síncrono (`mecanica-55`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** duodécima práctica del dominio D5 (Transformadores/Máquinas
> eléctricas) — d5-12 de 16. Es una práctica de **molde S+P** (esquemático interactivo +
> panel de instrumentos virtual, sin fase de ensamble), como d5-07 (mecanica-50) y d5-11
> (mecanica-54): el elemento central es el pizarrón que dibuja la familia de curvas V
> (corriente de armadura contra corriente de campo) para tres niveles de carga mecánica,
> con un reóstato de campo como único control activo. Es la primera práctica de la
> colección centrada en el motor síncrono operando como **compensador de factor de
> potencia**, en contraste con d5-05/d5-06 (motor de CD) y d5-08/d5-09 (motor de
> inducción), que se centran en el comportamiento interno de la máquina misma sin
> interacción con el resto de la red de la planta.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-55
sector: mecanica-electronica
practica_maestra: "d5-12 — Opera el motor síncrono como compensador de FP (molde S+P) — tomado literalmente de la fila d5-12 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "UAX Máquinas — tomado literalmente de la columna 'Trazabilidad' de la fila d5-12 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
norma_ancla_lista_maestra: "— (sin norma ancla asignada) — la fila d5-12 de la lista maestra deja la columna 'Norma ancla' vacía ('—'), a diferencia de d5-11 (IEC 60034, con discrepancia de alcance documentada). No hay, por tanto, ninguna cláusula normativa que reconciliar en esta práctica; se cita en su lugar el mismo cuerpo de teoría estándar de máquinas síncronas usado en d5-11 como referencia general (ver `fuentes`)."
modulo: "Transformadores (D5)"
submodulo: "Máquinas síncronas: el motor síncrono como compensador de factor de potencia (curvas V, sobreexcitación) — molde S+P, mismo patrón estructural que d5-07/d5-11"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ código reutilizado de d5-01..11/D2/D10 (mismo perfil ocupacional general de electricidad/electrónica); confirmar si existe una clave SINCO más específica de eficiencia energética/calidad de energía antes de publicar la trazabilidad
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de explicar por qué la corriente de armadura de
  un motor síncrono, graficada contra su corriente de campo, forma una curva en "V" con un
  mínimo exacto en factor de potencia unitario; distinguir el comportamiento subexcitado
  (el motor consume reactivos de la red, como un motor de inducción) del sobreexcitado (el
  motor entrega reactivos, como un banco de capacitores); calcular a mano la corriente
  mínima de una curva V dada la carga mecánica y la tensión de línea; y usar el reóstato de
  campo de un motor síncrono para corregir, hasta donde el límite térmico de su armadura lo
  permita, el factor de potencia total de un bus que comparte una carga industrial
  inductiva — incluyendo reconocer cuándo esa corrección no puede completarse al 100% sin
  exceder la corriente nominal de la máquina.
actividad_clave: >
  Sobre un banco con un motor síncrono, un reóstato de campo y un bloque de carga
  industrial conectable al mismo bus, el estudiante mueve el deslizador de corriente de
  campo (If) con tres niveles distintos de carga mecánica (0, 8 y 15 kW) y observa cómo la
  corriente de armadura traza una curva en V con un mínimo distinto para cada nivel. En
  modo Comparar, ve las tres curvas superpuestas y nota cómo se desplaza el mínimo de cada
  una. En modo Reto, resuelve uno de dos tipos de problema: calcular a mano la corriente
  mínima de una curva (el pizarrón se oculta, forzando el cálculo) o ajustar el reóstato
  para maximizar el factor de potencia total del bus frente a una carga industrial dada
  (el pizarrón permanece visible; los selectores de carga mecánica y de carga industrial
  quedan bloqueados al escenario propuesto por el simulador).
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modo Explora: con carga mecánica en 0 kW, mueve el reóstato de campo (If) desde 60% hasta 180% y observa cómo la corriente de armadura desciende hasta un mínimo de 0.00 A exactamente en If=100.0% y vuelve a subir — confirmado por recómputo exacto con `node -e` de `motorPQ()`/`iaMinAt()`: con P3=0, el mínimo algebraico P/(3·Vt)=0 se alcanza en Ef=Vt, es decir If=100.0%."
  - "Cambia la carga mecánica a 8 kW y luego a 15 kW, y verifica que el mínimo de cada curva ya no es cero y se desplaza a la derecha: If=101.1% (Ia_mín=10.04 A) para 8 kW, e If=103.9% (Ia_mín=18.83 A) para 15 kW — confirmado por bisección numérica con `node -e` de `efUnityPF()`, no leído a ojo del pizarrón."
  - "Modo Comparar: observa las tres curvas V superpuestas (0/8/15 kW) y la línea roja punteada en Ia=50 A (corriente nominal de armadura); verifica que el límite superior seguro de sobreexcitación (el punto donde cada curva toca la línea roja) también se desplaza, de If=175.3% a carga nula hasta If=172.1% a 15 kW — confirmado con `node -e` de `efAtIaRatedOver()`."
  - "Conecta la carga industrial A (50 kW, FP 0.80 en atraso) al bus con carga mecánica en 0 kW, y sobreexcita el motor hasta que la telemetría de factor de potencia total del bus (`t_fptotal`) llegue a 1.00 — confirmado con `node -e` de `fpCorrectionTarget('A')`: la corrección completa se logra en If=170.9%, con Ia_síncrono=47.07 A, sin exceder el límite de 50 A (`limited=false`)."
  - "Repite con la carga industrial B (70 kW, FP 0.70 en atraso): verifica que el factor de potencia total del bus ya no llega a 1.00 aunque el reóstato se lleve al máximo seguro — la telemetría se detiene en FPtotal=0.9115 con Ia_síncrono=50.00 A exactos (`limited=true`), confirmado con `node -e`, porque corregir por completo esa carga exigiría una corriente de armadura mayor a la nominal."
  - "Modo Reto (variante 'corriente mínima'): el pizarrón se oculta por completo; dada la carga mecánica del escenario (8 o 15 kW) y la tensión de línea (460 V), calcula a mano Ia_mín=P/(3·Vt_fase) y verifica tu resultado con tolerancia ±0.3 A."
  - "Modo Reto (variante 'corrección de FP'): el pizarrón permanece visible pero los selectores de carga mecánica y de carga industrial quedan bloqueados al escenario propuesto; ajusta solo el reóstato de campo hasta acercarte al factor de potencia total objetivo (tolerancia ±0.01), que en algunos escenarios es 1.00 exacto y en otros queda por debajo debido al límite térmico de armadura — la telemetría no te dice de antemano cuál es el caso."
normatividad:          # 🔒 sin norma ancla asignada en la lista maestra para esta fila
  - "La fila d5-12 de la lista maestra no asigna norma ancla ('—' en la columna correspondiente); no hay, por tanto, ninguna cláusula normativa específica que esta práctica deba reconciliar, a diferencia de d5-11 (IEC 60034)."
  - "Teoría estándar de máquinas síncronas de rotor liso (diagrama fasorial con Ra≈0, curvas V, motor síncrono como condensador síncrono) — consistente con textos de referencia ampliamente usados en el sector (p. ej. Fitzgerald/Kingsley/Umans, 'Electric Machinery'; Chapman, 'Máquinas Eléctricas'), el mismo cuerpo citado en d5-11."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "La forma característica en V de la corriente de armadura contra la corriente de campo, para tres niveles de carga mecánica constante, con el mínimo de cada curva calculado por bisección numérica exacta (`efUnityPF()`) y verificado por recomputación con `node -e` contra el código fuente de curvas-v-motor-sincrono.body.js: If=100.0%/101.1%/103.9% para P=0/8/15 kW respectivamente."
  - "El comportamiento cualitativo correcto de subexcitación (consumo de reactivos, FP en atraso, `estadoFP()` devuelve 'atraso') frente a sobreexcitación (entrega de reactivos, FP en adelanto, `estadoFP()` devuelve 'adelanto'), calculado a partir del signo de Q1 en el diagrama fasorial, no de una tabla precomputada."
  - "El límite térmico real de la armadura (Ia_nominal=50 A) como restricción dura sobre la corrección de factor de potencia: verificado que 2 de 6 combinaciones de carga mecánica × carga industrial logran FPtotal=1.00 exacto sin tocar el límite (`limited=false`), y las otras 4 topan con Ia=50.00 A exactos y quedan con FPtotal entre 0.91 y 1.00 (`limited=true`) — los seis casos recomputados con `node -e` de `fpCorrectionTarget()`."
  - "Un modo Reto de dos variantes verificadas independientemente por recomputación exacta: 'corriente mínima' (pizarrón oculto, cálculo directo P/(3·Vt)) y 'corrección de FP' (pizarrón visible, selectores de escenario bloqueados, bisección numérica del reóstato)."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "La saturación magnética del circuito de campo — la relación If→Ef se asume estrictamente lineal (Ef=Vt·If/100%); una máquina real satura la curva de magnetización a corrientes de campo altas, por lo que el brazo sobreexcitado de una curva V real se aplana más de lo que este modelo lineal predice."
  - "La resistencia de armadura (Ra≈0 en el diagrama fasorial, solo reactancia síncrona Xs=4 Ω) — simplificación estándar de textos introductorios, no válida sin reservas para máquinas pequeñas donde Ra no es despreciable frente a Xs."
  - "El arranque del motor ni su sincronización a la red — el simulador asume el motor ya girando en sincronismo (mismo evento que resuelve d5-11) y solo modela el régimen permanente posterior; no reproduce el devanado amortiguador ni el transitorio de enganche al sincronismo."
  - "El límite de estabilidad dinámica transitoria — el modelo solo verifica la existencia matemática de solución al ángulo de par (|sen δ|≤1), no un margen de estabilidad ante una perturbación real de la red."
  - "Las pérdidas mecánicas, de núcleo o por efecto Joule en el devanado de campo, ni un instrumento real con imprecisión de medición — todas las lecturas del tablero son valores exactos calculados por el modelo, sin simular tolerancia de instrumento."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Registro de los tres mínimos de curva V observados en modo Explora/Comparar (con su corriente de campo aproximada), un intento de corrección de factor de potencia con carga industrial A que llega a FP=1.00, un intento con carga industrial B que se detiene antes de FP=1.00 por límite de armadura (con la lectura de Ia_síncrono en el momento de detenerse), y el diagnóstico correcto resuelto en ambas variantes del modo Reto con su cifra numérica de respaldo."
evidencia_desempeno: "Guía de observación de la lectura correcta del pizarrón de curvas V y de la telemetría de factor de potencia, de la explicación verbal de por qué subexcitar y sobreexcitar tienen efectos opuestos sobre los reactivos de la red, y de la justificación razonada (no por ensayo y error) de por qué una carga industrial puede o no corregirse por completo dado el límite térmico de la armadura del motor síncrono."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué un motor síncrono es la excepción entre las máquinas rotativas —puede dejar de pedir reactivos a la red y empezar a entregarlos— y qué es una curva V (briefing.ts)."
desarrollo: "Práctica en el simulador: Explora (mueve el reóstato de campo con distintos niveles de carga y observa el mínimo de la curva V) → Comparar (observa las tres curvas juntas y el desplazamiento del mínimo) → Conecta (une una carga industrial inductiva y corrige el factor de potencia total del bus) → Reto (dos variantes: cálculo directo o corrección de FP limitada por corriente) → recorrido guiado automático como referencia."
cierre: "Ficha técnica (capa 2) con la tabla de los tres mínimos de curva V, el contrato de fidelidad completo (SÍ/NO modela) y la tabla de las seis combinaciones de corrección de factor de potencia con su resultado exacto (completa o limitada por corriente)."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Teoría estándar de máquinas síncronas de rotor liso (diagrama fasorial con Ra≈0, curvas V, motor síncrono como condensador síncrono, corrección de factor de potencia por sobreexcitación) — consistente con textos de referencia ampliamente usados en el sector (Fitzgerald/Kingsley/Umans; Chapman), el mismo cuerpo citado en d5-11."
  - "Todos los valores numéricos citados en esta ficha (mínimos de curva V, límites de sobreexcitación segura, resultados de corrección de FP para las seis combinaciones de escenario) fueron recomputados exactamente con `node -e` contra el código fuente de curvas-v-motor-sincrono.body.js, no calculados a mano ni estimados."
banderas_incertidumbre:
  - "⚑ La clave SINCO 2641/7541 se reutiliza de d5-01..11/D2/D10 — confirmar si existe una clave SINCO más específica de eficiencia energética o calidad de la energía (compensación de factor de potencia) antes de publicar la trazabilidad."
  - "⚑ Vt_línea=460 V, Xs=4 Ω, Ia_nominal=50 A, el rango del reóstato (60–180%) y los dos escenarios de carga industrial (50 kW/FP 0.80 y 70 kW/FP 0.70) son valores ilustrativos de catálogo típico, no de una máquina ni planta real verificada — confirmar con el experto si conviene anclarlos a una hoja de datos real de motor síncrono industrial."
  - "⚑ El modelo asume la relación If→Ef estrictamente lineal (sin saturación magnética); confirmar con el experto si conviene introducir una curva de magnetización no lineal simplificada en una futura iteración, dado que afectaría la forma exacta del brazo sobreexcitado de cada curva V."
  - "✅ Verificación de implementación: física verificada por recomputación ejecutada con `node -e` (no a mano) de `motorPQ()`/`iaMinAt()`/`efUnityPF()`/`efAtIaRatedOver()`/`fpCorrectionTarget()` contra el código fuente, incluyendo los tres mínimos de curva V y las seis combinaciones de corrección de factor de potencia (2 completas, 4 limitadas por corriente). Pendiente al momento de escribir esta ficha: corrida completa de Jest tras `npm run gen:labs` (snapshots dorados actualizados a mano en los puntos de inserción exactos, nunca con `jest -u`), `tsc --noEmit`, y verificación funcional con Playwright contra el HTML construido y servido localmente (los 3 modos, la conexión de carga industrial, ambas variantes del modo Reto, y el recorrido guiado automático, 0 errores de consola/página esperados) — completar antes del commit final y actualizar esta nota con el resultado exacto.
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (duodécima práctica de D5, tercera de molde S+P):**
   d5-12 reutiliza el patrón estructural de d5-07 (mecanica-50) y d5-11 (mecanica-54):
   esquemático interactivo + panel de instrumentos, sin fase de ensamble. Es la primera
   práctica de la colección centrada en el motor síncrono como **compensador de factor de
   potencia** de una planta —no en su comportamiento aislado— y la primera cuyo modo Reto
   tiene dos variantes de habilidad distinta (cálculo analítico directo vs. optimización
   numérica limitada por una restricción física real).
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/curvas-v-motor-sincrono.html](../../../public/labs/curvas-v-motor-sincrono.html))
   muestra el HUD con el modelo físico y el contrato de fidelidad —
   documentado en la sección 5 de la ficha técnica in-app
   ([_ficha-curvas-v-motor-sincrono.js](../../../public/labs/_ficha-curvas-v-motor-sincrono.js))
   y en el encabezado de fidelidad del propio archivo fuente
   (`curvas-v-motor-sincrono.body.js`).
3. **Verificación de implementación:** ✅ Física verificada por recomputación ejecutada con
   `node -e` (no a mano) de las siete funciones del modelo, incluyendo los tres mínimos de
   curva V y las seis combinaciones de corrección de factor de potencia. Pendiente al
   momento de escribir esta ficha: corrida completa de Jest tras `npm run gen:labs`,
   `tsc --noEmit`, y verificación funcional con Playwright contra el HTML construido y
   servido localmente — completar antes del commit final y actualizar esta nota con el
   resultado exacto.
4. **Petición concreta al experto:** (a) confirmar si Vt_línea=460 V, Xs=4 Ω e
   Ia_nominal=50 A son razonables como valores ilustrativos de catálogo típico o si
   convendría anclarlos a una hoja de datos real; (b) confirmar si la ausencia de
   saturación magnética en el modelo If→Ef es aceptable pedagógicamente o si distorsiona de
   forma importante la forma del brazo sobreexcitado de la curva V; (c) confirmar si existe
   una clave SINCO más específica de eficiencia energética/calidad de energía que la
   reutilizada de la familia D2/D10/d5-01..11; (d) confirmar si, en ausencia de norma ancla
   asignada por la lista maestra, conviene proponer una (p. ej. IEEE 115 para pruebas de
   máquinas síncronas) o dejarla intencionalmente sin anclar como lo indica la fila d5-12.
