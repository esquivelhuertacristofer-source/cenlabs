# MEC-101 · Configura la Unidad FRL y Evalúa la Calidad del Aire

**Dominio:** D4 · Hidráulica y Neumática
**Práctica del backlog:** d4-09 — «Configura la unidad FRL y evalúa la calidad del aire»
**Simulador:** `/labs/unidad-frl-calidad-aire.html`
**Slug de construcción:** `unidad-frl-calidad-aire`

---

## Qué enseña

1. **La clase ISO 8573-1 son TRES números independientes.** `[A:B:C]` = sólidos : agua : aceite, y cada uno lo decide un aparato distinto: el último filtro mecánico, el secador y el carbón activado. Pedir «aire limpio y seco» no compra nada.
2. **El aceite llega en dos formas y sólo una la para un filtro.** En Monterrey entran **10,4466 mg/m³**: 4,9900 de aerosol y **5,4566 de vapor**. Prefiltro, coalescente y microfiltro bajan el total a 7,4526 → 5,5566 → 5,4666 y la clase C **sigue siendo 10** en los tres.
3. **Tres filtros mecánicos mueven el vapor en CERO.** Sólo el carbón lo adsorbe: **0,008457 mg/m³** y clase **C 1**, de golpe.
4. **La fracción de vapor la fija la TEMPERATURA, no el filtro.** 13,1 % a 18 °C · 17,2 % a 22 °C · 34,5 % a 32 °C · **52,2 % a 38 °C**. En Toluca los mismos filtros «funcionan» (2,6117 → 0,4410, clase C 3) porque hace frío, no porque sean mejores.
5. **El punto de rocío se compara con el punto más FRÍO de la línea, no con el catálogo.** El frigorífico da **+3 °C** y clase B 4 bajo techo; la misma instalación a la intemperie, con la línea a **−12 °C**, **vuelve a condensar** aguas abajo de todos los filtros.
6. **El agua reaparece donde ya no queda nada que la recoja.** Ése es el diagnóstico completo del «tengo agua y el filtro es nuevo»: el filtro es inocente y el secador cumple lo que promete.
7. **El rocío atmosférico siempre queda por debajo del rocío a presión.** Por eso el aire que sopla en la salida parece seco mientras la tubería gotea.
8. **El posenfriador es el que drena.** 5,646 g/min por m³/min en Toluca y **21,284** en Veracruz — casi cuatro veces más antes de tocar ningún filtro.
9. **La clase de sólidos no la fija la concentración sino el TAMAÑO.** En Monterrey hay **12,6535 mg/m³** con filtro y sin él (1,6 mg/m³ aspirados, concentrados **×7,9084** al pasar a 7 bar), y la clase A va de **10 → 5 → 3 → 1**.
10. **El secador de adsorción ensucia.** Aporta finos de desecante y **degrada la clase A de 1 a 2** aunque se lleve carbón activado montado. El aparato que resuelve el agua estropea los sólidos.
11. **La presión de red no se elige: se levanta hacia atrás.** Martillo con cuerpo G1/4: 6,0 + 0,25 tubería + 0,4959 droop + 0,3315 lubricador + 0,7 diferencial + 0,4237 filtros = **8,2011 bar**, y el compresor da **8,0**.
12. **Un cambio de rosca hunde TODOS los peldaños a la vez.** Con G3/8 la conductancia sube **×1,90**: droop 0,4959 → 0,1374, lubricador 0,3315 → 0,0971, filtros 0,4237 → 0,1275, red **7,3119 bar**. Con G1/2, ×3,20 → 7,0791.
13. **Y el punto de uso no se entera:** **6,000000 bar** exactos con los tres cuerpos. La escalera no cambia lo que la herramienta recibe, cambia lo que cuesta dárselo.
14. **Cuando `f = q/(C·p₁)` llega a 1 el elemento se ahoga.** Bloqueo sónico en **5 de las 600** propuestas, todas martillos con membrana y cuerpo G1/4.
15. **La calidad se paga en kilovatios.** +7 % de energía específica por bar sobre los 7 de referencia —medido, **+6,58 %** en el martillo: de 38 246 a 40 762 kWh/año— y la purga del secador se paga **entera** en el compresor: 15 % con adsorción, 18 % con membrana.
16. **El aparato caro sale barato por el sitio donde nadie mira.** En instrumentación la membrana consume **6 061 kWh** contra un contrato de **6 000** y ninguna de sus quince combinaciones baja del tope; la adsorción, que cuesta 34 u.c. frente a 26, consume **5 937** y entra.

---

## Lógica (verificada `verif_frl.mjs` — 43 794/43 794)

### Constantes selladas

| Constante | Valor | Origen |
|---|---|---|
| `P_ATM` / `PATM_BAR` | 1 013,25 mbar · 1,013 25 bar | presión de referencia del banco |
| `MAG_A` / `MAG_B` / `MAG_C` | 6,112 hPa · 17,62 · 243,12 °C | Magnus–Sonntag sobre agua líquida |
| `MAG_TMIN` / `MAG_TMAX` | **−45 … +60 °C** | banda de validez **declarada** de Magnus |
| `N_REF` / `M_H2O` | 41,027 mol/m³ · 18,015 g/mol | referencia de contenido de agua ISO 8573-1 (20 °C, 100 kPa) |
| `DT_POST` | 10 K | salto del posenfriador sobre el ambiente |
| `DP_REG_MIN` | 0,7 bar | diferencial mínimo que exige el regulador |
| `DP_TUB` | 0,25 bar | caída fija de la tubería hasta el punto de uso |
| `P_MAX_RED` | **8,0 bar g** | tope del compresor de la planta |
| `P_RED_NOM` | 7,0 bar g | red de referencia del consumo específico |
| `POT_ESP` | 6,7 kW por (m³/min) | consumo específico a 7 bar g |
| `K_BAR` | **0,07** | +7 % de energía específica por bar de descarga |
| `HORAS_ANIO` / `PRECIO_KWH` | 6 000 h/año · 2,5 MXN/kWh | criterios de proyecto declarados |
| `ACEITE_BASE` / `T_ACE_REF` / `DEC_ACE` | 3,0 mg/m³ · 30 °C · 10 K | arrastre del compresor, duplica cada 10 K |
| `FRAC_VAP0` / `FRAC_VAP_MAX` | 0,15 a 30 °C · tope 0,90 | reparto aerosol / vapor |
| `D0_DROOP` / `Q_NOM_G14` | 0,30 bar · 700 Nl/min | droop característico del regulador a caudal nominal |
| `MARGEN_ISA` | **10 K** | margen de la práctica ISA para aire de instrumentación |

### Reglas del motor

- **Psicrometría:** `pSat(T) = 6,112·exp(17,62·T/(243,12+T))` mbar; `tRocio` es su inversa; contenido de agua `wRef(pv,p) = 41,027·18,015·pv/(p−pv)` g por m³ de referencia.
- **Entrada al tren:** `Tpost = T_amb + 10 K`; `aceite = 3,0·2^((Tpost−30)/10)` mg/m³; `fracVap = min(0,90 ; 0,15·2^((Tpost−30)/10))`; aerosol y vapor salen de repartir el total.
- **Cascada de aceite:** cada elemento aplica `paso(x, eff, piso) = x ≤ piso ? x : max(x·(1−eff), piso)`. Prefiltro 0,60/1,00 · coalescente 0,98/0,10 · microfiltro 0,999/0,01 · **carbón 0,999/0,003 y es el único con `effVa > 0`**.
- **Sólidos:** `conc = polvo·(pRed+1,013 25)/1,013 25`; la clase la fija el filtro (`f0` → tabla por concentración, `f1` → 5, `f2` → 3, `f3`/`f4` → 1) y el secador de adsorción impone un suelo de **clase 2**.
- **Agua:** `pdp` = punto de rocío a presión del secador (o `Tpost` sin secador); el condensado en la línea sale de `wRef(pSat(pdp)) − wRef(pSat(Tmin))`; `condensa = pdp > Tmin`. Se marca `extrapolado` cuando el rocío atmosférico cae por debajo de −45 °C.
- **Caída ISO 6358:** `f = q/(C·p₁)`; si `f ≥ 1` → **bloqueo sónico**; si no, `p₂ = p₁·[b + (1−b)·√(1−f²)]`.
- **Escalera de presiones:** `pSet = pReq + DP_TUB + droop`, con `droop = 0,30·(Q/(700·fC))²`, más el lubricador aguas abajo resuelto por iteración; `pRed = pSet + DP_REG_MIN + Σ Δp` de separador, filtros y secador aguas arriba.
- **Energía:** `fad = Q·(1+purga)` corregido por temperatura de aspiración; `kW = fad·6,7·(1 + 0,07·(pRed − 7))`; `kWh = kW·6 000`.
- **Coste:** `round((12 + coste_filtro + coste_secador + 6·lub) · fCoste_cuerpo)` — recuento de unidades de catálogo, no un precio.

### Los siete criterios y cuántas veces falla cada uno EN SOLITARIO

| Criterio | Primer fallo | Falla solo |
|---|---|---|
| `okMontaje` — el secador exige una filtración previa (`sm`→f3, `sa`→f2) | 150 | **7** |
| `okSolidos` — clase A dentro del pliego | **192** | **3** |
| `okAgua` — clase B **y** rocío por debajo del punto más frío (con margen ISA donde aplica) | 114 | **38** |
| `okAceite` — clase C dentro del pliego | 30 | **9** |
| `okLub` — la estación exige o prohíbe lubricador | 57 | **38** |
| `okPresion` — sin bloqueo sónico y `pRed ≤ 8,0 bar` | 12 | **4** |
| `okEnergia` — kWh/año dentro de lo contratado | 7 | **7** |

**Los siete pueden suspender en solitario: ninguno es texto muerto.** Al alumno se le enseña siempre el **primero** que falla en el orden de la tabla, y `whyCfg()` se apoya en la misma función que la malla del proyecto para que el diagnóstico y el panel no puedan desincronizarse.

---

## El catálogo del banco

### Climas (5)

| Clima | T amb / HR | T posenfriador | Punto más frío | Polvo | Aceite total | Fracción de vapor |
|---|---|---|---|---|---|---|
| Nave templada (Toluca) | 18 °C / 60 % | 28 °C | 8 °C | 0,7 mg/m³ | 2,6117 mg/m³ | 13,1 % |
| Taller general (CDMX) | 22 °C / 45 % | 32 °C | 6 °C | 1,1 | 3,4461 | 17,2 % |
| Nave costera (Veracruz) | 32 °C / 85 % | 42 °C | 20 °C | 0,5 | 6,8922 | 34,5 % |
| Verano seco (Monterrey) | 38 °C / 30 % | **48 °C** | 12 °C | **1,6** | **10,4466** | **52,2 %** |
| Líneas a la intemperie | 4 °C / 90 % | 14 °C | **−12 °C** | 0,3 | 0,9896 | 4,9 % |

Monterrey arrastra **exactamente 4 veces** el aceite de Toluca: 20 K de diferencia son dos duplicaciones.

### Filtración (5 escalones acumulativos)

| Escalón | Elementos | Clase A que fija | Coste |
|---|---|---|---|
| `f0` Solo separador | — | por concentración | 0 |
| `f1` Prefiltro 5 µm | pre | 5 | 5 |
| `f2` Pre + coalescente 1 µm | pre, coal | 3 | 14 |
| `f3` + microfiltro 0,01 µm | pre, coal, micro | 1 | 28 |
| `f4` + **carbón activado** | pre, coal, micro, carb | 1 | 40 |

### Secadores (4)

| Secador | Rocío a presión | Purga | Exige | Suelo de clase A | `C` / `b` | Coste |
|---|---|---|---|---|---|---|
| Sin secador | = `Tpost` | 0 % | — | — | — | 0 |
| Frigorífico | **+3 °C** (clase B 4) | 0 % | — | — | 6,0 / 0,30 | 18 |
| Membrana | **−20 °C** (clase B 3) | **18 %** | `f3` | — | **2,4 / 0,35** | 26 |
| Adsorción sin aporte de calor | **−40 °C** (clase B 2) | **15 %** | `f2` | **2** | 5,5 / 0,30 | 34 |

### Cuerpos (3) y elementos pasivos

| Cuerpo | Factor de conductancia | Factor de coste |
|---|---|---|
| G1/4 | ×1,00 | ×1,00 |
| G3/8 | **×1,90** | ×1,35 |
| G1/2 | ×3,20 | ×1,80 |

`C` base (dm³/(s·bar)) en cuerpo G1/4: separador 7,0 · prefiltro 6,0 · coalescente 5,0 · microfiltro 4,0 · carbón 4,5 · lubricador 5,5.

### Las cinco estaciones

| Estación | `pReq` | Caudal | Pliego `[A:B:C]` | Lubricador | Margen ISA | Contrato |
|---|---|---|---|---|---|---|
| Martillo cincelador | 6,0 bar | **900 Nl/min** | [7:8:4] | **exige** | no | 44 000 kWh |
| Cabina de pintura | 4,0 | 400 | [2:4:2] | prohíbe | no | 17 000 |
| Envasado con contacto directo | 5,0 | 250 | [1:4:1] | prohíbe | no | 11 000 |
| Aire de instrumentación | 6,0 | **120** | [2:3:2] | prohíbe | **sí (10 K)** | **6 000** |
| Soplado en línea de electrónica | 3,0 | 450 | [1:3:1] | prohíbe | no | 19 000 |

### Solución de coste mínimo

| Escena | Óptimo | Coste | Válidas de 120 | Clase dada | `pRed` | kWh/año |
|---|---|---|---|---|---|---|
| Martillo @ Toluca | `f0` / frigorífico / **con lubricador** / **G3/8** | **49** | 17 | [7:4:4] | 7,3119 | 38 246 |
| Pintura @ intemperie | `f3` / **membrana** / sin / G1/4 | **66** | 12 | [1:3:2] | 6,0780 | 16 781 |
| Envasado @ Monterrey | `f4` / frigorífico / sin / G1/4 | **70** | **3** | [1:4:1] | 6,1803 | 10 748 |
| Instrumentación @ Monterrey | `f4` / **adsorción** / sin / G1/4 | **86** | **3** | [2:2:1] | 7,0119 | **5 937** |
| Soplado @ intemperie | `f4` / membrana / sin / G1/4 | **78** | **3** | [1:3:1] | 5,7641 | 18 435 |

**Barrido completo:** 5 estaciones × 5 filtraciones × 4 secadores × 2 lubricaciones × 3 cuerpos = **600** propuestas. Válidas: **38**. En las cinco escenas la solución de coste mínimo es **única**, y en el barrido de las **25** combinaciones de estación × clima **siempre hay solución y siempre es única**.

---

## Los cuatro efectos que hay que ver

### La cascada de aceite (Monterrey, 48 °C)

| Filtración | Aerosol | Vapor | Total | Clase C |
|---|---|---|---|---|
| `f0` | 4,990027 | 5,456580 | 10,446607 | **10** |
| `f1` | 1,996011 | **5,456580** | 7,452590 | **10** |
| `f2` | 0,100000 | **5,456580** | 5,556580 | **10** |
| `f3` | 0,010000 | **5,456580** | 5,466580 | **10** |
| `f4` | 0,003000 | **0,005457** | **0,008457** | **1** |

La columna del vapor no se mueve hasta la última fila. En Toluca la misma cascada da 2,6117 → 1,3410 → 0,4410 → 0,3510 → **0,006000**, y sí baja de clase por el camino (4 → 4 → 3 → 3 → 1): la diferencia no está en los filtros, está en los 30 K de temperatura.

**A la intemperie el prefiltro no hace absolutamente nada:** el aerosol de entrada (0,9407 mg/m³) ya está por debajo de su piso de 1,00, así que `f1` = `f0` = 0,989631 mg/m³.

### El agua contra la línea (`pUso` = 6 bar)

| Secador | Rocío a presión | Clase B | ¿Condensa a la intemperie (−12 °C)? |
|---|---|---|---|
| Sin secador | = `Tpost` (14 … 48 °C) | 9 … 10 | **sí, en todos los climas** |
| Frigorífico | +3,00 °C | 4 | **SÍ** |
| Membrana | −20,00 °C | 3 | no |
| Adsorción | −40,00 °C | 2 | no — y **avisa de que extrapola Magnus** |

### La escalera de presiones (martillo @ Toluca, `f0` + frigorífico + lubricador)

| Cuerpo | Droop | Lubricador | Σ Δp filtros | `pSet` | **`pRed`** | `pUso` |
|---|---|---|---|---|---|---|
| G1/4 | 0,4959 | 0,3315 | 0,4237 | 7,0774 | **8,2011** ✗ (tope 8,0) | 6,000000 |
| G3/8 | 0,1374 | 0,0971 | 0,1275 | 6,4845 | **7,3119** ✓ | 6,000000 |
| G1/2 | 0,0484 | 0,0347 | 0,0460 | 6,3332 | **7,0791** ✓ | 6,000000 |

### La factura (instrumentación @ Monterrey, `f4`, sin lubricador)

| Secador | Cuerpo | Purga | `pRed` | kWh/año | Contrato | Coste |
|---|---|---|---|---|---|---|
| Membrana | G1/4 | 18 % | 7,0458 | **6 061,2** ✗ | 6 000 | 78 |
| Membrana | G3/8 | 18 % | 7,0186 | **6 032,0** ✗ | 6 000 | 105 |
| Membrana | G1/2 | 18 % | 7,0117 | **6 024,7** ✗ | 6 000 | 140 |
| **Adsorción** | **G1/4** | 15 % | 7,0119 | **5 937,1** ✓ | 6 000 | **86** |

La membrana pierde en los dos frentes a la vez: purga tres puntos más **y** exige más presión de red, porque su conductancia sónica es la menor del catálogo (2,4 frente a 5,5). **Ninguna** de las quince combinaciones con membrana baja de 6 000 kWh: no hay filtro ni cuerpo que la rescate en esta estación.

---

## Anclas de honestidad

- **La ecuación de Magnus–Sonntag se declara válida entre −45 y +60 °C, y el laboratorio AVISA cuando la extrapola** en vez de callárselo: es lo que ocurre con el secador de adsorción a −40 °C de rocío a presión, cuyo rocío atmosférico cae por debajo de la banda.
- **El modelo de arrastre de aceite —3 mg/m³ a 30 °C duplicando cada 10 K, con un 15 % de vapor a 30 °C y un tope del 90 %— es una correlación declarada del laboratorio**, representativa de un compresor de tornillo lubricado, no un valor de norma. Lo firme es el comportamiento: la fracción de vapor sube con la temperatura y ningún filtro mecánico la toca.
- **Las eficacias y pisos de retención de los filtros son valores nominales de catálogo con su rango declarado**, no valores normativos. El piso es lo que hace que el prefiltro sea inútil a la intemperie, y se declara.
- **El «coste» es un recuento de unidades de catálogo**, no un precio de mercado ni una amortización. Los 2,5 MXN/kWh y las 6 000 h/año son criterios de proyecto declarados.
- **Los pliegos de las cinco estaciones son criterios de proyecto, no clases exigidas por ninguna norma.** La ISO 8573-1 define las clases; quién necesita cuál lo decide el proyectista. El margen de 10 K del aire de instrumentación es **práctica ISA**, no requisito normativo, y se declara como tal.
- **El +7 % de energía por bar es una regla de mantenimiento, no una ley.** Aquí se aplica sobre la referencia de 7 bar y se **mide** el resultado: subir un bar la red del martillo cuesta un **6,58 %**, no un 7,00 %. El número redondo del curso y el número real del caso no coinciden, y eso es parte de la lección.
- **La concentración de sólidos NO cambia con el filtro en este modelo** — la clase sí. Se declara explícitamente para que nadie lea la celda de mg/m³ como una medida de la eficacia del filtro.
- **Los siete criterios se comprobaron contra el texto muerto:** se verifica que cada uno puede ser el **único** que suspende en propuestas reales del banco, no que exista en el código.
- **El bloqueo sónico no se esconde:** cuando `f ≥ 1` la propuesta se marca como bloqueada y suspende por presión, en lugar de devolver una caída sin sentido.
- **No se modela** la generación del aire (compresor, depósito, control de carga/vacío, **MEC-94** y **MEC-98**), la pérdida de carga de la red de distribución más allá de la caída fija de 0,25 bar, la saturación y regeneración reales del lecho de desecante, la vida y la colmatación de los elementos filtrantes con el tiempo, el drenaje automático de condensados, la corrosión de la tubería, la caída de temperatura a lo largo de la línea, la separación de aceite en el condensado y su tratamiento como residuo, ni la certificación de un aire alimentario según **ISO 8573-1 clase 1** con métodos de ensayo reales (**ISO 8573-2/-4/-5**, citadas).

---

## Molde y estructura

**Molde E+S** (ensamble 3D con *mode-lock* + banco 3D + pizarrón 1024×768 fuera de pantalla + panel de telemetría HTML), seis modos:

| Modo | Contenido |
|---|---|
| `ensamble` | Se monta el tren pieza por pieza —posenfriador, separador ciclónico, torre de filtros finos, secador, regulador con manómetro, lubricador y punto de uso—; hasta terminarlo no se abre ningún modo de análisis |
| `tren` | Cascada de aceite escalón a escalón con **aerosol y vapor en columnas separadas** y la clase C resultante, más la concentración de sólidos y su clase A; se elige clima y filtración |
| `agua` | Punto de rocío a presión contra el punto más frío de la línea, clase B, condensado del posenfriador y aviso de extrapolación de Magnus; se elige clima y secador |
| `presion` | Escalera de caídas construida hacia atrás, peldaño a peldaño, con el flujo conmutable; caída ISO 6358 de cada elemento, droop, lubricador, `pRed` contra el tope de 8,0 bar y `pUso` |
| `proyecto` | Malla de 5 filtraciones × 4 secadores × 2 lubricaciones × 3 cuerpos = 120 propuestas para la estación y el clima elegidos, con las válidas en verde y su coste y las inválidas con la letra del criterio que suspende **primero**; recuento de válidas y coste mínimo |
| `reto` | Estación sorteada; se proyectan filtración, secador, lubricación y cuerpo con **calificación cuádruple ortogonal**, y se exige válido **Y** de coste mínimo |

**Reto de calificación cuádruple ortogonal:** cada eje (`fino`, `sec`, `lub`, `tam`) se califica con los otros tres ya en su valor óptimo, de modo que el alumno sabe exactamente cuál ha fallado. La configuración de partida está mal en los **cuatro** ejes a la vez en las cinco escenas. Cumplir los siete criterios no basta: el veredicto exige además el coste mínimo — **49 · 66 · 70 · 86 · 78** unidades. **Candado de salida:** no se puede abandonar el modo `reto` hasta resolverlo.

**Recorrido guiado (`runAuto`):** monta el tren solo y narra en orden la cascada de aceite de Monterrey, el rocío contra la línea a la intemperie, la escalera de presiones del martillo con los dos cuerpos y el proyecto de instrumentación, dejando el laboratorio en el estado que acaba de contar y devolviendo el control al alumno.

---

## Verificación en dos capas

**Capa 1 — numérica:** `verif_frl.mjs`, **43 794 comprobaciones, 0 fallos**, en 16 secciones. Cubre la psicrometría de Magnus y su inversa, las entradas de los cinco climas, el condensado del posenfriador, la cascada de aceite escalón a escalón con sus pisos de retención, el agua y el punto de rocío en los cuatro secadores contra los cinco climas, la clase de sólidos y el suelo que impone la adsorción, la caída ISO 6358 con su bloqueo sónico, la escalera de presiones completa y la invariancia del punto de uso, la energía y el coste, los siete criterios de calificación uno a uno con su recuento de primeros fallos y de fallos únicos, el barrido de las 600 propuestas con sus 38 válidas, el barrido de las 25 combinaciones de estación × clima con la unicidad del óptimo, la ortogonalidad de los cuatro ejes del reto, el arranque equivocado en los cuatro ejes, el formato SI de todas las cifras y la coherencia interna del catálogo.

**Capa 2 — navegador:** Playwright contra `window.__labDebug` sobre servidor HTTP local. Estado estático (`pw_frl.mjs`, **247 comprobaciones**): *mode-lock* del ensamble, los seis modos, telemetría de los cuatro paneles, malla del proyecto con sus letras de criterio, quiz barajado y reto con su candado de salida. Recorrido guiado (`pw_frl_auto.mjs`, **26 comprobaciones**): `runAuto()` completo contrastando **cada cifra narrada** contra la que el motor calcula en ese instante y el estado final contra lo que acaba de contar. **Cero errores de consola** en ambos.

**Capa 3 — regresión del proyecto:** `npx tsc --noEmit` limpio y `npx jest` completo, con los *golden snapshots* actualizados en modo aditivo.

---

## Referencias

- **ISO 8573-1:2010** — Clases de pureza del aire comprimido. Las tres tablas del laboratorio salen de aquí: partículas sólidas (clase A), punto de rocío a presión y agua líquida (clase B) y aceite total, aerosol más vapor (clase C). **Criterio activo** en los siete de calificación.
- **ISO 8573-2, -4 y -5** — Métodos de ensayo de aerosol de aceite, partículas sólidas y aceite total (vapor incluido): **citadas**. El laboratorio calcula clases, no las certifica.
- **ISO 6358** — Determinación de las características de caudal de componentes neumáticos: conductancia sónica `C` y relación crítica de presiones `b`. De aquí sale **toda** la escalera de caídas y el bloqueo sónico. **Criterio activo.**
- **Magnus–Sonntag** — Presión de vapor de saturación sobre agua líquida, con su banda de validez declarada de **−45 a +60 °C** y aviso explícito de extrapolación.
- **Práctica ISA de aire de instrumentación** — Margen de **10 K** entre el punto de rocío a presión y la temperatura mínima de la línea. **Criterio activo** en una estación, declarado como práctica y no como norma.
- **ISO 1219-1** — Símbolos del tren de tratamiento: filtro con drenaje, regulador con manómetro y lubricador. **Citada.**
- **ISO 4414** — Reglas generales de los sistemas neumáticos: **citada**; la seguridad del mando se trata en **MEC-95** a **MEC-98**.
- **Valores nominales de catálogo con rango declarado** — eficacias 0,60 / 0,98 / 0,999, pisos de retención 1,00 / 0,10 / 0,01 / 0,003 mg/m³, puntos de rocío +3 / −20 / −40 °C, purgas 15 % y 18 %, conductancias 2,4 a 7,0 dm³/(s·bar), factores de cuerpo ×1,90 y ×3,20.
- **Verificación numérica propia** — 43 794 comprobaciones, barrido de 600 propuestas, 38 válidas, 25 combinaciones de estación × clima con óptimo único.
- **Relación con MEC-93 a MEC-100** — aquéllos dan por supuesto que el aire llega limpio, seco y a la presión pedida. Éste construye ese supuesto y le pone precio: cuánto cuesta la clase que el actuador necesita, y cuál de los tres números del `[A:B:C]` decide realmente el proyecto.
