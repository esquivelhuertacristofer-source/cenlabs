# MEC-77 · Síntesis Lógica y Simplificación con Mapas de Karnaugh

**Dominio:** D3 Sistemas Digitales · Álgebra de Boole · Diseño combinacional
**Práctica del backlog:** d3-01 · **Molde:** S (pizarrón: Explora / Agrupa / Reto) — **ABRE D3 1/16**
**Simulador:** `/labs/karnaugh-simplificacion.html`
**Slug de construcción:** `karnaugh-simplificacion`

## Qué enseña

Sintetizar una función lógica combinacional a partir de su tabla de verdad y simplificarla al mínimo
coste con el mapa de Karnaugh.

1. **Tabla de verdad → mintérminos** — la función queda definida por la salida en cada una de las 2ⁿ
   combinaciones; la suma de mintérminos (forma canónica SOP) es correcta pero derrochadora.
2. **Mapa de Karnaugh y código Gray** — celdas vecinas difieren en un bit; agrupar 2^k unos adyacentes
   elimina las k variables que cambian dentro del grupo (álgebra de Boole `XY+XY′=X`).
3. **Implicantes primos y forma mínima** — cubrir todos los unos con los mayores grupos válidos al menor
   coste en literales (desempate: menos términos).
4. **Coste en compuertas** — realización AND-OR de 2 niveles: un AND por producto de ≥2 literales, un OR
   si hay ≥2 términos, inversores por variable complementada distinta.

Lección central honesta: **no toda función simplifica** — la paridad (XOR) tiene sus unos en tablero de
ajedrez, sin adyacencias agrupables, y su forma mínima coincide con la canónica.

## Física / lógica (verificada node -e)

- **Minimizador Quine-McCluskey:** implicantes primos por combinación iterativa (`combine`: mismo mask,
  Hamming-1) + cobertura exacta de coste mínimo por búsqueda de subconjuntos sobre los primos. Coste de
  un término = `n − popcount(mask)` (literales); desempate por menos términos.
- **Verificación cruzada:** comparado contra un oráculo de fuerza bruta (todos los implicantes válidos +
  branch-and-bound de coste mínimo) y equivalencia funcional celda a celda → **1200/1200 OK** (2 a 4
  variables, 400 casos aleatorios por n).
- **Modelo de coste en compuertas** (2 niveles AND-OR): AND por cada término con ≥2 literales, OR si hay
  ≥2 términos, inversores = variables complementadas distintas; constantes 0/1 → 0 compuertas.
  Autoconsistente en los spot checks.
- **Presets Explora (verificados):** XOR2 [1,2]→`A′B+AB′` (sin ahorro); Mayoría3 [3,5,6,7]→`BC+AC+AB`
  (lit6, canon12); Paridad-impar3 [1,2,4,7]→4 términos irreducibles (sin ahorro, lección honesta);
  4var [0,2,5,7,8,10,13,15]→`B′D′+BD` (lit4, canon32, ahorro 28).
- **Pool del Reto (todos verificados con cobertura y coste mínimo únicos por el motor):**
  n=3 [0,1,2,5]→`A′C′+B′C`; n=3 [1,2,3,4,5]→`A′C+A′B+AB′`; n=3 [2,3,4,5,7]→`A′B+BC+AB′`;
  n=4 [0,4,5,7,8,12,13,15]→`C′D′+BD`; n=4 [0,1,2,5,8,9,10]→`A′C′D+B′C′+B′D′`;
  n=4 [0,1,2,3,5,7,8,10,14,15]→`ABC+B′D′+A′D`.
- **Reto (calificación dual):** cobertura completa (todos los mintérminos cubiertos) Y coste = coste
  mínimo del motor; ambos se califican por separado. Como solo se ofrecen implicantes primos, el mínimo
  es alcanzable y no existe coste menor; una cobertura completa con coste = mínimo no puede tener términos
  redundantes.

## Convenciones del mapa

- A = MSB; `posBit = 1<<(n-1-v)`; mintérmino = A·2ⁿ⁻¹ + … ; etiquetas de fila/columna en código Gray.
- n=2: rejilla 2×2 (fila A, col B). n=3: 2×4 (fila A, col BC). n=4: 4×4 (fila AB, col CD).
- Grupos dibujados por componentes planos (flood-fill 4-vecinos sin wrap): un implicante que envuelve el
  borde se dibuja en varios rectángulos.

## Verificación en dos capas

1. **Numérica** (`node -e`): minimizador vs. fuerza bruta 1200/1200; modelo de coste; presets y pool.
2. **Dinámica** (Playwright + `window.__labDebug`, servidor HTTP local sirviendo `public/`): three.js por
   CDN import map (file:// falla por CORS).

## Referencias

IEEE Std 91-1984 (símbolos lógicos) · Mano & Ciletti, *Diseño Digital* (Pearson) · Wakerly, *Digital
Design* (Pearson) · Quine (1952) / McCluskey (1956), minimización de funciones booleanas · verificación
numérica propia.
