# MEC-107 · Dimensiona un acumulador hidroneumático y su precarga de nitrógeno

- **Dominio:** D4 · Hidráulica y Neumática
- **Práctica del backlog:** d4-A1 — *Dimensiona un acumulador y su precarga de N₂* (molde S)
- **Simulador:** `/labs/acumulador-precarga-nitrogeno.html`
- **Slug:** `acumulador-precarga-nitrogeno`
- **Ancla curricular:** EM-V.1
- **Fuentes normativas de referencia:** ISO 4413 · ISO 5598 · ISO 1219-1/2 · Directivas de equipos a presión · Korteweg (1878) · Joukowsky (1900)

---

## Qué enseña

1. Que un acumulador **no guarda aceite: guarda nitrógeno**, y el aceite sólo es el pistón que lo comprime. El volumen del catálogo es el del **gas a precarga**, no el aceite disponible: el cuerpo de 5 L de la prensa entrega **2,3060 L útiles**, menos de la mitad.
2. Que todo sale de una sola ley escrita tres veces —en `p₀`, en `p₁` y en `p₂`—: `ΔV = V₀·p₀^(1/n)·(p₁^(−1/n) − p₂^(−1/n))`.
3. Que el **índice politrópico no es un adorno**: el mismo cuerpo de 10 L al 90 % entre 100 y 160 bar entrega **3,3538 L con n = 1,0 · 2,9489 con n = 1,2 · 2,6271 con n = 1,4**. Un **21,67 % menos** de aceite sin cambiar una pieza.
4. Que esa pérdida **no se recupera subiendo la precarga**, porque por arriba topa con la válvula de plato.
5. Que el gas tiene **dos topes de carrera** —el cuerpo entero por arriba, las botellas de transferencia por abajo— y que ahí la respuesta deja de ser una curva suave; el laboratorio los **declara como estado** en vez de dibujar un número imposible.
6. Que la **precarga que se rotula no es la que trabaja**: `p₀(T) = p₀,ref·(273,15+T)/(273,15+20)`. Los 55,80 bar rotulados a 20 °C valen **52,89 a 5 °C** y **70,53 a 55 °C**.
7. Que el **tope térmico del plato** (`0,90·p₁`) es el criterio que **más montajes tumba él solo: 251 de 1 995**.
8. Que la **ventana de precarga está cerrada por los dos lados** y es estrechísima: en la prensa de emergencia, de las **siete** precargas del catálogo sirve **UNA**.
9. Que por abajo manda el aceite entregado **hoy y dentro de un año**: al 75 % entrega **2,2021 L** (cumple) y **2,0916 L** a doce meses (**no** cumple, se piden 2,1058).
10. Que la deriva no es retórica: **3 % de permeación anual** del nitrógeno **+ 2 bar** de tolerancia del kit de carga = **3,62 bar** menos en la precarga del año siguiente.
11. Que un acumulador **se dimensiona para el final del intervalo de mantenimiento**, no para el día del montaje.
12. Que la **relación de compresión** `p₂/p₀` en frío la fija el separador y no el proyectista: **4** en vejiga, **8** en membrana, **10** en pistón. El mismo montaje válido con pistón (4,657) sería inválido con vejiga.
13. Que el **tiempo de respuesta del separador** decide faenas enteras: los de pistón tardan **100 ms** y el ariete exige 15, el rizado 20. Suspenden **252 veces, 127 de ellas en solitario**.
14. Que **más gas NO es más aceite**: el mismo cuerpo de vejiga de 10 L sostiene **3,7382 h sin botellas, 7,1963 h con una y 3,8499 h con dos**. El óptimo es **interior**.
15. Que el motivo es geométrico y no económico: las botellas amplían el **gas**, no el sitio donde meter aceite. Con dos botellas el cuerpo se llena de aceite ya a **102,6 bar** y el ciclo útil pasa a ser 102,6 → 90 bar en vez de 140 → 90.
16. Que la **celeridad de la onda** se calcula con Korteweg y **no** es la del fluido libre: **1 258,1 m/s** en tubo de acero Ø50×4 frente a **1 313,1 m/s** en tubo infinitamente rígido.
17. Que un cierre es **rápido o lento contra `2L/c`**, no en milisegundos absolutos: 40 ms sobre 190,8 ms de ida y vuelta es **rápido**, y el golpe de Joukowsky sale entero.
18. Que ese golpe es `Δp = ρ·c·Δv` = **27,87 bar** sobre los 120 de línea → **147,87 bar sin acumulador** (límite 140) y **132,03 bar** con una vejiga de 1 L que absorbe **664,6 J**.
19. Que un **circuito de amarre sellado** que se calienta 35 K dilata `β·V·ΔT` = **0,196 L** que no caben en ninguna parte y llegaría a **467,5 bar**; el mismo litro de vejiga lo deja en **143,2**.
20. Que de **1 995 configuraciones sólo 392** cumplen los siete criterios, con reparto por faena **55 · 64 · 73 · 132 · 68**.
21. Que **la función nunca suspende en solitario: 0 de 972**, porque la deriva sólo empeora — si no llega hoy, tampoco llegará dentro de un año.
22. Que **el que más pesa es el plato**: perdonando sólo el tope térmico, el catálogo pasaría de **392 a 643** montajes válidos.
23. Que **cumplir la función no basta**: el reto exige el válido **más barato** bajo un orden declarado **antes** de barrer, y el óptimo resulta **único en las cinco faenas**.

---

## Lógica (verificada en `scratchpad/verif_acum.mjs`, 41 712 comprobaciones, 0 fallos)

### Constantes selladas

| Constante | Valor | Origen / significado |
|---|---|---|
| `P_ATM` | 1,013 bar | Paso de manométrica a absoluta: la ley del gas sólo vale en absolutas |
| `T0K` | 273,15 | Paso de °C a K |
| `T_REF` | 20 °C | Temperatura de rótulo de la precarga |
| `K_PLATO` | 0,90 | Tope térmico: `p₀(T_máx) ≤ 0,90·p₁`, para que el separador no se apoye en la válvula de plato |
| `PERM_ANUAL` | 3 % | Permeación del nitrógeno a través del separador en un año |
| `TOL_KIT` | 2 bar | Tolerancia del kit de carga, restada en el peor sentido |
| `RHO_OIL` | 870 kg/m³ | Densidad del aceite de referencia |
| `K_OIL` | 1,5 GPa | Módulo volumétrico del aceite (celeridad y compresibilidad) |
| `E_ACERO` | 210 GPa | Módulo del tubo, para la corrección de Korteweg |
| `BETA_OIL` | 7·10⁻⁴ K⁻¹ | Dilatación térmica del aceite |
| `V_BOT` | 10 L | Botella de transferencia de nitrógeno |
| `C_BOT` / `C_BLOQ` | 6 / 4 | Coste de una botella y del bloque de conexión |
| `N_ISO` / `N_POL` / `N_ADI` | 1,0 / 1,2 / 1,4 | Los tres índices politrópicos en estudio |

### Catálogo de acumuladores (valores de proyecto representativos, no de un modelo comercial)

| Clave | Tipo | V₀ (L) | p_s (bar) | Q_máx (L/min) | Coste |
|---|---|---|---|---|---|
| `v1` · `v25` · `v4` | Vejiga | 1 · 2,5 · 4 | 330 | 130 · 200 · 250 | 12 · 16 · 19 |
| `v10` · `v10b` | Vejiga | 10 · 10 | **330 · 150** | 350 · 350 | **27 · 22** |
| `v20` · `v50` | Vejiga | 20 · 50 | 330 | 450 · 600 | 38 · 62 |
| `m008` · `m016` · `m035` · `m06` | Membrana | 0,075 · 0,16 · 0,35 · 0,6 | 250 | 20 · 25 · 35 · 45 | 5 · 6 · 7 · 9 |
| `m14` · `m28` | Membrana | 1,4 · 2,8 | 210 | 60 · 75 | 12 · 15 |
| `p25` · `p5` · `p10` | Pistón | 2,5 · 5 · 10 | 350 | 400 · 500 · 600 | 26 · 33 · 42 |
| `p20` · `p35` · `p100` | Pistón | 20 · 35 · 100 | 350 | 700 · 800 · 900 | 58 · 76 · 128 |

> `v10` y `v10b` son **el mismo volumen** con distinta presión admisible (330 y 150 bar) y distinto precio (27 y 22): el laboratorio obliga a **no pagar presión que no se usa**, y el óptimo del sostenimiento es precisamente el barato de 150 bar.

### Los tres separadores

| Tipo | RC máx `p₂/p₀` | t_resp | Δp de fricción | Nota |
|---|---|---|---|---|
| Vejiga | **4** | 5 ms | 0 | Vejiga de NBR y válvula de plato |
| Membrana | **8** | 15 ms | 0 | Membrana soldada, sin piezas móviles |
| Pistón | **10** | **100 ms** | **3 bar** | Pistón con sellos deslizantes |

> La tabla es un **compromiso cerrado**: el pistón admite la relación de compresión más alta y es el único que llega a los 100 L, pero **tarda 100 ms** y **se come 3 bar** de fricción. Por eso gana la emergencia (200 ms de exigencia) y **pierde el ariete y el rizado** (15 y 20 ms).

### Precargas y botellas

- **Precargas** (fracción de `p₁`, rotuladas a 20 °C): `50 · 60 · 70 · 75 · 80 · 90 · 95 %`
- **Botellas de transferencia**: `0 · 1 · 2` × 10 L
- **Barrido**: 19 × 7 × 3 = **399 configuraciones por faena**, **1 995 en total**

### Las cinco faenas

| Faena | p₁ / p₂ (bar) | n | T mín/máx (°C) | Objetivo | Exigencia | t_resp exigido |
|---|---|---|---|---|---|---|
| Apertura de emergencia de una prensa | 70 / 250 | 1,4 | 5 / 55 | Aceite entregado | **≥ 2,1058 L** (Ø125/70, carrera 250 mm) | 200 ms |
| Rizado de una bomba de tres pistones | 175 / 185 | 1,4 | 15 / 60 | Rizado pico a pico | **≤ 4 bar** (3 cm³/pulso a 72,5 Hz) | 20 ms |
| Golpe de ariete al cerrar una válvula | 120 / 140 | 1,4 | −5 / 45 | Pico de presión | **≤ 140 bar** (Ø50×4, 120 m, 300 L/min, cierre 40 ms) | 15 ms |
| Circuito de amarre sellado que se calienta | 100 / 160 | 1,0 | 20 / 55 | Presión final | **≤ 160 bar** (8 L, 35 K, 1 800 s) | 60 s |
| Sostenimiento del amarre con la bomba parada | 90 / 140 | 1,0 | 5 / 45 | Tiempo sostenido | **≥ 5 h** (fuga de 12 cm³/min) | 60 s |

### Cadena de cálculo

```
p_abs = p_man + P_ATM                     la ley del gas sólo vale en absolutas
p₀(T) = p₀,ref·(273,15+T)/(273,15+20)     Gay-Lussac: la precarga rotulada NO es la que trabaja
p₀,frío = p₀(T_mín)   p₀,cal = p₀(T_máx)
p₀,der = p₀,frío·(1 − PERM_ANUAL) − TOL_KIT      un año después
V_T   = V₀ + n_bot·V_BOT                  gas total instalado
V(p)  = clamp(V_T·(p₀/p)^(1/n), n_bot·V_BOT, V_T)   ← los DOS topes de carrera
ΔV    = V(p₁) − V(p₂)                     aceite útil
── criterios ──
okFunc   : la función de la faena cumple su exigencia HOY
okPlato  : p₀(T_máx) ≤ K_PLATO·p₁
okRC     : p₂/p₀,frío ≤ RC del separador
okPS     : p₂ ≤ p_s del cuerpo
okQ      : caudal de la faena ≤ Q_máx de la conexión
okResp   : t_resp del separador ≤ el exigido por la faena
okDeriva : la función SIGUE cumpliendo con p₀,der
── faenas particulares ──
ariete : c = √( (K/ρ) / (1 + (K·D)/(E·e)) )      Korteweg
         Δp_J = ρ·c·Δv                            Joukowsky
         2L/c vs t_cierre → cierre rápido o lento
         pico con acumulador: absorción politrópica de E_c = ½·m_eq·v²
térmica: ΔV_aceite = β·V·ΔT, comprimido contra el gas por bisección de 200 pasos
fugas  : t = ΔV / q_fuga
rizado : Δp = f(dV por pulso, V_gas a la presión de trabajo)
```

### Los siete criterios (1 995 configuraciones)

| Criterio | Qué exige | Falla (total) | Falla **él solo** | Perdonándolo, válidas |
|---|---|---|---|---|
| `okDeriva` | La función se sigue cumpliendo dentro de un año | **1 021** | 17 | 409 |
| `okFunc` | La función se cumple hoy | 972 | **0** | **392** |
| `okPlato` | `p₀(T_máx) ≤ 0,90·p₁` (tope térmico del plato) | 627 | **251** | **643** |
| `okResp` | `t_resp` del separador ≤ el que la faena exige | 252 | **127** | 519 |
| `okQ` | Caudal de la faena ≤ `Q_máx` de la conexión | 173 | 10 | 402 |
| `okRC` | `p₂/p₀` en frío ≤ RC del separador | 126 | 40 | 432 |
| `okPS` | `p₂` ≤ presión admisible del cuerpo | 105 | 21 | 413 |

> **Dos lecturas obligatorias.** La primera: `okFunc` **jamás** suspende en solitario (0 de 972) y perdonarlo no añade ni un montaje válido, porque **la deriva sólo empeora** — si el aceite no llega hoy, tampoco llegará dentro de un año. La segunda: el criterio que decide de verdad **no es el volumétrico sino el térmico** — perdonando sólo el plato, las válidas pasarían de **392 a 643**.

### Censo por faena

| Faena | Válidas / 399 | Fallos totales `Func/Plato/RC/PS/Q/Resp/Deriva` | En solitario |
|---|---|---|---|
| Emergencia de la prensa | **55** | 229 / 114 / 126 / 63 / 126 / 0 / 239 | 0 / 39 / 40 / 0 / 0 / 0 / **3** |
| Rizado de bomba | **64** | 136 / 171 / 0 / 21 / 0 / 126 / 149 | 0 / **61** / 0 / 10 / 0 / **56** / 2 |
| Golpe de ariete | **73** | 161 / 114 / 0 / 0 / 47 / 126 / 167 | 0 / 36 / 0 / 0 / 10 / **71** / 1 |
| Circuito térmico | **132** | 163 / 114 / 0 / 21 / 0 / 0 / 176 | 0 / **74** / 0 / 11 / 0 / 0 / 5 |
| Sostenimiento del amarre | **68** | 283 / 114 / 0 / 0 / 0 / 0 / 290 | 0 / **41** / 0 / 0 / 0 / 0 / 6 |

### Óptimos (orden lexicográfico declarado en pantalla antes de barrer: **coste → gas instalado → margen**)

| Faena | Óptimo | Coste | Función | Exigencia | Margen | Ventana de precarga | Empates |
|---|---|---|---|---|---|---|---|
| Emergencia de la prensa | Pistón 5 L · **80 %** · sin botellas | 33 | 2,3060 L | ≥ 2,1058 | 9,51 % | **sólo 80 %** | **1** |
| Rizado de bomba | Membrana 0,35 L · 75 % · sin botellas | **7** | 2,7553 bar | ≤ 4 | 45,17 % | 50 · 60 · 70 · 75 % | **1** |
| Golpe de ariete | Vejiga 1 L · 80 % · sin botellas | 12 | 132,0347 bar | ≤ 140 | 6,03 % | 50 · 60 · 70 · 75 · 80 % | **1** |
| Circuito térmico | Vejiga 1 L · 80 % · sin botellas | 12 | 143,2444 bar | ≤ 160 | 11,70 % | 60 · 70 · 75 · 80 % | **1** |
| Sostenimiento del amarre | Vejiga 10 L a **150 bar** · 80 % · **1 botella** | 32 | 7,1963 h | ≥ 5 | 43,93 % | **sólo 80 %** | **1** |

**Óptimo único en las cinco faenas** (`empates = 1`).

### La ventana, de punta a punta (emergencia · pistón de 5 L · sin botellas)

| Precarga | Hoy | A un año | p₀ en caliente | Tope del plato | RC en frío | Veredicto |
|---|---|---|---|---|---|---|
| 50 % | 1,6484 L | 1,5418 | 38,73 bar | 62,90 | 7,451 | Función + Deriva |
| 60 % | 1,8777 | 1,7698 | 46,68 | 62,90 | 6,209 | Función + Deriva |
| 70 % | 2,0962 | 1,9867 | 54,63 | 62,90 | 5,322 | Función + Deriva — **por 9,6 cm³** |
| 75 % | **2,2021** | **2,0916** | 58,61 | 62,90 | 4,967 | **Deriva** — cumple hoy, no a un año |
| **80 %** | **2,3060** | **2,1944** | 62,58 | 62,90 | 4,657 | ✅ **la única** |
| 90 % | 2,5084 | 2,3945 | **70,53** | 62,90 | 4,139 | Plato |
| 95 % | 2,6072 | 2,4921 | **74,50** | 62,90 | 3,921 | Plato |

> Es la tabla que resume el laboratorio entero: **por abajo manda el aceite (hoy y dentro de un año) y por arriba manda la temperatura**. La precarga rotulada del óptimo es **55,80 bar a 20 °C**, que valen **52,89 en frío**, **62,58 en caliente** y **49,27 dentro de un año** — **3,62 bar** de deriva.

### El óptimo interior del sostenimiento

| Botellas | Gas total | Sostiene | Coste | Veredicto |
|---|---|---|---|---|
| 0 | 10 L | 3,7382 h | 22 | Función + Deriva |
| **1** | 20 L | **7,1963 h** | **32** | ✅ |
| 2 | 30 L | 3,8499 h | 38 | Función + Deriva |

> **Más gas no es más aceite.** Las botellas amplían el nitrógeno, no el sitio donde meter aceite: el cuerpo sigue teniendo 10 L. Con dos botellas el conjunto **se llena de aceite ya a 102,6 bar** y el ciclo útil pasa a ser 102,6 → 90 bar en vez de 140 → 90; entrega **2,772 L** frente a los **5,181 L** de una sola botella. El óptimo es **interior**, y ni cero ni dos lo alcanzan.

### Las otras tres faenas, con números

| Faena | Sin acumulador | Con el óptimo | Límite |
|---|---|---|---|
| Golpe de ariete | **147,87 bar** (120 de línea + 27,87 de Joukowsky) | **132,03 bar** | 140 |
| Circuito térmico | **467,5 bar** (0,196 L de dilatación sin sitio) | **143,24 bar** | 160 |
| Rizado de bomba | 12,87 bar (con la membrana de 0,075 L) | **2,76 bar** | 4 |

**Ariete, detalle sellado:** `c` = 1 258,1 m/s (Korteweg) frente a 1 313,1 m/s en tubo rígido · `v_línea` = 2,5465 m/s · `Δp_J` = 27,87 bar · `E_c` = 664,6 J · `ΔV` absorbido = 0,0524 L · `Q_pico` = 78,58 L/min · `2L/c` = **190,8 ms** contra un cierre de 40 ms → **cierre rápido, golpe entero**.

---

## Los cinco modos (molde S)

| Modo | Qué se manipula | Qué demuestra |
|---|---|---|
| **El gas** | modelo · precarga · botellas · **índice n** | La curva `p·Vⁿ` con sus dos topes y el peso del politrópico (21,67 %) |
| **La faena** | faena · el conjunto entero | La misma ley contestando a cinco preguntas distintas |
| **La precarga** | precarga de punta a punta | La ventana cerrada por los dos lados: plato arriba, aceite y deriva abajo |
| **El catálogo** | los 19 modelos con una faena delante | El censo de las 399 combinaciones, criterio por criterio |
| **Reto** | modelo · precarga · botellas | Calificación por eje independiente + orden lexicográfico |

---

## Verificación

### Capa 1 — física (`scratchpad/verif_acum.mjs`)

**41 712 comprobaciones, 0 fallos**, en doce bloques: la ley politrópica y sus dos recortes de carrera; la corrección de temperatura de la precarga; el golpe de ariete (Korteweg, Joukowsky, criterio `2L/c` y absorción politrópica); el circuito sellado que se calienta, resuelto por bisección de 200 pasos y contrastado con el balance de energía; el rizado de la bomba; el volumen entregado; el censo completo con los siete criterios recalculados de forma independiente y su recuento de fallos en solitario; el peso del índice politrópico; el formato sellado de cifras; el catálogo entero; la fricción del pistón; y las lecturas continuas que alimentan las curvas del pizarrón.

**Transcripción al body** (`scratchpad/check_trans_acum.mjs`): **98 705/98 705** sobre las **1 995** configuraciones. Re-importa el bloque MOTOR del `body.js` y lo compara campo a campo con el motor sellado (magnitudes numéricas, los siete booleanos y la lista de fallos de cada configuración), más `solucion`, `empates`, `botellaMax`, `f1` y `pc1`.

### Capa 2 — navegador real (`scratchpad/pw_acum.mjs`)

**322 aserciones, 0 fallos**, sobre Chromium contra `window.__labDebug`, en 20 bloques:

1. Carga limpia y superficie de depuración (5 modos, 19 modelos, 7 precargas, 3 opciones de botellas, 5 faenas, 7 criterios, 3 ejes, 16 constantes selladas, 15 piezas inspeccionables) · 2. Catálogo publicado campo a campo contra el sellado · 3. **Rederivación de las 1 995 configuraciones** de la página contra el motor sellado, 13 magnitudes numéricas más coste, validez, lista de fallos y la palabra de siete bits de los criterios · 4. Censo · 5. Ley del gas y sus topes · 6. Gay-Lussac · 7. La ventana de precarga · 8. Los cinco óptimos · 9. Botellas de transferencia y su óptimo interior · 10. Ariete: Korteweg y Joukowsky · 11. Los cinco modos, panel y controles · 12. Telemetría contra el motor · 13. Formato sellado `f1` (incluido el separador de millares por código de carácter) · 14. Cuestionario (barajado, índice y bloqueo) · 15. Arranque equivocado del reto · 16. Válido pero caro NO cierra el reto · 17. La pista es honesta y no toca el montaje · 18. Inspección de piezas: 75 combinaciones, **56 fichas vivas** y ninguna con `NaN` · 19. Recorrido guiado completo · 20. Escena 3D y selección por clic.

> El bloque 3 **no copia** el motor del laboratorio: importa el motor sellado en Node y lo compara con lo que la página calcula, de modo que una errata de transcripción aparecería como desacuerdo de física y no como una coincidencia de instantánea.

---

## Qué NO modela (declarado en la ficha del alumno)

La **ecuación de estado real** del nitrógeno con su factor de compresibilidad `Z`, que por encima de unos 200 bar se aparta apreciablemente del gas ideal; el valor exacto del **exponente politrópico** de una instalación concreta, que depende del tiempo de ciclo, de la relación superficie-volumen del cuerpo y del salto de presión, y que aquí se ofrece como elección de tres valores para que se vea su peso; la **transferencia de calor transitoria** entre el gas y el cuerpo, que es lo que en realidad determina `n`; la **fatiga del separador** y la vida en número de ciclos, que es el motivo físico de que existan los límites de relación de compresión y que en un catálogo es una curva y no un número; la **dinámica** del separador durante el transitorio, resumida en un único tiempo de respuesta por tipo; la **pérdida de carga** de la conexión y del bloque de seguridad, de la que sólo se modela la fricción del separador de pistón y como constante; el **bloque de seguridad y descarga** que la ISO 4413 exige en toda instalación con acumulador y el procedimiento de despresurización previo a cualquier intervención; el **procedimiento de carga** del nitrógeno con su kit, su botella patrón y su corrección por la temperatura de la propia botella, del que sólo se modelan la tolerancia y la temperatura de rótulo; la **oscilación completa** del golpe de ariete —aquí se calcula el PRIMER PICO por balance de energía, no la serie de crestas con su período `4L/c`, su amortiguamiento ni la cavitación de la depresión posterior—; las **pérdidas de carga** tramo a tramo por Darcy–Weisbach y el número de Reynolds (**d4-A2**); la electrónica de mando de la máquina (**d4-13** y **d4-A4**); la **certificación** del acumulador como recipiente a presión, con su marcado, sus pruebas hidrostáticas periódicas y su libro del aparato, resumida en el único campo «presión máxima admisible»; y el envejecimiento del elastómero por temperatura y por compatibilidad con el fluido.

Los datos del catálogo de 19 modelos, los tres tipos de separador con su relación de compresión, su tiempo de respuesta y su fricción, las cinco faenas con sus presiones, temperaturas y exigencias, las siete precargas, el volumen y el coste de las botellas de transferencia, los 2 bar de tolerancia del kit y el campo «coste» son **valores de proyecto representativos**, no constantes medidas ni límites normativos, y se declaran como tales en la pantalla.

---

## Normas de referencia

- **ISO 4413** — Transmisiones hidráulicas, reglas generales y requisitos de seguridad: exige el bloque de seguridad y descarga en toda instalación con acumulador, la despresurización previa a cualquier intervención y la justificación de cada componente frente a las condiciones reales de servicio.
- **ISO 5598** — Vocabulario: precarga, presión máxima admisible, relación de compresión y volumen nominal **no son sinónimos** de lo que el taller suele llamar «capacidad».
- **ISO 1219-1 / ISO 1219-2** — Símbolos gráficos y esquemas de circuito, incluido el del acumulador con su bloque de seguridad.
- **Directivas de equipos a presión** — Un acumulador es un recipiente a presión: marcado, presión máxima admisible declarada, pruebas periódicas y libro del aparato.
- **D. J. Korteweg** (1878) — Celeridad de la onda de presión en un conducto elástico: `c = √((K/ρ)/(1 + K·D/(E·e)))`.
- **N. Joukowsky** (1900) — Golpe de ariete `Δp = ρ·c·Δv` y el criterio de cierre rápido frente a `2L/c`.
