# Revisión adversarial de labs (mecanica-11..51)

Mandato del usuario (2026-07-16): antes de seguir construyendo el backlog de 150 prácticas (d5-09 en adelante), revisar de forma adversarial cada laboratorio ya construido — calidad, precisión técnica, dinámica pedagógica — y darle sello de aprobado.

**Alcance de esta revisión**: los 41 labs `mecanica-11..51` (backlog de 150 prácticas), que nunca habían pasado por una revisión holística de estos 3 ejes. Los otros 50 labs (40 no-mecánica + `mecanica-1..10`) ya tienen auditorías previas documentadas (científica 2026-06-09; implementación 2026-07-02) y quedan fuera de este alcance.

**Método**: por cada lab, dos revisores independientes (sin verse entre sí) — Revisor A (implementación + dinámica pedagógica) y Revisor B (precisión técnica, re-verificación de fórmulas). El hilo principal concilia ambos veredictos y asigna el sello final.

**Leyenda de sello**: ✅ **Aprobado** (sin hallazgos, o solo cosméticos) · 🟡 **Aprobado con observaciones** (hallazgos menores, no bloqueantes) · 🔴 **No aprobado** (hallazgo bloqueante, requiere corrección antes de continuar el backlog).

---

## Tanda 1 — D1 + D10 metrología (mecanica-13, 40-43)

### mecanica-13 — Kirchhoff (d1-02, molde S de referencia) — 🟡 Aprobado con observaciones
Física verificada de forma independiente por Revisor B (MNA, LCK, LVK, todas las cuentas coinciden exacto). Sin hallazgos bloqueantes de ninguno de los dos revisores.
- **MENOR**: `scripts/lab-src/kirchhoff.body.js:166-176` — el objeto `MAT` esparce `plas.maps`/`brush.maps`/`rub.maps`, pero las factories de textura devuelven el objeto plano (`{map,roughnessMap,normalMap}`), no anidado en `.maps`. El spread queda vacío → banco, marco, patas, pistas PCB, cables pierden sus texturas PBR (se ven en color plano). Único archivo del catálogo con este typo (confirmado por grep contra el resto de `.body.js`).
- **MENOR**: `buildQuiz()` (líneas 661-698) — el orden de las 4 opciones del mini-quiz nunca se aleatoriza; la opción correcta cae siempre en la misma posición por modo (mallas→A, explora/nodos/reto→B), incluso tras "Nueva red". Es adivinable por patrón de botón sin entender LCK/LVK/MNA.
- **COSMÉTICO**: variable `solved` se escribe pero nunca se lee (código vestigial).
- **MENOR (sistémico, no exclusivo de este lab)**: identificación de componentes individuales solo vía toast por picking de puntero — sin vía de teclado/lector de pantalla (los valores pedagógicos centrales sí están espejados en el DOM).
- **Nota de prioridad**: como este lab es la implementación de referencia del "molde S" que ya se replicó en ~26 labs (D1/D2/D10), se recomienda corregir el typo `.maps` y aleatorizar el quiz **antes de usarlo como plantilla en futuras réplicas**, aunque no bloquea el sello de este lab en sí (ninguno de los revisores encontró algo bloqueante).

### mecanica-40 — Calibrador vernier (d10-11) — 🔴 No aprobado (corregido en este mismo turno, ver commit)
Revisor A encontró un hallazgo **bloqueante confirmado**: `updateReport()` (`scripts/lab-src/calibrador-vernier.body.js:399-402`) imprime la "Lectura corregida" con el mismo formato numérico (`toFixed(3)+' mm'`) que usa `buildOptions()` para el texto del botón de respuesta correcta — el estudiante puede copiar la respuesta del panel de informe sin leer el nonio ni razonar la corrección de cero. Agravado por: (a) quiz sin aleatorización real entre sesiones (8 combinaciones fijas caso×resolución), (b) variable `solved` sin efecto (sin gating de progreso).
Revisor B no encontró errores de física — las 4 fórmulas (LC, corrección de cero, s muestral, ±LC/2) verifican exactas contra la ficha.
**Corrección aplicada**: ver sección "Correcciones aplicadas" abajo.

### mecanica-41 — Micrómetro/comparador (d10-12) — 🟡 Aprobado con observaciones
Revisor B: APROBADO sin hallazgos de física (3 fórmulas centrales — lectura de 3 términos, TIR, planitud — verificadas exactas; barrido de robustez 0-30mm sin anomalías).
Revisor A: sin hallazgos bloqueantes. **MENOR**: posición de respuesta del quiz determinista y sesgada a "B" en 3/5 casos (mismo patrón sistémico que mecanica-13/40); **MENOR**: sin gating de progreso (variable `solved` sin efecto, igual que en mecanica-40); **MENOR**: desglose de 3 términos del micrómetro (el objetivo de aprendizaje central) solo existe como píxeles de canvas, sin respaldo textual en el DOM.

### mecanica-42 — Incertidumbre y trazabilidad GUM (d10-13) — 🟡 Aprobado con observaciones
Revisor B: fórmulas GUM (uA, uRes, uCert, uc, U) verificadas exactas contra la ficha; único hallazgo real es de notación (`Ø` usado para un bloque patrón rectangular, debería ser dimensión nominal sin símbolo de diámetro) — cosmético, no afecta cálculo.
Revisor A: sin hallazgos bloqueantes. **MENOR**: el gate del quiz no requiere haber tocado los nodos 3D (cadena de trazabilidad) ni el tablero de certificado; **MENOR**: quiz con posición determinista (mismo patrón sistémico); **MENOR**: la narrativa de "construcción secuencial entre casos" no está aplicada por el código (el estudiante puede saltar casos libremente).

### mecanica-43 — Termopar/RTD/infrarrojo (d10-14) — 🔴 No aprobado (corregido en este mismo turno, ver commit)
Revisor A encontró un hallazgo **bloqueante confirmado**: el `<style>` de `public/labs/termopar-rtd-infrarrojo.html` no define ninguna regla para las clases reales del panel (`.telegrid`, `.trow`, `.dxblock`, `.dxbtns`, `.dxb`, `.dxfeedback`, `.ppanel`, `.scenbar`, `.hpanel`), mientras que sí define reglas huérfanas para clases que el HTML no usa (`.gl`, `.b.dx.right/.wrong`) — evidencia de plantilla CSS copiada de otro lab sin actualizar. Efecto: botones de diagnóstico sin estilo, resaltado correcto/incorrecto del quiz nunca se ve, código de color verde/ámbar/rojo del error de medición nunca se aplica. **Contradice directamente** la afirmación de `ficha.md` de que el resaltado fue verificado por Playwright.
Revisor B: física perfecta — termopar, RTD (2/4 hilos) e infrarrojo (rederivación greybody independiente) verificados exactos; sin `Math.random()`; solo 2 hallazgos cosméticos de completitud del flag ⚑.
**Corrección aplicada**: ver sección "Correcciones aplicadas" abajo.

### Correcciones aplicadas tras Tanda 1

**mecanica-40 — Calibrador vernier**: `updateReport()` en `scripts/lab-src/calibrador-vernier.body.js` ahora oculta la línea "Lectura corregida = cruda − error de cero = ..." mientras `solved===false`; se muestra solo tras responder correctamente el quiz. Antes de contestar, el panel sigue mostrando la lectura cruda y el error de cero (para que el estudiante pueda calcular la corrección él mismo), pero ya no revela el resultado final con el mismo formato que usa el botón de respuesta correcta.

**mecanica-43 — Termopar/RTD/infrarrojo**: `scripts/lab-src/termopar-rtd-infrarrojo.body.js` usaba una vocabulario de clases CSS inventado (`.hpanel`, `.htitle`, `.ppanel`, `.ptitle`, `.scenbar`, `.telegrid`, `.trow`, `.dxblock`, `.dxq`, `.dxbtns`, `.dxb`, `.dxfeedback`, `.b.wide`) que no tenía ninguna regla definida en el donor compartido (`escaner-obd.html`) ni en ningún otro lugar — el panel derecho completo (botones de diagnóstico, grilla de telemetría, encabezado de pregunta, caja de feedback) se renderizaba sin ningún estilo del framework. Se reescribió el HUD y el panel para reutilizar las clases reales ya definidas y usadas por labs hermanos (`calibrador-vernier.body.js`, `circuito-equivalente-motor-induccion.body.js`): `.eyebrow`/`h2` para el título, `.li`/`.dot` para la leyenda, `.fl`/`.fl.no` para el contrato de fidelidad, `.g`/`.gl` para la telemetría, `.btns`+`.b.dx` (en vez de `.dxb`) para los botones de diagnóstico con estados `right`/`wrong` (en vez de `correct`/`wrong`), `.console` para la caja de feedback, y `.b.auto` dentro de su propio `.btns` para el botón de demostración guiada. También se eliminó un `<div id="toast">` duplicado dentro del panel (id ya provisto por el framework base). Ambos labs regenerados vía `build-lab.mjs` y verificados con un script Playwright temporal (borrado tras uso): botones de quiz correcto/incorrecto ahora sí cambian de color, la grilla de error de temperatura sí aplica el código verde/ámbar/rojo, y el panel de informe del calibrador ya no filtra la respuesta antes de contestar. Suite Jest completa (834 tests) sin regresiones tras el cambio.

---

## Tanda 2 — D10 automotriz (mecanica-11,12,24-31)

_(pendiente)_

---

## Tanda 3 — D2 electrónica, Tanda 1 (mecanica-14..23)

_(pendiente)_

---

## Tanda 4 — D2 electrónica, Tanda 2 (mecanica-32..39)

_(pendiente)_

---

## Tanda 5 — D5 máquinas eléctricas (mecanica-44..51)

_(pendiente)_

---

## Resumen final

_(se completa al cerrar la tanda 5)_
