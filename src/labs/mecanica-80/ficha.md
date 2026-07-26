# MEC-80 · Contadores Síncronos Módulo N

**Dominio:** D3 Sistemas Digitales · Lógica secuencial · Flip-flops y tablas de excitación
**Práctica del backlog:** d3-04 · **Molde:** S (pizarrón: Explora / Aplica / Reto) — **D3 4/16**
**Simulador:** `/labs/contadores-sincronos.html`
**Slug de construcción:** `contadores-sincronos`

## Qué enseña

Cómo se construye un contador que cuente exactamente hasta donde uno quiera, partiendo de la celda de
memoria de un bit (el flip-flop) y de la disciplina del reloj común.

1. **Flip-flop y ecuación característica** — la memoria de un bit; su ecuación dice cómo cambia Q en cada
   flanco: D `Qn=D`, T `Qn=Q⊕T`, JK `Qn=J·Q'+K'·Q` (con J=K equivale a un T).
2. **Tabla de excitación (con don't care)** — el reverso: dada la transición Q→Qn, qué entrada la produce.
   El JK tiene 2 de 4 celdas en "don't care" (x), que simplifican las compuertas.
3. **Contador síncrono módulo 2ⁿ** — flip-flops con reloj común (sin acumular retardos, a diferencia del
   ripple); `state → (state+1) mód 2ⁿ`; con T, `T_i = Q0·Q1···Q(i-1)`.
4. **Módulo N, borrado síncrono y error off-by-one** — detectar `DET = N−1` + borrado síncrono → ciclo
   0..N−1 (periodo N, `n = ⌈log₂ N⌉`). Detectar N (no N−1) da módulo N+1. Diseño autocorrectivo desde
   estados no usados.

## Física / lógica (verificada node -e — 14/14)

- **Ecuación característica:** `dFF(Q,D)=D`; `jkFF(Q,J,K)=(J&(Q^1))|((K^1)&Q)` ≡ `J·Q'+K'·Q` (exhaustivo
  8/8 contra la tabla de verdad); `tFF(Q,T)=Q^T`.
- **Excitación:** `excD(Q,Qn)={D:Qn}`; `excT={T:Q^Qn}`; `excJK` con don't-cares (0→0 {J0,Kx}, 0→1 {J1,Kx},
  1→0 {Jx,K1}, 1→1 {Jx,K0}). Verificado: cada tabla reproduce Qn para **todas** las resoluciones de x.
- **Contador binario síncrono (n=1..4):** `D_i = bit i de (state+1)`; `T_i = AND de los bits de menor peso`
  — ambos reconstruyen `binNext(state,n)=(state+1)&mask`.
- **Módulo N (borrado síncrono):** `modNext(s,n,DET,clear) = (clear && s===DET) ? 0 : (s+1)&mask`.
  Con `DET=N−1, clear` → periodo N y secuencia 0..N−1 (verificado N=2..16).
- **Error off-by-one:** `DET=N` (con hueco) → módulo N+1. **Sin clear:** módulo 2ⁿ (libre).
  **Autocorrección:** desde un estado no usado (p. ej. 6 en mod-5) entra al ciclo 0..N−1.
- `bitsFor(N) = ⌈log₂ N⌉`. Script: `verify_counters.mjs` (scratchpad).

## Reto (calificación dual)

Se da un objetivo (un módulo N concreto: década 0..9, segundos 0..5, horas 0..11, etc.). El alumno
construye el contador configurando dos cosas por separado:

- **retoOkDetect** — la detección del terminal es `DET === N−1` (el último de los N estados válidos).
- **retoOkClear** — el borrado síncrono está **activo** (`retoClear === true`), la acción que cierra el ciclo.

Ambos se califican aparte y se modelan los dos errores clásicos: `DET=N` cuenta un estado de más (módulo
N+1) y, sin borrado, el contador corre libre hasta 2ⁿ−1. Es un reto de **diseño**, sin valor oculto que
adivinar; el pool usa N no potencias de 2 (5, 10, 6, 12, 3, 7) para que el borrado sea genuinamente
necesario.

## Convenciones

- Bit LSB en el índice 0; palabras de n bits con `mask = (1<<n)-1`; `bitsFor(N)=⌈log₂N⌉`.
- Borrado **síncrono** (única variante modelada; el asíncrono queda fuera).
- Lógica active-high; modelo puramente lógico (sin setup/hold, retardo reloj-a-Q ni sesgo de reloj).
- Nunca `onclick` inline en el HTML generado: los controles se cablean con `el(id).onclick=()=>fn()`.

## Verificación en dos capas

1. **Numérica** (`node -e` / `verify_counters.mjs` en scratchpad): ecuación JK exhaustiva 8/8, excitación
   D/T/JK con todos los don't-care, contador binario n=1..4 (D y T), módulo N N=2..16 (secuencia, periodo,
   off-by-one, autocorrección) → **14/14 OK**.
2. **Dinámica** (Playwright + `window.__labDebug`, servidor HTTP local sirviendo `public/`): three.js por
   CDN import map (file:// falla por CORS).

## Referencias

IEEE Std 91-1984 (símbolos lógicos) · Mano & Ciletti, *Diseño Digital* (Pearson): flip-flops, ecuaciones
características y de excitación, diseño de contadores síncronos y módulo N · Wakerly, *Digital Design*
(Pearson): lógica secuencial y estados no usados · Roth, *Fundamentals of Logic Design* (Cengage) · Texas
Instruments: 74x161/163 (contador binario síncrono), 74x190/191 (década/binario up/down) · verificación
numérica propia.
