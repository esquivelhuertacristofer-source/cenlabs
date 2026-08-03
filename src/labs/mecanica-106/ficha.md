# MEC-106 · Opera válvulas proporcionales con rampas y consignas

- **Dominio:** D4 · Hidráulica y Neumática
- **Práctica del backlog:** d4-14 — *Opera válvulas proporcionales con rampas y consignas* (molde S+P)
- **Simulador:** `/labs/valvulas-proporcionales-rampas-consignas.html`
- **Slug:** `valvulas-proporcionales-rampas-consignas`
- **Ancla curricular:** MEC-II.3
- **Fuentes normativas de referencia:** ISO 4411 · ISO 10770-1 · ISO 4413 · ISO 1219-1/2 · ISO 6403 · ISO 5598 · Merritt (1967)

---

## Qué enseña

1. Que una válvula proporcional **no es un grifo lineal**: entre la señal de la tarjeta y el aceite hay banda muerta, histéresis y tiempo propio, y las tres deciden si la máquina sirve.
2. Que el caudal de un canto se declara **a una caída nominal POR CANTO** (ISO 4411), `Q = Q_n·u·√(Δp_canto/Δp_n)`, y que **dos caudales nominales sólo se comparan si comparten Δp_n**: la servoválvula de 40 L/min a 35 bar es **más pequeña** que la NG16 de 60 a 5.
3. Que la velocidad del cilindro diferencial es una **raíz de la fuerza disponible**, no una recta: `v = (Q_n·u/√Δp_n)·√(ΔF/(A_a³+A_b³))` con `ΔF = p_S·A_a − p_T·A_b − F − F_r`.
4. Que **la válvula manda en la velocidad y NO manda en la presión**: `Δp_PA = ΔF·A_a²/Ω` y `Δp_BT = ΔF·A_b²/Ω` con `Ω = A_a³+A_b³` **no contienen ningún parámetro de la válvula**.
5. Que eso es medible y no retórico: en el carro de transferencia, de la NG6/4 a la NG16/60 la velocidad de tope salta **de 92,6 a 320,8 mm/s** y los manómetros marcan **38,73 y 48,93 bar en los cuatro casos**, con Δp_PA = 101,27 y Δp_BT = 45,93.
6. Que lo que sí mueve esas presiones es **el vástago**: `φ = A_a/A_b = 1,485` en el carro y el cociente de las dos caídas vale exactamente **φ² = 2,205**. La **intensificación es geometría, no mando**.
7. Que la característica estática tiene **banda muerta** (20 · 20 · 22 · 24 · 4 · 0,5 % en las seis válvulas) y que dentro de ella **la corredera se mueve y el vástago no**.
8. Que la histéresis es un **operador de juego**, no un error de precisión: subiendo `u = g(c − H/2)`, bajando `u = g(c + H/2)`. Con NG10 sin dither, una consigna del 60 % da **0,446 subiendo y 0,529 bajando**.
9. Que **ese operador de juego es el origen físico del retardo de parada**: al invertir hay que recorrer H entero antes de que la corredera empiece a cerrar.
10. Que el **dither sólo cura si la corredera puede seguirlo**: `a_ef = a/√(1+(f/f_v)²)`. Sobre la NG10 de 15 Hz, 12 % @ 40 Hz llega con **0,351** y 3 % @ 180 Hz con **0,083**.
11. Que la mejora es **saturante y nunca completa**, `H = h₀·máx(0,15; 1 − a_ef/8)`: la NG10 pasa de 6,50 a **3,08 / 4,53 / 5,78 / 6,30 %** con los cuatro presets.
12. Que el dither **se paga en rizado** del vástago, `r = v_libre·Δu/(2π·f)`, y por eso el óptimo de la sierra de cinta va **sin dither**.
13. Que los tiempos **no se suman aritméticamente sino en cuadratura**: `t_real = √(t_orden² + t_v²)` con `t_v = 0,35/f_v` — **38,9 ms** en la NG16 y **4,4 ms** en la servoválvula.
14. Que **alargar la rampa NO afina la parada: la empeora**, porque `t_hold` crece con la rampa y la velocidad de meseta no cambia.
15. Que la ventana de rampa está **acotada por los dos lados**: en el carro, 0,1 s da **141,0 bar** de pico contra un límite de 120 y 2,5 s da **29,8 mm** de error contra una tolerancia de 6. La única válida es **0,3 s**.
16. Que la velocidad de régimen es el **menor de dos topes**, `v = mín(v_válvula·u, Q_bomba/A_a)`: montar más válvula de la que la central alimenta no acelera nada.
17. Que con **carga negativa** (plataforma elevadora, F = −14 025 N) **las presiones se invierten** —19,0 bar en la entrada y 64,2 en el retorno— y la máquina retiene en vez de empujar.
18. Que de **2 250 configuraciones sólo 475** cumplen los siete criterios, y que el reparto por estación es **70 · 108 · 119 · 157 · 21**.
19. Que **los siete criterios deciden de verdad**: los siete suspenden en solitario alguna vez (391 · 93 · 82 · 66 · 58 · 37 · 25).
20. Que **uno pesa más que todos**: perdonar sólo la precisión de parada llevaría el catálogo **de 475 a 866** montajes válidos.
21. Que el **orden de decisión hay que declararlo ANTES de barrer**: en la prensa existe un montaje válido de **2,06 s** que pierde contra el óptimo de **2,10 s** porque cuesta **14 en vez de 9**.

---

## Lógica (verificada en `scratchpad/facts_prop.mjs`, 133 270 comprobaciones, 0 fallos)

### Constantes selladas

| Constante | Valor | Origen / significado |
|---|---|---|
| `DPN_DEF` | 5 bar | Caída nominal por canto del convenio de catálogo (ISO 4411) |
| `J_EXC` | 4 % | Salto de consigna que introduce la sobrecompensación |
| `A_REF` | 8 % | Dither efectivo que satura la mejora de la histéresis |
| `H_MIN_F` | 0,15 | Suelo: el dither **nunca** borra la histéresis del todo |
| `U_MIN` | 0,12 | Apertura mínima utilizable de la corredera |
| `C_MIN` | 5 % | Consigna mínima utilizable |
| `G_RISE` | 0,35 | `t_v = G_RISE/f_v`, subida 10-90 % de un primer orden |
| `P_T` | 3 bar | Contrapresión de retorno |
| `RHO` | 870 kg/m³ | Densidad del aceite de referencia |

### Catálogo de válvulas (valores de proyecto representativos, no de un modelo comercial)

| Clave | Rótulo | Q_n (L/min) | Δp_n (bar/canto) | b_m (%) | h₀ (%) | f_v (Hz) | t_v (ms) | Coste |
|---|---|---|---|---|---|---|---|---|
| `p04` | NG6 · 4 L/min | 4 | 5 | 20,0 | 6,0 | 30 | 11,67 | 6 |
| `p12` | NG6 · 12 L/min | 12 | 5 | 20,0 | 6,0 | 25 | 14,00 | 7 |
| `p24` | NG10 · 24 L/min | 24 | 5 | 22,0 | 6,5 | 15 | 23,33 | 9 |
| `p60` | NG16 · 60 L/min | 60 | 5 | 24,0 | 7,0 | 9 | 38,89 | 14 |
| `r24` | NG10 realimentada | 24 | 5 | 4,0 | 0,5 | 40 | 8,75 | 18 |
| `sv40` | Servoválvula 40@35 | 40 | 35 | 0,5 | 0,3 | 80 | 4,37 | 42 |

> La `r24` tiene **el mismo caudal nominal** que la `p24` y cuesta el doble: lo que se paga es la **realimentación de posición de la corredera**, que baja la banda muerta de 22 a 4 % y la histéresis de 6,5 a 0,5 %.

### Presets de dither de la tarjeta

| Clave | Rótulo | a (%) | f (Hz) | g sobre NG10 (15 Hz) | H resultante (%) | g sobre r24 (40 Hz) | H resultante (%) |
|---|---|---|---|---|---|---|---|
| `off` | sin dither | 0 | — | 0,000 | 6,500 | 0,000 | 0,500 |
| `d40` | 12 % @ 40 Hz | 12 | 40 | 0,351 | **3,077** | 0,707 | **0,075** |
| `d60` | 10 % @ 60 Hz | 10 | 60 | 0,243 | 4,529 | 0,555 | 0,153 |
| `d100` | 6 % @ 100 Hz | 6 | 100 | 0,148 | 5,777 | 0,371 | 0,361 |
| `d180` | 3 % @ 180 Hz | 3 | 180 | 0,083 | **6,298** | 0,217 | 0,459 |

### Rampas y compensación

- **Rampas** (s para 0-100 % de señal): `0,1 · 0,3 · 0,6 · 1,2 · 2,5`
- **Compensación de banda muerta**: `no` (sin compensar) · `si` (compensada) · `exc` (sobrecompensada, con salto `J_EXC` = 4 %)
- Pendientes de salida: `1` · `(100−b_m)/100` · `(100−b_m−4)/100` → **compensar no es gratis: cambia la ganancia**

### Las cinco estaciones

| Estación | Ø pistón/vástago | Carrera | F (N) | F_r (N) | m (kg) | p_S / p_lím (bar) | Q_bomba | t_máx | tol | rizado máx | ΔF (N) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Prensa de encolado | 100/56 mm | 400 mm | 38 000 | 900 | 2 500 | 160 / 210 | 110 L/min | 3,4 s | 1,5 mm | 0,35 mm | 85 146 |
| Carro de transferencia | 63/36 mm | 1 200 mm | 1 200 | 600 | 6 000 | 140 / 120 | 60 L/min | 5,5 s | 6,0 mm | 1,20 mm | 41 212 |
| Avance de sierra de cinta | 100/56 mm | 300 mm | 26 000 | 1 200 | 900 | 120 / 160 | 20 L/min | 30,0 s | 0,40 mm | 0,060 mm | 65 430 |
| Plataforma elevadora | 80/45 mm | 900 mm | **−14 025** | 1 500 | 1 430 | 150 / 110 | 55 L/min | 7,0 s | 4,0 mm | 0,80 mm | 86 892 |
| Unidad de dosificación | 40/22 mm | 90 mm | 3 200 | 250 | 45 | 100 / 140 | 18 L/min | 2,2 s | 0,25 mm | 0,050 mm | 8 853 |

### Cadena de cálculo

```
A_a = π·d_p²/4                          área del lado pistón
A_b = A_a − π·d_v²/4                     área anular
Ω   = A_a³ + A_b³        φ = A_a/A_b
ΔF  = p_S·A_a − p_T·A_b − F − F_r        fuerza neta disponible
k_v = (Q_n/60000)/√(Δp_n·1e5)            constante de la válvula (SI)
v_libre(u) = k_v·u·√(ΔF/Ω)               velocidad con la válvula sola
v_bomba    = (Q_b/60000)/A_a             tope impuesto por la central
v          = mín(v_libre(u), v_bomba)
Δp_PA = ΔF·A_a²/Ω     Δp_BT = ΔF·A_b²/Ω  ← SIN parámetros de válvula
p_A = p_S − Δp_PA     p_B = p_T + Δp_BT
c_ef = compensación(c, b_m, modo)
g(y) = clamp((y − b_m)/(100 − b_m), 0, 1)
u_sub = g(c_ef − H/2)   u_baj = g(c_ef + H/2)
a_ef = a/√(1 + (f/f_v)²)      H = h₀·máx(H_MIN_F, 1 − a_ef/A_REF)
r    = v_libre(1)·Δu/(2π·f)              rizado del vástago
t_v  = G_RISE/f_v        t_real = √(t_orden² + t_v²)
perfil: banda muerta → rampa → meseta → frenado (tramo a tramo)
t_hold = tiempo en cruzar H tras la orden de parar
disp   = v_meseta · t_hold               error de parada
p_pico = balance de energía de la masa en la deceleración disponible
```

### Los siete criterios

| Criterio | Qué exige | Falla (total) | Falla **él solo** |
|---|---|---|---|
| `okPos` | Error de parada ≤ tolerancia de la estación | **1 098** | **391** |
| `okCiclo` | Tiempo de ciclo ≤ t_máx | 527 | 58 |
| `okVel` | Velocidad de régimen ≥ la exigida | 495 | 66 |
| `okZona` | Apertura ≥ `U_MIN` y consigna ≥ `C_MIN` (zona de trabajo) | 450 | 82 |
| `okArr` | Arranque limpio: salto de velocidad ≤ `v_k` y tiempo muerto ≤ `t_dMax` | 443 | 93 |
| `okRizo` | Rizado del dither ≤ límite de la estación | 195 | 25 |
| `okPico` | Pico de presión de frenado ≤ p_lím | 45 | 37 |

> **Ninguno es decorativo**: los siete tumban alguna configuración ellos solos. Y **uno pesa más que todos**: perdonando sólo `okPos`, las válidas pasarían de **475 a 866**.

### Barrido y óptimos

**2 250 configuraciones** = 6 válvulas × 5 presets de dither × 5 rampas × 3 compensaciones × 5 estaciones. **475 válidas.**

| Estación | Óptimo | Coste | t_ciclo | Parada | Pico | Rizado | Válidas / 450 | Empates |
|---|---|---|---|---|---|---|---|---|
| Prensa de encolado | NG10 · 12 %@40 · 0,1 s · sobrecompensada | 9 | 2,095 s | 1,173 mm | 41,6 bar | 0,044 mm | 70 | **1** |
| Carro de transferencia | NG10 · 12 %@40 · 0,3 s · compensada | 9 | 4,156 s | 3,816 mm | 48,9 bar | 0,124 mm | 108 | **1** |
| Avance de sierra | NG6/4 · sin dither · 0,1 s · sobrecompensada | 6 | 21,469 s | 0,141 mm | 32,7 bar | 0,000 mm | 119 | **1** |
| Plataforma elevadora | NG6/12 · sin dither · 0,1 s · sobrecompensada | 7 | 6,492 s | 1,355 mm | 64,2 bar | 0,000 mm | 157 | **1** |
| Unidad de dosificación | NG6/4 · 10 %@60 · 0,1 s · sin compensar | 6 | 1,063 s | 0,238 mm | 28,6 bar | 0,026 mm | **21** | **1** |

**Orden lexicográfico declarado en pantalla antes de barrer:** coste del montaje → tiempo de ciclo → dispersión de parada → pico de presión. **Óptimo único en las cinco estaciones** (`empates = 1`).

**El caso que obliga a declararlo antes:** en la prensa, `NG16 · 12 %@40 · 0,1 s · sin compensar` es válido y cierra el ciclo en **2,056 s**, más rápido que el óptimo (2,095 s), pero cuesta **14 frente a 9**. Con el criterio declarado gana la barata; elegir el criterio después de ver el resultado es hacer trampa.

---

## Los cinco modos (molde S+P)

| Modo | Qué se manipula | Qué demuestra |
|---|---|---|
| **Consigna** | válvula · dither · compensación · consigna | La característica estática con sus DOS ramas y la banda muerta sombreada |
| **Carga** | estación · válvula · apertura | Que la velocidad cambia con la válvula y **las presiones no** |
| **Rampa** | estación · válvula · dither · rampa · compensación | El perfil completo y la ventana de rampa acotada por los dos lados |
| **Proyecto** | estación · el montaje entero | El censo de las 450 combinaciones de la faena, criterio por criterio |
| **Reto** | los cuatro ejes | Calificación por eje independiente + orden lexicográfico |

---

## Verificación

### Capa 1 — física (`scratchpad/facts_prop.mjs`)

**133 270 comprobaciones, 0 fallos.** Cubre: la ley de orificio y su consistencia en unidades de taller; la identidad del reparto de presiones frente al balance de fuerzas y **su independencia respecto de la válvula en las 2 250 configuraciones**; el operador de juego de la histéresis en las dos ramas; la monotonía y la saturación de la mejora por dither; la atenuación de primer orden frente a su forma cerrada; la suma en cuadratura de los tiempos; la coherencia del perfil de movimiento tramo a tramo con la carrera total; el recálculo independiente de los siete criterios con su censo de fallos en solitario; la unicidad del óptimo bajo el orden lexicográfico en las cinco estaciones; el formato sellado de cifras; y las ayudas del reto (arranque equivocado, corrección por ejes y diagnóstico por criterio).

**Transcripción al body** (`scratchpad/check_trans.mjs`): **123 935/123 935**. Re-importa el bloque MOTOR del `body.js` y lo compara campo a campo con el motor sellado sobre el barrido completo (43 magnitudes numéricas + 10 booleanos + lista de fallos por configuración), más `solucion`, `empates`, `ejeSolC`, `startCfg`, `f1` y `pc1`.

### Capa 2 — navegador real (`scratchpad/pw_prop.mjs`)

**280 aserciones, 0 fallos**, sobre Chromium contra `window.__labDebug`, en 20 bloques:

1. Carga limpia y superficie de depuración · 2. Catálogo publicado y **motor rederivado independientemente en Node** (150 filas × 20 magnitudes, tolerancia 1e-12) · 3. Identidad del reparto de presiones · 4. Dither, ancho de banda, histéresis efectiva y `t_v` · 5. Banda muerta, compensación y las dos ramas · 6. La ventana de rampa · 7. Los cinco óptimos y el orden lexicográfico · 8. Censo completo · 9. Los cinco modos, panel y controles · 10. Telemetría contra el motor · 11. Formato sellado `f1` · 12. Cuestionario (barajado, índice y bloqueo) · 13. El reto arranca equivocado en los cuatro ejes · 14. Válido pero caro NO cierra el reto · 15. La pista es honesta y no toca el montaje · 16. La animación sigue el perfil sellado · 17. Modo proyecto: el censo que se ve es el que calcula · 18. Los siete criterios se juzgan a la vez (cuatro barridos de un solo eje) · 19. Recorrido guiado completo · 20. Escena 3D e inspección de piezas.

> El bloque 2 **no copia** el motor del laboratorio: extrae los catálogos de la página y **rederiva las 20 magnitudes desde las leyes declaradas**, de modo que una errata de transcripción aparecería como desacuerdo de física y no como una coincidencia de instantánea.

---

## Qué NO modela (declarado en la ficha del alumno)

El lazo **cerrado** de posición con transductor y regulador (PID, error en permanente y estabilidad → **d4-A4**); la respuesta en frecuencia completa de la ISO 10770-1 con su Bode a −3 dB, aquí resumida en un solo `f_v`; la deriva del punto neutro con temperatura y presión, la asimetría entre sentidos y el solape real de los cantos; las fuerzas de flujo de Bernoulli sobre la corredera y la histéresis magnética del solenoide, englobadas en `h₀`; la **compresibilidad** del aceite y la elasticidad de las conducciones —el pico de frenado es un balance de energía en el instante de la deceleración, no la primera cresta de una oscilación amortiguada—; el golpe de ariete y las pérdidas de carga por Darcy–Weisbach (**d4-A2**); la válvula de frenado o contrapresión que impide descolgarse con carga negativa; el acumulador que sostendría la presión en un arranque rápido (**d4-A1**) y la curva del regulador de la bomba; la temperatura y la viscosidad como variables (**d4-13**); la contaminación del fluido; la arquitectura interna de las servoválvulas de dos etapas; y la parametrización digital por bus de campo.

Los datos de catálogo de las seis válvulas, los presets de dither, las rampas, el salto de la sobrecompensación, `t_v = 0,35/f_v`, el suelo y la saturación de la mejora por dither, la apertura y la consigna mínimas, la contrapresión de retorno y el campo «coste» son **valores de proyecto representativos**, no constantes medidas ni límites normativos, y se declaran como tales en la pantalla.

---

## Normas de referencia

- **ISO 4411** — Determinación de las características de caída de presión y caudal: el convenio de declarar `Q_n` a una `Δp_n` **por canto**.
- **ISO 10770-1** — Ensayo de válvulas de cuatro vías moduladas eléctricamente: umbral, banda muerta, histéresis, ganancia, deriva del punto neutro y respuesta en frecuencia.
- **ISO 4413** — Reglas generales y requisitos de seguridad de las transmisiones hidráulicas: la justificación de cada componente frente a las condiciones reales de servicio.
- **ISO 1219-1 / ISO 1219-2** — Símbolos gráficos y esquemas de circuito.
- **ISO 6403** — Caracterización estacionaria de válvulas de caudal y presión.
- **ISO 5598** — Vocabulario: banda muerta, umbral, histéresis, repetibilidad, ganancia y linealidad **no son sinónimos**.
- **H. E. Merritt**, *Hydraulic Control Systems* (Wiley, 1967) — cilindro diferencial con corredera simétrica y reparto de la caída con la relación de áreas al cuadrado.
