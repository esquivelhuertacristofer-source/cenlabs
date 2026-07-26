# MEC-82 · Máquinas de Estados Finitos · Moore / Mealy

**Dominio:** D3 Sistemas Digitales · Lógica secuencial · Diagrama y tabla de estados
**Práctica del backlog:** d3-06 · **Molde:** S (pizarrón: Explora / Aplica / Reto) — **D3 6/16**
**Simulador:** `/labs/maquinas-estado.html`
**Slug de construcción:** `maquinas-estado`

## Qué enseña

Cómo el patrón central de la lógica secuencial —la máquina de estados finitos— pasa de la idea al circuito
a través del diagrama y la tabla de estados, y en qué se diferencian sus dos estilos (Moore y Mealy).

1. **Estado = memoria** — una FSM pasa de un estado a otro por flanco de reloj según su entrada y emite una
   salida; el estado resume todo el pasado que importa (n flip-flops ⇒ hasta 2ⁿ estados).
2. **Moore vs Mealy** — Moore: salida = f(estado), registrada, glitch-free, un estado más. Mealy: salida =
   f(estado, entrada), reacciona el mismo ciclo, un estado menos, puede glitchear. Salida_Moore = salida_Mealy
   registrada un ciclo (`moReg[i]=mealy[i-1]`).
3. **Detector de secuencia (con solape)** — reconoce un patrón de bits; al fallar retrocede al prefijo útil
   más largo (failure-function de KMP), no siempre a cero → solape (101 en 10101). Moore usa len+1 estados,
   Mealy len; ambos detectan las mismas posiciones.
4. **Controlador de proceso (Moore)** — tanque de mezcla ESPERA→LLENADO→MEZCLA→VACIADO: cada etapa se retiene
   por self-loop hasta su señal (arranque/nivel/tiempo) y los actuadores dependen sólo del estado.

## Física / lógica (verificada node -e — 14/14)

- **Detector:** `kmpFail(P)` (failure-function), `kmpNext(P,f,s,b)` (prefijo útil 0..len con solape).
  `mooreRun(P,stream)` estados 0..len, `outs[i]=1` si tras consumir `x[i]` el estado es `len`;
  `mealyRun(P,stream)` estados 0..len-1, salida en el bit que completa. Ambos = `bruteMatches(P,stream)`
  (6 patrones × 3 flujos). Solape: `bruteMatches([1,0,1],[1,0,1,0,1])=[2,4]`, `mooreRun=…[0,0,1,0,1]`.
- **Conteo de estados:** Moore = len+1, Mealy = len (verificado). **Tiempos:** la salida Mealy sube en el
  ciclo del bit que completa el patrón; la Moore, registrada un ciclo después.
- **Equivalencia:** Moore y Mealy reconocen el mismo lenguaje (mismas posiciones), verificado contra fuerza
  bruta sobre patrón 1101 y flujo de 300 bits.
- **Proceso (Moore):** `TS={IDLE:0,FILL:1,MIX:2,DRAIN:3}`, `tankNext(s,inp)` (switch con self-loops),
  `tankOut(s)=[[0,0,0,0],[1,1,0,0],[0,0,1,0],[0,0,0,1]][s]` (válvula entrada, bomba, motor mezcla, válvula
  drenaje). Ciclo `[0,1,2,3,0]`; cada estado se retiene sin su entrada; determinista sobre las 16 combos por
  estado (4×16). Script: `verify_fsm.mjs` (scratchpad).

## Reto (calificación dual)

Reto de **DISEÑO** de la FSM de un proceso industrial (embotelladora, lavadora, prensa o semáforo); sin
valor oculto que adivinar. Para cada etapa el alumno elige dos cosas, calificadas por separado:

- **retoOkNext** — la tabla de TRANSICIÓN: cada etapa debe avanzar a la siguiente en orden cíclico
  (`retoNextSel[s]===(s+1)%4`). Errores clásicos: saltar una etapa (no la ejecuta) o dejar un estado
  estancado (nunca reinicia).
- **retoOkOut** — la tabla de SALIDAS Moore: cada etapa acciona su propio actuador (`retoOutSel[s]===p.out[s]`,
  con `out=[0,1,2,3]`).

`retoSolved = retoOkNext && retoOkOut`.

## Convenciones

- Estados codificados 0..3 (dos flip-flops); lógica active-high; MSB primero en el detector.
- Modelo puramente lógico: sin setup/hold, retardo reloj-a-Q, sesgo de reloj ni metaestabilidad.
- Detector con solape mediante failure-function (KMP): un bit malo retrocede al prefijo útil, no siempre a 0.
- Estilo Moore para actuadores (salida = f(estado), glitch-free); Mealy sólo se compara, no se cablea a HW.
- Nunca `onclick` inline en el HTML generado: los controles se cablean con `el(id).onclick=()=>fn()`.

## Verificación en dos capas

1. **Numérica** (`node -e` / `verify_fsm.mjs` en scratchpad): detector Moore y Mealy vs fuerza bruta
   (6 patrones × 3 flujos), solape 101 en 10101 → [2,4], conteo de estados (Moore len+1, Mealy len),
   equivalencia de lenguaje y relación de tiempos, controlador de tanque (ciclo, self-loops, actuadores por
   estado, determinismo 4×16) → **14/14 OK**.
2. **Dinámica** (Playwright + `window.__labDebug`, servidor HTTP local sirviendo `public/`): three.js por
   CDN import map (file:// falla por CORS).

## Referencias

Mano & Ciletti, *Diseño Digital* (Pearson): máquinas de estados, Moore/Mealy, diagramas y tablas de estado ·
Wakerly, *Digital Design: Principles and Practices* (Pearson): síntesis de FSM y detectores de secuencia ·
Roth & Kinney, *Fundamentals of Logic Design* (Cengage) · Katz & Borriello, *Contemporary Logic Design*
(Pearson) · Knuth, Morris & Pratt, *Fast Pattern Matching in Strings* (SIAM J. Comput., 1977): la
failure-function del detector con solape · verificación numérica propia (`verify_fsm.mjs`).
