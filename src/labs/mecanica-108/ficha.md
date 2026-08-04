# MEC-108 · Calcula pérdidas de carga y selecciona conducciones

- **Dominio:** D4 · Hidráulica y Neumática
- **Práctica del backlog:** d4-A2 — *Calcula pérdidas de carga y selecciona conducciones* (molde S)
- **Simulador:** `/labs/perdidas-carga-conducciones.html`
- **Slug:** `perdidas-carga-conducciones`
- **Ancla curricular:** UAX Fluidos
- **Fuentes de referencia:** Darcy (1857) · Weisbach (1845) · Reynolds (1883) · Colebrook–White (1939) · Moody (1944) · Swamee–Jain (1976) · Walther / ASTM D341 · Korteweg (1878) · Joukowsky (1900) · Barlow · ISO 3448 (grados de viscosidad) · ISO 4413

---

## Qué enseña

1. Que **la longitud que entra en Darcy–Weisbach no es la que mide la cinta**. Los accesorios se cuentan en diámetros, y en la aspiración con manguera de espiral DN38 el trazado directo recorre **1,80 m** reales pero arrastra **88 D → 3,353 m** equivalentes: el **65,1 %** de los 5,153 m que realmente pierden presión.
2. Que **acortar la tubería puede empeorarla**. El trazado compacto de esa misma aspiración baja la manguera a **1,44 m** —36 cm menos— y sube el conjunto a **15,461 m** equivalentes, **10,31 m más**, porque cambia dos codos por diez.
3. Que **la viscosidad manda sobre todo lo demás**. La línea larga de tubo 35×5 pierde **0,6018 bar a 50 °C** y **18,1492 bar a −5 °C**: exactamente **×30,2**, el mismo factor en que crece ν (**29,97 → 903,97 cSt**), porque en régimen laminar Δp es proporcional a la viscosidad y a nada más del fluido.
4. Que el **número de Reynolds decide la fórmula**, no el gusto del proyectista: `64/Re` por debajo de 2 000, Colebrook–White por encima de 4 000, y **una banda de transición entre ambos en la que la instalación no debe quedarse**, porque ahí el factor de fricción no es una función sino un intervalo (`0,02712` frente a `0,04758` en el caso de la línea de presión con tubo 22×2).
5. Que **el golpe de ariete es un criterio de selección, no un apéndice**. La celeridad de Korteweg vale **1 273 m/s** en tubo 22×2 —contra los **1 313 m/s** del aceite en un tubo infinitamente rígido— y se declara en **350** y **240 m/s** en manguera; por eso 1 m/s de cierre brusco levanta **11,07 bar** en el tubo y sólo **3,04** o **2,09 bar** en manguera.
6. Que **el tubo que aguanta la presión de trabajo puede no aguantar la instalación**. El 22×2 admite **223 bar** por Barlow con coeficiente 4 y la línea trabaja a 210: sobra. Pero a **3,930 m/s** el golpe añade **43,52 bar** y la suma, **253,5 bar**, lo tumba.
7. Que **la conducción barata sale cara**. En la línea de presión, el montaje más barato de comprar cuesta **192,00 €** y termina en **512,59 €** a cinco años; el óptimo cuesta **242,40 €** y cierra en **314,61 €**. Elegir por etiqueta sale un **63 % más caro**; elegir bien ahorra el **39 %** del coste de vida.
8. Que **el criterio que más monta no es el que se enseña**. De los 855 montajes, el **arranque en frío** invalida **108 él solo** —más de la mitad de los 192 que sobreviven—, mientras que la compatibilidad de presión invalida 162 pero **jamás en solitario**.

---

## Lógica (verificada en `scratchpad/verif_perd.mjs`, 99 388 comprobaciones, 0 fallos)

### Constantes selladas

| Símbolo | Valor | Qué es |
|---|---|---|
| `P_ATM` | 1,013 bar | Presión atmosférica de referencia |
| `RHO` | 870 kg/m³ | Densidad del aceite mineral ISO VG 46 |
| `K_OIL` | 1,5·10⁹ Pa | Módulo volumétrico del aceite |
| `E_ACERO` | 210·10⁹ Pa | Módulo de Young del acero |
| `G` | 9,81 m/s² | Gravedad |
| `NU40` / `NU100` | 46 / 6,8 cSt | Los dos anclajes del grado ISO VG 46 |
| `RE_LAM` / `RE_TURB` | 2 000 / 4 000 | Fronteras del régimen |
| `ETA_GRUPO` | 0,80 | Rendimiento bomba + motor eléctrico |
| `EUR_KWH` | 0,18 €/kWh | Precio de la energía |
| `ANIOS` | 5 | Horizonte del coste de propiedad |
| `C_COLECTOR` | 18 € | Sobrecoste por cada línea adicional (dos tes y racores) |
| `RM_ACERO` | 490·10⁶ Pa | Resistencia a la tracción del tubo E235 |
| `S_BARLOW` | 4 | Coeficiente de seguridad rotura/trabajo |
| `CEL_MANG` / `CEL_ESP` | 350 / 240 m/s | Celeridad declarada de manguera trenzada y de espiral |
| `LE_CODO`/`LE_TE`/`LE_VAL`/`LE_ENT`/`LE_SAL` | 30 / 20 / 8 / 20 / 40 D | Longitudes equivalentes, en diámetros |

### Viscosidad: Walther / ASTM D341 ajustada a los dos puntos del grado

`log₁₀(log₁₀(ν + 0,7)) = A − B·log₁₀(T)`, con `A` y `B` resueltos sobre (40 °C, 46 cSt) y (100 °C, 6,8 cSt).

| T (°C) | −5 | 5 | 20 | 40 | 50 | 55 | 100 |
|---|---|---|---|---|---|---|---|
| ν (cSt) | **903,97** | 382,47 | 133,84 | 46,00 | **29,97** | 24,71 | 6,80 |

> Los dos puntos de anclaje **no son datos inventados**: son la definición del grado (ISO 3448) y el índice de viscosidad ≈ 100 del aceite mineral. Todo lo demás es interpolación de Walther.

### Catálogo de conducciones (19 · valores de proyecto representativos, no de un modelo comercial)

| Clave | Referencia | Tipo | dᵢ (mm) | e (mm) | p_adm (bar) | ε (mm) | € / m | r_mín (mm) | c (m/s) | ¿vacío? |
|---|---|---|---|---|---|---|---|---|---|---|
| `t08` | Tubo de acero 8×1 | tubo | 6,0 | 1,0 | 306 | 0,015 | 5 | 20 | 1 286 | sí |
| `t10` | Tubo de acero 10×1,5 | tubo | 7,0 | 1,5 | 368 | 0,015 | 7 | 25 | 1 292 | sí |
| `t12` | Tubo de acero 12×1,5 | tubo | 9,0 | 1,5 | 306 | 0,015 | 9 | 30 | 1 286 | sí |
| `t15` | Tubo de acero 15×2 | tubo | 11,0 | 2,0 | 327 | 0,015 | 12 | 38 | 1 288 | sí |
| `t18` | Tubo de acero 18×2 | tubo | 14,0 | 2,0 | 272 | 0,015 | 15 | 45 | 1 281 | sí |
| `t22` | Tubo de acero 22×2 | tubo | 18,0 | 2,0 | 223 | 0,015 | 19 | 55 | 1 273 | sí |
| `t28` | Tubo de acero 28×2 | tubo | 24,0 | 2,0 | 175 | 0,015 | 25 | 70 | 1 260 | sí |
| `t35` | Tubo de acero 35×2,5 | tubo | 30,0 | 2,5 | 175 | 0,015 | 34 | 88 | 1 260 | sí |
| `t42` | Tubo de acero 42×3 | tubo | 36,0 | 3,0 | 175 | 0,015 | 46 | 105 | 1 260 | sí |
| `t28g` | Tubo de acero 28×4 | tubo | 20,0 | 4,0 | **350** | 0,015 | 38 | 70 | 1 290 | sí |
| `t35g` | Tubo de acero 35×5 | tubo | 25,0 | 5,0 | **350** | 0,015 | 52 | 88 | 1 290 | sí |
| `h06` | Manguera 2 trenzas DN6 | manguera | 6,4 | — | 400 | 0,030 | 11 | 100 | 350 | no |
| `h10` | Manguera 2 trenzas DN10 | manguera | 9,5 | — | 330 | 0,030 | 14 | 130 | 350 | no |
| `h12` | Manguera 2 trenzas DN12 | manguera | 12,7 | — | 275 | 0,030 | 17 | 180 | 350 | no |
| `h16` | Manguera 2 trenzas DN16 | manguera | 15,9 | — | 250 | 0,030 | 22 | 200 | 350 | no |
| `h20` | Manguera 2 trenzas DN20 | manguera | 19,0 | — | 215 | 0,030 | 28 | 240 | 350 | no |
| `h25` | Manguera 2 trenzas DN25 | manguera | 25,4 | — | 165 | 0,030 | 37 | 300 | 350 | no |
| `a38` | Manguera de espiral DN38 | espiral | 38,1 | — | 10 | 0,060 | 25 | 190 | 240 | sí |
| `a51` | Manguera de espiral DN51 | espiral | 50,8 | — | 10 | 0,060 | 33 | 250 | 240 | sí |

**Los tubos no se inventan la presión:** `p_adm = 2·e·Rm / (d_ext·S)` con `Rm` = 490 MPa y `S` = 4 (Barlow). Y su celeridad tampoco: `c = √((K/ρ)/(1 + K·dᵢ/(E·e)))` (Korteweg). De ahí sale el detalle que más desconcierta al alumno: **el 28×2 y el 28×4 tienen el mismo diámetro exterior y presiones admisibles de 175 y 350 bar**; el 35×2,5 y el 35×5, lo mismo. La pared es lo que manda, y se paga (25 € frente a 38 €; 34 € frente a 52 €).

**Las mangueras de espiral admiten 10 bar** en este banco: son de aspiración y retorno. Es el único tipo que, junto al tubo, **soporta vacío**; la manguera de dos trenzas colapsa y por eso no se admite en la aspiración.

### Trazados (3)

| Clave | f_L | Codos | Tes | Válvulas | r disponible (mm) | Montaje (€) |
|---|---|---|---|---|---|---|
| `directa` | 1,00 | 2 | 0 | 1 | 250 | 24 |
| `perimetral` | 1,45 | 6 | 1 | 1 | 400 | 38 |
| `compacta` | **0,80** | **10** | 2 | 1 | **90** | 52 |

> El compacto es **el más corto y el peor**: 20 % menos de tubería, cinco veces más codos y un radio de curvatura disponible de sólo 90 mm que ninguna manguera de este banco puede doblar.

### Las cinco faenas

| Clave | Faena | Q (L/min) | L (m) | T_rég | T_frío | p_trab | ¿vacío? | v_máx | Objetivo | Límite rég. | Límite frío | h/año |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `aspir` | Aspiración de la bomba | 60 | 1,8 | 50 °C | 5 °C | 0 bar | sí | 1,2 m/s | p_abs ≥ | 0,80 bar abs | 0,55 bar abs | 4 000 |
| `presion` | Línea de presión bomba–válvula | 60 | 4,2 | 50 °C | 5 °C | 210 bar | no | 6,0 m/s | Δp ≤ | 5,0 bar | 15,0 bar | 4 000 |
| `retorno` | Retorno al depósito | 90 | 6,5 | 55 °C | 5 °C | 8 bar | no | 3,0 m/s | Δp ≤ | 3,5 bar | 8,0 bar | 3 000 |
| `drenaje` | Drenaje de carcasa del motor | 6 | 9,0 | 55 °C | 5 °C | 2 bar | no | 3,0 m/s | Δp ≤ | 1,5 bar | 3,0 bar | 4 000 |
| `larga` | Línea larga a un actuador remoto | 45 | 26,0 | 50 °C | **−5 °C** | 180 bar | no | 6,0 m/s | Δp ≤ | 12,0 bar | 30,0 bar | 600 |

La aspiración tiene **entrada** (20 D) y una **columna** de 0,45 m que resta **0,0384 bar**; el retorno y el drenaje tienen **salida** (40 D). La aspiración no se juzga por la pérdida sino por la **presión absoluta en la boca de la bomba**, `p_abs = P_ATM − Δp − ρgh`.

### Cadena de cálculo

```
área      A   = π·dᵢ²/4
caudal    q_l = Q / n_líneas
velocidad v   = q_l / A
longitud  L_real = L_faena · f_L
          n_Le   = codos·30 + tes·20 + válv·8 + entrada·20 + salida·40      [en DIÁMETROS]
          L_acc  = n_Le · dᵢ
          L_eq   = L_real + L_acc
viscosidad ν(T)  = Walther/ASTM D341
Reynolds  Re  = v·dᵢ/ν
fricción  f   = 64/Re                    si Re < 2 000
              = Colebrook-White(Re, ε/d) si Re ≥ 2 000     [120 iteraciones de punto fijo desde f₀ = 0,02]
pérdida   Δp  = f·(L_eq/dᵢ)·ρv²/2
ariete    Δp_J = ρ·c·v                                     (Joukowsky)
potencia  P   = Δp·q_total / η_grupo
compra    C   = n·(L_real·€/m + montaje) + (n−1)·18
coste     T   = C + 5·(P/1000 · h_año · 0,18)
```

Todo se evalúa **dos veces**: a la temperatura de régimen y a la de arranque en frío.

### Los siete criterios (855 configuraciones)

| Criterio | Qué exige |
|---|---|
| `okFunc` | El objetivo de la faena se cumple **a temperatura de régimen** |
| `okFrio` | …y también **en el arranque en frío**, contra un límite relajado |
| `okVel` | `v ≤ v_máx` de la faena (1,2 m/s en aspiración; 6 en presión) |
| `okReg` | Ni en régimen ni en frío el Reynolds cae **en la banda 2 000–4 000** |
| `okComp` | `p_adm ≥ p_trab` **y**, si la faena trabaja en vacío, la conducción lo soporta |
| `okGolpe` | `p_trab + ρ·c·v ≤ p_adm` |
| `okRad` | `r_mín` de la conducción ≤ radio disponible del trazado |

### Censo (855 = 5 faenas × 19 conducciones × 3 trazados × 3 líneas)

| Faena | Válidos | okFunc | okFrio | okVel | okReg | okComp | okGolpe | okRad |
|---|---|---|---|---|---|---|---|---|
| `aspir` | **17** | 107 | 149 | 114 | 45 | 54 | 3 | 30 |
| `presion` | **28** | 45 | 66 | 48 | 45 | 54 | 90 | 30 |
| `retorno` | **42** | 71 | 101 | 93 | 54 | 0 | 9 | 30 |
| `drenaje` | **86** | 27 | 63 | 6 | 0 | 0 | 0 | 30 |
| `larga` | **19** | 47 | 97 | 36 | 27 | 54 | 66 | 30 |
| **Global** | **192** | 297 | 476 | 297 | 171 | 162 | 168 | 150 |

Y el mismo censo contando **sólo los fallos en solitario** —los montajes que ese criterio, y nada más que ese criterio, tumba:

| | okFunc | okFrio | okVel | okReg | okComp | okGolpe | okRad |
|---|---|---|---|---|---|---|---|
| **Global** | 0 | **108** | 0 | 11 | **0** | 8 | 45 |

Tres lecturas, las tres selladas:

- **`okFrio` es el criterio decisivo.** Tumba 108 montajes él solo. Si se ignorase el arranque en frío, los válidos pasarían de **192 a 300**.
- **`okFunc` y `okVel` nunca deciden solos.** Cuando la pérdida en régimen o la velocidad se pasan, siempre hay otro criterio que también ha caído. El dimensionado «de libro» —Δp y v— **no es el que selecciona**.
- **`okComp` invalida 162 montajes y ninguno en solitario.** En **108** de ellos el golpe también suspende; en los **54** restantes es otro criterio el que acompaña. Es decir: **el golpe no implica la compatibilidad**. Que una conducción aguante el pico no garantiza que aguante la presión de trabajo, ni al revés.

### Óptimos (orden lexicográfico declarado en pantalla antes de barrer: **coste a 5 años → potencia disipada → margen**)

| Faena | Solución | v (m/s) | L_real | n_Le | L_eq (m) | Re | Δp rég. | Δp frío | Golpe | P (W) | Compra | Coste 5 a | Empates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `aspir` | **a38 / directa / 1** | 0,877 | 1,80 | 88 | 5,153 | 1 115 | 0,0260 bar | 0,3315 | 1,83 | 3,2 | 69,00 € | **80,69 €** | 1 |
| `presion` | **t35g / directa / 1** | 2,037 | 4,20 | 68 | 5,900 | 1 699 | 0,1605 bar | 2,0477 | 22,87 | 20,1 | 242,40 € | **314,61 €** | 1 |
| `retorno` | **a51 / directa / 1** | 0,740 | 6,50 | 108 | 11,986 | 1 522 | 0,0236 bar | 0,3660 | 1,55 | 4,4 | 238,50 € | **250,47 €** | 1 |
| `drenaje` | **t22 / compacta / 1** | 0,393 | 7,20 | 388 | 14,184 | 286 | 0,1183 bar | 1,8318 | 4,35 | 1,5 | 188,80 € | **194,13 €** | 1 |
| `larga` | **t35g / compacta / 1** | 1,528 | 20,80 | 348 | 29,500 | 1 274 | 0,6018 bar | 18,1492 | 17,15 | 56,4 | 1 133,60 € | **1 164,06 €** | 1 |

**La solución es única en las cinco faenas** (`empates = 1`), lo que hace el reto calificable sin ambigüedad.

Obsérvese que **todos los óptimos son laminares** —Re entre 286 y 1 699— y que en dos de ellos (`drenaje` y `larga`) **gana el trazado compacto pese a sus diez codos**, porque el ahorro del 20 % de tubería en 9 y 26 metros pesa más que los accesorios cuando el diámetro es pequeño. Ese es el contraejemplo que impide convertir «el compacto es peor» en regla.

### El hallazgo 1 · la longitud equivalente (aspiración, `a38`)

| Trazado | L_real | n_Le | L_acc | L_eq | % accesorios | Δp | ¿válida? |
|---|---|---|---|---|---|---|---|
| `directa` | 1,80 m | 88 D | 3,353 m | **5,153 m** | **65,1 %** | 0,0260 bar | **sí** |
| `compacta` | 1,44 m | 368 D | 14,021 m | **15,461 m** | **90,7 %** | 0,0780 bar | no · `okFrio`, `okRad` |

**36 cm menos de manguera cuestan 10,31 m equivalentes.** Y además el radio: la espiral DN38 necesita 190 mm y el compacto ofrece 90.

### El hallazgo 2 · la viscosidad (línea larga, `t35g`)

| Trazado | L_eq | Re a 50 °C | Δp a 50 °C | Re a −5 °C | Δp a −5 °C | Factor |
|---|---|---|---|---|---|---|
| `directa` | 27,700 m | 1 274 | 0,5651 bar | 42 | 17,0418 bar | **×30,2** |
| `compacta` | 29,500 m | 1 274 | 0,6018 bar | 42 | 18,1492 bar | **×30,2** |

ν pasa de **29,97** a **903,97 cSt**: ×30,2. Δp se multiplica **por el mismo número exacto**, porque en laminar `Δp = (64/Re)·(L/d)·ρv²/2 = 32·ν·L·v/d²` — la velocidad no cambia, la geometría tampoco, y el factor de fricción es proporcional a ν. **El Reynolds baja de 1 274 a 42**: el flujo no es que sea laminar, es que está prácticamente parado en términos de turbulencia.

### El hallazgo 3 · el golpe (línea de presión, `t22 / directa / 1`)

| Magnitud | Valor |
|---|---|
| Velocidad | **3,930 m/s** (≤ 6,0: pasa `okVel`) |
| Reynolds a 50 °C | **2 360 → banda de transición** (falla `okReg`) |
| f laminar / f turbulento | 0,02712 / **0,04758** — casi el doble, y ninguno es «el» valor |
| Δp | 0,9631 bar (≤ 5,0: pasa `okFunc`) |
| Celeridad de Korteweg | 1 273 m/s |
| Pico de Joukowsky | **43,52 bar** |
| p_trab + pico | **253,5 bar** frente a los **223** de Barlow → falla `okGolpe` |

Un montaje que **cumple pérdida y cumple velocidad** y aun así no se puede instalar. Fallos: `okReg`, `okGolpe`.

**Ariete comparado, a 1 m/s de cierre:**

| Conducción | c (m/s) | Δp_J | p_adm |
|---|---|---|---|
| `t18` | 1 281 | 11,15 bar | 272 |
| `t22` | 1 273 | **11,07 bar** | 223 |
| `t28` | 1 260 | 10,96 bar | 175 |
| `t35g` | 1 290 | 11,22 bar | 350 |
| `h12` (trenzas) | 350 | **3,04 bar** | 275 |
| `a38` (espiral) | 240 | **2,09 bar** | 10 |

Referencia: `√(K/ρ)` = **1 313 m/s**, la celeridad en un conducto infinitamente rígido. Ningún tubo de acero llega: la elasticidad de la pared siempre resta.

### El hallazgo 4 · comprar contra poseer (línea de presión)

| | Montaje | v | Δp | P disipada | Compra | Energía 5 a | **Coste 5 a** |
|---|---|---|---|---|---|---|---|
| El más barato de comprar | `t18 / directa / 2` | 3,248 m/s | 0,7124 bar | **89,1 W** | **192,00 €** | 320,59 € | **512,59 €** |
| El óptimo | `t35g / directa / 1` | 2,037 m/s | 0,1605 bar | **20,1 W** | 242,40 € | 72,21 € | **314,61 €** |

**Sobrecoste de comprar por etiqueta: 63 %. Ahorro de elegir bien: 39 %.** Las dos cifras son la misma comparación leída en las dos direcciones, y el laboratorio publica ambas para que se vea que **no son intercambiables** (63 % de sobrecoste ≠ 63 % de ahorro).

Sólo la línea de presión separa ambos criterios: en las otras cuatro faenas, **el montaje más barato de comprar es también el óptimo a cinco años**. Es el detalle que impide vender «lo barato siempre sale caro» como consigna: sale caro **cuando hay caudal y horas**, y aquí eso ocurre en una faena de cinco.

### Colebrook–White contra Swamee–Jain

| Re | ε/d | Colebrook | Swamee–Jain | Diferencia |
|---|---|---|---|---|
| 5 000 | 0,00068 (`t22`) | 0,03815 | 0,03871 | +1,47 % |
| 5 000 | 0,00157 (`a38`) | 0,03911 | 0,03980 | +1,74 % |
| 10 000 | 0,00068 | 0,03192 | 0,03214 | +0,71 % |
| 50 000 | 0,00068 | 0,02312 | 0,02322 | +0,44 % |
| 100 000 | 0,00157 | 0,02395 | 0,02416 | +0,88 % |

La explícita se aparta **menos del 2 %** en todo el rango del banco. El laboratorio la muestra al lado de la implícita, no en lugar de ella: quien calcula a mano usa Swamee–Jain sabiendo lo que renuncia.

---

## Los cinco modos (molde S)

Los cuatro modos de estudio comparten el mismo banco —faena, conducción, trazado, número de líneas y el conmutador régimen/frío— y se diferencian en qué mira el pizarrón y qué recorre el botón «nuevo escenario».

| Modo | Dónde mira | Qué demuestra |
|---|---|---|
| **El fluido** | Curva ν(T) del ISO VG 46 y el Reynolds sobre ella | Que la misma tubería cambia de régimen entre el arranque y el servicio sin que nadie toque nada. «Nuevo escenario» alterna régimen/frío y avanza de faena |
| **La pérdida** | Descomposición de `L_eq` accesorio a accesorio y Darcy–Weisbach sobre ella | Que los codos son metros de tubo invisible y que la pérdida se desploma con la cuarta potencia del diámetro. Vigila la banda de transición |
| **El golpe** | Celeridad, pico de Joukowsky y presión admisible | Que la misma velocidad da tres picos distintos según sea tubo rígido, manguera de trenzas o de espiral. «Nuevo escenario» recorre las 19 conducciones |
| **El catálogo** | Los 171 montajes de la faena, criterio por criterio | Cuántos caen por cada motivo y, sobre todo, **cuántos caen sólo por ese motivo** |
| **Reto** | Tres ejes: conducción · trazado · líneas | Calificación por eje independiente + orden lexicográfico (coste → potencia → margen), con solución única |

---

## Verificación

### Capa 1 — física (`scratchpad/verif_perd.mjs`)

**99 388 comprobaciones, 0 fallos.** Cubre: el ajuste de Walther contra sus dos anclajes y la monotonía de ν(T); la convergencia de Colebrook–White por punto fijo y su contraste con Swamee–Jain; Darcy–Weisbach recalculado por la forma cerrada laminar `32νLv/d²` allí donde el régimen lo permite; Barlow y Korteweg sobre los once tubos; Joukowsky; el recuento de longitudes equivalentes en diámetros para las quince combinaciones faena × trazado; el barrido completo de las 855 configuraciones con los siete criterios recalculados de forma independiente; el censo y su recuento de fallos en solitario; el orden lexicográfico y la unicidad de las cinco soluciones; el coste de compra y de propiedad; y el formato sellado de cifras.

**Auditoría de prosa** (`scratchpad/ficha_perd_check.mjs`): vuelca del motor sellado, en diez bloques, cada magnitud que después se cita en la ficha del alumno, en el briefing, en la entrada del catálogo y en el cuestionario —longitudes equivalentes de las quince combinaciones faena × trazado, viscosidades, celeridades y picos, censos, óptimos y costes—, de modo que **ninguna cifra de la prosa se escribe a mano**.

### Capa 2 — navegador real (`scratchpad/pw_perd.mjs`)

**459 comprobaciones, 0 fallos**, sobre Chromium contra `window.__labDebug`, en 20 bloques:

1. Carga limpia y superficie de depuración · 2. Catálogo publicado campo a campo contra el sellado · 3. **Rederivación de los 855 montajes** de la página contra el motor sellado, 24 campos numéricos cada uno más los siete booleanos, la lista de fallos y la palabra de régimen · 4. Censo · 5. Fluido, Walther y banda de transición · 6. Pérdida y longitudes equivalentes · 7. Golpe: Korteweg, Joukowsky y Barlow · 8. Los cinco óptimos · 9. Comprar contra poseer · 10. Los cinco modos y su DOM · 11. Telemetría contra el motor · 12. Formato sellado `f1`/`pc1`, incluido el separador de millares por código de carácter · 13. Cuestionario · 14. Arranque del reto y cierre por la solución · 15. Válido pero caro **no** cierra el reto, más las **siete ramas de explicación**, una por criterio, con su caso mínimo · 16. La pista es honesta y no toca el montaje · 17. Nuevo escenario · 18. Inspección de las nueve piezas · 19. Recorrido guiado completo · 20. Escena 3D y selección por clic.

> El bloque 3 **no copia** el motor del laboratorio: importa el motor sellado en Node y lo compara con lo que la página calcula, de modo que una errata de transcripción aparecería como desacuerdo de física y no como coincidencia de instantánea.

---

## Qué NO modela (declarado en la ficha del alumno)

El **régimen transitorio** del flujo —aquí todo es permanente, y por tanto no hay ni arranque de bomba ni aceleración de la columna de aceite, que es lo que en la realidad decide el tiempo de cierre frente al `2L/c`—; la **serie completa del golpe de ariete**, de la que se calcula el **primer pico** de Joukowsky y no las crestas sucesivas, su amortiguamiento ni la cavitación de la depresión posterior; la **dependencia de la viscosidad con la presión**, que en hidráulica de 210 bar no es despreciable y aquí se ignora en favor de la sola dependencia con la temperatura; la **variación de temperatura a lo largo del tramo** —cada faena tiene una temperatura de régimen y una de frío, uniformes—; el **calentamiento del aceite por la propia pérdida**, que en un circuito real realimenta la viscosidad; los **accesorios reales** con su coeficiente `K` propio medido en banco, sustituidos aquí por longitudes equivalentes en diámetros, que es la aproximación de taller; las **pérdidas por entrada y salida** más allá de los 20 y 40 D declarados; la **rugosidad envejecida** de la conducción, que crece con los años y con el fluido; el **flujo bifásico y la cavitación** de la aspiración, de la que sólo se comprueba que la presión absoluta se mantenga por encima del límite, no lo que ocurre si no; la **fatiga por impulsos** de la manguera, que es lo que en realidad fija su vida y que en un catálogo es una curva y no el número `p_adm`; el **envejecimiento del elastómero** y su compatibilidad con el fluido; la **dilatación y los esfuerzos de montaje** del tubo rígido; el **ruido** de la instalación; y la **selección de la bomba y del intercambiador** (**d4-10** y **d4-13**), el **acumulador** que amortigua el pico (**d4-A1**) y el **control en lazo cerrado** del actuador que hay al final de la línea larga (**d4-A4**).

Los datos del catálogo de 19 conducciones —precios, radios mínimos de curvatura, presiones admisibles de manguera y rugosidades—, los tres trazados con su factor de longitud, su número de accesorios y su radio disponible, las cinco faenas con sus caudales, temperaturas, límites y horas de servicio, el precio de la energía, el rendimiento del grupo y el horizonte de cinco años son **valores de proyecto representativos**, no constantes medidas ni límites normativos, y se declaran como tales en la pantalla. Las presiones admisibles y las celeridades **de los tubos de acero sí se calculan**, con Barlow y Korteweg, a partir de la geometría y de las propiedades del material.

---

## Normas y fuentes de referencia

- **H. Darcy** (1857) / **J. Weisbach** (1845) — Pérdida de carga por fricción: `Δp = f·(L/D)·ρv²/2`.
- **O. Reynolds** (1883) — El número adimensional que separa laminar de turbulento y decide qué fórmula aplica.
- **C. F. Colebrook y C. M. White** (1939) — Ecuación implícita del factor de fricción en régimen turbulento; aquí resuelta por punto fijo con 120 iteraciones desde `f₀` = 0,02.
- **L. F. Moody** (1944) — El diagrama que popularizó esa ecuación y la noción de rugosidad relativa.
- **P. K. Swamee y A. K. Jain** (1976) — Aproximación explícita, mostrada al lado de la implícita para cuantificar lo que se renuncia al usarla.
- **C. Walther / ASTM D341** — Relación viscosidad-temperatura, ajustada aquí a los dos puntos que definen el grado.
- **ISO 3448** — Clasificación de viscosidad de lubricantes industriales: el «46» del ISO VG 46 son los cSt a 40 °C, no a la temperatura de trabajo.
- **D. J. Korteweg** (1878) — Celeridad de la onda de presión en un conducto elástico: `c = √((K/ρ)/(1 + K·D/(E·e)))`.
- **N. Joukowsky** (1900) — Golpe de ariete: `Δp = ρ·c·Δv`.
- **Fórmula de Barlow** — Presión admisible de un tubo de pared delgada con coeficiente de seguridad: `p = 2·e·Rm/(d_ext·S)`.
- **ISO 4413** — Transmisiones hidráulicas: exige justificar cada componente frente a las condiciones reales de servicio, incluidas las de arranque en frío.
