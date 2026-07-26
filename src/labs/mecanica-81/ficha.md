# MEC-81 · Registros de Desplazamiento · SIPO / PISO

**Dominio:** D3 Sistemas Digitales · Lógica secuencial · Conversión serie/paralelo
**Práctica del backlog:** d3-05 · **Molde:** S (pizarrón: Explora / Aplica / Reto) — **D3 5/16**
**Simulador:** `/labs/registros-desplazamiento.html`
**Slug de construcción:** `registros-desplazamiento`

## Qué enseña

Cómo una fila de flip-flops con reloj común —que sólo mueve los bits una posición por flanco— produce las
dos conversiones que sostienen casi toda la comunicación digital: de serie a paralelo y de paralelo a serie.

1. **Desplazamiento (÷2 y ×2)** — reloj común, los bits avanzan una posición por flanco. A la derecha
   `Q_i←Q_{i+1}` (entra por el MSB, sale por el LSB) equivale a ÷2 con SIN=0; a la izquierda `Q_i←Q_{i-1}`
   (entra por el LSB, sale por el MSB) equivale a ×2 mód 2ⁿ (el bit que sale se pierde).
2. **SIPO (serie → paralelo)** — recibe una palabra bit a bit por un cable, MSB primero; tras n flancos la
   presenta completa en paralelo. Recepción serie (UART/SPI); expansión de E/S. Circuito típico 74x164.
3. **PISO (paralelo → serie)** — el inverso: carga en paralelo y n flancos la sacan por un cable, MSB
   primero. PISO + SIPO = enlace serie completo. Circuito típico 74x165.
4. **Contadores de anillo y Johnson** — realimentando la salida serie a la entrada: anillo one-hot de
   periodo n; Johnson (realimenta la salida NEGADA) de periodo 2n con el mismo hardware.

## Física / lógica (verificada node -e — 21/21)

- **Desplazamiento:** `shiftR(s,n,sin)=((s>>1)|(sin<<(n-1)))&mask`, `shiftRout(s)=s&1`;
  `shiftL(s,n,sin)=((s<<1)|sin)&mask`, `shiftLout(s,n)=(s>>(n-1))&1`. Exhaustivo n=2..8:
  `shiftR(w,0)=w>>1` (÷2) y `shiftL(w,0)=(w<<1)&mask` (×2).
- **SIPO/PISO:** `sipo(bits,n)` con shift-left MSB primero reconstruye la palabra; `piso(word,n)` saca los
  bits MSB primero. Round-trip `sipo(piso(w))=w` verificado exhaustivo n=2..8.
- **Anillo:** `ringNext(s,n)=shiftR(s,n, s&1)` (realimenta serial-out→serial-in) → secuencia one-hot de
  periodo n (n=2..10); n=4 desde 1 = `[1,8,4,2]`.
- **Johnson:** `johnsonNext(s,n)=shiftR(s,n,(s&1)^1)` (realimenta serial-out NEGADO) → periodo 2n (n=2..8);
  n=4 desde 0 = `[0,8,12,14,15,7,3,1]`.
- **Enlace serie (reto):** `receive(tx,n,dir,clocks)` desplaza el flujo (MSB primero). `receive(left,n)`
  reconstruye exacto; `receive(right,n)` invierte los bits (`revBits`); `clocks<n` trunca. Script:
  `verify_shift.mjs` (scratchpad).

## Reto (calificación dual)

Un emisor manda una palabra por un enlace serie (por un cable, MSB primero) y el alumno configura el
receptor SIPO ajustando dos cosas por separado:

- **retoOkDir** — la dirección de desplazamiento debe ser IZQUIERDA (`retoDir==='left'`) para conservar el
  orden de los bits; a la derecha la palabra llega invertida.
- **retoOkClocks** — el número de flancos debe ser exactamente n (`retoClocks===f.n`); con menos flancos la
  palabra queda truncada, con más se desborda.

Ambos se califican aparte. Es un reto de **diseño**, sin valor oculto que adivinar; el pool usa palabras
NO palíndromas (anchos 3–8) para que el error de dirección sea siempre visible.

## Convenciones

- Bit LSB en el índice 0; palabras de n bits con `mask=(1<<n)-1`; MSB primero en SIPO/PISO y enlace serie.
- Desplazamiento LÓGICO (el bit que sale se pierde; no hay rotación ni extensión de signo).
- Lógica active-high; modelo puramente lógico (sin setup/hold, retardo reloj-a-Q ni sesgo de reloj).
- Nunca `onclick` inline en el HTML generado: los controles se cablean con `el(id).onclick=()=>fn()`.

## Verificación en dos capas

1. **Numérica** (`node -e` / `verify_shift.mjs` en scratchpad): ÷2/×2 exhaustivo n=2..8; SIPO/PISO y
   round-trip n=2..8; anillo one-hot periodo n n=2..10; Johnson periodo 2n n=2..8; enlace serie con
   inversión (dirección) y truncamiento (flancos), RETO_POOL no palíndromo → **21/21 OK**.
2. **Dinámica** (Playwright + `window.__labDebug`, servidor HTTP local sirviendo `public/`): three.js por
   CDN import map (file:// falla por CORS).

## Referencias

IEEE Std 91-1984 (símbolos lógicos) · Mano & Ciletti, *Diseño Digital* (Pearson): registros, registros de
desplazamiento, conversión serie/paralelo, contadores de anillo/Johnson · Wakerly, *Digital Design*
(Pearson) · Floyd, *Digital Fundamentals* (Pearson): tipos SISO/SIPO/PISO/PIPO y diagramas de tiempos ·
Texas Instruments: 74x164 (SIPO 8 bits), 74x165 (PISO 8 bits), 74x194 (registro universal 4 bits) ·
verificación numérica propia.
