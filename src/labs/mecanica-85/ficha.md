# MEC-85 · Arranque Estrella-Delta Temporizado

**Dominio:** D3 Sistemas Digitales · Maniobra de contactores · IEC 61131-3 + IEC 60947-4-1 (Anexo F)
**Práctica del backlog:** d3-09 · **Molde:** S (pizarrón: Explora / Aplica / Reto) — **D3 9/16**
**Simulador:** `/labs/arranque-estrella-delta.html`
**Slug de construcción:** `arranque-estrella-delta`

## Qué enseña

El **lado de control** del arrancador estrella-delta. La parte eléctrica —tensión entre √3, corriente y
par a un tercio, curvas par-velocidad— es de **MEC-50** y aquí no se repite. Lo que se enseña es el
programa de maniobra y el hecho físico que lo gobierna:

1. **La orden ≠ el contacto** — la bobina cambia dentro de un ciclo de scan; la armadura tiene masa y
   tarda `t_cierre` en cerrar y `t_apertura` en abrir (incluye extinción del arco). Ambos son dato de
   catálogo.
2. **Ventana de peligro = `t_apertura − t_cierre`** — es lo que KMY sigue cerrado después de que KMΔ ya
   cerró. Con los dos cerrados, el bobinado cortocircuita dos fases.
3. **Solape medido = `máx(0, t_apertura − t_cierre − t_muerto)`** — no se postula: se mide scan a scan
   sobre el motor.
4. **Enclavamiento por software ≠ protección** — lee variables internas del PLC, que caen en el mismo
   scan en que se quita la orden. Evita el *error de programación* (mandar las dos bobinas a la vez),
   no el solape físico.
5. **El tiempo muerto correcto es el MÁS CORTO que anula el solape** — la transición es **abierta**: el
   motor queda desenergizado, la fem residual decae con `T₀` y se desfasa a `s·2πf`, así que el pico de
   reconexión **crece con el tiempo muerto en todo el rango ajustable (0–60 ms)** y alcanza su **máximo**
   cerca de la **oposición de fase** (`δ = 180°`, `tOpos = 500/(s·f)` ≈ 99–180 ms), fuera de ese rango en
   las cuatro máquinas del pool. Las dos curvas se oponen. *(Honestidad: la monotonía NO es global —
   pasado el máximo el pico vuelve a bajar—, y el máximo NO cae exactamente en `δ = 180°` sino un poco
   antes, porque la fem residual sigue decayendo mientras gira. Por eso el texto usa `tPeakMax`, que lo
   busca por barrido, en vez de postular `tOpos`. El laboratorio lo dice y lo marca en la gráfica.)*
6. **Contra un contacto SOLDADO el tiempo no sirve** — sólo los **contactos espejo** (IEC 60947-4-1,
   Anexo F): auxiliar NC con garantía constructiva de no estar cerrado a la vez que ningún principal NA.
   Da **falla segura**: KMΔ ni se energiza, el motor se queda en estrella, sin daño.
7. **El tiempo de estrella se decide por DESLIZAMIENTO, no por reloj** — alargarlo no da más par (en
   estrella el par es un tercio) y sí calienta el bobinado.

## Lógica (verificada `verify_stardelta.mjs` — 38/38)

Base de scan idealizada `DT = 5 ms`. El motor del laboratorio es **el mismo código del verificador**,
pegado verbatim (simulación y verificación comparten implementación):

- `newT()` / `stepTON(s,IN,pt,dt)` — TON IEC 61131-3; el flanco de subida arranca con `ET = 0`.
- `newCtor(tOn,tOff)` / `stepCtor(c,cmd,dt)` — contactor con tiempos de operación; `stuck` = principal
  soldado (cierra y ya no vuelve a abrir aunque se desenergice la bobina).
- `newStar(sc,fault)` / `starScan(s,Start,Stop,tY,tW,lock,dt)` — un scan completo: sello de KM1
  (`M = (Start ∨ M) ∧ ¬Stop`), TON de estrella `qy`, TON de tiempo muerto `qw` disparado por `qy`,
  órdenes `cy = M ∧ ¬qy ∧ lockY` y `cd = M ∧ qw ∧ lockD`.
  `lock='aux'` ⇒ lee `contacto` (`!kmd.closed` / `!kmy.closed`); `lock='soft'` ⇒ lee **orden de bobina**
  (`!kmd.cmd` / `!kmy.cmd`); `lock='none'` ⇒ sin condición.
- `runStar(sc,tY,tW,lock,fault,extraMs)` — ejecuta la maniobra y **mide** `tCmdY0`, `tOpenY`, `tCmdD1`,
  `tCloseD`, `tCloseY`, `overlapMs`, `tDelta` y las etapas.
- `zoomStar(...)` — muestras de la ventana para el cronograma (orden punteada + contacto continuo).
- `slipAt(t,sc) = sInf + (1−sInf)·e^(−t/τ)` — deslizamiento durante la estrella.
- `peakIdx(tW,sY,sc) = ILR·|1 − e·e^{jδ}|` con `e = (1−sY)·e^(−tW/T₀)` y `δ = sY·2πf·tW` — pico de
  reconexión en p.u. de la corriente a rotor bloqueado.
- `tYref(sc)` / `sYref(sc)` — el deslizamiento con el que **esta** máquina conmuta de verdad: el de su
  tiempo de estrella correcto (`okY`), no un valor fijo. Usarlo es lo que hace que la curva de pico sea
  la de la máquina y no la de otra. `tOpos(sY,sc) = 500/(sY·f)` ms — instante de oposición de fase;
  `tPeakMax(sY,sc)` — máximo real de la curva de pico, **buscado por barrido** (0–400 ms, paso 0,5 ms).

Comprobaciones: modelo de contactor (5) · secuencia Y→Δ (8) · solape físico y su fórmula (7) · falla de
KMY soldado con los tres enclavamientos (4) · deslizamiento y monotonía del pico (6) · unicidad y
ortogonalidad del Reto en los 4 escenarios (4) · traza `zoomStar` (4).

## Reto (calificación triple, por COMPORTAMIENTO)

Un escenario del pool (`POOL`: 4 máquinas con `tOn`, `tOff`, `τ`, `sInf`, `sMax`, `T₀`, `ILR`). El alumno
ajusta **tres decisiones independientes** y cada una se simula y califica por separado:

- **`okY`** — tiempo en estrella: la opción **más corta** de `OPT_TY` cuyo `slipAt(tY) ≤ sMax`.
  Respuestas correctas por escenario: `3000 / 8000 / 12000 / 5000 ms`.
- **`okW`** — tiempo muerto: la opción **más corta** de `OPT_TW` con `overlapMs === 0` evaluada con
  `lock='none'` (sin ayuda del enclavamiento). Respuestas: `20 / 40 / 60 / 40 ms`. El umbral
  `tOff − tOn` vale `15 / 35 / 55 / 25 ms` y **nunca coincide con una opción** (sin filo de navaja).
- **`okLock`** — enclavamiento: el único que da `overlapMs === 0` con `fault='kmy'` es **`'aux'`**
  (contactos espejo) en los cuatro escenarios.

`retoSolved = retoOkY && retoOkW && retoOkL`. El `seedReto` arranca **deliberadamente mal en las tres**
(`badY` = primer `OPT_TY` que falla, `tw = 0`, `lock = 'none'`).

## Convenciones

- `DT = 5 ms` por scan; cada pulsación de la botonera de Explora = **un scan**.
- Cronogramas: **orden de bobina punteada, estado del contacto continuo**, misma ventana de tiempo.
- Los fotogramas de LED de la escena 3D (`seqFrames`) se derivan del resultado **medido** de `runStar`,
  nunca de secuencias escritas a mano: la escena no puede contradecir al motor.
- Quiz barajado (Fisher-Yates); `runAuto` responde con `findIndex(o=>o.ok)`, nunca por posición fija.
- Nunca `onclick` inline en el HTML generado: los controles se cablean con `el(id).onclick=()=>fn()`.

## Verificación en dos capas

1. **Numérica** (`verify_stardelta.mjs`, scratchpad): contactor, secuencia, solape, falla soldada,
   deslizamiento/pico y unicidad del Reto → **38/38 OK**.
2. **Dinámica** (`pw_stardelta.mjs`, Playwright + `window.__labDebug`, servidor HTTP local sirviendo
   `public/`): **66/66 OK** en 8 secciones. three.js por CDN import map (file:// falla por CORS).

   Bugs que **sólo** encontró esta capa:
   - la curva de pico usaba `slipAt(8000,sc)` fijo en vez del deslizamiento real de cada máquina, lo que
     metía la oposición de fase dentro de la ventana graficada del ventilador y hacía FALSA la afirmación
     "el pico crece siempre" → `tYref`/`sYref`;
   - la narración de Explora contaba mal los scans (el del flanco arranca la cuenta en cero, así que el
     contacto cierra en la pulsación `tOn/DT + 1`, no `tOn/DT`);
   - `expReset` dejaba la traza vacía, de modo que el flanco de la primera pulsación no quedaba
     registrado y el **retardo de cierre nunca se podía medir** (el panel mostraba "—") → la traza
     arranca ahora con una muestra de reposo.

## Referencias

IEC 61131-3 *Programmable controllers, Part 3: Programming languages* (TON) · IEC 60947-4-1 *Contactors
and motor-starters*, **Anexo F (mirror contacts)** · IEC 60947-5-1 (contactos de apertura positiva y
mecánicamente ligados) · NMX-J-515-ANCE *Controladores y arrancadores de motores de c.a.* · Chapman,
*Máquinas eléctricas* (McGraw-Hill) · Petruzella, *Electric Motors and Control Systems* (McGraw-Hill) ·
guías de aplicación de fabricantes de aparamenta sobre arrancadores estrella-delta · verificación
numérica propia (`verify_stardelta.mjs`).
