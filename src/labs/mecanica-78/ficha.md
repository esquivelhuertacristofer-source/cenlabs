# MEC-78 · Multiplexores, Decodificadores y Display de 7 Segmentos

**Dominio:** D3 Sistemas Digitales · Bloques combinacionales MSI · Habilitación
**Práctica del backlog:** d3-02 · **Molde:** S (pizarrón: Explora / Aplica / Reto) — **D3 2/16**
**Simulador:** `/labs/mux-decodificadores-7seg.html`
**Slug de construcción:** `mux-decodificadores-7seg`

## Qué enseña

Los tres bloques combinacionales de mediana escala más usados y la idea que los unifica: que son
generadores de funciones universales.

1. **Multiplexor (Y = D[sel]·EN)** — conmutador controlado: la selección de n bits elige cuál de las 2ⁿ
   entradas de datos llega a la salida; EN=0 fuerza Y=0 (interruptor maestro).
2. **Decodificador (one-hot)** — inverso del MUX: activa una y solo una de sus 2ⁿ salidas, la del número
   de entrada; cada salida es un mintérmino (chip-select y realización SOP con una OR).
3. **Display de 7 segmentos (BCD)** — decodificador BCD→7seg traduce el dígito 0-9 al patrón de segmentos
   a-g; cada segmento es una función booleana de 4 bits, minimizable con don't-care 10-15.
4. **Lógica universal** — un MUX 2ⁿ:1 con las variables en la selección realiza cualquier función de n
   variables cableando `D_i = f(i)` (el MUX "es" la tabla de verdad); un decodificador+OR hace lo mismo
   por la vía SOP.

## Física / lógica (verificada node -e — 14/14)

- **Modelo del MUX:** `mux(data,sel,en) = en ? data[sel] : 0` — exhaustivo para 2:1, 4:1, 8:1.
- **Modelo del decodificador:** `decoder(inp,n,en)` → arreglo one-hot (una salida en 1, la del índice
  `inp`; todas 0 si `en=0`) — exhaustivo 2:4 y 3:8.
- **MUX universal:** `muxRealize(mintérminos,n)` genera los datos `D_i=f(i)`; se comprobó que el MUX así
  cableado reproduce la tabla de verdad completa en **400 funciones aleatorias** (n=2,3,4).
- **Decodificador + OR = SOP:** la OR de las salidas de los mintérminos de una función la reconstruye
  celda a celda (verificado).
- **Display BCD→7seg:** patrones canónicos `SEG_PAT` de los dígitos 0-9 (orden de bits `[a,b,c,d,e,f,g]`);
  `segOf(digit,seg)` da el bit; el **SOP mínimo por segmento** se obtiene con el motor Quine-McCluskey
  usando `SEG_DC=[10,11,12,13,14,15]` como don't-care. SOP derivados y verificados:
  `a=B′D′+BD+C+A` (6 lit), `b=C′D′+CD+B′` (5), `c=C′+D+B` (3), `d=BC′D+B′D′+B′C+CD′+A` (10),
  `e=B′D′+CD′` (4), `f=C′D′+BC′+BD′+A` (7), `g=B′C+CD′+BC′+A` (7). Coincide con Mano & Ciletti.
- **Motor Quine-McCluskey reutilizado** del laboratorio de Karnaugh (mecanica-77): implicantes primos por
  combinación iterativa + cobertura exacta de coste mínimo; soporta don't-cares (`dc`) y constantes
  (`special` '0'/'1').

## Reto (calificación dual)

Se da una función objetivo `F = Σm(...)`. El alumno configura los datos del MUX y la habilitación:

- **retoOkData** — todos los bits `data[i]` coinciden con `f(i)` (la regla de oro `D_i=f(i)`, copiar la
  columna F de la tabla).
- **retoOkEnable** — `EN === 1`.

Ambos se califican por separado: el error clásico —datos correctos pero EN=0— deja la salida siempre en 0
y se reporta específicamente. Es un reto de **diseño**, sin valor oculto que adivinar.

## Convenciones

- Lógica **active-high** por claridad (los 74138/7447 reales son active-low).
- Display de 7 segmentos con orden de bits `[a,b,c,d,e,f,g]`; los dígitos 10-15 son don't-care sin patrón
  visual definido.
- Nunca `onclick` inline en el HTML generado: los controles se cablean con `el(id).onclick=()=>fn()`.

## Verificación en dos capas

1. **Numérica** (`node -e` / `_verify_muxdec.mjs`): MUX y decodificador exhaustivos, 400 funciones
   aleatorias por el MUX universal, decod.+OR = SOP, SOP mínimo de los 7 segmentos → **14/14 OK**,
   coincidente con Mano & Ciletti. (Script temporal eliminado antes del commit.)
2. **Dinámica** (Playwright + `window.__labDebug`, servidor HTTP local sirviendo `public/`): three.js por
   CDN import map (file:// falla por CORS).

## Referencias

IEEE Std 91-1984 (símbolos lógicos) · Mano & Ciletti, *Diseño Digital* (Pearson): MUX como lógica
universal, decodificadores, realización SOP y BCD→7seg · Wakerly, *Digital Design* (Pearson): bloques MSI
y habilitación · Texas Instruments: 74151 (MUX 8:1), 74138 (decodificador 3:8), 7447 (BCD→7seg) ·
verificación numérica propia.
