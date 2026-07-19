# Ficha de práctica — Variador V/f del Motor de Inducción (`mecanica-56`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** decimotercera práctica del dominio D5 (Transformadores/Máquinas
> eléctricas) — d5-13 de 16. Es una práctica de **molde S+P** (esquemático interactivo +
> panel de instrumentos virtual, sin fase de ensamble), como d5-07 (mecanica-50), d5-11
> (mecanica-54) y d5-12 (mecanica-55): el elemento central es el pizarrón que dibuja la
> curva par-velocidad (ecuación de Kloss) del motor de inducción a la frecuencia comandada,
> junto con las curvas de cuatro frecuencias de referencia. Es la primera práctica de la
> colección centrada en el **control escalar V/f de un variador de frecuencia**, en
> contraste con d5-08/d5-09 (motor de inducción a frecuencia de línea fija) y d5-12 (motor
> síncrono como compensador de FP).

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-56
sector: mecanica-electronica
practica_maestra: "d5-13 — Controla un motor de inducción con variador V/f (molde S+P) — tomado literalmente de la fila d5-13 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "EM-IV; MEC-III.1 — tomado literalmente de la columna 'Trazabilidad' de la fila d5-13 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
norma_ancla_lista_maestra: "— (sin norma ancla asignada) — la fila d5-13 de la lista maestra deja la columna 'Norma ancla' vacía ('—'), igual que d5-12. No hay, por tanto, ninguna cláusula normativa que reconciliar en esta práctica; se cita en su lugar el mismo cuerpo de teoría estándar de máquinas de inducción y control escalar V/f usado en d5-08/d5-09 como referencia general (ver `fuentes`)."
modulo: "Transformadores (D5)"
submodulo: "Máquinas de inducción: control escalar V/f con variador de frecuencia (curva de Kloss, par constante vs. debilitamiento de campo) — molde S+P, mismo patrón estructural que d5-07/d5-11/d5-12"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ código reutilizado de d5-01..12/D2/D10 (mismo perfil ocupacional general de electricidad/electrónica); confirmar si existe una clave SINCO más específica de accionamientos/variadores de frecuencia antes de publicar la trazabilidad
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de explicar por qué un variador de frecuencia debe
  mantener la relación tensión/frecuencia (V/f) constante por debajo de la frecuencia base
  para conservar el par máximo disponible del motor de inducción; reconocer la región de
  debilitamiento de campo por encima de esa frecuencia, donde el par máximo cae porque la
  tensión ya no puede seguir creciendo; explicar por qué un arranque en rampa desde baja
  frecuencia entrega mucho más par de arranque que un arranque directo a la red a frecuencia
  nominal; y calcular —a mano o por tanteo— la frecuencia mínima a la que el motor puede
  sostener una carga mecánica dada antes de calarse, usando la misma ecuación que traza las
  curvas del pizarrón.
actividad_clave: >
  Sobre un banco con un variador de frecuencia, un motor de inducción y un bloque de carga
  mecánica ajustable, el estudiante mueve el deslizador de frecuencia comandada (8–100 Hz) y
  el de carga mecánica (0–24 N·m), y observa cómo cambia la velocidad estable del motor y
  qué tan cerca está de calarse. En modo Comparar, ve las curvas par-velocidad de cuatro
  frecuencias de referencia (20/40/60/80 Hz) superpuestas, con el punto de operación en vivo
  sobre la curva a la frecuencia comandada. Dos demostraciones guiadas animan la frecuencia
  en el tiempo para contrastar un arranque directo a la red (DOL, a 60 Hz) contra un
  arranque en rampa desde baja frecuencia. En modo Reto, resuelve uno de dos tipos de
  problema: calcular a mano la frecuencia mínima antes de calado para una carga dada (el
  pizarrón se oculta, forzando el cálculo) o encontrarla por tanteo moviendo el deslizador
  de frecuencia con la carga fija (el pizarrón permanece visible; el deslizador de carga
  queda bloqueado al escenario propuesto por el simulador).
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modo Explora: con la carga mecánica fija en 15 N·m, mueve la frecuencia comandada de 20 a 80 Hz y observa cómo la velocidad estable del motor sube de 510 rpm (20 Hz) a 1110 rpm (40 Hz) y 1710 rpm (60 Hz), y luego el motor se cala a 80 Hz — confirmado por recómputo exacto con `node -e` de `stableSlip()`/`speedRpm()`: a 80 Hz el par resistente (15 N·m) excede el par máximo disponible a esa frecuencia (Tmax(80 Hz)=14.06 N·m)."
  - "Modo Comparar: observa las cuatro curvas par-velocidad de referencia (20/40/60/80 Hz) superpuestas en el pizarrón y verifica que el par máximo se mantiene constante en 25.00 N·m para 20, 40 y 60 Hz, y cae a 14.06 N·m a 80 Hz — confirmado con `node -e` de `tmax()`: por debajo de la frecuencia base el par máximo no depende de la frecuencia (V/f=cte conserva el flujo), por encima de ella la tensión topada al 100% reduce el flujo y el par máximo disponible."
  - "Demostración 'Arranque directo (DOL)': corre la animación a 60 Hz desde rotor bloqueado y verifica en la telemetría que el par de arranque disponible es T_DOL≈7.33 N·m — confirmado con `node -e` de `TofS(1,60)`."
  - "Demostración 'Arranque en rampa': corre la animación desde 8 Hz y verifica que el par disponible a rotor bloqueado en ese punto es ≈24.83 N·m, más de tres veces el de la demostración DOL — confirmado con `node -e` de `TofS(1,8)`: a baja frecuencia el deslizamiento de par máximo (sm) crece muy por encima de 1, dejando el arranque muy cerca de la zona de par máximo de la curva."
  - "Modo Reto (variante 'calaFrecuencia', analítica): el pizarrón se oculta por completo; dada la carga mecánica del escenario (un entero entre 9 y 23 N·m), calcula a mano f_máx=f_base·√(Tmax_base/TL) y verifica tu resultado con tolerancia ±1.0 Hz — el rango de carga se eligió para que la respuesta caiga siempre dentro de los 8–100 Hz del deslizador de frecuencia; en el caso límite TL=9 N·m, f_máx=100.0 Hz exactos, confirmado con `node -e` de `fMaxBeforeStall(9)`."
  - "Modo Reto (variante 'buscarLimite', empírica): el pizarrón permanece visible pero el deslizador de carga queda bloqueado al escenario propuesto; ajusta solo el deslizador de frecuencia hasta acercarte a la frontera estable→CALADO de esa carga, con tolerancia ±0.8 Hz — la telemetría muestra 'CALADO' explícitamente cuando la frecuencia comandada cae por debajo de esa frontera, sin ocultar el resultado del intento."
normatividad:          # 🔒 sin norma ancla asignada en la lista maestra para esta fila
  - "La fila d5-13 de la lista maestra no asigna norma ancla ('—' en la columna correspondiente); no hay, por tanto, ninguna cláusula normativa específica que esta práctica deba reconciliar."
  - "Teoría estándar de máquinas de inducción (ecuación de Kloss, curva par-deslizamiento) y control escalar V/f de variadores de frecuencia — consistente con textos de referencia ampliamente usados en el sector (p. ej. Fitzgerald/Kingsley/Umans, 'Electric Machinery'; Chapman, 'Máquinas Eléctricas'), el mismo cuerpo citado en d5-08/d5-09/d5-12."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "La ecuación de Kloss del par de un motor de inducción, con par máximo (Tmax) y deslizamiento de par máximo (sm) derivados de mantener V/f=cte hasta la frecuencia base y tensión topada al 100% por encima de ella — verificado por recomputación con `node -e` contra el código fuente de variador-vf-motor-induccion.body.js: Tmax=25.00 N·m constante a 20/40/60 Hz, cae a 14.06 N·m a 80 Hz."
  - "El punto de operación se protege explícitamente contra el caso de carga nula (TL≤0 devuelve deslizamiento cero exacto, velocidad síncrona exacta) en vez de evaluar una división 0/0 indefinida — verificado leyendo el guard en `stableSlip()`."
  - "La ventaja de par de arranque de un arranque en rampa frente a un arranque directo (DOL), cuantificada con las mismas ecuaciones que dibujan las curvas del pizarrón: T_DOL(60 Hz, s=1)≈7.33 N·m frente a T(8 Hz, s=1)≈24.83 N·m, más de 3 veces mayor — ambos valores recomputados con `node -e` de `TofS()`."
  - "Una frontera de calado en forma cerrada, f_máx(TL)=f_base·√(Tmax_base/TL), verificada por recomputación exacta contra el código fuente para el rango completo de carga que genera el modo Reto (9 a 23 N·m), confirmando que la respuesta siempre cae dentro del rango operable del deslizador de frecuencia (8–100 Hz)."
  - "Un modo Reto de dos variantes verificadas independientemente por recomputación exacta: 'calaFrecuencia' (pizarrón oculto, cálculo directo de la frontera de calado) y 'buscarLimite' (pizarrón visible, carga bloqueada al escenario, búsqueda empírica por tanteo del deslizador de frecuencia)."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "La dinámica electromagnética del flujo y la corriente del estator durante los pasos de la rampa de frecuencia — el modelo asume que el motor sigue instantáneamente la curva par-velocidad en régimen cuasi-estacionario en cada paso, no la dinámica real de asentamiento del flujo tras un cambio de frecuencia."
  - "La compensación IR (boost de tensión a baja frecuencia) que usan los variadores comerciales reales para sostener el par de arranque más allá de lo que predice una relación V/f estrictamente lineal — el modelo usa V/f lineal estricto, sin boost."
  - "La magnitud de la corriente de línea ni los límites térmicos del motor o del variador — el par máximo mostrado (Tmax) es un límite geométrico de la ecuación de Kloss, no una restricción impuesta por sobrecorriente real."
  - "El contenido armónico de la salida PWM real de un variador de frecuencia — el modelo asume una alimentación senoidal pura a la frecuencia comandada."
  - "Las pérdidas mecánicas, de núcleo o por conmutación del propio variador, ni un instrumento real con imprecisión de medición — todas las lecturas del tablero son valores exactos calculados por el modelo, sin simular tolerancia de instrumento."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Registro de la velocidad estable observada a las cuatro frecuencias de referencia con una carga fija (incluyendo el caso de calado a 80 Hz), los dos valores numéricos de par de arranque comparados entre las demostraciones DOL y rampa, y el diagnóstico correcto resuelto en ambas variantes del modo Reto con su cifra numérica de respaldo."
evidencia_desempeno: "Guía de observación de la lectura correcta del pizarrón de curvas par-velocidad y de la telemetría de velocidad/deslizamiento, de la explicación verbal de por qué mantener V/f constante conserva el par máximo del motor, y de la justificación razonada (no por ensayo y error) de la frontera de calado calculada en el modo Reto."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué un variador de frecuencia debe mantener V/f constante para no perder par, y qué ventaja de arranque ofrece frente a un arranque directo a la red (briefing.ts)."
desarrollo: "Práctica en el simulador: Explora (mueve la frecuencia y la carga y observa la velocidad estable y el margen antes de calado) → Comparar (observa las cuatro curvas de referencia juntas y el punto de operación en vivo) → Demuestra (arranque directo vs. arranque en rampa) → Reto (dos variantes: cálculo directo de la frontera de calado o búsqueda empírica limitada al escenario) → recorrido guiado automático como referencia."
cierre: "Ficha técnica (capa 2) con la tabla de par máximo y deslizamiento de par máximo por frecuencia, el contrato de fidelidad completo (SÍ/NO modela) y la comparación numérica de par de arranque DOL vs. rampa."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Teoría estándar de máquinas de inducción (ecuación de Kloss, par máximo, deslizamiento de par máximo) y control escalar V/f de variadores de frecuencia — consistente con textos de referencia ampliamente usados en el sector (Fitzgerald/Kingsley/Umans; Chapman), el mismo cuerpo citado en d5-08/d5-09/d5-12."
  - "Todos los valores numéricos citados en esta ficha (par máximo y deslizamiento por frecuencia, velocidades estables, comparación de par de arranque DOL vs. rampa, frontera de calado en los extremos del rango de reto) fueron recomputados exactamente con `node -e` contra el código fuente de variador-vf-motor-induccion.body.js, no calculados a mano ni estimados."
banderas_incertidumbre:
  - "⚑ La clave SINCO 2641/7541 se reutiliza de d5-01..12/D2/D10 — confirmar si existe una clave SINCO más específica de accionamientos eléctricos/variadores de frecuencia antes de publicar la trazabilidad."
  - "⚑ POLOS=4, f_base=60 Hz, Tmax_base=25 N·m, sm_base=15% (a f_base), el rango de frecuencia del variador (8–100 Hz) y el rango de carga mecánica (0–24 N·m) son valores ilustrativos de catálogo típico, no de una máquina ni variador real verificado — confirmar con el experto si conviene anclarlos a una hoja de datos real de motor de inducción industrial."
  - "⚑ El modelo no incluye compensación IR (boost de tensión a baja frecuencia); confirmar con el experto si conviene introducirla en una futura iteración, dado que un variador comercial real la usa para sostener aún más el par de arranque a muy baja frecuencia que lo que predice este modelo V/f estrictamente lineal."
  - "✅ Verificación de implementación: física verificada por recomputación ejecutada con `node -e` (no a mano) de `ns()`/`vcmd()`/`tmax()`/`sm()`/`TofS()`/`stableSlip()`/`speedRpm()`/`fMaxBeforeStall()` contra el código fuente, incluyendo la tabla de par máximo por frecuencia, la comparación de par de arranque DOL vs. rampa y los extremos del rango de carga del modo Reto. Pendiente al momento de escribir esta ficha: corrida completa de Jest tras `npm run gen:labs` (snapshots dorados actualizados a mano en los puntos de inserción exactos, nunca con `jest -u`), `tsc --noEmit`, y verificación funcional con Playwright contra el HTML construido y servido localmente (los 3 modos, las dos demostraciones guiadas, ambas variantes del modo Reto, y el recorrido guiado automático, 0 errores de consola/página esperados) — completar antes del commit final y actualizar esta nota con el resultado exacto.
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (decimotercera práctica de D5, cuarta de molde S+P):**
   d5-13 reutiliza el patrón estructural de d5-07 (mecanica-50), d5-11 (mecanica-54) y
   d5-12 (mecanica-55): esquemático interactivo + panel de instrumentos, sin fase de
   ensamble. Es la primera práctica de la colección centrada en el **control escalar V/f
   de un variador de frecuencia** —no en el motor de inducción a frecuencia de línea fija
   (d5-08/d5-09)— y la primera cuyo modo Reto compara dos escenarios de arranque (directo
   vs. rampa) además de las dos variantes habituales de habilidad (cálculo analítico
   directo vs. búsqueda empírica limitada por un escenario).
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/variador-vf-motor-induccion.html](../../../public/labs/variador-vf-motor-induccion.html))
   muestra el HUD con el modelo físico y el contrato de fidelidad —
   documentado en la sección 5 de la ficha técnica in-app
   ([_ficha-variador-vf-motor-induccion.js](../../../public/labs/_ficha-variador-vf-motor-induccion.js))
   y en el encabezado de fidelidad del propio archivo fuente
   (`variador-vf-motor-induccion.body.js`).
3. **Verificación de implementación:** ✅ Física verificada por recomputación ejecutada con
   `node -e` (no a mano) de las ocho funciones del modelo, incluyendo la tabla de par
   máximo por frecuencia y la comparación de par de arranque DOL vs. rampa. Pendiente al
   momento de escribir esta ficha: corrida completa de Jest tras `npm run gen:labs`,
   `tsc --noEmit`, y verificación funcional con Playwright contra el HTML construido y
   servido localmente — completar antes del commit final y actualizar esta nota con el
   resultado exacto.
4. **Petición concreta al experto:** (a) confirmar si POLOS=4, f_base=60 Hz,
   Tmax_base=25 N·m y sm_base=15% son razonables como valores ilustrativos de catálogo
   típico o si convendría anclarlos a una hoja de datos real; (b) confirmar si la ausencia
   de compensación IR (boost de tensión a baja frecuencia) es aceptable pedagógicamente o
   si distorsiona de forma importante la comparación de par de arranque DOL vs. rampa;
   (c) confirmar si existe una clave SINCO más específica de accionamientos
   eléctricos/variadores de frecuencia que la reutilizada de la familia D2/D10/d5-01..12;
   (d) confirmar si, en ausencia de norma ancla asignada por la lista maestra, conviene
   proponer una (p. ej. NEMA MG-1 o IEC 60034-1, ya citadas en d5-09/d5-11) o dejarla
   intencionalmente sin anclar como lo indica la fila d5-13.
