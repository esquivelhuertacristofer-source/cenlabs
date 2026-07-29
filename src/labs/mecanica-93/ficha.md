# MEC-93 · Prensa hidráulica: ley de Pascal, volumen y proyecto del circuito

**Dominio:** D4 · Hidráulica y Neumática
**Práctica del backlog:** d4-01 — «Prensa hidráulica: ley de Pascal» — **Molde E+S** — **D4 1/18 · ABRE EL DOMINIO**
**Simulador:** `/labs/prensa-hidraulica-pascal.html`
**Slug de construcción:** `prensa-hidraulica-pascal`

---

## Qué enseña

1. **La presión la impone la CARGA, no la bomba.** `p = F₂/(η·A₂)`: 60 kN sobre un Ø80 son **13,26 MPa** y no hay nada que elegir. La bomba solo decide si esa presión se alcanza.
2. **Hay dos topes distintos y rara vez coinciden.** El de la **mano** (a 400 N: 8,42 MPa con b1, 19,89 con b2) y el de la **limitadora** (16 · 25 · 25 · 70 · 70 MPa). Con b1 y b2 se agota la mano y la válvula ni se entera; con b3, b4 y b5 corta la válvula (la b3 daría **31,83 MPa** a mano y abre en 25).
3. **La fuerza se multiplica; el trabajo no.** `F₂/F_mano = η·R·A₂/A₁`, de **×37** a **×1969** en el catálogo, y siempre a costa del recorrido.
4. **El volumen se conserva.** `V = A₁·s₁ = A₂·s₂`. El avance por bombeo va de **4,840 mm** (Ø50 con b1) a **0,205 mm** (Ø125 con b4).
5. **El precio de la multiplicación, con la cifra delante.** El Ø125 con la b5 multiplica ×1953 y avanza **0,4147 mm** por bombeo: **73 bombeos** y **65,7 m** de palanca para mover el vástago **30 mm**.
6. **El balance de trabajo cierra exactamente en η.** `W_out/W_in = 0,9000` verificado; el 10 % restante se disipa en calor en el aceite y las juntas.
7. **El aire atrapado se come los primeros bombeos.** Un latiguillo DN10 × 2 m contiene **157,08 cm³**; con un 30 % de aire (**47,12 cm³**), Boyle se lo lleva casi todo: **5** bombeos perdidos con b1, **10** con b5, **19** con b4, antes de que la carga se mueva.
8. **La columna de aceite se calcula para poder despreciarla.** `ρ·g·h` con ρ = 900 kg/m³ da **0,0088 MPa/m**: frente a los 31,69 MPa del buje es el **0,028 %**. Despreciarla con conocimiento no es lo mismo que ignorarla por costumbre.
9. **Fuerza techo de la pareja.** `η·p_máx·A₂`, de **113,1 kN** a **773,1 kN** en el catálogo: es la fuerza a la que abre la limitadora, no una cifra de folleto.
10. **Seis criterios simultáneos o no vale.** Diámetro que quepa, carrera suficiente, presión ≤ tarado, mano ≤ 400 N, bombeos ≤ máximo del trabajo y latiguillo con presión de trabajo suficiente.
11. **Cumplir no basta: hay que cumplir Y ser el más barato.** En el eje, el Ø80 (**24 u.c.**) y el Ø100 (**29 u.c.**) satisfacen los seis criterios; sobredimensionar cuenta como error.
12. **A veces la bomba correcta es la más floja y la más barata.** En el casquillo largo gana la **b1**, porque lo que manda es la cilindrada (130 mm de carrera en 120 bombeos), no la presión.
13. **El cilindro más caro puede abaratar el sistema.** En el buje, el Ø100 cumple **cinco** criterios y falla **solo** en el latiguillo (pediría 49,51 MPa y la clase 350 bar trabaja a 35); el Ø125 baja a **31,69 MPa** y hace barato todo lo demás. Cambiar el cilindro cambia el latiguillo.
14. **El hueco disponible puede obligar a la peor solución hidráulica.** El extractor portátil deja **Ø63** de espacio, así que 120 kN salen del cilindro más pequeño a **67,91 MPa**, con latiguillo de 700 bar y un techo de **123,7 kN** frente a los 120 pedidos: **3,7 kN** de holgura.
15. **El límite de 400 N en la palanca es un criterio de proyecto del taller**, inspirado en ISO 11228-2 y EN 1005-3, **no** una cifra normativa de la máquina. Se declara como tal en la ficha y en el laboratorio.

---

## Lógica (verificada `verif_prensa.mjs` — 204/204)

**Constantes selladas del motor** (idénticas en el verificador y en el laboratorio, copiadas verbatim entre los marcadores `MOTOR` / `FIN MOTOR`):

| Símbolo | Valor | Origen |
|---|---|---|
| `ETA_CIL` | 0,90 | rendimiento mecánico-hidráulico del cilindro (fricción de juntas y guías) |
| `F_MANO_MAX` | 400 N | criterio de proyecto del taller (inspirado en ISO 11228-2 / EN 1005-3) |
| `SF_MAN` | 4 | factor de seguridad rotura/trabajo del latiguillo (ISO 1436 · SAE J517) |
| `P_ATM` | 0,101325 MPa | presión atmosférica para la compresión isotérmica del aire |
| `RHO_ACEITE` | 900 kg/m³ | densidad del aceite hidráulico |
| `G_GRAV` | 9,80665 m/s² | aceleración de la gravedad |

**Fórmulas del motor**

| Magnitud | Expresión |
|---|---|
| Área | `A = π·d²/4` |
| Presión que exige la carga | `p = F/(η·A₂)` |
| Fuerza de mano | `F_mano = p·A₁/R` |
| Volumen por bombeo | `V_b = A₁·s₁` |
| Avance por bombeo | `s₂ = V_b/A₂` |
| Número de bombeos | `N = ⌈s/s₂⌉` |
| Multiplicación de fuerza | `F₂/F_mano = η·R·A₂/A₁` |
| Reducción de recorrido | `s_pal/s₂ = R·A₂/A₁` |
| Fuerza techo | `F_techo = η·p_máx·A₂` |
| Columna de aceite | `p = ρ·g·h` |
| Aire atrapado (Boyle) | `p₁·V₁ = p₂·V₂` con `p₁ = P_ATM` |

**Catálogo de cilindros**

| Clave | Ø (mm) | A₂ (mm²) | Carrera máx. (mm) | Coste (u.c.) |
|---|---|---|---|---|
| `c50` | 50 | 1963,50 | 50 | 5 |
| `c63` | 63 | 3117,25 | 80 | 7 |
| `c80` | 80 | 5026,55 | 125 | 10 |
| `c100` | 100 | 7853,98 | 200 | 15 |
| `c125` | 125 | 12271,85 | 200 | 18 |

**Catálogo de bombas de mano**

| Clave | Ø (mm) | A₁ (mm²) | Carrera s₁ (mm) | V_b (cm³) | Palanca R | p_máx (MPa) | p a 400 N (MPa) | ¿Qué corta primero? | Coste |
|---|---|---|---|---|---|---|---|---|---|
| `b1` | 22 | 380,13 | 25 | 9,50 | 8 | 16 | 8,42 | la **mano** | 5 |
| `b2` | 16 | 201,06 | 32 | 6,43 | 10 | 25 | 19,89 | la **mano** | 10 |
| `b3` | 16 | 201,06 | 45 | 9,05 | 16 | 25 | 31,83 | la **limitadora** | 11 |
| `b4` | 10 | 78,54 | 32 | 2,51 | 14 | 70 | 71,30 | la **limitadora** | 14 |
| `b5` | 12 | 113,10 | 45 | 5,09 | 20 | 70 | 70,74 | la **limitadora** | 20 |

**Catálogo de latiguillos** (`p_trab = p_rotura/4`)

| Clave | Clase | p_rotura (MPa) | p_trab (MPa) | Coste |
|---|---|---|---|---|
| `h100` | 100 bar | 40 | 10 | 2 |
| `h200` | 200 bar | 80 | 20 | 4 |
| `h350` | 350 bar | 140 | 35 | 7 |
| `h700` | 700 bar | 280 | 70 | 12 |

**Los seis criterios del proyecto**

| Criterio | Condición |
|---|---|
| `okD` | `d_cilindro ≤ d_máx` del hueco disponible |
| `okS` | `s ≤ carrera máxima` del cilindro |
| `okP` | `p ≤ p_máx` de la bomba (tarado de la limitadora) |
| `okF` | `F_mano ≤ 400 N` |
| `okN` | `N ≤ N_máx` del trabajo |
| `okM` | `p ≤ p_trab` del latiguillo |

---

## Las cuatro estaciones (barrido completo 5 × 5 × 4 = 100 por estación)

| Trabajo | F (kN) | s (mm) | N_máx | Hueco Ø (mm) | Terna única | Coste | Siguiente | Válidas | p (MPa) | F_mano (N) | s₂ (mm) | N | Multiplicación | Palanca total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Enderezar un eje flector | 60 | 40 | 60 | 125 | `c80 · b2 · h200` | **24** | 25 | 35/100 | 13,26 | 267 | 1,2800 | 32 | ×225 | 10,2 m |
| Extraer un rodamiento (extractor portátil) | 120 | 25 | 35 | **63** | `c50 · b4 · h700` | **31** | 33 | 4/100 | 67,91 | 381 | 1,2800 | 20 | ×315 | 9,0 m |
| Introducir un casquillo de bronce largo | 45 | **130** | 120 | 125 | `c100 · b1 · h100` | **22** | 24 | 8/100 | 6,37 | 302 | 1,2100 | 108 | ×149 | 21,6 m |
| Prensar el buje de la mangueta de un camión | **350** | 30 | 80 | 125 | `c125 · b5 · h350` | **45** | 47 | 3/100 | 31,69 | 179 | 0,4147 | 73 | ×1953 | 65,7 m |

**Fuerza techo de cada pareja ganadora:** eje 113,1 kN (para 60) · rodamiento **123,7 kN (para 120)** · casquillo 113,1 kN (para 45) · buje 773,1 kN (para 350).

### Por qué no vale el cilindro más grande (verificado eje por eje)

| Trabajo | Ø50 | Ø63 | Ø80 | Ø100 | Ø125 |
|---|---|---|---|---|---|
| eje | falla `okP+okF+okM` | falla `okF+okM` | **válida 24** | válida 29 | falla `okN` (77 > 60) |
| rodamiento | **válida 31** | válida 33 | falla `okD+okN` | falla `okD+okN` | falla `okD+okN` |
| casquillo | falla `okS+okP+okF+okM` | falla `okS+okP+okF+okM` | falla `okS+okF` (125 < 130 mm; 473 N) | **válida 22** | falla `okN` (168 > 120) |
| buje | falla `okP+okF+okM` | falla `okP+okF+okM` | falla `okP+okF+okM` | falla **solo `okM`** (49,51 > 35) | **válida 45** |

---

## Anclas de honestidad

- **El tope de la mano no es el `p_máx` de catálogo.** La b1 está marcada 16 MPa pero a 400 N solo llega a **8,42**; la b2 está marcada 25 y llega a **19,89**. Con b3, b4 y b5 pasa lo contrario y corta la válvula. Se dice con las cinco cifras delante.
- **Sobredimensionar es un error, no prudencia.** En el eje, el Ø80 y el Ø100 cumplen los seis criterios; la calificación es «válida **Y** más barata».
- **La bomba más floja puede ser la correcta.** En el casquillo gana la b1 (5 u.c.) porque manda la cilindrada, no la presión.
- **El componente más caro puede abaratar el sistema.** En el buje, el Ø125 (18 u.c.) resulta más barato en conjunto que el Ø100 (15 u.c.), porque este último obligaría a un latiguillo que no existe en el catálogo por debajo de 49,51 MPa.
- **65,7 m de palanca por 30 mm de vástago**, y el 10 % de ese trabajo se pierde en calor. La multiplicación de fuerza tiene factura.
- **La holgura real del extractor son 3,7 kN** sobre 120 kN pedidos: la solución válida no siempre es la cómoda.
- **La columna de aceite es el 0,028 %** — se calcula, se enseña la cifra y luego se desprecia.
- **La animación 3D del vástago está a escala de carrera, no 1:1 en mm.** Se declara en el laboratorio: dibujar 0,4147 mm por bombeo no se vería.

---

## Molde y estructura

**Molde E+S** (ensamble 3D + banco de estudio):

- **Ensamble:** 7 piezas (cilindro, depósito, bomba de mano, limitadora, manómetro, latiguillo y pieza de trabajo) sobre pedestales; cada hueco solo acepta su pieza y hasta el último encaje los modos quedan bloqueados (`simUnlocked`).
- **Pascal:** tubo en U con ambos émbolos a escala real (1,75 px/mm), barra de presión con los marcadores de carga, mano y limitadora, y veredicto de tres estados (avanza / corta la limitadora / falta fuerza en la mano).
- **Volumen:** bombeo manual (×1 y ×10), aire atrapado seleccionable (0 · 10 · 25 · 47,12 cm³), avance por bombeo, bombeos totales, palanca total y reparto trabajo útil / calor.
- **Proyecto:** curva de decisión sobre los cinco cilindros con las líneas límite de la limitadora y del máximo de bombeos, más el veredicto por cilindro con el criterio exacto que incumple.
- **Reto:** calificación **triple ortogonal** (cilindro / bomba / latiguillo), cada eje evaluado con los otros dos correctos, y cuestionario de 4 opciones barajadas (Fisher-Yates) con los distractores verificados falsos contra el motor.

---

## Verificación en dos capas

1. **Numérica:** `scratchpad/verif_prensa.mjs` — **204 comprobaciones, 0 fallos** (áreas, presiones, fuerzas de mano, avances, bombeos, multiplicación, balance de trabajo, aire atrapado, columna de aceite, fuerza techo y barrido completo de las 100 combinaciones de cada estación con terna única).
2. **Navegador:** arnés Playwright contra `window.__labDebug` sobre servidor HTTP local, más el recorrido guiado completo (`runAuto`) con la narración verificada paso a paso.

---

## Referencias

- **Ley de Pascal** (1653): la presión aplicada a un fluido confinado se transmite sin disminución a todo el fluido y a las paredes del recipiente.
- **ISO 6020-2** e **ISO 6022** — Cilindros hidráulicos: series normalizadas de diámetros de émbolo (50, 63, 80, 100, 125 mm).
- **ISO 1436** y **SAE J517** (serie 100R) — Mangueras hidráulicas de alambre trenzado: presiones de trabajo normalizadas y factor de seguridad mínimo de 4 entre rotura y trabajo.
- **ISO 4413** — Transmisiones hidráulicas: reglas generales y requisitos de seguridad (limitadora de presión, protección contra sobrepresión).
- **ISO 1219-1** — Símbolos gráficos y esquemas de circuito de transmisiones hidráulicas y neumáticas.
- **ISO 11228-2** y **EN 1005-3** — Ergonomía: límites recomendados de fuerza manual de empuje y tracción. Inspiran el criterio de proyecto de 400 N; **no** son una cifra normativa de la prensa.
- **Ley de Boyle-Mariotte** (`p₁V₁ = p₂V₂`, compresión isotérmica) para el aire atrapado en el circuito.
