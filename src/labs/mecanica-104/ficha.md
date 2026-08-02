# MEC-104 · Controla cargas negativas con válvula de contrabalance

- **Dominio:** D4 · Hidráulica y Neumática
- **Práctica del backlog:** d4-12 — *Controla cargas negativas con válvula de contrabalance* (molde S)
- **Simulador:** `/labs/valvula-contrabalance-cargas-negativas.html`
- **Slug:** `valvula-contrabalance-cargas-negativas`
- **Fuentes normativas de referencia:** ISO 4413 · ISO 1219-1 · ISO 6020-2 · ISO 3448 · ASTM D341 · Routh–Hurwitz

---

## Qué enseña

1. Que una carga negativa **ya presurizó el circuito** antes de arrancar la bomba: `p_ind = 10·F/A_res` vale **55,4 bar** en la pluma (68,0 kN sobre 12 272 mm²).
2. Que la presión inducida **no mide el tamaño de la máquina** sino la carga dividida por el área: el cabrestante mueve 22,0 kN —tres veces menos que la pluma— e induce **138,2 bar** porque su área equivalente es de 1 592 mm².
3. Que el criterio de sujeción `tarado ≥ 1,3·p_ind` convierte esas presiones en tarados mínimos de **72,0 · 62,9 · 61,4 · 64,8 y 179,7 bar**, y que por eso la pluma **no** se puede tarar a 70 aunque falten sólo dos.
4. Que toda la física del carrete cabe en una línea: **`p_res + R·p_mot = tarado + f_bp·p_Bp + Δp_ov`**, y que lo demás es despejarla.
5. Que `f_bp` **no es una constante**: es una propiedad del **drenaje del muelle** — `1 + R` interno, `1` balanceado, `0` ventilado a tanque.
6. Que por eso los **6 bar** de contrapresión de retorno de la pluma pesan **15,0 bar** con 1,5:1 y **66,0 bar** con 10:1, y ventilar el muelle los borra de la ecuación.
7. Que subir la relación de pilotaje **abarata la válvula y baja el pilotaje** (33,5 → 11,6 bar) y a cambio **se lleva la estabilidad** (ME 1,63 → 0,24 con manguera corta).
8. Que **bajar una carga no cuesta energía: la regala**. En la pluma la bomba pone 1,68 kW, la carga que cae pone 4,04 y la contrabalance quema **5,71 kW**.
9. Que ese calor es la **función** de la válvula, no su defecto, y se paga en kWh reales: **5 142 · 4 680 · 2 284 · 5 803 · 7 342 kWh/año**.
10. Que la contrabalance es un **lazo cerrado** y Routh–Hurwitz sobre el modelo linealizado con β = 1,4 GPa se reduce a **`R·A_mot·V_res < A_res·V_mot`**.
11. Que en esa desigualdad **no aparecen ni la masa de la carga ni la ganancia del carrete**, y el laboratorio lo demuestra moviéndolas sin que las raíces crucen (**0 discrepancias en 675 combinaciones**).
12. Que las raíces de la pluma con manguera corta van de **−0,48 ± 94,47i** a **+3,81 ± 94,84i** con la frecuencia clavada en **15,04…15,09 Hz**: lo que R mueve es el amortiguamiento, no el tono.
13. Que como `V_res` lo fija el **montaje**, el mismo hardware pasa de inestable a estable cambiándolo de sitio: cabrestante a 4,5:1, **ME 0,61 en el bloque y 1,39 abridado**.
14. Que el **tarado también cierra el asiento**, con una década de fuga por cada 0,2 de la relación `p_ind/tarado`, corregida por la viscosidad real.
15. Que la prensa, a **65 °C** (aceite **2,687 veces** menos viscoso que a 40) y con el útil en contacto, deriva **0,349 mm** en 10 min con 70 bar contra 0,30 de tolerancia: la única estación que **suspende la fuga en solitario**.
16. Que cuando la cámara resistente es la corona la contrabalance **intensifica**: en la prensa (φ = 1,457) tarar a 280 bar lleva la corona a **170,8 bar** sobre 160 admisibles.
17. Que de **1 125 configuraciones sólo 61** cumplen los seis criterios, y en la plataforma de tijera —con personas a bordo— sobrevive **UNA de 225**.
18. Que el criterio de apertura **no puede fallar él solo**, y eso es un **teorema** del catálogo, no una casualidad del barrido.

---

## Lógica (verificada en `scratchpad/motor_contrabalance.mjs`, 28 829 comprobaciones, 0 fallos)

### Constantes selladas

| Constante | Valor | Origen / significado |
|---|---|---|
| `BETA` | 1,4·10⁹ Pa | Módulo volumétrico efectivo del aceite mineral (rango 1,2–1,8 GPa) |
| `OV_NOM` / `Q_NOM` | 12 bar / 60 L/min | Sobrepresión de apertura a caudal nominal: `Δp_ov = 12·(q_res/60)` |
| `QF_REF` | 0,30 cm³/min | Fuga del asiento al 80 % del tarado y 40 °C |
| `KF` | ln 10 / 0,2 = 11,5129 | Una **década** de fuga por cada 0,2 de la relación `p_ind/tarado` |
| `T_FUGA_REF` | 40 °C | Temperatura del dato de catálogo de fuga |
| `K_SUJ` | 1,3 | Tarado mínimo = 1,3 × presión inducida (criterio de proyecto) |
| `MARG_AB` | 10 bar | Margen entre la presión de pilotaje y el tarado del grupo |
| `ME_MIN` | 1,15 | Margen exigido sobre la frontera de Routh |
| `D_RES` | 12 mm | Diámetro interior de la línea actuador-contrabalance |
| `ACEITE` | ν₄₀ = 46, ν₁₀₀ = 6,8, ρ₁₅ = 875 | ISO VG 46 (ISO 3448) |
| `WAL_A`, `WAL_B`, `WAL_C` | ajustados a los dos puntos · 0,7 | Walther / ASTM D341 |
| Banda de validez | −20 a 120 °C | Fuera de ella `extrapola(T)` marca la cifra como extrapolada |

### Reglas del motor

| Regla | Expresión |
|---|---|
| Viscosidad | `log₁₀log₁₀(ν + 0,7) = A − B·log₁₀(T_K)` |
| Presión inducida | `p_ind = 10·F/A_res` |
| Área equivalente de un motor | `A = D·i/(2π·r)` → cabrestante **1 592 mm²** |
| Factor de contrapresión | `f_bp = 1 + R` (int) · `1` (bal) · `0` (vent) |
| Presión efectiva | `p_eff = tarado + f_bp·p_Bp + Δp_ov` |
| Equilibrio del carrete | `p_res + R·p_mot = p_eff` |
| Presión de pilotaje | `p_mot = (p_eff − p_ind)·A_res/(A_mot + R·A_res)` |
| Presión resistente | `p_res = p_mot·A_mot/A_res + p_ind` |
| Calor | `P = q_b·p_mot/600 + F·v·10⁻⁶` (kW) |
| Identidad de energía | `q_b·p_mot/600 + F·v·10⁻⁶ ≡ q_res·p_res/600` |
| Fuga del asiento | `q = 0,30·10^((p_ind/tarado − 0,8)/0,2) · μ(40)/μ(T)` cm³/min |
| Estabilidad (Routh) | `c₂c₁ − c₀ > 0` ⟺ `R·A_mot·V_res < A_res·V_mot` |
| Margen de estabilidad | `ME = (A_res·V_mot)/(R·A_mot·V_res) ≥ 1,15` |

**Volúmenes:** `V` de cada lado es la cámara del actuador **más** la manguera que le llega, `V = π·d²·L/4`. Los tres montajes valen **395,8 · 90,5 · 5,7 cm³** (3,5 · 0,8 · 0,05 m con Ø12), y son exactamente lo que se ve en la escena.

### Los seis criterios

| Criterio | Se cumple si | Falla en… | …y **falla EL SOLO** |
|---|---|---|---|
| `okSujecion` Sujeción | `tarado ≥ 1,3·p_ind` | 180 / 1 125 | **9** |
| `okFuga` Fuga | deriva en 10 min ≤ tolerancia de la estación | 180 | **6** |
| `okApertura` Apertura | `p_eff > p_ind`, `p_mot > 0` y `p_mot ≤ p_lím − 10` | 66 | **0** |
| `okPresion` Presión | `p_res ≤ p_max_cil` y `p_mot ≤ p_max_cil` | 12 | **3** |
| `okEstab` Estabilidad | `ME ≥ 1,15` | 900 | **503** |
| `okTermico` Térmico | calor ≤ capacidad de disipación | 333 | **86** |

**Teorema del catálogo:** `okApertura` **no puede fallar él solo**. Como `p_eff ≥ tarado ≥ 1,3·p_ind > p_ind`, si la válvula no abre es porque el tarado ya era insuficiente y `okSujecion` había fallado antes. Sus **66** fallos son todos del cabrestante con tarado por debajo del mínimo, con `p_mot` **negativo**, y siempre acompañados de sujeción y fuga.

---

## El catálogo del banco

### Cinco relaciones de pilotaje (eje 1)

| R | 1,5:1 | 3:1 | 4,5:1 | 8:1 | 10:1 |
|---|---|---|---|---|---|
| Coste | 14 | 11 | 10 | 9 | 9 |
| `p_mot` en la pluma (int, 105 bar) | 33,5 | 22,3 | 17,6 | 12,9 | 11,6 bar |
| `f_bp` con drenaje interno | 2,5 | 4 | 5,5 | 9 | 11 |
| ME de la pluma (manguera corta) | 1,63 | 0,81 | 0,54 | 0,31 | 0,24 |

**La relación alta abarata la válvula y paga el descuento en estabilidad.**

### Tres drenajes del muelle (eje 2) y tres montajes (eje 3)

| Drenaje | `f_bp` | Coste | | Montaje | Longitud | V manguera | Coste |
|---|---|---|---|---|---|---|---|
| Interno | `1 + R` | 0 | | Bloque de mando | 3,5 m | 395,8 cm³ | 0 |
| Balanceado | 1 | 3 | | Manguera corta | 0,8 m | 90,5 cm³ | 4 |
| Ventilado a tanque | 0 | 5 | | Abridada al actuador | 0,05 m | 5,7 cm³ | 7 |

### Tarados (eje 4)

**70 · 105 · 140 · 210 · 280 bar.** El tarado **no entra en el coste**: sólo el segundo criterio del orden puede separarlo, y sin embargo es lo que rompe el cilindro de la prensa.

**5 × 5 × 3 × 3 = 225 configuraciones por estación · 1 125 en el banco.**

### Cinco estaciones

| Estación | Actuador | Cámara motriz | F (kN) | masa | Q_b | p_Bp | T | p_max_cil | P_dis | h/año | tol. deriva |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Pluma de grúa articulada | Ø125/Ø70 · 700 mm | anular (tira por la corona) | 68,0 | 6 900 kg | 30 L/min | 6 bar | 45 °C | 250 bar | 6,0 kW | 900 | 4,0 mm |
| Plataforma de tijera | Ø100/Ø56 · 800 | anular | 38,0 | 3 900 | 24 | 10 | 40 | 250 | 3,5 | 1 400 | 8,0 |
| Caja basculante de volquete | Ø160/Ø110 · 1 200 | anular | 95,0 | 9 700 | 40 | 12 | 50 | 250 | 8,0 | 300 | 20,0 |
| Prensa vertical | Ø125/Ø70 · 400 | **pistón** (φ = 1,457) | 42,0 | 4 300 | 20 | 5 | **65** | **160** | 2,6 | 3 000 | **0,30** |
| Cabrestante | motor 250 cm³/rev · i = 10 · Ø500 | A_eq = 1 592 mm² | 22,0 | 2 250 | 20 | 15 | 45 | 210 | 7,5 | 1 200 | 15,0 |

### Los cinco óptimos (todos ÚNICOS bajo el orden declarado)

| Estación | Óptimo | Coste | Calor | kWh/año | ME | deriva | Válidas / 225 |
|---|---|---|---|---|---|---|---|
| Pluma | 1,5:1 · 105 bar · drenaje **interno** · bloque de mando | 14 | 5,71 kW | 5 142 | 1,52 | 0,013 mm | 9 |
| Tijera | 1,5:1 · 70 bar · muelle **VENTILADO** · **abridada** | 26 | 3,34 | 4 680 | 1,16 | 0,109 | **1** |
| Volquete | 1,5:1 · 70 bar · **balanceado** · bloque de mando | 17 | 7,61 | 2 284 | 1,28 | — | 6 |
| Prensa | 1,5:1 · 105 bar · interno · **manguera corta** | 18 | 1,93 | 5 803 | 1,25 | 0,023 | 12 |
| Cabrestante | 1,5:1 · **210 bar** · interno · bloque de mando | 14 | 6,12 | 7 342 | 1,83 | — | 33 |

**61 válidas sobre 1 125.** Orden lexicográfico declarado en pantalla: **coste del conjunto** (relación + drenaje + montaje) y, sólo a igualdad de coste, **menor calor**. Con ese orden el óptimo es único en las cinco (`empatesTot === 1`).

---

## Las seis tesis que hay que ver

### 1. La carga ya presurizó el circuito

| Estación | F (kN) | A_res (mm²) | `p_ind` | tarado mínimo |
|---|---|---|---|---|
| Pluma | 68,0 | 12 272 | **55,4 bar** | 72,0 |
| Tijera | 38,0 | 7 854 | 48,4 | 62,9 |
| Volquete | 95,0 | 20 106 | 47,2 | 61,4 |
| Prensa | 42,0 | 8 423 | 49,9 | 64,8 |
| Cabrestante | 22,0 | **1 592** | **138,2** | **179,7** |

Los 70 bar del catálogo se quedan a **dos bar** del mínimo de la pluma.

### 2. Seis bar que nadie mira cuestan sesenta y seis (pluma, `p_Bp` = 6 bar)

| Drenaje | `f_bp` con 1,5:1 | Muelle ve | `f_bp` con 10:1 | Muelle ve | `p_mot` a 10:1 |
|---|---|---|---|---|---|
| Interno | 2,5 | 15,0 bar | 11 | **66,0 bar** | 11,6 bar |
| Balanceado | 1 | 6,0 | 1 | 6,0 | — |
| Ventilado | 0 | **0** | 0 | **0** | **5,5 bar** |

El drenaje más barato (coste 0) es el que multiplica la contrapresión: **la decisión no es obvia**.

### 3. Bajar una carga la regala (kW, identidad verificada en 1 059 puntos con `p_mot > 0`)

| Estación | Bomba | + Carga que cae | = Calor | P_dis |
|---|---|---|---|---|
| Pluma | 1,68 | **4,04** | 5,71 | 6,0 |
| Tijera | 0,52 | 2,82 | 3,34 | 3,5 |
| Volquete | 1,64 | **5,97** | 7,61 | 8,0 |
| Prensa | 0,79 | 1,14 | 1,93 | 2,6 |
| Cabrestante | 1,51 | 4,61 | 6,12 | 7,5 |

La pluma cabe con 5,71 sobre 6,0; **tarada a 140 en vez de 105 generaría 6,51 y ya no cabría.**

### 4. Las raíces cruzan sin cambiar de tono (pluma, manguera corta)

| R | Raíces | Frecuencia | ME |
|---|---|---|---|
| 1,5:1 | −2,23 · **−0,48** ± 94,47i | 15,04 Hz | 1,63 |
| 3:1 | −3,76 · **+0,29** ± 94,49i | 15,04 Hz | 0,81 |
| 10:1 | **+3,81** ± 94,84i | 15,09 Hz | 0,24 |

**La parte imaginaria apenas se mueve y la real cruza.** Por eso todas las contrabalances inestables suenan igual.

### 5. El mismo hardware, otro sitio (relación crítica por estación y montaje)

| Estación | Bloque (3,5 m) | Corta (0,8 m) | Brida (0,05 m) |
|---|---|---|---|
| Pluma | 2,28 | 2,44 | 2,49 |
| Tijera | 1,55 | 1,70 | 1,74 |
| Volquete | 1,92 | 1,97 | 1,99 |
| Prensa | 1,61 | 1,88 | 1,98 |
| Cabrestante | **2,74** | 4,89 | **6,24** |

Cabrestante a 4,5:1: **ME 0,61 en el bloque → 1,39 abridado**, sin tocar la válvula.

### 6. El tarado es gratis y sin embargo rompe el cilindro (prensa, φ = 1,457, límite 160 bar)

| Tarado | 70 | 105 | 140 | 210 | 280 |
|---|---|---|---|---|---|
| `p_res` en la corona | 67,3 | 84,5 | 101,8 | 136,3 | **170,8 bar** |
| Deriva en 10 min | **0,349 mm** | 0,023 | — | — | — |

Con 70 bar la sujeción **pasa** (hacen falta 64,8) y lo que suspende es la **fuga**, contra una tolerancia de 0,30 mm. Con 280 bar la fuga es despreciable y lo que revienta es el **cilindro**.

---

## Anclas de honestidad

- El criterio de apertura **no puede fallar él solo** y el laboratorio lo dice como **teorema demostrado de las desigualdades**, no como observación del barrido. De los seis criterios, cinco tienen fallos en solitario y ése tiene exactamente **cero**.
- Se distingue una válvula que **fuga** de una válvula **ABIERTA**: por encima del 100 % del tarado el asiento no gotea, está abierto, y el modelo lo marca en vez de extrapolar la exponencial. El cabrestante a 70 y 105 bar (con `p_ind` = 138,2) está en ese caso.
- El modelo de estabilidad es **linealizado** y con caudal de bomba constante: dice si el lazo converge o diverge y a qué frecuencia, **no la amplitud del ciclo límite**. El temblor de la escena se declara **ilustrativo** en pantalla.
- El margen de sujeción del **30 %**, los **10 bar** de margen de apertura y el **ME ≥ 1,15** son **criterios de proyecto de este banco**, no límites normativos, y así se declaran.
- Los coeficientes de fuga y de sobrepresión de apertura, la ganancia del carrete, los volúmenes de manguera y el campo «coste» son **valores representativos**, no constantes medidas de un modelo comercial. El «coste» es un orden de complejidad, no un precio.
- La deriva calculada es **sólo la que pasa por el asiento de la contrabalance**: no incluye la fuga externa por el vástago ni la interna del actuador, que en una máquina con horas suele ser mayor.
- El **rozamiento de las juntas se omite**, lo que hace que el tarado mínimo teórico sea **ligeramente conservador** respecto de una máquina real — y se dice.
- El orden de decisión se **declara en pantalla antes** de pedir el óptimo: en una máquina real lo fija el pliego; lo que no vale es dejarlo implícito.

---

## Molde y estructura

Molde **S** (simulador de cinco modos, sin ensamble). Cinco modos con cámara propia:

| Modo | Qué se manipula |
|---|---|
| Presión inducida | Estación y tarado, con la máquina parada: `p_ind`, tarado mínimo, fuga y deriva |
| Descenso | Estación, relación, tarado y drenaje: punto de trabajo, reparto bomba/carga, intensificación |
| Pilotaje | El equilibrio del carrete término a término, con `f_bp` y el margen hasta el límite |
| Estabilidad | Lugar de las raíces, los dos lados de la desigualdad de Routh, ME y relación crítica |
| Reto | Los cuatro ejes, calificados por separado, con pista |

La contrabalance **viaja con el montaje**: al cambiarlo la válvula se desplaza por la escena y las conducciones se vuelven a trazar. **La manguera que se ve es la que se está contando como `V_res`.**

El **reto** arranca en la configuración que difiere del óptimo en los **cuatro** ejes (`startCfg`), califica cada eje con los otros tres ya en su óptimo (`okEje` / `ejeSol`), acepta empates legítimos, y sólo da por resuelto cuando la configuración es válida **y** de coste mínimo. Cada pista destapa **un** eje y se agotan en cuatro; **destapar los cuatro no equivale a acertar**, porque la pista no toca la configuración montada.

---

## Verificación en dos capas

| Capa | Qué comprueba | Script | Resultado |
|---|---|---|---|
| **Capa 1 · Numérica** | Walther y su reversibilidad en los dos puntos del VG 46, monotonía de ν con T, áreas de las cinco estaciones y área equivalente del motor, equilibrio del carrete en las 1 125 configuraciones, identidad de energía en todos los puntos válidos, equivalencia entre el discriminante de Routh y la desigualdad de áreas y volúmenes (**0 discrepancias en 675 combinaciones**, moviendo masa y ganancia), signo de las raíces frente al ME, monotonía de la fuga con tarado y temperatura, unicidad del óptimo | `scratchpad/motor_contrabalance.mjs` + `ver_contrabalance.mjs` | **28 829 / 28 829**, 0 fallos |
| **Capa 2 · Navegador real** | Carga limpia, aceite de Walther, presión inducida, punto de trabajo y equilibrio del carrete, contrapresión, identidad de energía sobre todo el espacio, Routh ↔ ME y raíces, fuga y deriva, barrido/criterios/óptimos, intensificación de la prensa, los cinco modos con su telemetría y selectores, quiz, reto de cuatro ejes, sorteo y pista, animación, visita guiada e inspección de piezas | `scratchpad/pw_contrabalance.mjs` (Playwright) | **157 / 157**, 0 fallos |

El bloque MOTOR del cuerpo del laboratorio está pegado **verbatim** desde el verificador numérico, sin más cambio que quitar la palabra `export`. Si hay que cambiar física, se cambia en el verificador y se vuelve a pegar.

---

## Referencias

1. **ISO 4413** — *Hydraulic fluid power — General rules and safety requirements for systems and their components.* Para toda carga suspendida o que pueda desplazarse por gravedad exige medios que impidan su caída ante un fallo de la conducción, y justificar la selección frente a las condiciones reales de servicio.
2. **ISO 1219-1** — *Fluid power systems and components — Graphic symbols and circuit diagrams.* Contrabalance como limitadora pilotada con su línea de pilotaje discontinua, su antirretorno en paralelo y las tres variantes de drenaje según dónde se conecta la cámara del muelle.
3. **ISO 6020-2** — *Hydraulic fluid power — Mounting dimensions for single rod cylinders, 16 MPa (160 bar) series — Compact series.* De ella salen Ø125/Ø70, Ø100/Ø56 y Ø160/Ø110.
4. **ISO 3448** — *Industrial liquid lubricants — ISO viscosity classification.* Grado VG 46 (41,4–50,6 mm²/s a 40 °C) y sus dos puntos de ajuste.
5. **ASTM D341** — *Viscosity-Temperature Charts for Liquid Petroleum Products* (ecuación de Walther), con su banda declarada de −20 a 120 °C.
6. **Criterio de Routh–Hurwitz** aplicado al polinomio característico de tercer grado del lazo contrabalance-actuador-carga, con la compresibilidad del aceite como rigidez. `c₂c₁ − c₀ > 0` se reduce a `R·A_mot·V_res < A_res·V_mot`: resultado clásico de la literatura de control hidráulico y razón por la que los manuales recomiendan montar la válvula sobre el actuador y evitar relaciones altas con mangueras largas.
7. **Módulo de compresibilidad efectivo** β = 1,4 GPa, típico del mineral sin aire arrastrado en conducción rígida (rango 1,2–1,8 GPa). Es el resorte del lazo, y de él salen los 15,04–15,09 Hz calculados.
8. **Criterios de proyecto de fabricante** (Sun Hydraulics, Bosch Rexroth, Eaton/Vickers): tarar entre un 25 y un 40 % por encima de la presión inducida, elegir la relación de pilotaje más baja que permita el circuito, preferir drenaje ventilado o balanceado con contrapresión apreciable y montar la válvula lo más cerca posible del actuador. Los valores concretos del banco (30 %, 10 bar, 1,15) son criterios de proyecto, no normativos.
