# MEC-105 · Analiza una transmisión hidrostática bomba-motor

- **Dominio:** D4 · Hidráulica y Neumática
- **Práctica del backlog:** d4-13 — *Analiza una transmisión hidrostática bomba-motor* (molde S)
- **Simulador:** `/labs/transmision-hidrostatica-bomba-motor.html`
- **Slug:** `transmision-hidrostatica-bomba-motor`
- **Ancla curricular:** EM-II.3
- **Fuentes normativas de referencia:** ISO 3448 · ASTM D341 · ISO 4409 · ISO 4391 · ISO 4413 · Wilson (1946)

---

## Qué enseña

1. Que en una transmisión hidrostática **el par no lo pone el plato: lo pone la presión**, y la ley es `T = Δp·D/2π` — verificada a 1e-12 y estrictamente proporcional en Δp y en D.
2. Que la presión **no se ajusta, se despeja**: como el término viscoso del motor no depende de Δp, el punto de servicio `(n_req, T_req)` da `Δp = (T_req·20π/D_m + K_V·μ·ω_m/1e5)/(1 − K_F)` de forma **explícita**, sin iterar.
3. Que la cilindrada del motor decide **contra qué muro choca la máquina**: los 280 N·m de la cargadora piden **655,1 bar** con 28 cm³/rev (límite del grupo 420) y **178,5 bar** con 107 cm³/rev, pero entonces el mando pide **α = 1,248** y no existe tanto plato.
4. Que la relación de transmisión **medida nunca es la geométrica**: `relCin = relGeom·η_vb·η_vm` es una **identidad**, no una aproximación.
5. Que por eso el deslizamiento vale exactamente `desliz = 1 − η_vb·η_vm`, y que **el tacómetro no lo enseña**: con las cinco bombas del catálogo la cargadora da `relCin = 0,500` en las cinco mientras el deslizamiento sube del **9,60 % al 11,26 %**.
6. Que el modelo de **Wilson (1946)** separa la fuga (`σ = K_S·Δp/(μ·ω)`) del arrastre viscoso (`τ = K_V·μ·ω/Δp`) y añade un término de Coulomb `K_F`.
7. Que el producto **`σ·τ = K_S·K_V = 0,0016` no depende del punto de trabajo** — verificado en **80 puntos de trabajo distintos** con desviación máxima **< 1e-18** —, y que por eso **no se pueden bajar las dos pérdidas a la vez**.
8. Que el rendimiento total es el producto de **cuatro** términos en cascada, `η_total = η_vb·η_tb·η_vm·η_tm`: **79,54 · 79,98 · 73,24 · 72,02 · 79,85 %** en los cinco óptimos.
9. Que el rendimiento **de sistema** —el que paga además la bomba de carga— es otro número y es el honesto: **78,62 · 78,78 · 71,56 · 68,28 · 78,60 %**.
10. Que **la temperatura del aceite no es un dato: es una salida**, punto fijo de `calor(T) = UA·(T − T_amb)`, y da **49,9 · 64,3 · 28,6 · 77,1 · 51,2 °C** en las cinco estaciones con el mismo tipo de hierro.
11. Que por eso **el aceite espeso se adelgaza solo**: los cuatro grados ISO se separan **3,13×** a 40 °C y sólo **2,99 / 2,33 / 3,06 / 1,76 / 2,19×** en equilibrio.
12. Que en el ventilador de radiador elegir entre VG 32 y VG 100 mueve la viscosidad de servicio **de 9,9 a 17,4 mm²/s**: la mitad de lo que promete la etiqueta.
13. Que **cada máquina pide su aceite** porque `μ* ∝ Δp/ω`: la que gira más deprisa pide el más fino, y **la del conjunto cae siempre entre las dos** (27,2 / 36,5 / 48,7 mm²/s en la cargadora; 30,8 / 80,7 / 206,8 en el cabrestante; 5,4 / 4,2 / 3,3 en el ventilador).
14. Que de **1 500 configuraciones sólo 123** cumplen los siete criterios, **15 no son ni físicas**, y en el ventilador de radiador sobreviven **3 de 300**.
15. Que **los siete criterios deciden de verdad**: los siete tienen fallos en solitario, incluido el caudal de la bomba de carga, que tumba **una** máquina que lo tenía todo lo demás en regla.

---

## Lógica (verificada en `scratchpad/motor_hidrostatica.mjs`, 284 183 comprobaciones, 0 fallos)

### Constantes selladas

| Constante | Valor | Origen / significado |
|---|---|---|
| `K_S` | 4,0·10⁻⁹ | Coeficiente de deslizamiento (fuga) de Wilson, adimensional |
| `K_V` | 4,0·10⁵ | Coeficiente de fricción viscosa de Wilson, adimensional |
| `K_F` | 0,030 | Coeficiente de fricción de Coulomb, adimensional |
| `K_S·K_V` | 0,0016 | **Invariante**: `σ·τ` en cualquier punto de trabajo |
| `ALFA_MAX` | 0,95 | Reserva de mando: la bomba no se proyecta al tope del plato |
| `NU_MIN` / `NU_MAX` | 10 / 80 mm²/s | Ventana de servicio declarada por el fabricante del grupo |
| `NU_OPT_LO` / `NU_OPT_HI` | 16 / 36 mm²/s | Franja óptima declarada (informativa, no criterio) |
| `T_MAX` | 80 °C | Límite de servicio continuo del fluido |
| `P_CARGA` | 25 bar | Presión del circuito de alimentación |
| `FR_CARGA` | 0,20 | Cilindrada de la bomba de carga / cilindrada principal |
| `ETA_V_CARGA` | 0,92 | Rendimiento volumétrico de la bomba de carga |
| `F_BARR` | 0,10 | Caudal de barrido del lazo, fracción del caudal ideal del motor |
| `ALFA_RHO` / `T_REF_RHO` | 0,00065 K⁻¹ / 15 °C | Dilatación del aceite: `ρ(T) = ρ₁₅/(1 + α·(T − 15))` |
| `WAL_C` | 0,7 | Constante de la ecuación de Walther |
| Banda de Walther | 0 … 140 °C | Fuera de ella `extrapola(T)` marca la cifra como extrapolada |
| `T_SCAN_PASO` / `T_SCAN_TOPE` / `BISEC` | 0,5 °C / 140 °C / 60 | Cierre térmico: barrido para acotar + bisecciones para afinar |
| `MU_LO` / `MU_HI` / `MU_PASOS` / `AUREA` | 10⁻⁴ / 1,0 Pa·s / 400 / 200 | Óptimo de viscosidad del conjunto: barrido logarítmico + sección áurea |

### Aceites del catálogo (ISO 3448, HLP mineral VI ≈ 100)

| Grado | ν₄₀ (mm²/s) | ν₁₀₀ (mm²/s) | ρ₁₅ (kg/m³) |
|---|---|---|---|
| ISO VG 32 | 32 | 5,4 | 865 |
| ISO VG 46 | 46 | 6,8 | 875 |
| ISO VG 68 | 68 | 8,7 | 880 |
| ISO VG 100 | 100 | 11,4 | 885 |

Viscosidad calculada (mm²/s) a 0 / 20 / 40 / 50 / 60 / 80 / 100 °C:

| Grado | 0 | 20 | 40 | 50 | 60 | 80 | 100 |
|---|---|---|---|---|---|---|---|
| VG 32 | 336,00 | 86,28 | 32,00 | 21,50 | 15,19 | 8,53 | 5,40 |
| VG 46 | 577,32 | 133,84 | 46,00 | 29,97 | 20,62 | 11,10 | 6,80 |
| VG 68 | 1 033,18 | 214,76 | 68,00 | 42,87 | 28,66 | 14,72 | 8,70 |
| VG 100 | 1 719,49 | 334,28 | 100,00 | 61,51 | 40,22 | 19,89 | 11,40 |

La correlación pasa **exactamente** por los dos puntos normalizados de cada grado, es monótona decreciente con T y **las cuatro curvas no se cruzan** en toda la banda. Densidad del VG 46 a 15 / 40 / 80 °C: **875,0 · 861,0 · 839,5 kg/m³**.

### Reglas del motor

| Regla | Expresión |
|---|---|
| Viscosidad | `log₁₀log₁₀(ν + 0,7) = A − B·log₁₀(T_K)` (Walther / ASTM D341) |
| Viscosidad dinámica | `μ = ν·10⁻⁶·ρ(T)` |
| Par ideal | `T = Δp·D/2π` → `parIdeal(D, Δp) = D·Δp/(20π)` [N·m; cm³/rev; bar] |
| Caudal ideal | `q = D·n/1000` [L/min; cm³/rev; rpm] |
| Fuga (Wilson) | `σ = K_S·Δp/(μ·ω)` |
| Arrastre viscoso (Wilson) | `τ = K_V·μ·ω/Δp` |
| **Invariante** | `σ·τ = K_S·K_V`, **independiente del punto de trabajo** |
| Presión de servicio | `Δp = (T_req·20π/D_m + K_V·μ·ω_m/10⁵)/(1 − K_F)` — **explícita, sin iterar** |
| Rendimientos del motor | `η_vm = 1/(1 + σ_m)` · `η_tm = 1 − K_F − τ_m` |
| Rendimientos de la bomba | `η_vb = 1 − σ_b` · `η_tb = 1/(1 + K_F + τ_b)` |
| Rendimiento total | `η_total = η_vb·η_tb·η_vm·η_tm` (identidad exacta) |
| Mando del plato | `α = n_req·D_m·(1 + σ_m)/(n_b·D_b·(1 − σ_b))` |
| Relación geométrica | `relGeom = D_b·α/D_m` |
| Relación cinemática | `relCin = n_m/n_b = relGeom·η_vb·η_vm` |
| Deslizamiento | `desliz = 1 − η_vb·η_vm` |
| Potencia | `P_out = T_req·ω_m/1000` · `P_in = T_bomba·ω_b/1000` · `calor = P_in + P_carga − P_out` |
| Rendimiento de sistema | `η_sist = P_out/(P_in + P_carga)` |
| Cierre térmico | `calor(T) = UA·(T − T_amb)`, **primer** cruce por cero subiendo desde el ambiente |
| Viscosidad óptima (bomba) | `μ* = a + √(a² + a(1 + K_F)/b)`, `a = K_S·Δp/ω`, `b = K_V·ω/Δp` |
| Viscosidad óptima (motor) | `μ* = −a + √(a² + a(1 − K_F)/b)` |
| Ley del aceite | **`μ* ∝ Δp/ω`** en las dos máquinas → la que gira más deprisa pide el aceite más fino |
| Par de calado | `T_calado = parIdeal(D_b, p_lim)·(1 + K_F + τ(p_lim))` |

### Los siete criterios

| Criterio | Qué exige | Falla en | En solitario |
|---|---|---|---|
| `okTerm` | El balance térmico cierra **y** `T ≤ 80 °C` | 383 | **13** |
| `okVel` | Reserva de mando: `α ≤ 0,95` | 601 | **40** |
| `okPres` | `Δp ≤ p_lim` de la estación | 313 | **58** |
| `okPot` | `P_in + P_carga ≤` potencia del diésel a ese régimen | 644 | **164** |
| `okVisc` | `10 ≤ ν ≤ 80 mm²/s` a la temperatura de equilibrio | 408 | **53** |
| `okRpm` | `n_b ≤ n_max(D_b)` y `n_req ≤ n_max(D_m)` | 620 | **165** |
| `okCarga` | `q_carga ≥ fuga_bomba + fuga_motor + barrido` | 434 | **1** |

`okVel` y `okCarga` acotan **la misma variable** (el mando α) desde dos sitios distintos —el regulador de la bomba y el caudal que hay que reponer—, y están las dos porque con sólo seis el panel declara válida una máquina que no rueda. Ese **único** fallo en solitario de `okCarga` es la demostración de que el séptimo criterio no sobra.

---

## El catálogo del banco

### Cinco bombas de cilindrada variable (eje 1) y cinco motores fijos (eje 2)

| `D_b` (cm³/rev) | 28 | 45 | 71 | 90 | 125 |
|---|---|---|---|---|---|
| Coste | 8 | 10 | 13 | 15 | 19 |
| `n_max` (rpm) | 3 200 | 2 600 | 2 100 | 1 900 | 1 600 |

| `D_m` (cm³/rev) | 28 | 45 | 63 | 80 | 107 |
|---|---|---|---|---|---|
| Coste | 7 | 9 | 11 | 13 | 16 |
| `n_max` (rpm) | 4 000 | 3 000 | 2 500 | 1 800 | 1 400 |

Cuanto mayor es la cilindrada, **más despacio** puede girar el bloque de pistones: es un dato de catálogo real y es lo que hace que `okRpm` sea el criterio que más veces decide en solitario (165 veces).

### Cuatro aceites (eje 3) y tres regímenes del diésel (eje 4)

ISO VG **32 / 46 / 68 / 100** · **1 500 / 1 800 / 2 200 rpm**. Total: 5 × 5 × 4 × 3 = **300 configuraciones por estación**, **1 500** en el banco.

### Cinco estaciones

| Estación | `n_req` | `T_req` | `p_lim` | `T_amb` | `UA` | horas/año | Diésel (kW) a 1 500 / 1 800 / 2 200 |
|---|---|---|---|---|---|---|---|
| Cargadora compacta | 900 rpm | 280 N·m | 420 bar | 30 °C | 0,36 kW/K | 1 400 | 26 / 35 / 44 |
| Cosechadora | 2 400 rpm | 130 N·m | 400 bar | 35 °C | 0,30 kW/K | 600 | 38 / 45 / 50 |
| Cabrestante forestal | 200 rpm | 480 N·m | 420 bar | 12 °C | 0,24 kW/K | 900 | 18 / 24 / 29 |
| Ventilador de radiador | 2 600 rpm | 30 N·m | 250 bar | 50 °C | 0,14 kW/K | 2 600 | 12 / 15 / 18 |
| Tambor de hormigonera | 1 200 rpm | 190 N·m | 350 bar | 28 °C | 0,28 kW/K | 2 200 | 22 / 29 / 36 |

### Los cinco óptimos (todos ÚNICOS bajo el orden declarado: coste y, a igualdad, kWh/año)

| Estación | Solución | Coste | Válidas | `T` | `ν` | `Δp` | `α` | `η_total` | `η_sist` | kWh/año |
|---|---|---|---|---|---|---|---|---|---|---|
| Cargadora compacta | D_b 28 · D_m 45 · VG 68 · 1 800 | 17 | 43/300 | 49,9 °C | 43,0 | 417,4 bar | 0,863 | 79,54 % | 78,62 % | 46 991 |
| Cosechadora | D_b 45 · D_m 28 · VG 46 · 1 800 | 17 | 24/300 | 64,3 °C | 17,8 | 316,4 bar | 0,897 | 79,98 % | 78,78 % | 24 883 |
| Cabrestante forestal | D_b 28 · D_m 80 · VG 32 · 1 500 | 21 | 41/300 | 28,6 °C | 54,2 | 392,7 bar | 0,452 | 73,24 % | 71,56 % | 12 643 |
| Ventilador de radiador | D_b 45 · D_m 28 · VG 46 · 1 800 | 17 | **3**/300 | 77,1 °C | 12,0 | 80,8 bar | 0,925 | 72,02 % | 68,28 % | 31 102 |
| Tambor de hormigonera | D_b 28 · D_m 45 · VG 32 · 2 200 | 17 | 12/300 | 51,2 °C | 20,6 | 282,5 bar | 0,949 | 79,85 % | 78,60 % | 66 825 |

Censo global: **1 500 configuraciones · 123 válidas · 15 no físicas**.

---

## Las cinco tesis que hay que ver

### 1. El par no lo pone el plato: lo pone la presión (cargadora, `D_b` 45, VG 46, 1 800 rpm)

| `D_m` (cm³/rev) | 28 | 45 | 63 | 80 | 107 |
|---|---|---|---|---|---|
| `Δp` (bar) | 655,1 | 412,7 | 297,7 | 236,2 | 178,5 |
| `α` | 0,385 | 0,555 | 0,754 | 0,945 | 1,248 |
| Falla | `okPres`, `okPot` | — | — | — | `okVel` |

Los 280 N·m son los mismos en las cinco columnas. Lo que cambia es contra qué muro se choca: **la presión del grupo por un lado, el tope del plato por el otro**, y sólo tres cilindradas caen entre los dos.

### 2. El deslizamiento que el tacómetro no enseña (cargadora, `D_m` 45, VG 46, 1 800 rpm)

| `D_b` (cm³/rev) | 28 | 45 | 71 | 90 | 125 |
|---|---|---|---|---|---|
| `α` | 0,889 | 0,555 | 0,353 | 0,280 | 0,203 |
| `Δp` (bar) | 413,0 | 412,7 | 412,3 | 412,0 | 411,4 |
| `relCin` | **0,500** | **0,500** | **0,500** | **0,500** | **0,500** |
| Deslizamiento | 9,60 % | 9,87 % | 10,29 % | 10,62 % | 11,26 % |
| `T` (°C) | 50,0 | 50,8 | 51,9 | 52,8 | 54,4 |
| Falla | — | — | — | — | `okPot`, `okRpm` |

La relación cinemática es la misma en las cinco porque **el regulador tapa la fuga subiendo α**. El aceite perdido no se ve en revoluciones: se ve en mando, en caudal de carga y en temperatura.

### 3. σ·τ es una constante del par de máquinas

`σ·τ = K_S·K_V = 0,0016` en **todos** los puntos de trabajo — verificado en **80 puntos distintos** con desviación máxima **< 1e-18**, en la bomba y en el motor por separado. En el producto desaparecen la viscosidad, el régimen y la presión, así que **no existe el aceite perfecto**: todo lo que se le quita a la fuga se le regala al arrastre. La cascada `η_vb·η_tb·η_vm·η_tm` se comprueba como identidad exacta contra el rendimiento total.

### 4. La temperatura es una salida, y el aceite espeso se adelgaza solo

| Estación | Horquilla ν a 40 °C | Horquilla ν en equilibrio |
|---|---|---|
| Cargadora compacta | 3,13× | **2,99×** |
| Cosechadora | 3,13× | **2,33×** |
| Cabrestante forestal | 3,13× | **3,06×** |
| Ventilador de radiador | 3,13× | **1,76×** |
| Tambor de hormigonera | 3,13× | **2,19×** |

Cargadora, los cuatro grados: ν = **19,4 / 30,0 / 43,0 / 58,0 mm²/s** con T = **52,8 / 50,0 / 49,9 / 51,3 °C**. Ventilador: ν = **9,9 / 12,0 / 14,5 / 17,4** con T = **74,3 / 77,1 / 80,4 / 84,3 °C**. El aceite espeso arrastra más, calienta más y **se destempla él solo**; la etiqueta del bidón promete a 40 °C y la máquina no trabaja a 40 °C.

### 5. Cada máquina pide su aceite: `μ* ∝ Δp/ω`

| Estación | `ω_b` | `ω_m` | ν\* bomba | ν\* sistema | ν\* motor | ν montada |
|---|---|---|---|---|---|---|
| Cargadora compacta | 188,5 | 94,2 | 27,2 | **36,5** | 48,7 | 43,0 |
| Cosechadora | 188,5 | 251,3 | 20,9 | **17,1** | 14,0 | 17,8 |
| Cabrestante forestal | 157,1 | 20,9 | 30,8 | **80,7** | 206,8 | 54,2 |
| Ventilador de radiador | 188,5 | 272,3 | 5,4 | **4,2** | 3,3 | 12,0 |
| Tambor de hormigonera | 230,4 | 125,7 | 15,3 | **19,7** | 25,2 | 20,6 |

En las cinco estaciones, la viscosidad óptima del conjunto cae **entre** la de la bomba y la del motor, **la máquina más lenta pide siempre el aceite más espeso**, y el óptimo del sistema es un **máximo verdadero** frente a perturbaciones de ±20/25 %. Obsérvese que la ν montada **no** es la ν\* del sistema: el catálogo sólo tiene cuatro bidones, y el óptimo se elige entre esos cuatro con siete criterios encima.

---

## Anclas de honestidad

- La temperatura del aceite se declara como **resultado del balance**, no como dato, y el algoritmo (barrido de 0,5 °C + 60 bisecciones, **primer** cruce) se explica en pantalla: la raíz física es la primera porque la máquina **arranca en frío**.
- El cierre térmico puede tener **más de una raíz**, y el laboratorio no lo esconde: el óptimo del cabrestante forestal tiene **dos**, y se verifica que la elegida es la primera y que es **estable** (`desbalance(T−3) > 0` y `desbalance(T+3) < 0`).
- Hay **62 configuraciones que nunca cierran** el balance térmico. Ninguna de ellas falla **sólo** por eso: todas arrastran además otro criterio, y así se dice en vez de presentarlo como un fallo aislado.
- La banda de validez de Walther (0 a 140 °C) se declara y `extrapola(T)` **marca la cifra** cuando se sale de ella, en lugar de dar un número con la misma cara que los demás.
- Los coeficientes de Wilson `K_S`, `K_V` y `K_F` son **valores representativos** de un grupo de pistones axiales, no constantes medidas de un modelo comercial. El campo «coste» es un **orden de complejidad**, no un precio.
- El rendimiento que se defiende es el **de sistema** (`η_sist`), que descuenta la bomba de carga, no el producto de los cuatro términos: son dos números distintos y el laboratorio muestra los dos.
- La franja «óptima» de viscosidad del fabricante (16–36 mm²/s) es **informativa**: el criterio duro es la ventana de servicio 10–80 mm²/s, y así se declara. La ν montada de tres de los cinco óptimos cae **fuera** de la franja recomendada y el laboratorio no lo disimula.
- La **pista del reto puede salir vacía**: desde el arranque deliberadamente equivocado, en **19 de 20 casos** no existe ningún valor de ese eje que salve la configuración. El laboratorio lo dice en vez de inventarse una sugerencia.
- El modelo es **estacionario**: da el punto de servicio y su temperatura de equilibrio, **no** el transitorio de calentamiento ni la respuesta dinámica del regulador. El movimiento de la escena es **ilustrativo** y se declara.
- El orden de decisión (coste primero, kWh después) se **declara en pantalla antes** de pedir el óptimo: en una máquina real lo fija el pliego; lo que no vale es dejarlo implícito.

---

## Molde y estructura

Molde **S** (simulador de cinco modos, sin ensamble). Cinco modos con cámara propia:

| Modo | Qué se manipula |
|---|---|
| Par y caudal | Cilindrada del motor y estación: `T = Δp·D/2π`, Δp ideal frente a real, límite del grupo |
| Relación de transmisión | Cilindrada de la bomba y mando α: `relGeom`, `relCin` y el deslizamiento que las separa |
| Rendimiento del conjunto | La cascada de cuatro rendimientos, σ y τ por máquina y el invariante `σ·τ` |
| El aceite decide | Grado ISO y estación: cierre térmico, autorregulación, ν\* de bomba, motor y conjunto |
| Reto | Los cuatro ejes, calificados por separado, con pista honesta |

El modo **El aceite decide** monta el hardware ganador de la estación y deja libre **sólo el bidón**, que es como se toma la decisión en la práctica. El **reto** arranca en la configuración que difiere del óptimo en los **cuatro** ejes (`startCfg`), califica cada eje con los otros tres ya en su óptimo (`okEje` / `ejeSol`), acepta empates legítimos, y sólo da por resuelto cuando la configuración es válida **y** de coste mínimo, con el desempate por kWh anuales declarado.

---

## Verificación en dos capas

| Capa | Qué comprueba | Script | Resultado |
|---|---|---|---|
| **Capa 1 · Numérica** | Walther y su paso exacto por los dos puntos ISO 3448 de los cuatro grados, monotonía y no cruce de las curvas, `T = Δp·D/2π` y su proporcionalidad, el despeje explícito de Δp, la cascada de cuatro rendimientos, el invariante `σ·τ`, `relCin = relGeom·η_vb·η_vm` y `desliz = 1 − η_vb·η_vm`, el balance de potencia con el barrido del 10 %, el punto fijo térmico y su estabilidad, el censo completo de 1 500 configuraciones con los siete criterios y sus fallos en solitario, la unicidad lexicográfica de los cinco óptimos, la ley `μ* ∝ Δp/ω` con el óptimo del sistema entre los dos individuales y como máximo verdadero | `scratchpad/motor_hidrostatica.mjs` + `facts_hidro.mjs` | **284 183 / 284 183**, 0 fallos |
| **Capa 2 · Navegador real** | Carga limpia y superficie de depuración, viscosidades y densidad, la ley del par y su proporcionalidad, el invariante `σ·τ` sobre 80 puntos, el despeje de Δp (`parMotor === T_req` exacto), las identidades de relación y deslizamiento, el balance de potencia, el punto fijo térmico (generación = evacuación, estabilidad ±3 °C, selección de la primera raíz), el censo y los cinco óptimos, la ley del aceite, la autorregulación térmica, los dos barridos, los cinco modos con cámara, panel, telemetría, informe y quiz, el formateo `f1` con U+202F y U+2212, el barajado y bloqueo del quiz, el reto en sus cuatro ejes con rechazo de válidas más caras y de empates más sedientos, las pistas honestas, la visita guiada de ~81 s y la interacción con el lienzo sin un solo error de consola | `scratchpad/pw_hidrostatica.mjs` (Playwright) | **386 / 386**, 0 fallos |

El bloque MOTOR del cuerpo del laboratorio está pegado **verbatim** desde el verificador numérico, sin más cambio que quitar la palabra `export`. Si hay que cambiar física, se cambia en el verificador y se vuelve a pegar.

---

## Referencias

1. **ISO 3448** — *Industrial liquid lubricants — ISO viscosity classification.* Grados VG 32, 46, 68 y 100, cada uno con sus dos puntos normalizados por los que pasa exactamente la correlación del banco.
2. **ASTM D341** — *Viscosity-Temperature Charts for Liquid Petroleum Products* (ecuación de Walther), `log₁₀log₁₀(ν + 0,7) = A − B·log₁₀(T_K)`, con la banda declarada de 0 a 140 °C.
3. **ISO 4409** — *Hydraulic fluid power — Positive-displacement pumps, motors and integral transmissions — Methods of testing and presenting basic steady state performance.* De ella salen las definiciones de rendimiento volumétrico y mecánico-hidráulico que el banco usa y la forma de presentar el punto de servicio.
4. **ISO 4391** — *Hydraulic fluid power — Pumps, motors and integral transmissions — Parameter definitions and letter symbols.* Cilindrada geométrica, caudal y par ideales, y la nomenclatura de la que sale `T = Δp·D/2π`.
5. **ISO 4413** — *Hydraulic fluid power — General rules and safety requirements for systems and their components.* Justificación de la selección frente a las condiciones reales de servicio, incluida la temperatura de trabajo del fluido.
6. **Wilson, W. E. (1946)** — *Positive-Displacement Pumps and Fluid Motors.* Modelo adimensional de pérdidas del que salen `σ = K_S·Δp/(μ·ω)`, `τ = K_V·μ·ω/Δp` y el término de Coulomb, base clásica de la caracterización de máquinas volumétricas. Los coeficientes concretos del banco son representativos, no medidos.
7. **Circuito de carga de un lazo cerrado** — bomba de carga del 20 % de la cilindrada principal a 25 bar y barrido del 10 % del caudal ideal del motor: criterios de proyecto habituales de fabricante (Bosch Rexroth, Danfoss/Sauer-Danfoss, Eaton), declarados como criterios de este banco y no como límites normativos.
8. **Ventana de viscosidad de servicio** 10–80 mm²/s con franja recomendada 16–36 mm²/s: valores típicos de catálogo de grupos de pistones axiales. El criterio duro del laboratorio es la ventana; la franja es informativa.
