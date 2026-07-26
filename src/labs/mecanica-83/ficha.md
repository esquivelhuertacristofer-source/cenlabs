# MEC-83 · Arranque-Paro con Sello y Enclavamientos en Ladder

**Dominio:** D3 Sistemas Digitales · Lógica de contactos · IEC 61131-3 (Ladder Diagram, LD)
**Práctica del backlog:** d3-07 · **Molde:** S (pizarrón: Explora / Aplica / Reto) — **D3 7/16**
**Simulador:** `/labs/ladder-arranque-paro.html`
**Slug de construcción:** `ladder-arranque-paro`

## Qué enseña

Cómo se escribe la lógica de mando de un motor en diagrama de escalera, y por qué los tres contactos del
arranque-paro con sello son el programa más repetido de la industria.

1. **El rung es una ecuación booleana** — contactos NO(x)=x y NC(x)=¬x; serie = AND, paralelo = OR. El valor
   de un rung es el AND de sus bloques, cada bloque el OR de sus ramas, cada rama el AND de sus contactos.
2. **Sello (seal-in) = retención** — `M = (Marcha ∨ M) ∧ /Paro`. Los pulsadores son momentáneos: sin la rama
   en paralelo con la propia bobina el rung es un **jog** (sigue al botón). El sello la sostiene scan a scan.
3. **Paro dominante y falla segura** — el Paro es NC en serie: rompe el AND aunque se mantenga la marcha, y
   un cable cortado detiene el equipo (con un Paro NO, no se podría parar).
4. **Enclavamiento (interlock)** — en la inversión, cada bobina lleva el NC de la contraria en serie: F y R
   nunca conducen a la vez; hay que parar para invertir. Empate simultáneo → gana el **rung superior**.
5. **Ciclo de scan** — los rungs se resuelven en orden; una bobina actualizada la ven los rungs posteriores
   del mismo scan, y el sello lee el valor de la bobina del scan anterior.

## Lógica (verificada `verify_ladder.mjs` — 15/15)

Motor de datos: `contacto {ref,type:'NO'|'NC'}`; `rung {coil, blocks:[block]}`; `block=[branch]` (OR);
`branch=[contact]` (AND).

- `contactCond(c,val)` → `type==='NC' ? !val(ref) : !!val(ref)`
- `evalRung(rung,val)` → `blocks.every(b => b.some(br => br.every(contactCond)))`
- `scan(rungs,inputs,coils)` → recorre rungs en orden sobre una copia de `coils`; `val(ref)` = entrada si
  está en `inputs`, si no la bobina (ya actualizada si su rung fue anterior).
- `run(rungs,seq,coilNames)` → una entrada por scan desde bobinas en 0; devuelve el historial.

Rungs sellados: `rungM = M:(Start∨M)∧/Stop`; `rungF = F:(StartF∨F)∧/Stop∧/R`; `rungR = R:(StartR∨R)∧/Stop∧/F`.

Comprobaciones: sello `[0,1,1,1,0,0]` · jog `[0,1,0,1,0]` · paro dominante `[1,0,1]` · el paro rompe el sello
`[1,1,0,0]` · F y R nunca simultáneas en una secuencia larga · F corriendo bloquea a R · tras el paro R
arranca · arranque simultáneo → gana F (rung superior) · el sello es punto fijo del scan · tabla 8/8 de
`(Start∨M)∧¬Stop` · definición NO/NC · serie=AND y paralelo=OR (4/4) · y los tres errores detectables
(sin sello ⇒ jog, Stop como NO ⇒ roto, sin enclavamiento ⇒ ambas bobinas encienden).

## Reto (calificación triple, de DISEÑO)

Sin valor oculto que adivinar: el alumno **programa** los dos rungs de inversión de un proceso del pool
(banda reversible, portón, husillo de torno, polipasto) eligiendo tres piezas independientes, calificadas
por separado con `retoBehavior()` explicando el comportamiento resultante:

- **retoOkSeal** — retención: la rama de sello debe ser el contacto **NO de la propia bobina**
  (`retoCh.seal==='NO'`). Sin rama ⇒ jog; con NC ⇒ lógica invertida que no retiene.
- **retoOkStop** — el Paro debe ser contacto **NC** en serie (`retoCh.stop==='NC'`) para ser dominante y
  fallar en seguro.
- **retoOkLock** — enclavamiento: **NC de la bobina contraria** (`retoCh.lock==='NC'`). Sin él pueden
  encenderse ambos sentidos (verificado).

`retoSolved = retoOkSeal && retoOkStop && retoOkLock`.

## Convenciones

- Lógica active-high; cada pulsación de la botonera = **un ciclo de scan** idealizado (sin tiempo real).
- Los rungs se evalúan en orden de arriba abajo (la prioridad de rung resuelve los empates).
- Modelo puramente lógico: sin rebote de contactos, sin dinámica del contactor, sin temporizadores.
- El enclavamiento simulado es el **de software**; el de hardware/mecánico se explica pero no se simula.
- Nunca `onclick` inline en el HTML generado: los controles se cablean con `el(id).onclick=()=>fn()` y
  `bar.querySelectorAll('[data-x]').forEach(b=>b.onclick=…)`.

## Verificación en dos capas

1. **Numérica** (`verify_ladder.mjs`, scratchpad): motor de scan de PLC con contactos NO/NC, series y
   paralelos, sello, paro dominante, inversión enclavada y los errores de diseño → **15/15 OK**.
2. **Dinámica** (Playwright + `window.__labDebug`, servidor HTTP local sirviendo `public/`): three.js por
   CDN import map (file:// falla por CORS).

## Referencias

IEC 61131-3 *Programmable controllers, Part 3: Programming languages* (Ladder Diagram) · Petruzella,
*Programmable Logic Controllers* (McGraw-Hill) · Bolton, *Programmable Logic Controllers* (Newnes/Elsevier) ·
Hackworth & Hackworth, *Programmable Logic Controllers: Programming Methods and Applications* (Pearson) ·
NFPA 79 / NOM-001-SEDE (circuitos de mando: paro dominante y falla segura) · verificación numérica propia
(`verify_ladder.mjs`).
