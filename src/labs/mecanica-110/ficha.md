# MEC-110 · Posiciona un actuador hidráulico en lazo cerrado

- **Dominio:** D4 · Hidráulica y Neumática
- **Práctica del backlog:** d4-A4 — *Posiciona un actuador hidráulico en lazo cerrado con válvula proporcional* (molde S)
- **Simulador:** `/labs/posicionamiento-actuador-lazo-cerrado.html`
- **Slug:** `posicionamiento-actuador-lazo-cerrado`
- **Ancla curricular:** UAX Fluidos · MEC-III
- **Fuentes de referencia:** Merritt, *Hydraulic Control Systems* (1967) · Blackburn, Reethof y Shearer, *Fluid Power Control* (1960) · Stribeck (1902) · Åström y Hägglund, *PID Controllers* (1995) · ISO 10770-1 (válvulas proporcionales, caudal a Δp nominal por land) · ISO 1219-1 (símbolos) · ISO 4413 (seguridad de transmisiones hidráulicas)

---

## Qué enseña

1. Que **la válvula no da fuerza: da caudal, y por una raíz cuadrada**. `Q = K_V·u·√Δp`, con `K_V = q_n/√Δp_N` deducida de la caída nominal por land que fija la ISO 10770-1, **Δp_N = 35 bar**. Las cinco válvulas del banco valen **6,76 · 3,04 · 2,03 · 10,65 · 8,45 L/(min·√bar)**. La consecuencia es que la ganancia del actuador **cambia con la carga**, y por eso una sintonía no se comporta igual antes y después de que la pieza toque.
2. Que **entre las dos cámaras hay un muelle y casi nada que lo amortigüe**. `k = β·(A₁²/V₁ + A₂²/V₂)` vale **42,84 N/µm** en la prensa sobre **420 kg**: **50,8 Hz** con **ζ = 0,021**. Las cinco máquinas van de **22,8 a 50,8 Hz** y de **ζ = 0,021 a 0,063**. Subir la ganancia no se paga con lentitud: se paga con **temblor**.
3. Que **el proporcional puro no se para donde el error es cero**. Se para donde el proporcional entrega **él solo** el mando que lo deja quieto, y ese mando son **dos sumandos**: cruzar el solape del carrete **más** abrir lo justo para reponer la fuga interna. `u_reposo = 100·(db + u_e·(1−db))` con `u_e = c_ip·(p₁−p₂)/(K_V·√(p_s−p₁))`. De ahí `e = u_reposo/kp`, y de ahí que **|e|·kp sea casi invariante**: **0,662 · 0,653 · 0,653 · 0,652 · 0,648 · 0,645 %** en los seis kp del banco de fatiga.
4. Que **esa ley se apoya en dos hipótesis y el laboratorio dice en voz alta cuándo se caen**. Si hay ciclo límite no hay pistón quieto que medir: la prensa a kp 18 oscila **4,6531 mm** frente a 0,30 admisibles y la desviación se dispara al **+513,26 %**. Si el mando de reposo cae **dentro** de la banda muerta no hay carrete abierto: la fresadora a kp 9, 13 y 18 pide **1,990, 1,788 y 1,461 %** contra un solape del **2,0 %**, el carrete cierra y el pistón se descuelga a **35,71 µm/s** sostenido sólo por el rozamiento. En las otras **26 de las 30** combinaciones la ley acierta **dentro del 5,51 %**.
5. Que **el proporcional solo no llega en ninguna de las cinco máquinas**, y con cuánto margen. Su mejor error contra la tolerancia: **0,2358/0,20 · 0,0812/0,05 · 0,0358/0,02 · 0,5042/0,20 · 0,2246/0,12 mm**. El kp que haría falta —`u_reposo/tolerancia`— es **15,2 · 40,4 · 31,2 · 45,3 · 33,6** frente a un catálogo que llega a 18: en la prensa la ganancia existiría, pero al llegar a ella el lazo **ya tiembla**.
6. Que **la fuga interna cambia de signo cuando entra la carga**. Sin carga el fondo está a **menos** presión que el anillo —porque A₁ > A₂ y el equilibrio pide `p₁·A₁ = p₂·A₂ + F`— y con carga se invierte. En la prensa, de **−14,9 a +34,8 bar** y de **17,85 a 41,77 cm³/min**; en la compuerta, de **−7,2 a +24,8 bar** y de **21,62 a 74,51**. Un centro cerrado **no es un tapón**.
7. Que **el anti-windup no se ve en el tiempo de establecimiento**. Apagado, el establecimiento **mejora** en las cinco máquinas mientras el sobrepaso se dispara: la prensa de **0,40 a 14,58 %** con 6 de máximo, la compuerta de **0,19 a 45,86 %** con **0,60** de máximo, con la punta en **375,03 mm** sobre una consigna de 320 y **seis de los siete** criterios caídos. Llegar antes al sitio equivocado no es ir más rápido.
8. Que **el pliego son siete criterios simultáneos**, y que contar bajas totales engaña. De las **480** sintonías del barrido sólo **66** pasan las siete, y **ninguna lleva ki = 0**. El sobrepaso tumba **163** y no decide **ninguna** él solo; el ciclo límite tumba **141** y tampoco; la presión tumba **77** y la carrera **70**, ninguna en solitario. El que decide es el **error con carga**: tumba 322 y decide **48**.
9. Que **el dinero es el desempate y manda el tiempo**. Las cinco ganadoras salen con **kd = 0** aunque **43 de las 66** válidas lleven derivada. En la prensa, de los **0,0214 €** que cuesta cada ciclo, **0,0184** son tiempo de máquina, 0,0024 desgaste del carrete y 0,0006 energía. Firmar la válida más cara en lugar de la óptima cuesta **+5 338 €** en el banco de fatiga y **+154 €** en la compuerta.

---

## Lógica (verificada en `scratchpad/motor_servo.mjs` + `verif_servo.mjs`, 1 619 987 comprobaciones, 0 fallos)

### Constantes selladas

| Símbolo | Valor | Qué es |
|---|---|---|
| `DT` / `TS` | 0,000 25 s · 0,001 s | Paso de integración y periodo del regulador (TS/DT = 4) |
| `T_FIN` / `T_CARGA` | 2,5 s · 1,2 s | Duración del ensayo y instante en que entra la carga |
| `W_SIN` / `W_CON` | [1,0 ; 1,2] s · [2,3 ; 2,5] s | Ventanas de medida del error **sin** y **con** carga |
| `W_CIC` | [2,0 ; 2,5] s | Ventana en la que se mide el ciclo límite |
| `DP_N` | 35 bar | Caída nominal **por land** a la que se declara `q_n` (ISO 10770-1) |
| `DP_LAM` | 0,30 bar | Umbral por debajo del cual el orificio se regulariza a régimen laminar |
| `V_STRIB` | 0,002 m/s | Velocidad de regularización del rozamiento de Coulomb |
| `BANDA` | 0,001 m | Banda de ±1 mm con la que se declara establecido |
| `TF_D` | 0,004 s | Filtro de primer orden de la derivada |
| `P_TANK` / `P_CAV` | 2,5 bar · 0,2 bar abs | Contrapresión de retorno y umbral de cavitación |
| `RHO_OIL` | 872 kg/m³ | Densidad del HLP 46 a 50 °C |
| `T_MANIP` | 0,8 s | Tiempo de manipulación que se suma al ciclo |
| `EUR_KWH` / `ETA_GRUPO` | 0,18 €/kWh · 0,78 | Energía y rendimiento del grupo |
| `EUR_CARRERA` | 0,0009 € | Desgaste por carrera completa equivalente del carrete |
| `ANIOS` | 5 | Horizonte del coste de propiedad |
| `KP_G` · `KI_G` · `KD_G` | 2·4·6·9·13·18 · 0·4·10·22 · 0·0,02·0,05·0,10 | Las 96 sintonías de catálogo de cada máquina |

### La válvula: orificio de raíz cuadrada y solape renormalizado

`Q = K_V·u_e·√Δp` con `K_V = q_n/√Δp_N`, y el solape **renormalizado, no recortado**:

`u_e = (|u| − db)/(1 − db)` con el signo de `u` si `|u| > db`, y **exactamente cero** si no.

Renormalizar significa que el 100 % de mando sigue dando el 100 % de apertura por encima del solape. Por debajo de `DP_LAM = 0,30 bar` la raíz se sustituye por una recta que empalma con continuidad, para que el paso no explote cuando las presiones se igualan.

### El cilindro: dos cámaras compresibles y un muelle

| Magnitud | Expresión | Qué decide |
|---|---|---|
| Áreas | `A₁ = πD²/4`, `A₂ = A₁ − πd²/4` | El reparto `p₁·A₁ = p₂·A₂ + F` en el equilibrio |
| Relación de áreas | `φ = A₁/A₂` | El signo del Δp en reposo y que el mismo mando dé velocidades distintas en cada sentido |
| Muelle hidráulico | `k = β·(A₁²/V₁ + A₂²/V₂)` | La rigidez del conjunto aceite-carga |
| Frecuencia y amortiguamiento | `ω_h = √(k/m)`, `ζ = b/(2√(k·m))` | Dónde empieza a temblar el lazo |
| Fuga interna | `q_L = c_ip·(p₁ − p₂)` | El segundo sumando del mando en reposo |
| Rozamiento | `b·v + f_c·tanh(v/v_S)` | Lo que sostiene el pistón cuando el carrete cierra |

### Las cinco máquinas

| Máquina | p_s | q_n | db | D/d × L | β | c_ip | m | f₀ → f₁ | x₀ → x_r | ciclos/año | €/h |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Prensa de embutición | 210 bar | 40 L/min | 3,0 % | 80/45 × 400 mm | 1,4 GPa | 2,0·10⁻¹³ | 420 kg | 4,12 → 26,0 kN | 120 → 200 mm | 120 000 | 58 |
| Mesa de fresadora | 160 | 18 | 2,0 % | 63/36 × 500 | 1,5 | 1,2·10⁻¹³ | 260 | 0,90 → 7,40 | 150 → 230 | 240 000 | 74 |
| Banco de fatiga | 210 | 12 | **0,5 %** | 50/28 × 250 | 1,6 | 1,5·10⁻¹³ | 300 | 0,30 → 9,80 | 70 → 120 | 900 000 | 96 |
| Compuerta de esclusa | 175 | 63 | **9,0 %** | 100/56 × 600 | 1,2 | 5,0·10⁻¹³ | 1 800 | 9,20 → 31,0 | 200 → 320 | 26 000 | 35 |
| Manipulador de forja | 230 | 50 | 4,0 % | 90/63 × 500 | 0,9 | 3,2·10⁻¹³ | 950 | 6,30 → 24,0 | 180 → 280 | 65 000 | 88 |

Y lo que de ahí sale, que es lo que el alumno mide:

| Máquina | A₁ | A₂ | φ | K_V | k | f_h | ζ |
|---|---|---|---|---|---|---|---|
| Prensa | 50,27 cm² | 34,36 | 1,463 | 6,76 L/(min·√bar) | 42,84 N/µm | 50,8 Hz | 0,021 |
| Fresadora | 31,17 | 20,99 | 1,485 | 3,04 | 24,18 | 48,5 | **0,063** |
| Banco de fatiga | 19,63 | 13,48 | 1,457 | 2,03 | 25,52 | 46,4 | 0,051 |
| Compuerta | 78,54 | 53,91 | 1,457 | 10,65 | 36,79 | **22,8** | 0,030 |
| Manipulador de forja | 63,62 | 32,44 | **1,961** | 8,45 | 24,13 | 25,4 | 0,031 |

### El regulador: PI-D digital con integración condicional

Se ejecuta cada **TS = 1 ms** sobre un modelo que se integra cada **DT = 0,25 ms**. La derivada actúa **sobre la medida**, no sobre el error, y va filtrada con `TF_D = 4 ms`, para que el escalón de consigna no dispare un impulso. La integración es **condicional**: si el mando sin saturar se ha ido más allá del ±100 % y el error empuja en el mismo sentido, el integrador **no acumula**. Las presiones se avanzan con paso **semi-implícito** y la mecánica con **Euler simpléctico**.

### La ley del mando en reposo y su alcance real

Desviación de `(medido − predicho)/predicho`, en las 30 combinaciones de máquina y ganancia:

| Máquina | kp 2 | kp 4 | kp 6 | kp 9 | kp 13 | kp 18 |
|---|---|---|---|---|---|---|
| Prensa | +0,43 % | +0,37 | +0,37 | +0,36 | +0,39 | **+513,26** |
| Fresadora | +1,56 | +0,17 | +0,20 | **−1,37** | **−11,39** | **−27,60** |
| Banco de fatiga | **+5,51** | +3,86 | +3,82 | +3,73 | +3,47 | +3,20 |
| Compuerta | +0,13 | +0,14 | +0,15 | +0,14 | +0,14 | +0,14 |
| Manipulador | +0,30 | +0,27 | +0,21 | +0,34 | +0,30 | +0,31 |

> Las **cuatro** casillas marcadas son exactamente los dos regímenes de fallo de las hipótesis, y **ninguna es un fallo del modelo**: son el modelo diciendo que la hipótesis se cayó. En la prensa a kp 18 el pistón no está quieto —ciclo límite de **4,6531 mm**—; en la fresadora a kp 9, 13 y 18 el carrete no está abierto —mando de reposo **por debajo** del solape del 2,0 %—.

### La fuga interna cambia de signo

Medida en el óptimo de cada máquina, promediando en las ventanas `W_SIN` y `W_CON`:

| Máquina | Δp sin carga | q_L sin carga | Δp con carga | q_L con carga |
|---|---|---|---|---|
| Prensa | −14,9 bar | 17,85 cm³/min | +34,8 bar | 41,77 cm³/min |
| Fresadora | −15,7 | 11,29 | +7,9 | 5,70 |
| Banco de fatiga | −24,5 | 22,06 | +29,8 | 26,79 |
| Compuerta | −7,2 | 21,62 | +24,8 | **74,51** |
| Manipulador | −16,5 | 31,74 | +18,4 | 35,26 |

### Lo que hace de verdad la antisaturación

Mismo trío de ganancias, con el anti-windup y sin él:

| Máquina | Sobrepaso | Máximo | Establecimiento | Pasos en el tope | Punta | Criterios caídos |
|---|---|---|---|---|---|---|
| Prensa | 0,40 → **14,58 %** | 6,00 | 0,344 → **0,292 s** | 256 → 304 | 211,67 mm (x_r 200) | 4 de 7 |
| Fresadora | 0,13 → 12,58 | 3,00 | 0,498 → 0,471 | 445 → 508 | 240,07 (230) | 4 de 7 |
| Banco de fatiga | 0,33 → 13,76 | 2,00 | 0,259 → 0,237 | 216 → 252 | 126,88 (120) | 4 de 7 |
| Compuerta | 0,19 → **45,86** | **0,60** | 0,556 → 0,498 | 457 → **712** | **375,03** (320) | **6 de 7** |
| Manipulador | 0,35 → 25,78 | 0,60 | 0,359 → 0,333 | 311 → 404 | 305,78 (280) | 5 de 7 |

> El establecimiento **mejora en las cinco**. Quien sintonice mirando ese número y sólo ese firmará el lazo peor de los dos.

### Los siete criterios y el censo del barrido

Barrido completo: **5 máquinas × 6 kp × 4 ki × 4 kd = 480** sintonías. Pasan las siete a la vez **66** (10 · 13 · 8 · 15 · 20), el **13,8 %**, y **ninguna lleva ki = 0**.

| Criterio | Qué mide | Tumba | Decide él solo |
|---|---|---|---|
| Sobrepaso | Punta sobre la consigna, en % | 163 | **0** |
| Establecimiento | Entrada definitiva en la banda de ±1 mm | 166 | 5 |
| Error sin carga | Media en [1,0 ; 1,2] s | 326 | 39 |
| Error con carga | Media en [2,3 ; 2,5] s | 322 | **48** |
| Ciclo límite | Pico a pico en [2,0 ; 2,5] s | 141 | **0** |
| Presión | Pico, cavitación y topes de cámara | 77 | **0** |
| Carrera del carrete | Recorrido acumulado del mando | 70 | **0** |

> **Cuatro** de los siete —sobrepaso, ciclo límite, presión y carrera— **nunca** deciden en solitario: cuando tumban una sintonía, siempre hay otro que también la tumba. El sobrepaso es el criterio que más se cita en una puesta en marcha y es, en este banco, el que menos decide.

### Las cinco soluciones óptimas

| Máquina | kp / ki / kd | Válidas | Sobrepaso | t_est | Error con carga | p_pico | Coste 5 años | La válida más cara |
|---|---|---|---|---|---|---|---|---|
| Prensa | **9 / 10 / 0** | 10 de 96 | 0,40 % | 0,344 s | 0,0014 mm | 111,0 bar | 12 843,28 € | +1 137 € |
| Fresadora | **18 / 10 / 0** | 13 | 0,13 | 0,498 | 0,0097 | 60,1 | 34 580,61 | +1 194 |
| Banco de fatiga | **18 / 22 / 0** | 8 | 0,33 | 0,259 | 0,0021 | 117,2 | 138 375,40 | **+5 338** |
| Compuerta | **9 / 22 / 0** | 15 | 0,19 | 0,556 | 0,0039 | 89,0 | 2 099,61 | +154 |
| Manipulador | **13 / 22 / 0** | 20 | 0,35 | 0,359 | 0,0191 | 83,0 | 10 301,04 | +816 |

Desglose del coste por ciclo en la prensa: **0,0006 €** de energía, **0,0024 €** de desgaste del carrete y **0,0184 €** de tiempo de máquina. La partida que manda es el **tiempo**, y por eso el óptimo no es la sintonía más suave sino la más rápida **de entre las que pasan el pliego**.

---

## Modos del simulador

- **EL LAZO.** El escalón de consigna con la carga entrando a los 1,2 s, la posición contra la banda de ±1 mm y, debajo, el mando de la válvula con sus topes. Al lado, el interruptor de la antisaturación, para verla fallar.
- **EL PROPORCIONAL PURO.** Sin integral, para medir dónde se para el pistón y contrastarlo contra la ley del mando en reposo — con las dos excepciones **declaradas en pantalla**, no escondidas.
- **LA FUGA INTERNA.** El caudal que se cuela entre cámara y cámara, su signo antes y después de la carga, y lo que ata el error del proporcional solo.
- **EL CENSO DEL PLIEGO.** Las 96 sintonías de la máquina pasadas por los siete criterios, con la columna de **bajas totales** al lado de la de **suspensos en solitario**.
- **EL RETO.** Se sortea una máquina y arrancas con las ganancias mal puestas. Si la sintonía no vale, el diagnóstico da la **cifra y el límite** del criterio caído; si vale pero no es la más barata de poseer, compara costes. Nunca da la respuesta.

### Qué dicen —y qué no dicen— las pistas

Las tres pistas destapan **un eje cada una** —kp, luego ki, luego kd— y ninguna da el trío. El embudo real:

| Máquina | Válidas | Tras la 1.ª | Tras la 2.ª | Tras la 3.ª |
|---|---|---|---|---|
| Prensa | 10 | 4 | 2 | **1** |
| Fresadora | 13 | 8 | 4 | **1** |
| Banco de fatiga | 8 | **8** | 2 | **1** |
| Compuerta | 15 | 5 | **1** | 1 |
| Manipulador | 20 | 7 | 3 | **1** |

> En el **banco de fatiga** la primera pista no descarta nada: sus ocho sintonías válidas ya comparten kp = 18. Y en la **compuerta** las dos primeras ya dejan una sola candidata, de modo que la tercera no aporta. Se dice aquí porque el alumno tiene derecho a saber cuándo la ayuda deja de serlo.

---

## Qué NO modela

- **La dinámica del carrete.** La válvula responde instantáneamente al mando: no hay solenoide, ni masa de carrete, ni ancho de banda de la etapa piloto, ni histéresis magnética. En una servoválvula real esa dinámica está en el mismo orden que la frecuencia hidráulica.
- **Las técnicas de un accionamiento comercial.** Compensación de banda muerta —que borraría de un plumazo el primer sumando del mando en reposo—, anticipación de velocidad y aceleración, ganancias programadas por tramo, perfilado de consigna con jerk limitado y control en cascada posición-velocidad. Aquí el regulador es un PID escueto **a propósito**, para que se vea de dónde sale cada milímetro de error.
- **La temperatura y la viscosidad.** El aceite se declara a 50 °C con un módulo de compresibilidad fijo por máquina; no hay calentamiento del depósito, ni cambio de viscosidad, ni aire disuelto —que es lo que de verdad hunde el β en una instalación real—.
- **La regla de posición.** Se lee la posición exacta: no hay cuantificación del encóder, ni ruido, ni retardo de la realimentación.
- **Las tuberías entre válvula y cilindro.** Los volúmenes muertos son un dato de catálogo por cámara; no hay longitud de línea, ni pérdidas, ni el modo de resonancia que introducen.
- **El grupo de presión.** `p_s` es una presión constante ideal: no hay bomba de caudal limitado, ni acumulador, ni caída de la limitadora (eso es materia de MEC-103 y de MEC-107).

---

## Verificación

**Capa 1 — motor sellado, 1 619 987 comprobaciones, 0 fallos** (`scratchpad/motor_servo.mjs`, `verif_servo.mjs`, `ficha_servo.mjs`, `banda_muerta_check.mjs`, `ley_banda_grid.mjs`): la ecuación del orificio y su regularización laminar, la renormalización de la banda muerta, el balance de caudales de las dos cámaras, el muelle hidráulico con su frecuencia y su amortiguamiento, el signo de la fuga interna antes y después de la carga, la convergencia del paso semi-implícito frente a paso reducido, la forma PI-D con derivada sobre la medida y la integración condicional, la ley del mando en reposo en las 30 combinaciones de máquina y ganancia **con sus dos regímenes de fallo identificados uno a uno**, la validez de los siete criterios sobre las 480 sintonías, el censo completo de bajas totales y suspensos en solitario, y la unicidad del óptimo de cada máquina.

**Capa 2 — laboratorio construido en un navegador real, 10 108 comprobaciones, 0 fallos** (`scratchpad/pw_servo.mjs`, 21 secciones): superficie de depuración, constantes publicadas, catálogo de máquinas campo por campo, **contraste cifra a cifra de las 480 sintonías contra el motor sellado**, censo del pliego, óptimo y embudo de pistas de las cinco máquinas, leyes del orificio y del solape, la ley del mando en reposo y sus dos regímenes anunciados en pantalla, el cambio de signo de la fuga interna, la antisaturación, los cinco paneles, la telemetría del modo lazo contra el motor, el formato sellado de cifras, el cuestionario con su baraja y su bloqueo, el reto —que empieza mal, no se cierra con una válida cara y sí con la mejor—, las etiquetas de inspección, el escenario nuevo, el lienzo 3D y el ratón, el recorrido guiado completo y el barrido final por los cinco modos y las cinco máquinas.

> Regla de la casa aplicada sin excepción: **toda cifra citada en la prosa —ficha, briefing, catálogo, informe y cuestionario— está rederivada del motor sellado**, y las unidades se leen del motor, nunca del nombre de la variable.
