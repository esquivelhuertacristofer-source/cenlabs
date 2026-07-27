# MEC-84 · Temporizadores y Contadores en Secuencias

**Dominio:** D3 Sistemas Digitales · Bloques funcionales de PLC · IEC 61131-3 (TON, TOF, TP, CTU, CTD)
**Práctica del backlog:** d3-08 · **Molde:** S (pizarrón: Explora / Aplica / Reto) — **D3 8/16**
**Simulador:** `/labs/temporizadores-contadores-plc.html`
**Slug de construcción:** `temporizadores-contadores-plc`

## Qué enseña

Por qué la lógica de contactos (MEC-83) no basta: no sabe decir "espera", "sigue un rato más" ni
"cuenta hasta diez". Los bloques funcionales con memoria propia son los que introducen el tiempo y la
cantidad en el programa.

1. **Instancia con memoria** — cada temporizador guarda su `ET` y cada contador su `CV` de un ciclo de
   scan al siguiente. Dos instancias del mismo tipo son independientes.
2. **TON retrasa el ENCENDIDO** — cuenta mientras `IN=1` y activa `Q` al alcanzar `PT`; `Q` cae en el
   mismo scan que `IN`. Si `IN` cae antes, `ET` se borra ⇒ es además un **filtro antirruido**.
3. **TOF retrasa el APAGADO** — `Q` sube con `IN` y sigue activa `PT` después de que `IN` caiga; es
   **redisparable**; arranca con `ET` precargado en `PT` para que `Q=0` al energizar el PLC (sin pulso
   espurio). Es el bloque de la purga y la sobre-marcha.
4. **TP entrega un pulso de anchura fija** — `PT` exactos por flanco, **no redisparable**: aporrear el
   botón no alarga ni multiplica la acción.
5. **CTU/CTD cuentan FLANCOS, no niveles** — mantener la entrada alta cuenta una sola vez. `CTU`: `Q`
   cuando `CV ≥ PV`, `R` dominante. `CTD`: `LD` carga `PV`, `Q` cuando `CV ≤ 0`; **sin cargar arranca en
   cero con Q ya activa** (falsa alarma clásica).
6. **Contar ≠ medir tiempo** — con cadencia irregular no existe ningún `PT` equivalente a "N piezas".
7. **Secuencia por etapas** — un TON por etapa re-armado en cada transición: cada etapa dura exactamente
   su `PT`, el ciclo es la **suma de los PT**, y un CTU cuenta los ciclos y cierra el lote en `PV`. Es la
   estructura previa al GRAFCET (IEC 60848).

## Lógica (verificada `verify_timers.mjs` — 33/33)

Base de scan idealizada `DT = 100 ms`. El motor del laboratorio es **el mismo código del verificador**,
pegado verbatim (simulación y verificación comparten implementación):

- `newT(kind,pt)` / `newC(kind)` — instancias; el TOF nace con `et=pt` (⇒ `Q=0` al energizar).
- `stepTON(s,IN,pt,dt)` — `IN` ⇒ acumula `et` hasta `pt`, `Q = IN && et>=pt`; `!IN` ⇒ `et=0`, `Q=0`.
- `stepTOF(s,IN,pt,dt)` — `IN` ⇒ `et=0`, `Q=1`; `!IN` ⇒ acumula hasta `pt`, `Q = et<pt`. Redisparable.
- `stepTP(s,IN,pt,dt)` — flanco de subida con pulso inactivo ⇒ lanza pulso; durante el pulso los flancos
  se ignoran; estado `HOLD` hasta que `IN` cae, para no re-disparar con `IN` mantenida.
- `stepCTU(s,CU,R,pv)` — `R` dominante (`cv=0`); si no, flanco de `CU` ⇒ `cv++`; `Q = cv>=pv`.
- `stepCTD(s,CD,LD,pv)` — `LD` ⇒ `cv=pv`; si no, flanco de `CD` ⇒ `cv--`; `Q = cv<=0`.
- `newSeq()` / `seqStep(s,PT,PV,dt)` — cascada de 3 etapas con TON re-armado + CTU de lote.
- `seqRun(PT,PV)` — ejecuta el ciclo completo y devuelve **transiciones medidas** (`trans`, `ms`, `cv`).

Comprobaciones: instante exacto de disparo del TON y borrado por `IN` corta · caída simultánea de `Q` con
`IN` · TOF sin pulso espurio al arranque, sobre-marcha exacta y redisparo · TP de anchura fija ante
flancos repetidos, pulso disparado por un `IN` de un solo scan que el TON no alcanza a ver · CTU con dos
scans altos consecutivos = 1 cuenta, `R` dominante · CTD arranca con `Q=1` sin `LD` · equivalencia de
duración de etapas con la suma de `PT` · unicidad de la solución del Reto en los 4 escenarios.

## Reto (calificación triple, por COMPORTAMIENTO)

Un escenario del pool (`RETO_POOL`: 4 máquinas con `tDelay`, `tPurge`, `N` y cadencia irregular `GAPS`).
El alumno programa **tres funciones independientes** eligiendo *bloque* + *preselección*; cada criterio se
simula sobre el motor verificado y se califica por separado (acertar el tipo con el tiempo equivocado
sigue estando mal):

- **retoOkArr** (`behArr`/`okArr`) — retardo de arranque: sólo `TON` con `PT = tDelay` energiza el equipo
  principal en el instante correcto. Con `TP` la salida se apaga sola; con `TOF` arranca de inmediato.
- **retoOkPar** (`behPar`/`okPar`) — sobre-marcha tras el paro: sólo `TOF` con `PT = tPurge`. El predicado
  exige el flag **`atStop`** (la salida debe haber estado realmente activa al instante del paro) para no
  dar el falso positivo del "¿se apaga?" — regla heredada de MEC-83.
- **retoOkCnt** (`behCnt`/`okCnt`) — conteo del lote: sólo `CTU` con `PV = N`. Ningún `PT` funciona porque
  `GAPS` impone cadencia irregular; el `CTD` sin `LD` dispararía desde el primer scan.

`retoSolved = retoOkArr && retoOkPar && retoOkCnt`. La lista de preselecciones del tercer criterio cambia
según el tipo elegido (`OPT_PT_CNT` en ms si es `TON`, `OPT_PV` en piezas si es contador).

## Convenciones

- `DT = 100 ms` por scan; cada pulsación de la botonera de Explora = **un scan**.
- Los tiempos se expresan en ms y todos los `PT` del laboratorio son múltiplos de `DT` (sin cuantización).
- Las transiciones del cronograma de Aplica están **medidas** ejecutando `seqRun`, no escritas a mano.
- Quiz barajado (Fisher-Yates); `runAuto` responde con `findIndex(o=>o.ok)`, nunca por posición fija.
- Nunca `onclick` inline en el HTML generado: los controles se cablean con `el(id).onclick=()=>fn()` y
  `bar.querySelectorAll('[data-x]').forEach(b=>b.onclick=…)`.

## Verificación en dos capas

1. **Numérica** (`verify_timers.mjs`, scratchpad): semántica de los cinco bloques, cascada de etapas y
   unicidad de la solución del Reto → **33/33 OK**.
2. **Dinámica** (Playwright + `window.__labDebug`, servidor HTTP local sirviendo `public/`): three.js por
   CDN import map (file:// falla por CORS).

## Referencias

IEC 61131-3 *Programmable controllers, Part 3: Programming languages* (bloques funcionales estándar TON,
TOF, TP, CTU, CTD) · IEC 60848 *GRAFCET specification language* · Petruzella, *Programmable Logic
Controllers* (McGraw-Hill) · Bolton, *Programmable Logic Controllers* (Newnes/Elsevier) · Hackworth &
Hackworth, *Programmable Logic Controllers: Programming Methods and Applications* (Pearson) · verificación
numérica propia (`verify_timers.mjs`).
