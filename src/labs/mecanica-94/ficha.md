# MEC-94 · Cilindro neumático: fuerza, velocidad y consumo de aire

**Dominio:** D4 · Hidráulica y Neumática
**Práctica del backlog:** d4-02 — «Cilindro neumático: fuerza, velocidad y consumo de aire» — **Molde S** — **D4 2/18**
**Simulador:** `/labs/cilindro-neumatico-fuerza-consumo.html`
**Slug de construcción:** `cilindro-neumatico-fuerza-consumo`

---

## Qué enseña

1. **La fuerza del catálogo no es la fuerza que tienes.** `F_útil = η·p·A` con η = 0,85: el Ø100 a 6 bar da **4712 N** teóricos, **4006 N** útiles y pierde **707 N** solo en juntas y guías.
2. **Un cilindro no empuja y tira igual.** El lado del vástago tiene menos área: la relación anular/émbolo va de **0,8400** (Ø40 y Ø50, un 16 % menos de fuerza al tirar) a **0,9375** (Ø100). El catálogo publica el empuje.
3. **Cuando el trabajo es de retroceso, la asimetría decide la presión.** Para los 460 N de la compuerta de la tolva con un Ø50: por avance bastarían **3,937 bar**, al tirar hacen falta **4,687**, y a 4 bar la relación de carga se dispara a **0,820** contra 0,7 admisible.
4. **La relación de carga tiene tres pasos según la velocidad.** `β = F_carga/F_útil` ≤ **0,7** hasta 100 mm/s (lento), ≤ **0,5** hasta 500 mm/s (normal), ≤ **0,3** por encima (rápido). El margen es lo que absorbe la inercia y evita el golpe de final de carrera.
5. **A alta velocidad hay que sobredimensionar la fuerza varias veces.** El transfer pide 120 N a 800 mm/s: con β ≤ 0,3, la fuerza útil del Ø32 a 6 bar (**410,2 N**) da β = **0,2926**, es decir un sobredimensionado de **3,33×** sobre la carga real.
6. **La velocidad la manda la válvula, no el cilindro.** Con Ø40 a 5 bar, la velocidad máxima es **74 · 147 · 441 · 1029 · 2206 mm/s** para M5 · G1/8 mini · G1/8 · G1/4 · G3/8.
7. **Una válvula pequeña no rompe nada: hace la máquina lenta.** El Ø100 de la prensa de marcado necesita 180 mm/s y las cinco válvulas dan **12 · 24 · 71 · 165 · 353 mm/s**: solo la G3/8 llega. Es un diagnóstico distinto al de falta de fuerza.
8. **El caudal se dimensiona con el lado del ÉMBOLO.** En el Ø50 a 5 bar y 60 mm/s el émbolo pide **42,5 l/min** y el anular **35,7**: la válvula es la misma para los dos sentidos, así que manda el mayor. Y con factor **×1,5** sobre el calculado.
9. **El consumo se paga en aire libre por ciclo.** Volumen barrido en los dos sentidos × relación de compresión `(p + 1,013)/1,000`.
10. **Bajar la presión del regulador NO siempre ahorra aire.** En el transfer, el mejor montaje gasta **5,799** l ANR/ciclo a 3 bar (Ø50), **4,636** a 4 bar (Ø40), **5,561** a 5 bar (Ø40) y **4,195** a 6 bar (Ø32). Pasar de 6 a 5 bar encarece el ciclo un **32,6 %**, porque compensar la presión exige subir el diámetro y el área va al cuadrado.
11. **Son dos preguntas distintas y dan cifras distintas.** Bajar el regulador de *ese* cilindro cuesta **+32,6 %**; limitar la **red entera** a 5 bar mueve el óptimo al Ø40 a 4 bar (**4,636** l ANR/ciclo), solo **+10,5 %**.
12. **La válvula no cambia el consumo por ciclo.** Recorrer las cinco válvulas mueve la velocidad alcanzable pero deja el aire por ciclo idéntico: el aire lo fija el volumen barrido, no el estrangulamiento.
13. **El litro ANR no es el litro normal.** ANR (ISO 8778) a 1000 hPa y 20 °C; normal (DIN 1343) a 1013,25 hPa y 0 °C. El factor exacto es **1,087440**, un **8,744 %** — comparar un compresor en Nm³/h con un consumo en m³/h ANR falsea el balance casi un 9 %.
14. **Cuatro criterios simultáneos o el montaje no vale.** Diámetro que quepa (`okD`), presión ≤ la de la red (`okP`), relación de carga bajo su máximo (`okB`) y caudal de válvula ≥ 1,5 × el necesario (`okQ`).
15. **Cumplir no basta: gana el que cumple Y gasta menos aire.** En el tope, el Ø40 (**1,112** l ANR/ciclo) y el Ø50 (**1,738**) cumplen los cuatro criterios; en el transfer, el Ø32 (**4,195**) y el Ø40 (**6,486**). Sobredimensionar cuenta como error.
16. **Los pasos 0,7 / 0,5 / 0,3 y el factor ×1,5 son criterios de proyecto de fabricante** (Festo, SMC), **no** valores normativos de la ISO 15552. Se declara como tal en la ficha y en el laboratorio.

---

## Lógica (verificada `verif_neumatica.mjs` — 114/114)

**Constantes selladas del motor** (idénticas en el verificador y en el laboratorio, copiadas verbatim entre los marcadores `MOTOR` / `FIN MOTOR`):

| Símbolo | Valor | Origen |
|---|---|---|
| `P_ATM` | 1,013 bar | presión atmosférica para la relación de compresión |
| `ETA` | 0,85 | rendimiento del cilindro (fricción de juntas y guías) |
| `K_VAL` | 1,5 | factor de sobredimensionado de válvula (criterio de proyecto) |
| `P_NORM` / `T_NORM` | 1013,25 hPa · 273,15 K | estado normal DIN 1343 (litro normal, Nl) |
| `P_ANR` / `T_ANR` | 1000 hPa · 293,15 K | atmósfera de referencia ANR, ISO 8778 (litro ANR) |
| `F_NL_ANR` | 1,087440 | `(P_NORM/P_ANR)·(T_ANR/T_NORM)` — el 8,744 % de diferencia entre referencias |

**Fórmulas del motor**

| Magnitud | Expresión |
|---|---|
| Área del émbolo | `A_emb = π·D²/4` |
| Área anular | `A_anu = π·(D² − d²)/4` |
| Área activa según el sentido | `A_dir = A_emb` si avance, `A_anu` si retroceso |
| Fuerza teórica | `F_teo = p·A_dir` |
| Fuerza útil | `F_útil = η·p·A_dir` |
| Relación de carga | `β = F_carga/F_útil` |
| Máximo admisible | `β_máx = 0,7` (v ≤ 100) · `0,5` (v ≤ 500) · `0,3` (v > 500 mm/s) |
| Relación de compresión | `r = (p + 1,013)/1,000` |
| Caudal necesario (aire libre) | `Q = A_emb·v·r` |
| Velocidad máxima de la válvula | `v_máx = Qn/(A_emb·r)` |
| Consumo por ciclo | `C = (A_emb + A_anu)·s·r` |
| Litro normal desde litro ANR | `Nl = l_ANR / 1,087440` |

**Catálogo de cilindros (ISO 15552)**

| Clave | Ø émbolo / Ø vástago (mm) | A_émbolo (cm²) | A_anular (cm²) | Ratio | F_útil a 6 bar avance / retroceso (N) |
|---|---|---|---|---|---|
| `c32` | 32 / 12 | 8,0425 | 6,9115 | 0,8594 | 410 / 352 |
| `c40` | 40 / 16 | 12,5664 | 10,5558 | **0,8400** | 641 / 538 |
| `c50` | 50 / 20 | 19,6350 | 16,4934 | **0,8400** | 1001 / 841 |
| `c63` | 63 / 20 | 31,1725 | 28,0309 | 0,8992 | 1590 / 1430 |
| `c80` | 80 / 25 | 50,2655 | 45,3567 | 0,9023 | 2564 / 2313 |
| `c100` | 100 / 25 | 78,5398 | 73,6311 | **0,9375** | 4006 / 3755 |

**Escalones de regulador y válvulas**

| Presión | Relación de compresión |
|---|---|
| `p3` = 3 bar | 4,013 |
| `p4` = 4 bar | 5,013 |
| `p5` = 5 bar | 6,013 |
| `p6` = 6 bar | 7,013 |

| Clave | Conexión | Qn (l/min ANR) | v_máx con Ø40 a 5 bar |
|---|---|---|---|
| `v50` | M5 | 50 | 74 mm/s |
| `v100` | G1/8 mini | 100 | 147 mm/s |
| `v300` | G1/8 | 300 | 441 mm/s |
| `v700` | G1/4 | 700 | 1029 mm/s |
| `v1500` | G3/8 | 1500 | 2206 mm/s |

**Los cuatro criterios de selección**

| Criterio | Condición |
|---|---|
| `okD` | `D ≤ D_máx` del hueco disponible |
| `okP` | `p ≤ p_red` de la estación |
| `okB` | `β ≤ β_máx` según el régimen de velocidad |
| `okQ` | `Qn ≥ 1,5 · Q_necesario` |

**Cada criterio puede fallar en solitario** (barrido completo, casos con exactamente un criterio incumplido): `okB` 134 · `okQ` 118 · `okP` 13 · `okD` 1. Ningún criterio es texto muerto.

---

## Las cuatro estaciones (barrido completo 6 × 4 × 5 = 120 por estación)

| Estación | F (N) | Sentido | s (mm) | v (mm/s) | Régimen · β_máx | Hueco Ø | Red | ciclos/min | Terna única | Válidas |
|---|---|---|---|---|---|---|---|---|---|---|
| Tope retráctil de posicionamiento | 250 | avance | 80 | 200 | normal · 0,5 | 100 | 6 bar | 25 | `c40 · p5 · v300` | 41/120 |
| Compuerta de descarga de una tolva | 460 | **retroceso** | 250 | 60 | lento · 0,7 | 100 | 5 bar | 6 | `c50 · p5 · v100` | 33/120 |
| Prensa de marcado de piezas | 1400 | avance | 40 | 180 | normal · 0,5 | 100 | 6 bar | 30 | `c100 · p5 · v1500` | **2/120** |
| Transfer rápido de piezas ligeras | 120 | avance | 400 | **800** | **rápido · 0,3** | **63** | 6 bar | 40 | `c32 · p6 · v700` | 16/120 |

**Resultado con la terna ganadora**

| Estación | F_útil (N) | β / β_máx | Q_nec (l/min) | ×1,5 | v_máx válvula | Consumo |
|---|---|---|---|---|---|---|
| Tope | 534 | 0,468 / 0,5 | 90,7 | 136,0 | 441 mm/s | **1,112** l ANR/ciclo · 1,023 Nl · 27,8 l/min · 1,67 m³/h |
| Compuerta | 701 | 0,656 / 0,7 | 42,5 | 63,8 | 94 mm/s | **5,431** l ANR/ciclo · 4,994 Nl · 32,6 l/min · 1,96 m³/h |
| Marcado | 3338 | 0,419 / 0,5 | 510,0 | 765,1 | 353 mm/s | **3,660** l ANR/ciclo · 3,366 Nl · 109,8 l/min · 6,59 m³/h |
| Transfer | 410 | 0,293 / 0,3 | 270,7 | 406,1 | 1379 mm/s | **4,195** l ANR/ciclo · 3,858 Nl · 167,8 l/min · 10,07 m³/h |

### Por qué no otro cilindro (verificado con los otros dos ejes correctos)

| Estación | Ø32 | Ø40 | Ø50 | Ø63 | Ø80 | Ø100 |
|---|---|---|---|---|---|---|
| Tope | falla `okB` (β 0,731) | **válida 1,112** | válida 1,738 | falla `okQ` | falla `okQ` | falla `okQ` |
| Compuerta | falla `okB` (β 1,566) | falla `okB` (β 1,025) | **válida 5,431** | falla `okQ` | falla `okQ` | falla `okQ` |
| Marcado | falla `okB` (β 4,096) | falla `okB` (β 2,621) | falla `okB` (β 1,678) | falla `okB` (β 1,057) | falla `okB` (β 0,655) | **válida 3,660** |
| Transfer | **válida 4,195** | válida 6,486 | falla `okQ` | falla `okQ` | falla `okD+okQ` | falla `okD+okQ` |

### El consumo óptimo frente a la presión de red (transfer)

| Presión | Mejor cilindro | Consumo (l ANR/ciclo) |
|---|---|---|
| 3 bar | Ø50 | 5,799 |
| 4 bar | Ø40 | **4,636** |
| 5 bar | Ø40 | 5,561 |
| 6 bar | Ø32 | **4,195** ← óptimo global |

De 6 a 5 bar el consumo sube un **32,6 %**. Si la red entera se limitara a 5 bar, el óptimo pasaría al Ø40 a 4 bar (4,636), un **10,5 %** más de aire.

**Diagnósticos vivos** (mensajes que llegan a dispararse en el barrido): `cabe` 2 · `red` 1 · `carga` 17 · `valvula` 18 · `gasta` 4 · `sobra` 3 — **45 mensajes distintos**, ninguno inalcanzable.

---

## Anclas de honestidad

- **`p·A` no es la fuerza que hay.** Con η = 0,85, el Ø100 a 6 bar pierde **707 N** de los 4712 teóricos. La cifra se muestra al lado de la teórica, no en una nota al pie.
- **Empujar y tirar no es lo mismo.** El Ø50 pierde el **16 %** de fuerza al retroceder, y la compuerta de la tolva está diseñada precisamente para que ese 16 % decida el escalón de regulador (4 bar no, 5 bar sí).
- **Los pasos 0,7 / 0,5 / 0,3 son criterio de fabricante, no norma.** La ISO 15552 normaliza dimensiones de montaje y parejas émbolo-vástago; el criterio de relación de carga es una recomendación de proyecto (Festo, SMC), igual que el factor ×1,5 de válvula. Declarado en la ficha.
- **Una válvula pequeña no es una avería.** El Ø100 con la M5 da 12 mm/s en lugar de 180: la máquina va lenta y tiene toda su fuerza. Se distingue explícitamente de la falta de fuerza.
- **Bajar la presión puede costar aire.** +32,6 % de 6 a 5 bar en el transfer. La receta popular «baja la red y ahorras» se contradice con la curva delante.
- **Y son dos preguntas distintas.** Bajar el regulador de ese cilindro (+32,6 %) no es lo mismo que limitar la red entera (+10,5 %, con cambio de cilindro y de presión). Se separan en dos paneles.
- **La válvula no cambia el aire por ciclo.** Cambiar de M5 a G3/8 multiplica la velocidad por 30 y deja el consumo por ciclo idéntico. Es un distractor verificado del cuestionario.
- **ANR y Nl no son la misma unidad.** Factor exacto **1,087440**. El laboratorio muestra las dos columnas en lugar de elegir una en silencio.
- **A 800 mm/s hay que sobredimensionar 3,33×.** El transfer pide 120 N y su cilindro entrega 410,2 útiles. No es despilfarro: es el margen que exige β ≤ 0,3.
- **No se modela la dinámica.** Masa acelerada, perfil de velocidad, amortiguación de final de carrera y golpe del vástago quedan fuera: el laboratorio trabaja con velocidad media, que es exactamente lo que hace la regla de la relación de carga — y la razón de que esa regla exista.

---

## Molde y estructura

**Molde S** (banco 3D + pizarrón de 1024×768 con cuatro modos):

- **Fuerza:** el cilindro en corte a escala con las dos cámaras coloreadas, barras de área émbolo/anular, comparación fuerza teórica / útil / carga y el indicador de relación de carga con sus tres zonas y el régimen activo.
- **Caudal:** barras de velocidad máxima con cada válvula, línea de la velocidad pedida, tabla de válvulas con veredicto y tiempo de carrera resultante.
- **Consumo:** curva de consumo por ciclo frente a la presión de regulador con el mejor cilindro etiquetado en cada punto, y la tabla de las cuatro estaciones en las cuatro unidades (l ANR/ciclo · Nl/ciclo · l/min · m³/h).
- **Reto:** calificación **triple ortogonal** (cilindro / presión / válvula), cada eje evaluado con los otros dos correctos, con la tabla de los cuatro criterios y el diagnóstico por eje.
- **Banco 3D:** el barril y el vástago se **escalan** al diámetro elegido, la carga es un cubo dimensionado por la fuerza pedida, el manómetro del regulador marca en rojo la zona por encima de la red y cuatro LED muestran los cuatro criterios. El vástago se mueve al tiempo de carrera real de la estación (`s/v`, acotado para que siga siendo visible).
- **Cuestionario:** 4 opciones barajadas (Fisher-Yates) por modo, con los distractores verificados falsos contra el motor.

---

## Verificación en dos capas

1. **Numérica:** `scratchpad/verif_neumatica.mjs` — **114 comprobaciones, 0 fallos** (áreas ISO 15552, fuerzas teóricas y útiles, regímenes y relación de carga, caudales y velocidades de válvula, consumo en las cuatro unidades, el óptimo frente a la presión, el barrido completo de las 120 combinaciones de cada estación con terna única, que cada criterio puede fallar en solitario y que ningún diagnóstico queda sin usar).
2. **Navegador:** arnés Playwright contra `window.__labDebug` sobre servidor HTTP local, más el recorrido guiado completo (`runAuto`) con la narración verificada paso a paso.

---

## Referencias

- **ISO 15552** — Cilindros neumáticos de simple y doble efecto con montaje desmontable, series de 32 a 320 mm: normaliza diámetros de émbolo y parejas émbolo-vástago (32/12, 40/16, 50/20, 63/20, 80/25, 100/25).
- **ISO 1219-1** — Símbolos gráficos y esquemas de circuito de transmisiones hidráulicas y neumáticas: cilindro de doble efecto, válvula 5/2 y regulador.
- **ISO 8778** — Neumática: atmósfera de referencia normal (ANR), 1000 hPa, 20 °C y 65 % HR. Referencia del caudal nominal de catálogo y del litro ANR.
- **DIN 1343** — Estado normal de referencia: 1013,25 hPa y 0 °C; define el litro normal (Nl) y el metro cúbico normal (Nm³). Factor exacto frente a ANR: **1,087440**.
- **ISO 6358** — Determinación de las características de caudal de componentes neumáticos: norma tras el `Qn` de catálogo de las válvulas.
- **ISO 4414** — Transmisiones neumáticas: reglas generales y requisitos de seguridad.
- **Criterios de proyecto de fabricante** (Festo y SMC, manuales de dimensionado de actuadores): relación de carga máxima 0,7 / 0,5 / 0,3 según régimen y sobredimensionado de válvula ×1,5. Recomendaciones de ingeniería, **no** valores normativos.
