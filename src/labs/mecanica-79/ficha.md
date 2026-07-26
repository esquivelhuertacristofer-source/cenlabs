# MEC-79 · Sumadores y Comparadores Binarios

**Dominio:** D3 Sistemas Digitales · Aritmética binaria · Acarreo y complemento a 2
**Práctica del backlog:** d3-03 · **Molde:** S (pizarrón: Explora / Aplica / Reto) — **D3 3/16**
**Simulador:** `/labs/sumadores-comparadores.html`
**Slug de construcción:** `sumadores-comparadores`

## Qué enseña

Cómo nace toda la aritmética digital a partir de un bloque diminuto, y por qué las computadoras casi
nunca tienen un circuito de resta.

1. **Sumador completo (full adder)** — suma tres bits (dos operandos + acarreo de entrada): la suma es la
   paridad `S = A⊕B⊕Cin` y el acarreo de salida es la MAYORÍA `Cout = (A·B)+(Cin·(A⊕B))`.
2. **Sumador de acarreo propagado (ripple-carry)** — n sumadores completos en cadena; el acarreo propaga
   etapa a etapa; da suma sin signo y acarreo final.
3. **Resta por complemento a 2** — `−B = ¬B + 1` ⇒ `A − B = A + ¬B + 1`; invertir B y forzar `Cin=1`
   convierte el sumador en restador (un bit de control elige sumar/restar).
4. **Desbordamiento y comparación** — overflow con signo por dos métodos equivalentes (signos, o
   `Cin_MSB ⊕ Cout_MSB`); comparador de magnitud por cascada desde el MSB, igualdad = AND de XNOR.

## Física / lógica (verificada node -e — 20/20)

- **Full adder:** `s = a^b^cin`, `cout = (a&b)|(cin&(a^b))` — exhaustivo 8/8 contra la suma aritmética.
- **Ripple-carry (LSB índice 0):** `rippleAdd(A,B,cin,n)` encadena full adders — exhaustivo 4 bits
  (2048 casos) `val=(A+B+cin)&(2ⁿ−1)`, `cout=(A+B+cin)>>n`.
- **Complemento a 2:** `twosComp(u,n)=((~u)+1)&mask`; `toSigned(u,n)` reinterpreta con signo;
  `invBits(u,n)=(~u)&mask`.
- **Resta:** `A − B = rippleAdd(A, ¬B, 1, n)` = `(A−B) mod 2ⁿ` — exhaustivo 4 bits (256 casos).
- **Overflow (signo):** `(sA===sB)&&(sS!==sA)` ≡ método de acarreo `carries[n-1] ^ carries[n]` — ambos
  verificados equivalentes y contra el desbordamiento real (256 casos cada uno).
- **Comparador:** `compareU(A,B,n)` cascada desde el MSB; el primer bit distinto decide; exactamente una de
  gt/eq/lt activa (256 casos, `gt+eq+lt=1`). Igualdad = AND de XNOR bit a bit (256 casos).

## Reto (calificación dual)

Se da una resta objetivo `A − B`. El alumno convierte el sumador en restador configurando dos cosas por
separado:

- **retoOkData** — la operación sobre B es `¬B` (todos los bits de `retoOpB` = `invBits(B)`), la mitad
  visible de la regla del complemento a 2.
- **retoOkEnable** — el acarreo inicial `retoCin === 1` (el `+1` que casi todos olvidan).

Ambos se califican aparte: el error clásico —invertir B pero dejar `Cin=0`— produce un resultado con un
error de **una unidad** (da `A + ¬B = A − B − 1`) y se reporta específicamente. Es un reto de **diseño**,
sin valor oculto que adivinar.

## Convenciones

- Bit LSB en el índice 0; palabras de n bits con `mask = (1<<n)-1`.
- Números con signo en **complemento a 2** (única representación con signo modelada).
- Lógica active-high; el modelo es puramente lógico/estacionario (sin retardos de propagación del acarreo).
- Nunca `onclick` inline en el HTML generado: los controles se cablean con `el(id).onclick=()=>fn()`.

## Verificación en dos capas

1. **Numérica** (`node -e` / `verify_addcmp.mjs` en scratchpad): full adder 8/8, ripple 4 bits 2048 casos,
   resta y overflow por los dos métodos 256 c/u, comparador 256 casos una-y-solo-una salida → **20/20 OK**.
2. **Dinámica** (Playwright + `window.__labDebug`, servidor HTTP local sirviendo `public/`): three.js por
   CDN import map (file:// falla por CORS).

## Referencias

IEEE Std 91-1984 (símbolos lógicos) · Mano & Ciletti, *Diseño Digital* (Pearson): sumador completo,
acarreo propagado, resta por complemento a 2, desbordamiento y comparadores · Wakerly, *Digital Design*
(Pearson): aritmética binaria y sumadores rápidos · Texas Instruments: 7483/74283 (sumador 4 bits), 7485
(comparador de magnitud) · verificación numérica propia.
