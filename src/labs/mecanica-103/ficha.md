# MEC-103 · Ajusta válvulas limitadoras y reguladoras de caudal

- **Dominio:** D4 · Hidráulica y Neumática
- **Práctica del backlog:** d4-11 — *Ajusta válvulas limitadoras y reguladoras de caudal* (molde S)
- **Simulador:** `/labs/valvulas-limitadora-reguladora-caudal.html`
- **Slug:** `valvulas-limitadora-reguladora-caudal`
- **Fuentes normativas de referencia:** ISO 4413 · ISO 1219-1 · ISO 3448 · ASTM D341 · ISO 4409 · ISO 5598 · Merritt (1967) cap. 3

---

## Qué enseña

1. Que la ecuación del orificio `Q = C_d·A·√(2Δp/ρ)` es exacta en su álgebra: subiendo Δp de 20 a 80 bar el caudal se multiplica **exactamente por 2,000**.
2. Que el coeficiente de descarga que lleva dentro **no es una constante**: se calcula con el número de transición de Merritt `λ = (d_h/ν)·√(2Δp/ρ)` y depende por tanto de la viscosidad, o sea de la temperatura.
3. Que por eso una válvula de **aguja** a 2,4 mm² y 8 bar pasa de `C_d` 0,0886 a 0,6149 entre 4 y 58 °C, y su caudal sube un **606,4 %** sin que nadie toque el tornillo.
4. Que una válvula de **canto vivo**, con el mismo aceite y el mismo recorrido, se mueve un **3,5 %**: es la geometría del orificio la que decide si la máquina se va con el termómetro.
5. Que **meter-in no sujeta una carga que arrastra**: en el descenso de plataforma la cámara motriz cae a −32,1 bar, cavita y el actuador se desboca.
6. Que eso **no se arregla ajustando**: las seis áreas del catálogo, de 0,3 a 9,6 mm², se desbocan igual.
7. Que **meter-out sí la sujeta**, con contrapresión: 81,8 bar sobre 5 027 mm² son 41 138 N frente a una carga de 12 000 N.
8. Que la misma contrapresión **intensifica** la presión en la relación de áreas, y en un cilindro de φ = 2,82 el pico llega a 183,9 bar sobre 160 admisibles: la regla «meter-out siempre» es falsa.
9. Que una reguladora simple entrega un caudal **que depende de la carga**, porque la carga fija la presión y la presión fija el caudal (58,6 % de regulación en la prensa).
10. Que abrir el estrangulador baja la regulación **rompiendo la velocidad** (6,1 % pero 28,4 mm/s con 14 pedidos): los criterios se pelean entre sí.
11. Que el **compensador de presión** cumple los dos a la vez —0,0 % y 15,25 mm/s— porque mantiene Δp = 8 bar constantes en el estrangulador.
12. Que el compensador **se satura** cuando la presión disponible baja de Δp + 2 bar: abierto a 9,6 mm² deja de compensar y la regulación vuelve al 6,2 %.
13. Que **compensar presión no es compensar temperatura**: en el cabezal de intemperie la compensada de presión deriva un 113,9 % —peor que la aguja— manteniendo escrupulosamente sus 8,00 bar en los dos extremos.
14. Que el **sangrado** no controla con precisión pero es el único que no tira todo el caudal de la bomba: 705 kWh/año frente a 9 241 con la misma válvula en meter-in.
15. Que el **tarado de la limitadora** fija el techo de presión de toda la máquina, y tiene una ventana por los dos lados: margen mínimo de 10 bar sobre la presión de trabajo y máximo de 90.
16. Que de **1 080 configuraciones sólo 6** cumplen los seis criterios a la vez, y que en cuatro de las cinco estaciones hay **una sola**.

---

## Lógica (verificada en `scratchpad/motor_regcaudal.mjs`, 247 251 comprobaciones, 0 fallos)

### Constantes selladas

| Constante | Valor | Origen / significado |
|---|---|---|
| `CD_INF` | 0,62 | C_d asintótico de un orificio de canto vivo en régimen turbulento |
| `DP_COMP` | 8 bar | Caída que mantiene la balanza de una compensada (valor típico de catálogo) |
| `DP_COMP_MIN` | 2 bar | Margen por debajo del cual la balanza se abre del todo y **satura** |
| `OVR_LIM` | 0,06 | Sobrepresión de la limitadora pilotada sobre su tarado |
| `P_CAV` | 0,30 bar | Presión motriz por debajo de la cual se declara cavitación |
| `MARG_LIM` / `MARG_MAX` | 10 / 90 bar | Ventana admisible del tarado sobre la presión de trabajo |
| `K_FUGA` | 2,4·10⁻⁴ | Fuga de la bomba, `Q = K·p/μ` |
| `ALFA_RHO`, `T_REF_RHO` | 6,5·10⁻⁴, 15 °C | Dilatación del aceite, `ρ(T) = ρ₁₅·(1 − α·(T − 15))` |
| `ACEITE` | ν₄₀ = 46, ν₁₀₀ = 6,8, ρ₁₅ = 875 | ISO VG 46 (ISO 3448) |
| `WAL_A`, `WAL_B`, `WAL_C` | 9,417993 · 3,684441 · 0,7 | Walther / ASTM D341, ajustados a los dos puntos normalizados |
| Banda de validez | −20 a 120 °C | Fuera de ella `extrapola(T)` marca la cifra como extrapolada |
| `BIS_IT` | 120 | Iteraciones de bisección de cada equilibrio |

### Reglas del motor

| Regla | Expresión |
|---|---|
| Viscosidad | `log₁₀log₁₀(ν + 0,7) = A − B·log₁₀(T_K)` |
| Número de transición | `λ = (d_h/ν)·√(2Δp/ρ)`, con `d_h = √(4A/π)` |
| Coeficiente de descarga | `C_d = 0,62·tanh(2λ/λ_c)`; la compensada de p+T devuelve 0,62 fijo |
| Caudal por el estrangulador | `Q = C_d·A·√(2Δp/ρ)` |
| Compensación | si `Δp_disp ≥ 8 + 2` → `Δp = 8`; si no, `Δp = Δp_disp` y **satura** |
| Presión de la limitadora | `p_full = tarado·(1 + 0,06)` → **84,8 / 148,4 / 222,6 bar** |
| Fuga de la bomba | `Q_fuga = K_FUGA·p/μ(T)` |
| Intensificación | `p_res = (p_mot·A_mot − 10·F)/A_res` en meter-out |
| Calor | `P_calor = P_bomba − P_útil`, con `P_bomba = Q_b·p_b/600` |
| Regulación | `(v_max − v_min)/v_med` entre carga mínima y máxima |
| Deriva térmica | `|v(T_cal) − v(T_frío)|/v_med` |

Cada punto de trabajo se resuelve por **bisección sobre el equilibrio simultáneo de caudal y fuerzas**, contemplando explícitamente tres desenlaces que no son «la fórmula»: que la limitadora quede **cerrada**, que la bomba se **cale** contra el tope mecánico (`calado()`), y que en sangrado la presión de bomba la fije **la carga** y no la limitadora.

### Los seis criterios

| Criterio | Se cumple si | Falla en… | …y **falla EL SOLO** |
|---|---|---|---|
| `okVel` Velocidad | \|v − v_obj\|/v_obj ≤ tol | 1 042 / 1 080 | **123** |
| `okReg` Regulación con la carga | reg ≤ tol_reg | 322 | **3** |
| `okCarga` Sujeción de la carga | no cavita y no queda seco | 422 | **1** |
| `okPresion` Presión | p_full ∈ [p_trab+10, p_trab+90] y p_pico ≤ p_max_cil | 749 | **2** |
| `okTermico` Térmico | calor ≤ P_dis | 290 | **1** |
| `okTemp` Deriva térmica | deriva ≤ tol_term | 464 | **3** |

Ninguno de los seis es texto muerto: los seis pueden ser la **única** razón por la que una configuración se cae.

---

## El catálogo del banco

### Cuatro reguladoras (eje 1)

| Clave | Rótulo | λ_c | Compensa p | Compensa T | Coste |
|---|---|---|---|---|---|
| `agu` | Aguja | 2 500 | no | no | 4 |
| `dia` | Canto vivo (diafragma) | 150 | no | no | 7 |
| `comp` | Compensada de presión | 2 500 | sí | no | 18 |
| `term` | Compensada de presión y temperatura | 2 500 | sí | sí | 27 |

### Tres topologías (eje 2)

| Clave | Rótulo | Coste | Qué decide |
|---|---|---|---|
| `in` | Meter-in · estrangula a la entrada | 3 | Simple; no sujeta cargas que arrastran |
| `out` | Meter-out · estrangula a la salida | 3 | Sujeta con contrapresión; **intensifica** |
| `sang` | Sangrado · deriva a tanque | 1 | Poco preciso; el único que no tira todo el caudal |

### Áreas y tarados (ejes 3 y 4)

- **Áreas:** 0,3 · 0,6 · 1,2 · 2,4 · 4,8 · 9,6 mm² (razón 2)
- **Tarados:** 80 · 140 · 210 bar → presión plena 84,8 · 148,4 · 222,6 bar

**4 × 3 × 6 × 3 = 216 configuraciones por estación · 1 080 en el banco.**

### Cinco estaciones

| Estación | Cilindro | Cámara | Carga (N) | v_obj | T_frío…T_cal | Q_b | p_max_cil | P_dis | h/año | p_trab |
|---|---|---|---|---|---|---|---|---|---|---|
| Sierra de cinta | 50/28 | empuje | 5 900…6 600 | 22 mm/s | 18…46 °C | 12 L/min | 250 bar | 1,8 kW | 2 200 | 33,8 bar |
| Descenso de plataforma | 80/45 | tiro | −14 200…−9 800 | 40 mm/s | 15…44 °C | 16 | 250 | 3,0 | 1 500 | 1,1 |
| Prensa de conformado | 100/56 | empuje | 9 000…128 000 | 14 mm/s | 36…40 °C | 14 | 250 | 5,4 | 3 500 | 163,4 |
| Cabezal forestal a la intemperie | 56/45 | empuje | 20 500…23 500 | 26 mm/s | 4…58 °C | 15 | **160** | 3,4 | 1 800 | 95,5 |
| Transfer de alimentación | 40/22 | empuje | 2 100…2 600 | **120 mm/s** | 22…40 °C | 12 | 250 | 0,55 | **6 000** | 21,2 |

### Los cinco óptimos (todos ÚNICOS)

| Estación | Óptimo | Coste | v | reg | deriva | kWh/año | Válidas / 216 |
|---|---|---|---|---|---|---|---|
| Sierra | canto vivo · meter-in · 0,6 mm² · 80 bar | 10 | 20,99 mm/s | 3,4 % | 0,9 % | 3 454 | **2** |
| Elevador | canto vivo · **meter-out** · 2,4 mm² · 80 bar | 10 | 40,52 | 5,4 % | 0,9 % | 4 278 | **1** |
| Prensa | **compensada de p** · meter-in · 4,8 mm² · 210 bar | 21 | 15,25 | 0,0 % | 4,6 % | 17 699 | **1** |
| Intemperie | **compensada de p+T** · meter-in · 2,4 mm² · 140 bar | 30 | 26,00 | 0,0 % | 1,8 % | 5 719 | **1** |
| Transfer | canto vivo · **sangrado** · 1,2 mm² · 80 bar | 8 | 118,70 | 3,7 % | 1,0 % | **705** | **1** |

**6 válidas sobre 1 080.** El desempate del óptimo es coste y, a igual coste, calor.

---

## Las cinco tesis que hay que ver

### 1. El C_d se mueve; la raíz no

| T (°C) | ν (mm²/s) | ρ (kg/m³) | C_d aguja | C_d canto vivo | Q aguja | Q canto vivo |
|---|---|---|---|---|---|---|
| 4 | 414,16 | 881,3 | 0,0886 | 0,6098 | 0,544 L/min | 3,742 L/min |
| 20 | 133,84 | 872,2 | 0,2603 | 0,6200 | — | — |
| 40 | 46,00 | 860,8 | 0,5360 | 0,6200 | — | — |
| 58 | 22,14 | 850,5 | 0,6149 | 0,6200 | 3,840 | 3,872 |
| 80 | 11,10 | 838,0 | — | — | — | — |

**Aguja +606,4 % · canto vivo +3,5 %.** Y con la válvula fija, Δp de 20 → 80 bar da un cociente de caudal de **2,000** exactos.

### 2. La carga que arrastra (elevador, −12 000 N)

| Topología | v | p_mot | p_res | ¿Se desboca? | Fallos |
|---|---|---|---|---|---|
| Meter-in 2,4 mm² | 71,32 mm/s | **−32,1 bar** | — | **sí** | varios |
| Meter-out 2,4 mm² | 40,52 mm/s | 84,8 bar | **81,8 bar** | no | **ninguno** |

Las **seis** áreas se desbocan en meter-in. La contrapresión son 41 138 N frenando 12 000 N de carga.

### 3. Intensificación (intemperie, φ = 2,82, p_max_cil = 160 bar)

| Topología | Pico | Veredicto |
|---|---|---|
| Meter-out 2,4 mm² · 140 bar | **183,9 bar** | falla `okVel`, `okPresion` |
| Meter-in 2,4 mm² · 140 bar | 148,4 bar | dentro |

### 4. El compensador y su saturación (prensa, 9 000…128 000 N)

| Válvula / área | Regulación | v | Fallos |
|---|---|---|---|
| Canto vivo 1,2 mm² | **58,6 %** | — | reg |
| Canto vivo 4,8 mm² | 6,1 % | 28,4 mm/s | `okVel` |
| **Compensada 4,8 mm²** | **0,0 %** | **15,25 mm/s** | **ninguno** |
| Compensada 9,6 mm² | 6,2 % (**satura**) | 28,6 mm/s | varios |

Deriva térmica en el cabezal de intemperie: aguja **64,6 %** · canto vivo 1,8 % · compensada de p **113,9 %** · compensada de p+T **1,8 %**. La compensada de presión mantiene `Δp = 8,00 bar` en los **dos** extremos de temperatura y aun así deriva: está compensando la carga, no la viscosidad.

### 5. Dónde pones la válvula son 8 536 kWh/año (transfer, 6 000 h)

| Topología (misma válvula, misma área 1,2 mm²) | v | Calor | kWh/año | Fallos |
|---|---|---|---|---|
| Meter-in | 73,1 mm/s | 1,540 kW | 9 241 | `okVel`, `okTermico` |
| **Sangrado** | **118,7 mm/s** | **0,118 kW** | **705** | **ninguno** |

---

## Anclas de honestidad

- El **compensador satura** y el laboratorio lo enseña en vez de esconderlo: fuera de su margen de 2 bar deja de compensar y la regulación vuelve a subir.
- El **meter-in que falla el térmico del transfer falla también la velocidad** (73,1 mm/s contra 120 pedidos); la ficha lo dice explícitamente para que la prosa no sugiera que el térmico era el único piloto rojo.
- La compensada de presión **empeora** la deriva térmica respecto de la aguja en el cabezal de intemperie (113,9 % contra 64,6 %). Una válvula más cara no es mejor en todos los ejes.
- El **sangrado no es «lo bueno»**: gana en el transfer y pierde en las otras cuatro estaciones, porque no regula con precisión frente a la carga.
- La cifra de deriva se declara **extrapolada** cuando la temperatura sale de la banda −20…120 °C de la ASTM D341, en vez de devolver un número inventado.
- Las presiones negativas de la cámara motriz **se muestran tal cual** (−32,1 bar), porque son exactamente el diagnóstico: presión por debajo del vacío es que el actuador va más rápido de lo que la bomba puede alimentar.
- Los 8 bar de compensación y los 2 de margen se declaran **valores típicos de catálogo** (Bosch Rexroth, Parker), no valores normativos.

---

## Molde y estructura

Molde **S** (simulador de cinco modos, sin ensamble). Cinco modos con cámara propia:

| Modo | Botón | Qué se manipula |
|---|---|---|
| Banco de ensayo | `#m_banco` | Válvula, área, Δp y temperatura sobre un estrangulador aislado |
| Topología | `#m_topo` | Estación, meter-in/out/sangrado, válvula y área |
| Carga | `#m_carga` | Estación, válvula, tarado y área frente al rango de fuerza |
| Térmico | `#m_termico` | Estación, válvula, tarado y área frente al rango de temperatura |
| Reto | `#m_reto` | Los cuatro ejes, calificados por separado, con pistas |

El **reto** arranca en la configuración que difiere del óptimo en los **cuatro** ejes (`startCfg`), califica cada eje con los otros tres ya en su óptimo (`okEje` / `ejeSol`), acepta empates legítimos de coste, y sólo da por resuelto cuando la configuración es válida **y** de coste mínimo. Las pistas revelan un eje cada una y se agotan en cuatro.

---

## Verificación en dos capas

| Capa | Qué comprueba | Script | Resultado |
|---|---|---|---|
| **Capa 1 · Numérica** | Walther, ρ(T), C_d de Merritt, la raíz de la ecuación del orificio, los tres desenlaces del equilibrio, los seis criterios, el barrido de las 1 080, la unicidad de los cinco óptimos, `startCfg` y `ejeSol` | `scratchpad/motor_regcaudal.mjs` | **247 251 / 247 251**, 0 fallos |
| **Capa 2 · Navegador real** | Carga limpia, identidad del motor del navegador con el verificado, las cinco tesis, los cinco modos con su telemetría y controles, clics reales que cambian el estado, decimales con coma, el reto completo en las cinco estaciones, el quiz en los cinco modos, la visita guiada entera y la ausencia de mojibake, `undefined`, `NaN` y errores de consola | `scratchpad/pw_regcaudal.mjs` (Playwright) | **224 / 224**, 0 fallos |

El bloque MOTOR del cuerpo del laboratorio está pegado **verbatim** desde el verificador numérico, sin más cambio que quitar la palabra `export`. Si hay que cambiar física, se cambia en el verificador y se vuelve a pegar.

---

## Referencias

1. **ISO 4413** — *Hydraulic fluid power — General rules and safety requirements for systems and their components.* Marco que obliga a justificar la topología frente a las cargas reales, incluidas las que arrastran.
2. **ISO 1219-1** — *Fluid power systems and components — Graphic symbols and circuit diagrams.* Símbolos de reguladora simple, compensada de presión y compensada de presión y temperatura.
3. **Merritt, H. E.** — *Hydraulic Control Systems*, Wiley, 1967, cap. 3. Coeficiente de descarga en función del número de transición λ y frontera laminar-turbulenta de un orificio real.
4. **ISO 3448** — *Industrial liquid lubricants — ISO viscosity classification.* Grados VG con sus dos puntos de medida.
5. **ASTM D341** — *Viscosity-Temperature Charts for Liquid Petroleum Products* (ecuación de Walther), con su banda declarada de −20 a 120 °C.
6. **ISO 4409** — *Hydraulic fluid power — Positive-displacement pumps, motors and integral transmissions — Methods of testing and presenting basic steady state performance.* Método de medida de las curvas que aquí se calculan.
7. **ISO 5598** — *Fluid power systems and components — Vocabulary.* Términos meter-in, meter-out y sangrado.
8. **Catálogos de fabricante** (Bosch Rexroth, Parker) — caída de compensación nominal de 8 bar y margen mínimo de 2 bar por debajo del cual la balanza deja de compensar. Declarados como valores típicos, no normativos.
