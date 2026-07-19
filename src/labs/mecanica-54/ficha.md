# Ficha de práctica — Sincronización de un Alternador a la Red (`mecanica-54`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** décimo primera práctica del dominio D5 (Transformadores/Máquinas
> eléctricas) — d5-11 de 16. Es una práctica de **molde S+P** (esquemático interactivo +
> panel de instrumentos virtual, sin fase de ensamble), como d5-07 (mecanica-50): el
> elemento central es el tablero que combina un sincronoscopio, un indicador de tres
> lámparas y una telemetría de cuatro condiciones independientes (tensión, frecuencia,
> secuencia de fases, ángulo). Es la primera práctica de la colección centrada en el
> *procedimiento de puesta en paralelo* de una máquina síncrona con una red, en contraste
> con d5-05/d5-06 (motor de CD) y d5-08/d5-09 (motor de inducción trifásico), que se
> centran en el comportamiento interno de la máquina misma.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-54
sector: mecanica-electronica
practica_maestra: "d5-11 — Sincroniza un alternador a la red (molde S+P) — tomado literalmente de la fila d5-11 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ELE-II.2 — tomado literalmente de la columna 'Trazabilidad' de la fila d5-11 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
norma_ancla_lista_maestra: "IEC 60034 — tomado literalmente de la columna 'Norma ancla' de la fila d5-11. ⚑ IEC 60034 es una familia de normas sobre requisitos generales de máquinas eléctricas rotativas (calentamiento, eficiencia, marcado); no cubre literalmente el procedimiento de sincronización, que se trata más directamente en IEEE C50.12/C50.13 (generadores síncronos) y en normas de protección como ANSI/IEEE C37.102 (relevador 25) — esta discrepancia de alcance entre la norma ancla asignada por la lista maestra y el contenido real de la práctica no ha sido resuelta por un experto revisor; se documenta explícitamente en el HUD del simulador y en la ficha técnica in-app."
modulo: "Transformadores (D5)"
submodulo: "Máquinas síncronas: procedimiento y condiciones de sincronización con la red (molde S+P — mismo patrón estructural que d5-07)"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ código reutilizado de d5-01..10/D2/D10 (mismo perfil ocupacional general de electricidad/electrónica); confirmar si existe una clave SINCO más específica de operación de plantas de generación antes de publicar la trazabilidad
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de enunciar y verificar, de forma independiente,
  las cuatro condiciones que deben cumplirse antes de cerrar el interruptor que conecta un
  alternador a una red ya energizada (igualdad de tensión dentro de tolerancia, igualdad de
  frecuencia dentro de tolerancia, igualdad de secuencia de fases, y ángulo de fase cercano a
  cero en el instante del cierre); interpretar el comportamiento de un sincronoscopio de
  aguja (gira mientras la frecuencia difiere, se detiene con ángulo cero) y de un indicador
  de tres lámparas (patrón de parpadeo distinto para secuencia correcta e invertida);
  explicar la consecuencia física de violar cada una de las cuatro condiciones por separado
  (corriente circulante por diferencia de tensión, deslizamiento por diferencia de
  frecuencia, cortocircuito franco por secuencia invertida, par pulsante transitorio por
  ángulo residual); y diagnosticar, en el modo Reto, cuál de las cuatro condiciones es la
  que falla en un escenario dado a partir de la telemetría numérica del tablero, sin
  depender únicamente de la lectura visual del sincronoscopio.
actividad_clave: >
  Sobre un banco con un alternador, un interruptor de sincronización (52) y el bus de la
  red, el estudiante ajusta la tensión del generador (Vgen) y la diferencia de frecuencia
  (Δf) con controles deslizantes, y alterna la secuencia de fases (correcta/invertida) con
  un selector, observando en vivo el sincronoscopio, el indicador de tres lámparas y las
  cuatro condiciones de telemetría. En modo Comparar, invierte la secuencia y usa el
  indicador dedicado para distinguirla sin ambigüedad de una secuencia correcta con ángulo
  variable. En modo Reto, dado un escenario con exactamente una condición fuera de
  tolerancia (fijado por el simulador y visible en la telemetría completa), identifica cuál
  de las cuatro condiciones falla antes de decidir si el interruptor debería cerrarse.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modo Explora: mueve el control deslizante de tensión del generador (Vgen) y observa cómo la lectura de tensión del tablero y la condición 'Tensión' de la telemetría cambian de verde a rojo cuando la diferencia respecto a la red supera ±5% (confirmado por recómputo exacto con `node -e` de `evaluar()`: con Vred=100 fijo, Vgen=94 da |ΔV|/Vred=6%>5% → condV=false; Vgen=96 da 4%≤5% → condV=true)."
  - "Mueve el control deslizante de diferencia de frecuencia (Δf) y observa que la aguja del sincronoscopio gira continuamente mientras Δf≠0, a una velocidad angular proporcional a Δf, y que la condición 'Frecuencia' del tablero solo se pone en verde cuando |Δf|≤0.1 Hz — confirmado por recómputo con `node -e`: con Δf=0.15 Hz, condF=false; con Δf=0.05 Hz, condF=true."
  - "Modo Comparar: invierte la secuencia de fases con el selector y observa el patrón de parpadeo del indicador de tres lámparas — con secuencia correcta, las tres lámparas se apagan y encienden juntas (todas en fase); con secuencia invertida, se encienden una tras otra en secuencia rotativa. Usa el indicador de secuencia dedicado (visible solo en este modo) para confirmar sin ambigüedad la lectura de las lámparas."
  - "Ajusta el ángulo de fase (deriva por sí solo cuando Δf≠0, o se congela en modo Reto) y verifica que la condición 'Ángulo' del tablero se pone en verde solo dentro de ±10° respecto a cero — confirmado con `node -e`: θ=8° da condAng=true; θ=15° da condAng=false. Con las cuatro condiciones en verde, cierra el interruptor (botón 'Cerrar interruptor') y observa la retroalimentación visual (flash verde) y el factor de choque ilustrativo, cercano a cero cuando el ángulo residual es pequeño."
  - "Modo Reto: el simulador fija un escenario donde exactamente una de las cuatro condiciones falla (tensión, frecuencia, secuencia o ángulo), visible en la telemetría numérica completa del tablero (el reto no oculta las lecturas, solo evalúa la decisión); el estudiante elige, entre cinco botones categóricos (las cuatro condiciones más 'todo correcto'), cuál es la que realmente falla, y recibe retroalimentación inmediata con la cifra exacta de respaldo."
normatividad:          # 🔒 norma ancla citada con discrepancia de alcance documentada
  - "IEC 60034 'Rotating electrical machines' — norma ancla listada en la fila d5-11 de la lista maestra; ⚑ es una familia de normas de requisitos generales de máquinas rotativas (calentamiento, eficiencia, marcado), no del procedimiento específico de sincronización — se cita como referencia general del tema 'máquinas eléctricas rotativas', no como fuente literal de las tolerancias numéricas del simulador; discrepancia de alcance no resuelta por un experto revisor."
  - "IEEE C50.12 / C50.13 (requisitos de generadores síncronos) y ANSI/IEEE C37.102 (protección de relevador 25, verificación de sincronismo) — normas más directamente relacionadas con el procedimiento de sincronización que IEC 60034, citadas aquí como referencia adicional; ⚑ ninguna cláusula específica de ninguna de las dos ha sido verificada contra el texto primario en esta sesión."
  - "Teoría estándar de sincronización de máquinas síncronas (las cuatro condiciones clásicas, sincronoscopio, método de las tres lámparas) — consistente con textos de referencia ampliamente usados en el sector (p. ej. Fitzgerald/Kingsley/Umans, 'Electric Machinery'; Chapman, 'Máquinas Eléctricas')."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "Las cuatro condiciones de sincronización evaluadas de forma independiente (tensión ±5%, frecuencia ±0.1 Hz, secuencia de fases sin tolerancia, ángulo de fase ±10°) — verificado por recomputación exacta con `node -e` de `evaluar()` contra el código fuente de sincronizacion-alternador-red.body.js para múltiples combinaciones de Vgen/Δf/secuencia/θ, incluyendo los cuatro casos límite en cada tolerancia."
  - "El comportamiento del sincronoscopio como integración en tiempo real de la diferencia de frecuencia (θ deriva continuamente mientras Δf≠0, usando el `dt` real del bucle de animación, no un `waitForTimeout` fijo) y su detención visual cuando el ángulo se acerca a cero."
  - "El patrón de parpadeo distintivo del indicador de tres lámparas para secuencia correcta (oscilación en fase) frente a secuencia invertida (oscilación rotativa) — calculado mediante `lampVoltages()` como diferencia fasorial entre generador y red para cada una de las tres lámparas, con signo de secuencia s=+1/-1."
  - "Un modo Reto categórico de cinco opciones (las cuatro condiciones más 'todo correcto') que no oculta la telemetría numérica —a diferencia de otros retos de la colección que sí ocultan lecturas— porque la habilidad evaluada aquí es la decisión GO/NO-GO informada a partir de datos visibles, no la lectura del instrumento en sí."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "La dinámica del regulador de tensión (AVR) ni del regulador de velocidad (governor) del alternador — Vgen y Δf se fijan directamente con controles deslizantes, sin modelar el lazo de control que en la realidad produce esos cambios."
  - "El transitorio electromecánico real de un cierre fuera de tolerancia (oscilación de polos, corriente subtransitoria, par pulsante) — el 'factor de choque' mostrado es una aproximación conceptual proporcional a sin(Δθ/2), explícitamente ilustrativa, no el resultado de resolver la ecuación de oscilación del rotor ni de conocer la reactancia subtransitoria de una máquina real."
  - "La lógica temporal y el control activo de un relevador de verificación de sincronismo (dispositivo 25) real, ni el retardo mecánico de apertura/cierre del interruptor — el simulador evalúa las cuatro condiciones en el instante del intento de cierre, sin ventana de tiempo sostenido ni anticipación de retardo de interruptor."
  - "El procedimiento de sincronización en paralelo de dos generadores ambos aislados de una red mayor — el modelo siempre sincroniza un generador contra un bus de referencia ya energizado (caso más común en la práctica de campo, pero no el único)."
  - "Un multímetro, frecuencímetro o sincronoscopio real con imprecisión de instrumento o ruido de medición — las lecturas de tensión, frecuencia y ángulo del tablero son valores exactos calculados por `evaluar()`, sin simular tolerancia de instrumento."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Registro de al menos un intento de cierre exitoso (las cuatro condiciones en verde) con su tabla de lecturas de respaldo, un intento de cierre rechazado con la razón de rechazo mostrada por el tablero, la distinción documentada entre el patrón de parpadeo de secuencia correcta e invertida observada en modo Comparar, y el diagnóstico correcto resuelto en modo Reto con su cifra numérica de respaldo."
evidencia_desempeno: "Guía de observación de la lectura correcta del sincronoscopio y del indicador de tres lámparas, de la explicación verbal de la consecuencia física de violar cada una de las cuatro condiciones por separado, y de la justificación razonada (no por ensayo y error) del diagnóstico elegido en el modo Reto a partir de la telemetría numérica."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué cerrar un interruptor de sincronización en el momento equivocado puede dañar el generador y perturbar la red, y las cuatro condiciones clásicas que todo operador verifica antes de la maniobra (briefing.ts)."
desarrollo: "Práctica en el simulador: Explora (ajusta tensión y frecuencia, observa el sincronoscopio y las cuatro condiciones) → Comparar (invierte la secuencia de fases y usa el indicador dedicado para distinguirla) → Reto (diagnostica cuál de las cuatro condiciones falla en un escenario dado) → recorrido guiado automático como referencia."
cierre: "Ficha técnica (capa 2) con la tabla de las cuatro condiciones y sus tolerancias, el contrato de fidelidad completo (SÍ/NO modela) y la aclaración explícita de la discrepancia de alcance entre la norma ancla asignada (IEC 60034) y el contenido real de la práctica (procedimiento de sincronización)."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Teoría estándar de sincronización de máquinas síncronas (las cuatro condiciones clásicas, sincronoscopio, método de las tres lámparas, factor de choque proporcional a sin(Δθ/2)) — consistente con textos de referencia ampliamente usados en el sector (Fitzgerald/Kingsley/Umans; Chapman)."
  - "⚑ IEC 60034 (requisitos generales de máquinas eléctricas rotativas) — norma ancla listada en la lista maestra; no cubre literalmente el procedimiento de sincronización; discrepancia de alcance documentada, no resuelta por un experto revisor."
  - "⚑ IEEE C50.12/C50.13 y ANSI/IEEE C37.102 — normas más directamente relacionadas con el procedimiento de sincronización y el relevador 25, citadas como referencia adicional; ninguna cláusula específica verificada contra el texto primario en esta sesión."
banderas_incertidumbre:
  - "⚑ La clave SINCO 2641/7541 se reutiliza de d5-01..10/D2/D10 — confirmar si existe una clave SINCO más específica de operación de plantas de generación o de protección eléctrica antes de publicar la trazabilidad."
  - "⚑ La norma ancla asignada por la lista maestra (IEC 60034) no coincide en alcance con el contenido de la práctica (procedimiento de sincronización); se documentó la discrepancia y se citaron IEEE C50.12/C50.13 y ANSI/IEEE C37.102 como referencia más pertinente, pero ninguna ha sido verificada por un experto — confirmar con el experto si conviene proponer un cambio de norma ancla en la lista maestra."
  - "⚑ Las tolerancias del simulador (±5% tensión, ±0.1 Hz frecuencia, ±10° ángulo) son valores ilustrativos consistentes con el orden de magnitud típico de sincronización manual descrito en literatura de máquinas eléctricas, pero no corresponden a una cláusula normativa específica verificada — confirmar con el experto si conviene ajustarlas a un límite normativo citable."
  - "⚑ El 'factor de choque' proporcional a sin(Δθ/2) es una aproximación conceptual explícitamente etiquetada como ilustrativa en el HUD y en la ficha técnica in-app, no el resultado de una simulación electromecánica real — confirmar con el experto si conviene reforzar aún más esta advertencia o retirar el número por completo en una futura iteración."
  - "✅ Verificación de implementación: física verificada por recomputación ejecutada con `node -e` (no a mano) de `evaluar()`/`lampVoltages()` contra el código fuente, incluyendo los cuatro casos límite de tolerancia y el patrón de parpadeo de secuencia correcta/invertida. Pendiente al momento de escribir esta ficha: corrida completa de Jest tras `npm run gen:labs` (snapshots dorados actualizados a mano en los puntos de inserción exactos, nunca con `jest -u`), `tsc --noEmit`, y verificación funcional con Playwright contra el HTML construido y servido localmente (los 3 modos, las cuatro condiciones, el indicador de tres lámparas, el modo Reto con sus cinco opciones, y el recorrido guiado automático, 0 errores de consola/página esperados) — completar antes del commit final y actualizar esta nota con el resultado exacto.
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (décimo primera práctica de D5, segunda de molde S+P):**
   d5-11 reutiliza el patrón estructural de d5-07 (mecanica-50: esquemático interactivo +
   panel de instrumentos, sin fase de ensamble) pero cambia de tema: en vez de comparar
   métodos de arranque de un motor, esta práctica enseña el procedimiento de puesta en
   paralelo de un alternador con una red ya energizada — la primera práctica de la colección
   centrada explícitamente en ese procedimiento, en vez de en el comportamiento interno de
   una máquina.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/sincronizacion-alternador-red.html](../../../public/labs/sincronizacion-alternador-red.html))
   muestra el HUD con las cuatro condiciones y el contrato de fidelidad —
   documentado en la sección 5 de la ficha técnica in-app
   ([_ficha-sincronizacion-alternador-red.js](../../../public/labs/_ficha-sincronizacion-alternador-red.js))
   y en el encabezado de fidelidad del propio archivo fuente
   (`sincronizacion-alternador-red.body.js`).
3. **Verificación de implementación:** ✅ Física verificada por recomputación ejecutada con
   `node -e` (no a mano) de `evaluar()`/`lampVoltages()` para los cuatro casos límite de
   tolerancia y el patrón de parpadeo de secuencia. Pendiente al momento de escribir esta
   ficha: corrida completa de Jest tras `npm run gen:labs`, `tsc --noEmit`, y verificación
   funcional con Playwright contra el HTML construido y servido localmente — completar antes
   del commit final y actualizar esta nota con el resultado exacto.
4. **Petición concreta al experto:** (a) confirmar si la norma ancla IEC 60034 asignada por
   la lista maestra a esta fila es intencional pese a no cubrir literalmente el procedimiento
   de sincronización, o si conviene proponer IEEE C50.12/C50.13 o ANSI/IEEE C37.102 como
   norma ancla más apropiada; (b) confirmar si las tolerancias ilustrativas (±5%, ±0.1 Hz,
   ±10°) deberían ajustarse a un límite normativo citable; (c) confirmar si el "factor de
   choque" ilustrativo aporta valor pedagógico suficiente para justificar el riesgo de
   sobre-interpretación, o si conviene retirarlo; (d) confirmar si existe una clave SINCO más
   específica que la reutilizada de la familia D2/D10/d5-01..10 para operación de plantas de
   generación o protección eléctrica.
