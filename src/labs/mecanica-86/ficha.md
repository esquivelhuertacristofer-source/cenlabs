# MEC-86 · GRAFCET: Secuencia de Cilindros Neumáticos

**Dominio:** D3 · Sistemas Digitales y Automatización
**Práctica del backlog:** d3-10 — GRAFCET / secuencia de cilindros neumáticos (IEC 60848). **Molde S** — **D3 10/16**
**Simulador:** `/labs/grafcet-secuencia-neumatica.html`
**Slug de construcción:** `grafcet-secuencia-neumatica`

## Qué enseña

1. **La electroválvula 5/2 biestable es una MEMORIA.** Sin señal mantiene su posición; con las dos bobinas energizadas el corredor tampoco se mueve. *No vibra al ritmo del scan, no alterna, no gana la última orden: se queda.* Esa propiedad, que es lo que la hace útil, es también lo que convierte una señal ambigua en un bloqueo.

2. **El método directo (combinacional) funciona en algunas secuencias.** `A+ B+ A− B−` sale bien sin una sola etapa. *Está en el pool a propósito:* la conclusión honesta no es «el método directo no sirve», sino «el método directo no se puede usar sin comprobarlo».

3. **Falla en cuanto un sensor debe significar dos cosas.** En `A+ B+ B− A−`, `b0` confirma B− (y por tanto dispara A−) pero también vale en reposo, cuando lo que toca es A+. Los dos solenoides de la válvula de A quedan energizados a la vez: **problema de señales opuestas**.

4. **Hay un fallo aún más elemental: el arranque espontáneo.** Si la primera condición del método directo ya es cierta en reposo (`A+ A− B+ B−`), la célula se mueve sola en cuanto recibe aire, sin que nadie pulse Marcha.

5. **La solución es introducir ESTADO.** Una etapa por movimiento: X0 espera y cada Xi ejecuta la acción del movimiento i. Con estado, el mismo sensor puede significar cosas distintas en instantes distintos del ciclo.

6. **La receptividad es el sensor que CONFIRMA, no el que dispara.** `t_i = recOf(seq[i])`. *Esa confusión es la fuente de casi todos los GRAFCET que no arrancan.*

7. **Regla 4 de la IEC 60848.** Todas las transiciones franqueables se franquean **simultáneamente** sobre una imagen de etapas congelada al principio del scan, y una etapa desactivada y activada a la vez **permanece activa**. *Sin la primera cláusula un token recorrería varias etapas en un solo ciclo; sin la segunda, un bucle que vuelve sobre sí mismo apagaría el GRAFCET entero.*

8. **La regla de desactivación se decide contra el banco degradado.** `siguiente` pasa nominal y degradado; `ninguna` falla ya en nominal; `tiempo` (PT fijo) **pasa el nominal y falla el degradado**. *Ese es el error más difícil de detectar, porque funciona mientras nada cambie.* La IEC 60848 **no** prohíbe las receptividades temporizadas: lo que está mal es sustituir por reloj la confirmación de un movimiento que tiene sensor.

9. **La asignación de salidas.** `etapa` funciona; `sensor` es el método directo otra vez (y por eso hereda sus fallos, incluido el arranque espontáneo); `destino` (Xi ∧ sensor de destino) se autoinhibe y bloquea el ciclo.

10. **El tiempo de ciclo medido es MENOR que la suma nominal.** No por optimismo del modelo: los reed conmutan dentro de una banda `eps = banda/carrera`, antes del tope mecánico. *En las cuatro células la diferencia es del 1,8 al 2,7 %, que de otro modo parecería un error de cálculo.*

## Lógica (verificada `verify_grafcet.mjs` — 111/111)

Base de scan `DT = 10 ms`. El motor del laboratorio es **el código del verificador pegado verbatim**.

```
newValve() / stepValve(v, cExt, cRet)   v.pos ∈ {ext, ret}; cExt ∧ cRet ⇒ NO se mueve (v.both = true)
newCyl(cy) / stepCyl(c, extend, dt)     p(t) lineal; tExt ≠ tRet
epsOf(cy) = cy.band / cy.stroke         sens0 ⇔ p ≤ eps · sens1 ⇔ p ≥ 1 − eps
recOf(mv)                               'a1'|'a0'|'b1'|'b0' — el sensor que CONFIRMA mv
grafcetStep(s, Start, sn, dt)           imagen congelada X = s.X.slice(); Sets dn/up; regla 4
coilsOf(s, sn, Start)                   sal ∈ {etapa, sensor, destino}
cellScan(s, Start, dt, slow)            grafcetStep → coilsOf → stepValve → stepCyl
runCell(sc, cfg, opt)                   mide orden / cerrado / serial / done / tMove / tConf / cycleMs
spontaneous(sc, cfg)                    ¿se mueve sin pulsar Marcha?
diagDirect(sc)                          diagnóstico combinacional de la célula
```

Pool de 4 células: **Estación de marcado** `A+ B+ B− A−` · **Alimentador** `A+ B+ A− B−` · **Prensa** `B+ A+ A− B−` · **Clasificador** `A+ A− B+ B−`.
`RETO_POOL = [0, 2, 3]` — el Alimentador se excluye del Reto porque el método directo **sí** funciona en él y se usa como contraejemplo honesto en Aplica.

Comprobaciones por sección: válvula biestable como memoria 12/12 · cilindro y bandas reed 14/14 · receptividades 8/8 · regla 4 de franqueo 9/9 · ciclo completo de las 4 células 16/16 · método directo (conflicto, culpable y arranque espontáneo) 12/12 · reglas de desactivación en banco nominal y degradado 12/12 · asignación de salidas 12/12 · unicidad de receptividades (barrido de 256 combinaciones × 4 células) 4/4 · tiempos de ciclo medidos vs nominales 8/8 · ausencia de señales opuestas con salida por etapa 4/4.

## Reto (calificación triple, por COMPORTAMIENTO)

Tres decisiones ortogonales, cada una simulada **con las otras dos correctas**:

```js
const badRec = mv => (cylOf(mv) === 'A' ? 'a' : 'b') + (dirOf(mv) ? '0' : '1');
const cfgWith = (sc, o) => ({ ...GOOD(sc), ...o });

okRec(sc, rec) = runC(sc, cfgWith(sc, {rec}), {maxMs: 20000}).done
okDes(sc, des) = runC(sc, cfgWith(sc, {des}), {maxMs: 20000}).done &&
                 runC(sc, cfgWith(sc, {des}), {maxMs: 40000, slow: SLOW}).done
okSal(sc, sal) = runC(sc, cfgWith(sc, {sal}), {maxMs: 20000}).done &&
                 !spontaneous(sc, cfgWith(sc, {sal}))
```

- **Receptividades** — las 4 transiciones. Barrido de las **256** combinaciones por célula: exactamente **1** es correcta, igual a `sc.seq.map(recOf)`.
- **Regla de desactivación** — se evalúa en nominal **y** en degradado (`SLOW = {A: 4, B: 1}`), que es lo que descarta el temporizador de PT fijo.
- **Asignación de salidas** — se evalúa por ciclo completo **y** contra el arranque espontáneo.

Semilla deliberadamente **mal en las tres**: `rec = seq.map(badRec)` (el sensor contrario en cada transición), `des = 'ninguna'`, `sal = 'sensor'`.

## Convenciones

- `DT = 10 ms`; cada pulsación de Explora es **un** ciclo de scan.
- Cronogramas: **orden de bobina punteada**, estado real (corredor, sensores) **continuo**.
- La traza de Explora se siembra con una muestra de **reposo** para que el primer flanco sea medible.
- Los fotogramas 3D se derivan de una corrida medida (`framesFromRun`), nunca se escriben a mano.
- Quiz barajado con Fisher-Yates; `runAuto` responde con `findIndex(o => o.ok)`, nunca con un índice fijo.
- Nunca `onclick` inline en el HTML generado: todo se cablea con `el(id).onclick = () => fn()`.

## Verificación en dos capas

1. **Numérica** (`scratchpad/verify_grafcet.mjs`, 423 líneas, 15 secciones): **111/111**.
2. **Dinámica** (Playwright + `window.__labDebug` sobre servidor HTTP local): `scratchpad/pw_grafcet.mjs` **114/114** en 14 secciones —arranque y escena, válvula como memoria, banda del reed (`trip` medido 590 ms frente a 600 ms nominales), señales opuestas desde el reposo y en marcha, receptividades, regla 4, método directo en las 4 células, ciclo completo, reglas de desactivación y asignación de salidas, barrido de unicidad 256×4 dentro del navegador, calificación triple del Reto con ortogonalidad comprobada criterio a criterio, modos y controles, quiz— y `scratchpad/pw_grafcet_auto.mjs` **5/5** (recorrido guiado completo, 153 s, termina en Reto resuelto). **Cero errores de consola** en ambas corridas.

## Referencias

- IEC 60848, *GRAFCET specification language for sequential function charts*
- IEC 61131-3, *Programmable controllers — Part 3: Programming languages* (SFC)
- ISO 5599-1, *Pneumatic fluid power — Five-port directional control valves*
- ISO 15552, *Pneumatic fluid power — Cylinders*
- ISO 1219-1, *Fluid power systems — Graphical symbols and circuit diagrams*
- Festo Didactic, *Neumática y electroneumática*
- Croser, P. y Ebel, F., *Neumática, nivel básico* (Festo)
