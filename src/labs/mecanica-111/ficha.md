# MEC-111 · Analiza el ciclo Otto y su eficiencia contra la relación de compresión

- **Dominio:** D6 · Motor de combustión interna
- **Práctica del backlog:** d6-01 — *Analiza el ciclo Otto y su eficiencia vs relación de compresión* (molde S+P)
- **Simulador:** `/labs/ciclo-otto-relacion-compresion.html`
- **Slug:** `ciclo-otto-relacion-compresion`
- **Ancla curricular:** AUT-Y motores · UAX Termodinámica
- **Fuentes de referencia:** Heywood, *Internal Combustion Engine Fundamentals* (1988, caps. 5, 9, 12 y 13) · Woschni, SAE 670931 (1967) · Wiebe (1970) y Ghojel, *IJER* 11(4) (2010) · Metghalchi y Keck, *Combustion and Flame* 48 (1982) · Douaud y Eyzat, SAE 780080 (1978) · Livengood y Wu, *5th Symposium on Combustion* (1955) · Chen y Flynn, SAE 650733 (1965) · Brunt, Rai y Emtage, SAE 981052 (1998) · Bradley et al., *Combustion and Flame* 115 (1998) y Peters, *Turbulent Combustion* (2000)

---

## Qué enseña

1. Que **la fórmula del libro no se equivoca de tendencia: se equivoca de escala**. `η = 1 − r^(1−γ)` con γ = 1,4 promete **56,47 · 60,19 · 62,99 · 65,20 %** para r = 8, 10, 12 y 14. Las cinco máquinas del banco entregan al freno entre **23,61 y 25,92 puntos menos**, y esa brecha tiene destinatarios medidos, no una excusa genérica.
2. Que **la compresión no empieza en el PMI**. Como la admisión cierra a **−140° ATDC**, quien gobierna es la relación efectiva `r_ef = V(θ_IVC)/V_c`: **9,217 a 11,958** en las cinco soluciones frente a las nominales 10 a 13. Ese solo desplazamiento se lleva **1,22 a 1,32 puntos** antes de que salte la chispa.
3. Que **la llama tarda, y lo que tarda se calcula, no se supone**. La duración de Wiebe se escala con la velocidad de llama turbulenta (`S_T = S_L^0,65·u′^0,35`, `u′ = 0,5·S_p`), y sale **40,0 · 41,2 · 55,3 · 48,6 · 42,2 grados** en las cinco soluciones. La planta de gas, que gira a 1 800 rpm, necesita **55,3°** de cigüeñal para quemar.
4. Que **el calor se escapa por las paredes mientras se libera**. Woschni con `C₁ = 2,28` y `C₂ = 3,24·10⁻³` se lleva del **9,2 al 14,8 %** del calor liberado en las cinco soluciones, y **al revés de lo que dice la intuición**: el motor de competición a 9 000 rpm pierde la fracción más pequeña y la planta lenta la más grande, porque lo que cuenta no es la potencia sino el **tiempo** que el gas caliente pasa tocando pared.
5. Que **el muro que detiene la relación de compresión no es termodinámico sino químico —y no siempre**. En el sedán con magna RON 91 a 16° y λ = 1,00 la integral de Livengood-Wu vale **0,469 · 0,633 · 0,826 · 1,016 · 1,262** para r de 8 a 12: la última firmable es **r = 10**, y la eficiencia sigue subiendo después de que el motor ya se rompió. Pero al motor de metanol RON 109 la integral **no le llega a 1 en ninguna de sus 210 configuraciones**: a él lo para la presión. De sus 30 calibraciones a r = 14, **21 caen por presión y 11 sin que ningún otro criterio las señale**.
6. Que **la mezcla que más rinde por dentro no es la que más entrega por fuera**. En la planta a r = 12 y 10°, pasar de λ = 1,00 a λ = 1,10 **sube** la eficiencia indicada de **41,43 a 41,49 %** y **baja** la del freno de **37,71 a 37,61 %**: la presión media indicada cae un **8,46 %** (11,690 → 10,701 bar) y la fricción sólo un **5,19 %** (0,982 → 0,931 bar). La fricción se resta en **bar**, no en tanto por ciento.
7. Que **el combustible enfría la carga antes de arder**, y cuánto: **0,0 K** en el gas LP —que entra ya gasificado—, **4,2 y 4,6 K** en las gasolinas de admisión, **13,8 K** en la inyección directa y **54,8 K** en el metanol. Ese frío es parte de por qué el metanol admite compresiones prohibidas a la gasolina.
8. Que **un pliego son siete criterios simultáneos y el censo miente si se lee mal**. De las **870** configuraciones que caben en el bloque sólo **51** pasan las siete —el **5,9 %**—. El par tumba **452** y decide sólo **17**; la mezcla tumba **378** y decide **16**; la estabilidad tumba **248** y decide **1**. El que más decide en solitario es la **temperatura de escape**: tumba 251 y decide **65**.
9. Que **el desempate es el dinero y ninguna de las cinco soluciones es la de mayor eficiencia**. Renuncian a **0,15 · 0,70 · 1,25 · 2,21 · 0,71 puntos** porque la mejor calibración de cada máquina incumple algo. Y equivocarse dentro de lo válido cuesta: firmar la válida más cara en lugar de la óptima son **+20 042 €** de combustible en la planta de gas a cinco años.

---

## Lógica (verificada en `scratchpad/motor_otto.mjs` + `test_otto.mjs`, 71 825 comprobaciones, 0 fallos)

### Constantes selladas

| Símbolo | Valor | Qué es |
|---|---|---|
| `TH_IVC` / `TH_EVO` | −140° · +130° ATDC | Ventana del ciclo cerrado: cierre de admisión y apertura de escape |
| `H_PASO` | 0,5° de cigüeñal | Paso del RK4 — **540 pasos, 541 puntos** por ciclo |
| `R_GAS` / `P_ATM` | 287 J/(kg·K) · 101 325 Pa | La mezcla se trata como aire; presión de referencia de la llama y del retardo |
| `A_WIEBE` / `M_WIEBE` | 6,908 · 2 | 99,9 % quemado al final de Δθ; el exponente de la ley es m + 1 = 3 |
| `C1_WOS` / `C2_WOS` | 2,28 · 3,24·10⁻³ | Woschni: término de arrastre y término de combustión (sólo tras la chispa) |
| `N_MOT` | 1,35 | Politrópico de la presión de arrastre que alimenta a Woschni |
| `CU_TURB` / `Q_DAMK` | 0,5 · 0,35 | `u′ = 0,5·S_p` y mezcla Damköhler `S_T = S_L^(1−q)·u′^q` |
| `T_U_REF` / `P_U_REF` | 750 K · 25 bar | Estado de referencia que ancla Δθ₀ al punto de diseño |
| `ETA_COMB` | 0,97 | Combustión incompleta e intersticios |
| `CF_A…CF_D` | 0,30 · 0,0080 · 0,0350 · 0,00060 | Chen-Flynn en bar, bar/bar, bar/(m/s) y bar/(m/s)² |
| `XB_KNOCK` | 0,90 | Fracción quemada en la que se corta la integral de detonación |
| `DE_A` · `DE_N` · `DE_P` · `DE_B` · `K_TAU` | 17,68 · 3,402 · −1,7 · 3 800 K · **1,60** | Douaud-Eyzat con su prefactor **declarado como anclaje**, no ajustado por punto |
| `K_PORT` | 0,78 | Pérdida en el conducto hasta la brida del colector |
| `CP_REF` | 1 005 J/(kg·K) | c_p del balance de mezcla y del enfriamiento evaporativo |
| `ANIOS` | 5 | Horizonte del coste de propiedad |
| `R_G` · `AV_G` · `LAM_G` | 8…14 · 4·10·16·22·28·34° · 0,85·0,95·1,00·1,10·1,25 | La rejilla: **1 050** combinaciones, **870** mecánicamente posibles |

### El ciclo cerrado, paso a paso

| Magnitud | Expresión | Qué decide |
|---|---|---|
| Volumen | `V(θ) = V_c + A_p·(L + a − a·cos θ − √(L² − a²·sen²θ))` | Biela-manivela exacto: la asimetría compresión/expansión es real |
| Relación efectiva | `r_ef = V(−140°)/V_c` | Que el techo de verdad esté 1,22–1,32 puntos por debajo del de catálogo |
| γ del gas | `γ = (1 − x_b)·γ_aire(T) + x_b·γ_q(T)`, mínimo 1,15 | `γ_q = 1,338 − 6,0·10⁻⁵·T + 1,0·10⁻⁸·T²` (Brunt-Rai-Emtage): a 2 500 K vale **1,25** |
| Quemado | `x_b = 1 − exp[−6,908·((θ − θ_s)/Δθ)³]` | La forma de la liberación |
| Duración | `Δθ = Δθ₀·S_T,ref/S_T,act` | **Se calcula**: mezcla, presión y temperatura en la chispa la mueven |
| Llama laminar | `S_L = [B_m + B_φ(φ − φ_m)²]·(T/298)^α·(p/p_atm)^β·(1 − 2,1·f_dil)` | Metghalchi-Keck con fila propia por combustible |
| Calor a pared | `h_c = 3,26·B^(−0,2)·p^0,8·T^(−0,55)·w^0,8` | Woschni, evaluado **en cada subpaso del RK4** |
| Autoencendido | `τ[ms] = 1,60·17,68·(RON/100)^3,402·p[atm]^(−1,7)·exp(3800/T_u)` | `T_u` es la del gas **sin quemar**, seguido por compresión isentrópica |
| Detonación | `I = ∫dt/τ` hasta `x_b = 0,90`; detona si `I ≥ 1` | Livengood-Wu |
| Presiones medias | `imep_n = imep_g − pmep`, `bmep = imep_n − fmep` | Todo el laboratorio razona como el taller: en bar |

> **La convergencia está comprobada, no supuesta:** bajar el paso de 0,5° a 0,25° mueve la eficiencia al freno **menos de 0,0026 puntos** en la peor de las cinco máquinas.

### Las cinco máquinas

| Máquina | V_d × cil. | D/S · biela | rpm · S_p | p_adm | Inyección · f_evap | Combustible | Carga anual |
|---|---|---|---|---|---|---|---|
| Motocicleta | 149,0 cm³ × 1 | 57,3/57,8 · 100 mm | 7 500 · 14,45 m/s | 95 kPa | PFI · 0,20 | Magna RON 91 | 1 150 kWh |
| Sedán 1.6 MPI | 1 597,9 × 4 | 79,0/81,5 · 137 | 4 400 · 11,95 | 96 | PFI · 0,20 | Magna RON 91 | 9 800 |
| Planta de gas LP | 2 020,1 × 3 | 95,0/95,0 · 160 | 1 800 · **5,70** | 98 | GAS · 1,00 | Gas LP RON 105 | **108 000** |
| Turbo 1.4 GDI | 1 394,9 × 4 | 74,5/80,0 · 139 | 2 800 · 7,47 | **145** | GDI · 0,60 | Premium RON 96 | 8 600 |
| Competición | 999,7 × 4 | 81,0/48,5 · 105 | **9 000** · 14,55 | 99 | PFI · 0,35 | Metanol RON 109 | 2 400 |

Y su pliego, que es lo que decide si una calibración se firma:

| Máquina | r ≤ | p_máx | T_brida | bmep ≥ | Δθ ≤ | Ventana de λ | Precio |
|---|---|---|---|---|---|---|---|
| Motocicleta | 13 | 72 bar | 1 100 K | 9,1 bar | 52° | 0,85–1,10 | 1,52 €/L |
| Sedán | 12 | 65 | 1 150 | 9,8 | 55° | **0,98–1,02** (catalizador) | 1,52 |
| Planta de gas | **14** | 72 | **1 040** | 8,4 | 72° | 0,90–1,25 | 0,88 |
| Turbo GDI | **11** | **105** | 1 165 | **15,2** | 58° | **0,98–1,02** (catalizador) | 1,68 |
| Competición | **14** | 78 | 1 160 | 10,6 | 52° | 0,85–1,05 | 0,62 |

### El techo, la realidad y el muro: sedán a 16° y λ = 1,00

| r | r_ef | Techo `1 − r^(1−γ)` | Techo con r_ef | η indicada | η al freno | I de detonación | Veredicto |
|---|---|---|---|---|---|---|---|
| 8 | 7,398 | 56,47 % | 55,09 % | 39,06 % | 33,93 % | 0,469 | Escape (1 197 K) y par (9,20 bar) |
| 9 | 8,312 | 58,48 | 57,13 | 40,60 | 35,28 | 0,633 | Escape (1 168 K) y par (9,60 bar) |
| 10 | 9,226 | 60,19 | 58,89 | 41,88 | 36,38 | **0,826** | **Válida** |
| 11 | 10,140 | 61,68 | 60,41 | 42,95 | 37,26 | **1,016** | Detonación y presión (69,22 bar) |
| 12 | 11,054 | 62,99 | 61,75 | 43,86 | 37,98 | 1,262 | Detonación y presión (76,30 bar) |

> Con ese avance **sólo una compresión de las cinco es firmable**, y no es la más eficiente: por debajo de r = 10 el escape se pasa de temperatura y falta par; por encima, el gas sin quemar se enciende solo y el pico revienta el límite del bloque. El muro **no está donde la eficiencia deja de subir** —no deja de subir nunca dentro del límite mecánico de la máquina—, está donde la integral **cruza el 1**, entre r = 10 y r = 11. Y el reparto de la brecha en la solución firmada de esta máquina (r = 12 con 4° de avance): de los **25,57 puntos** que separan el techo del freno, **1,24** son de la compresión efectiva, **19,01** de la combustión real —duración, calor a las paredes y γ del gas quemado— y **5,33** de bombeo y fricción.

### Las cinco soluciones firmadas

| Máquina | r / avance / λ | Válidas de… | η al freno | I | p_máx @ θ | T_brida | bmep | Δθ | bsfc | Coste 5 años |
|---|---|---|---|---|---|---|---|---|---|---|
| Motocicleta | **13 / 10° / 1,10** | 6 de 180 | 38,23 % | 0,588 | 71,93 bar @ 14,0° | 1 050/1 100 K | 9,65/9,1 | 40,0/52° | 217,0 g/kWh | 2 545 € |
| Sedán | **12 / 4° / 1,00** | 3 de 150 | 37,42 | 0,717 | 57,22 @ 20,0 | **1 147/1 150** | 10,27/9,8 | 41,2/55 | 221,7 | 22 163 |
| Planta de gas | **12 / 10° / 1,10** | 14 de 210 | 37,61 | **0,962** | 51,45 @ 19,0 | 992/1 040 | 9,70/8,4 | 55,3/72 | 207,6 | **182 706** |
| Turbo GDI | **10 / 4° / 1,00** | 4 de 120 | 36,58 | 0,880 | 69,09 @ 24,0 | 1 141/1 165 | 16,24/15,2 | 48,6/58 | 228,9 | 22 047 |
| Competición | **13 / 10° / 1,00** | 24 de 210 | **39,89** | **0,169** | **74,82** @ 15,5 | 1 116/1 160 | 11,40/10,6 | 42,2/52 | **451,2** | 4 239 |

Y lo que se pierde por dentro en cada una:

| Máquina | Calor a paredes | Enfriamiento evaporativo | Residuales | η volumétrico | η indicada | pmep | fmep |
|---|---|---|---|---|---|---|---|
| Motocicleta | 12,7 % | 4,2 K | 3,06 % | 87,5 % | 45,43 % | 0,310 bar | 1,507 bar |
| Sedán | 11,2 | 4,6 | 2,84 | 88,3 | 42,74 | 0,200 | 1,262 |
| Planta de gas | **14,8** | **0,0** | 2,77 | 85,8 | 41,49 | **0,070** | 0,931 |
| Turbo GDI | 11,2 | 13,8 | 2,97 | **90,2** | 39,50 | 0,150 | 1,147 |
| Competición | **9,2** | **54,8** | 2,73 | 84,2 | **46,06** | 0,230 | **1,535** |

> El motor de competición tiene la **mayor eficiencia indicada** del banco (46,06 %) y el **peor consumo específico** (451,2 g/kWh) al mismo tiempo, y no hay contradicción: el metanol tiene la mitad de poder calorífico por kilo. Un consumo específico sólo se compara **a igualdad de combustible**.

### Los siete criterios y el censo del pliego

Rejilla completa: **5 máquinas × 7 relaciones × 6 avances × 5 mezclas = 1 050**, de las que **870** caben en el bloque de su máquina. Pasan las siete a la vez **51** (6 · 3 · 14 · 4 · 24), el **5,9 %**.

| Criterio | Qué mide | Tumba | Decide él solo |
|---|---|---|---|
| Sin detonación | `I < 1` | 253 | 51 |
| Presión máxima | Pico de presión contra el límite del bloque | 241 | 43 |
| Temperatura de escape | Brida del colector contra su límite | 251 | **65** |
| Par entregado | `bmep ≥ bmep_mín` | **452** | 17 |
| Ventana de mezcla | λ dentro del rango del pliego | 378 | 16 |
| Estabilidad de combustión | `Δθ ≤ Δθ_lím` | 248 | **1** |
| Posición del pico | 5° ≤ θ(p_máx) ≤ 25° ATDC | 79 | **1** |

> El **par** es el que más bajas causa —452 de 870— y decide sólo 17 veces: casi siempre que falta par, falla algo más. La **temperatura de escape** tumba 251, casi la mitad, y sin embargo es la que **más veces decide sola**. Y hay dos criterios —estabilidad y posición del pico— que **deciden una vez cada uno** en todo el banco: existen para el caso raro, y el laboratorio enseña cuál es.

Repartido por máquina (bajas totales / suspensos en solitario):

| Máquina | Configs | Válidas | Deton. | Presión | Escape | Par | Mezcla | Estab. | Pico |
|---|---|---|---|---|---|---|---|---|---|
| Motocicleta | 180 | 6 | 10/0 | 72/18 | 97/33 | 98/3 | 36/0 | 23/0 | 29/0 |
| Sedán | 150 | 3 | 44/0 | 53/1 | 42/2 | 120/1 | 120/6 | 42/0 | 9/0 |
| Planta de gas | 210 | 14 | **116/42** | 40/0 | 60/29 | 30/7 | 42/0 | 32/1 | 18/0 |
| Turbo GDI | 120 | 4 | 83/9 | 17/0 | 3/0 | 48/0 | 96/10 | 56/0 | 10/1 |
| Competición | 210 | 24 | **0/0** | 59/24 | 49/1 | 156/6 | 84/0 | 95/0 | 13/0 |

> Cada máquina tiene **su** muro. A la planta de gas la para la detonación —42 bajas en solitario, más que cualquier otro criterio en cualquier otra máquina—; al motor de competición la detonación **no lo toca ni una vez** en 210 configuraciones y lo para la presión; al turbo lo paran a la vez la detonación y la ventana del catalizador; y a la motocicleta, la temperatura de escape.

### Renunciar a eficiencia no es un error del alumno: es el pliego

| Máquina | Mejor η al freno | Qué incumple | Firmada | Renuncia |
|---|---|---|---|---|
| Motocicleta | r 13 / 10° / 1,00 → 38,39 % | Presión máxima | 38,23 % | 0,15 pts |
| Sedán | r 12 / 10° / 1,00 → 38,12 | Presión máxima | 37,42 | 0,70 |
| Planta de gas | r 14 / 10° / 1,00 → 38,86 | Detonación (I = 1,690) | 37,61 | **1,25** |
| Turbo GDI | r 11 / 16° / 1,10 → 38,78 | Detonación (I = 1,745) **y** ventana de λ | 36,58 | **2,21** |
| Competición | r 14 / 10° / 1,00 → 40,60 | Presión máxima (80,89 bar contra 78) | 39,89 | 0,71 |

> **En ninguna de las cinco** la calibración más eficiente es firmable, y en el turbo la distancia es de más de dos puntos. Ésta es la lección que no cabe en una fórmula: el óptimo de un pliego **no es el óptimo de una función**.

### El dinero como desempate

El coste es el combustible que consume la carga anual real de cada máquina durante cinco años: `C = 5·W_año·3,6·10⁶/(η_b·LHV)/ρ·precio`.

| Máquina | Válidas | Óptima | La válida más cara | Diferencia |
|---|---|---|---|---|
| Motocicleta | 6 | 2 545 € | 2 661 € | +116 € |
| Sedán | 3 | 22 163 | 22 797 | +633 |
| Planta de gas | 14 | 182 706 | 202 748 | **+20 042** |
| Turbo GDI | 4 | 22 047 | 23 063 | +1 016 |
| Competición | 24 | 4 239 | 5 238 | +999 |

---

## Modos del simulador

- **EL CICLO CERRADO.** La traza p–V y p–θ del ciclo completo con el frente de llama, el manómetro de cilindro, la integral de detonación creciendo bajo la curva y las veinte filas de telemetría. El techo de aire frío se dibuja al lado, para que la brecha se vea y no se cuente.
- **EL BARRIDO DE r.** La eficiencia y la integral de detonación contra la relación de compresión, con la **banda roja de lo mecánicamente imposible** pintada más allá del `r_máx` de la máquina. Es donde se ve que la eficiencia sube después del muro.
- **LA MEZCLA.** El barrido de λ con las **dos** eficiencias —indicada y al freno— y las presiones medias debajo. Los dos máximos caen en λ distintos en cuatro de las cinco máquinas.
- **EL CENSO DEL PLIEGO.** Las configuraciones de la máquina pasadas por los siete criterios, con la columna de **bajas totales** al lado de la de **suspensos en solitario**.
- **EL RETO.** Se sortea una máquina y arrancas con la calibración mal puesta. Si no vale, el diagnóstico da la **cifra y el límite** del criterio caído; si vale pero no es la más barata de alimentar, compara costes. Nunca da la respuesta.

### Qué dicen —y qué no dicen— las pistas

Las tres pistas destapan **un mando cada una** —relación de compresión, luego mezcla, luego avance— y ninguna da la terna. El embudo real:

| Máquina | Válidas | Tras la 1.ª (r) | Tras la 2.ª (λ) | Tras la 3.ª (avance) |
|---|---|---|---|---|
| Motocicleta | 6 | 2 | **2** | **1** |
| Sedán | 3 | **1** | 1 | 1 |
| Planta de gas | 14 | 3 | 2 | **1** |
| Turbo GDI | 4 | **1** | 1 | 1 |
| Competición | 24 | 6 | 2 | **1** |

> En la **motocicleta** la segunda pista no descarta nada: sus dos candidatas ya comparten λ = 1,10, y quien decide es la tercera. En el **sedán** y en el **turbo** la primera pista deja ya una sola candidata, de modo que las otras dos no aportan. Se dice aquí porque el alumno tiene derecho a saber cuándo la ayuda deja de serlo.

---

## Qué NO modela

- **El lazo abierto.** No se simulan la admisión ni el escape: el ciclo va de IVC a EVO. El bombeo es un modelo de presiones medias, no un bucle integrado, y por eso la telemetría lo llama `pmep` y no «trabajo de bombeo medido».
- **La geometría de la cámara.** No hay squish, ni tumble, ni swirl, ni posición real de la bujía: la turbulencia es una fracción fija de la velocidad media del pistón. Dos culatas distintas con la misma r darían aquí el mismo resultado, y en el banco no.
- **El modelo de dos zonas.** La cámara es **una sola masa** con γ ponderado por `x_b`; el gas sin quemar sólo se sigue por compresión isentrópica para alimentar la integral de detonación. El frente de llama que se dibuja es didáctico y sigue a `x_b`, no tiene posición física.
- **La química de la combustión.** No hay mecanismo cinético, ni especies, ni equilibrio: hay una función de Wiebe. Por lo mismo **no hay emisiones** —ni NOx, ni CO, ni hidrocarburos, ni hollín—, y cualquier discusión sobre λ y contaminación queda fuera. El catalizador entra sólo como **criterio** de ventana de λ, no como dispositivo.
- **La sobrealimentación.** Los 145 kPa del turbo son un dato del enunciado, no la salida de un compresor: no hay mapa, ni desfase, ni intercooler, ni regulación de descarga.
- **La dispersión cíclica.** La combustión es determinista: el mismo punto da siempre el mismo ciclo. Un motor real reparte varios grados de ciclo a ciclo, y esa dispersión es justo la que obliga a dejar margen frente a la detonación.
- **El daño por detonación.** Livengood-Wu dice **cuándo** se autoenciende la mezcla, no cuánto daña, ni cuánto ruido hace, ni si un control por sensor de picado llegaría a retrasar el encendido. El preencendido y el LSPI tampoco están.
- **El régimen variable, las fugas y el desgaste.** Cada máquina se evalúa a **un solo régimen**: no hay curva de par contra revoluciones. La masa atrapada es constante entre IVC y EVO —sin blow-by ni consumo de aceite—, la temperatura de pared es fija, y no hay depósitos en la cámara, ni altitud, ni transitorios.
- **La economía real.** Precios, cargas anuales y horas de servicio son valores de proyecto representativos, no cotizaciones: sirven para **ordenar** alternativas, no para presupuestar. Tampoco se corrigen las potencias a SAE J1349 ni a ISO 1585.

---

## Verificación

**Capa 1 — motor sellado, 71 825 comprobaciones, 0 fallos** (`scratchpad/motor_otto.mjs`, `test_otto.mjs`, en doce bloques): la geometría de biela-manivela y su volumen instantáneo contra el cálculo directo, la relación efectiva en el cierre de admisión, la tabla de c_p y las dos correlaciones de γ con su ponderación por fracción quemada, la ley de Wiebe y su duración calculada a partir de la llama laminar de Metghalchi-Keck y la turbulenta por Damköhler, la convergencia del RK4 frente a paso mitad, el balance de energía del ciclo cerrado, la transferencia de Woschni acumulada en cada subpaso, el punto fijo del gas residual acoplado a la temperatura de escape, el enfriamiento evaporativo y el desplazamiento de aire por tipo de inyección, el retardo de Douaud-Eyzat con su prefactor declarado y la integral de Livengood-Wu cortada al 90 % de masa quemada, la fricción de Chen-Flynn y el bombeo en presiones medias, la monotonía de la eficiencia con r y su cruce con el muro de detonación, los siete criterios sobre las 870 configuraciones, el censo completo de bajas totales y suspensos en solitario, la unicidad de la solución de cada máquina y el embudo de las tres pistas.

**Capa 2 — laboratorio construido en un navegador real, 46 626 comprobaciones, 0 fallos** (`scratchpad/pw_otto.mjs`): superficie de depuración, constantes publicadas, catálogo de máquinas y combustibles campo por campo, **contraste cifra a cifra de las 870 configuraciones contra el motor sellado**, censo del pliego, solución y embudo de pistas de las cinco máquinas, el barrido de r con su banda de imposibilidad mecánica, el barrido de λ con sus dos eficiencias, la telemetría de cada modo contra el motor, el formato sellado de cifras, el banco tridimensional con sus catorce piezas inspeccionables, el cuestionario con su baraja y su bloqueo, el reto —que empieza mal, no se cierra con una válida cara y sí con la óptima—, el recorrido guiado completo y el barrido final por los cinco modos y las cinco máquinas.

> Regla de la casa aplicada sin excepción: **toda cifra citada en la prosa —ficha, briefing, catálogo, informe y cuestionario— está rederivada del motor sellado**, y las unidades se leen del motor, nunca del nombre de la variable.
