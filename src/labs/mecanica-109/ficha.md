# MEC-109 · Audita las fugas de una red de aire comprimido

- **Dominio:** D4 · Hidráulica y Neumática
- **Práctica del backlog:** d4-A3 — *Audita las fugas y la eficiencia de una red de aire comprimido* (molde S)
- **Simulador:** `/labs/fugas-red-aire-comprimido.html`
- **Slug:** `fugas-red-aire-comprimido`
- **Ancla curricular:** UAX Fluidos · MEC-III
- **Fuentes de referencia:** Saint-Venant y Wantzel (1839) · Darcy (1857) · Weisbach (1845) · Reynolds (1883) · Colebrook–White (1939) · ISO 8573-1 (calidad del aire) · ISO 1217 (caudal del compresor) · ISO 7183 (secadores) · UNE-EN 60204-1

---

## Qué enseña

1. Que **una fuga no tiene un caudal escrito en una tabla: es un orificio compresible**. Se resuelve por Saint-Venant–Wantzel con sus dos ramas, y como la relación crítica del aire vale **0,528 282**, toda fuga a la atmósfera desde más de **0,9045 barg** —que es 1,013/0,528 282 menos la atmosférica— descarga **bloqueada**, a velocidad sónica. En las cinco consignas del laboratorio (6,0 a 8,0 barg) las 40 fugas están bloqueadas sin excepción.
2. Que **el diámetro y la presión no entran igual**. Doblar el diámetro de 1 a 2 mm multiplica el escape por **4,000 000 exactamente** —el área va con el cuadrado— pero subir la consigna de 6,0 a 8,0 barg sólo lo multiplica por **1,285 185**, que es **9,013/7,013**, el cociente de las presiones **absolutas**, y no por el 1,333 333 de la regla de tres con el manómetro. Bajar un bar ahorra menos de lo que parece.
3. Que **el detector ultrasónico es logarítmico**. Un racor de 1 mm a 7 barg pierde **48,1 Nl/min** y marca **53,6 dB**; el mismo racor abierto a 2 mm pierde **192,5** y marca **65,7**. La diferencia es de **12,04 dB**, no de 6, porque el modelo del aparato es `40 + 20·log₁₀(q/10)`: cuadruplicar el caudal son doce decibelios.
4. Que **la presión se pierde donde nadie mira**. En el taller, el ramal de las pistolas de soplado pierde **0,0034 bar** en sus 8 m de tubo DN15 y el terminal de máquina —enchufe rápido, manguera y regulador, **8,0 mm²** de paso frente a los 203,6 del ramal— pierde **0,3062**: **noventa veces más**. Por eso el criterio de presión se juzga **después** del terminal, y por eso es el que más combinaciones tumba de todo el barrido (**3 288** de 6 400) y el que más decide él solo (**1 954**).
5. Que **la consigna toca al secador**. Su capacidad se deratea con la presión absoluta: en el laboratorio de ensayos cae de **1,2935 a 1,0065 Nm³/min** al bajar de 8,0 a 6,0 barg, mientras el caudal sólo baja de **1,3032 a 1,1866**. Bajar la consigna para ahorrar puede dejar el aire sin secar, y en ese laboratorio el margen del secador ya es **negativo** en la situación de partida (**−0,0527 Nm³/min**).
6. Que **medir una fuga es mucho más difícil que calcularla**. El ensayo de caída del depósito sólo ve lo que queda colgado del tronco con la planta parada —**2 de las 8** fugas del taller— y encima estima mal lo que ve: la caída es exponencial y la fórmula lineal no devuelve el caudal inicial sino la **media logarítmica**. Declara **95,8 Nl/min** contra **548,9** reales: un **−82,55 %**.
7. Que **un ensayo que acierta por casualidad no es un ensayo bueno**. El de ciclos carga/vacío ve la red entera pero mide a la presión media del ciclo, un **−5,66 %** por debajo, y sin embargo clava el total del taller con un **+0,02 %**, porque dos errores de signo contrario se cancelan. Con la misma pareja de ensayos, en la nave exterior los errores son **−94,78 %** y **+7,29 %**: la cancelación no se repite.
8. Que **arreglarlo todo no es la respuesta**. En el taller la óptima repara **cinco de las ocho** fugas y baja la consigna de 8,0 a 7,0 barg: **477,60 €** de inversión, **1 403,76 €/año** de ahorro, **4,08 meses** de retorno y **22 430,62 €** de coste a cinco años frente a los **28 971,83** de no tocar nada, un **22,58 % menos**. Añadir la unión roscada de 12 € tumba el montaje entero, porque la ventana pasa de **4,8 a 5,3 h** y el límite son **5,0**.
9. Que **el criterio que decide no es el que se enseña**. De las 6 400 combinaciones, el caudal del compresor tumba **25**, la capacidad del secador **391** y el plazo de retorno **308**, y **ninguno de los tres decide jamás en solitario**; la ventana de paro de máquina tumba **1 280** y decide **469 ella sola**.

---

## Lógica (verificada en `scratchpad/motor_fugas.mjs` + `verif_fugas.mjs`, 141 602 comprobaciones, 0 fallos)

### Constantes selladas

| Símbolo | Valor | Qué es |
|---|---|---|
| `P_ATM` | 1,013 bar | Atmósfera de referencia |
| `R_AIRE` / `K_AIRE` | 287 J/(kg·K) / 1,4 | Constante del aire y cociente de calores específicos |
| `T_K` | 293,15 K | Temperatura de línea y de aspiración (20 °C) |
| `MU` | 1,82·10⁻⁵ Pa·s | Viscosidad dinámica del aire a 20 °C |
| `RHO_N` | `P_ATM·10⁵/(R·T)` | Densidad en condiciones de referencia |
| `CD` | 0,65 | Coeficiente de descarga de orificio de borde vivo |
| `EPS_TUBO` | 0,045 mm | Rugosidad del acero estirado |
| `ETA_COMP` | 0,55 | Rendimiento global isotérmico → eje → red eléctrica |
| `EUR_KWH` / `EUR_HORA` | 0,18 €/kWh · 42 €/h | Energía y mano de obra de mantenimiento |
| `ANIOS` | 5 | Horizonte del coste de propiedad |
| `DP_SEC_NOM` / `P_SEC_REF` | 0,20 bar · 7,0 barg | Pérdida del secador a caudal nominal y presión a la que se declara |
| `DB_REF` / `DB_0` | 10 Nl/min · 40 dB | Curva declarada del detector ultrasónico |
| `CONSIGNAS` | 6,0 · 6,5 · 7,0 · 7,5 · 8,0 barg | Las cinco consignas de proyecto |
| `R_CRIT` | 0,528 281 787 717 174 | `(2/(k+1))^(k/(k−1))` — relación crítica de presiones |

### El orificio compresible

`ṁ = C_d·A·p₁·√(k/(R·T))·(2/(k+1))^((k+1)/(2(k−1)))` mientras `p₂/p₁ ≤ r_crít` (**bloqueado**), y la rama subsónica de Saint-Venant por encima. El gasto se pasa a Nl/min con `RHO_N`. Consecuencias que el laboratorio explota:

| Comprobación | Valor | Por qué |
|---|---|---|
| `q(2 mm)/q(1 mm)` a 7,0 barg | **4,000 000** exacto | El área va con `d²` y entra elevada a uno |
| `q(8,0)/q(6,0)` con 1 mm | **1,285 185** | Es `9,013/7,013`, presiones **absolutas** |
| El mismo cociente con el manómetro | 1,333 333 | **No es el que aplica** — error del 3,8 % |
| Umbral de bloqueo | **0,9045 barg** | `P_ATM/R_CRIT − P_ATM` |
| `dB(2 mm) − dB(1 mm)` | **12,04 dB** | `20·log₁₀ 4`, no `10·log₁₀ 4` |

### La red, resuelta por punto fijo

Compresor → secador → tronco → ramal de zona → terminal de máquina. Cada iteración recalcula el caudal (consumo declarado + fugas, que dependen de la presión de su tramo), y con él las caídas, y con ellas las presiones, hasta que ninguna zona se mueve. Los tramos usan **Darcy–Weisbach** con `f = 64/Re` por debajo de Re 2 000 y **Colebrook–White** por punto fijo por encima, evaluando la densidad del aire **a la presión de cada tramo**. El terminal de máquina se resuelve por **bisección** sobre el gasto que ha de pasar por su sección equivalente. La presión que juzga el criterio es la de **después** del terminal.

### Las cinco plantas

| Planta | Compresor | h/año | Consigna base | Tronco | Secador | Depósito | Ventana | Paro | Objetivo | Retorno máx |
|---|---|---|---|---|---|---|---|---|---|---|
| Taller mecánico | 2,35 Nm³/min | 2 000 | 8,0 barg | 45 m DN20 | 3,20 Nm³/min | 500 L | 5,0 h | **0,0 h** | 600 € | 9 meses |
| Línea de embalaje | 6,00 | 6 000 | 7,5 | 130 m DN32 | 6,00 | 1 000 L | 4,0 h | 4,0 h | 3 000 € | 4 meses |
| Cabina de pintura | 4,50 | 4 000 | 8,0 | 60 m DN25 | 3,60 | 750 L | 4,0 h | 3,0 h | 2 200 € | 6 meses |
| Laboratorio de ensayos | 1,50 | 3 000 | 7,5 | 30 m DN15 | 1,15 | 300 L | 4,0 h | 4,0 h | 450 € | 10 meses |
| Nave exterior | 3,60 | 1 800 | 8,0 | 140 m DN25 | 4,50 | 900 L | 5,0 h | 5,0 h | 1 100 € | 8 meses |

Cada planta tiene **cinco zonas** con su consumo declarado, su presión mínima de pliego, su ramal y su terminal, y **ocho fugas** con tipo, diámetro, ciclo de trabajo, horas de reparación, precio de repuesto, si exige **parar la máquina** y si cuelga del **tronco** (lo único que ve el ensayo de depósito).

### Situación de partida, planta a planta

| Planta | q total | Fuga | % | Potencia | Energía/año | Δp secador | Δp tronco | Margen secador |
|---|---|---|---|---|---|---|---|---|
| Taller | 2 398,9 Nl/min | 548,9 | 22,9 % | 16,10 kW | 5 794 € | 0,0888 bar | 0,4099 bar | +1,2005 Nm³/min |
| Embalaje | 4 836,0 | 986,0 | 20,4 % | 31,60 kW | 34 128 € | 0,1151 | 0,3621 | +1,5384 |
| Pintura | 3 608,9 | 808,9 | 22,4 % | 24,21 kW | 17 434 € | 0,1589 | 0,3731 | +0,4404 |
| Laboratorio | 1 274,4 | 434,4 | **34,1 %** | 8,33 kW | 4 497 € | 0,2176 | 0,4010 | **−0,0527** |
| Exterior | 3 716,3 | 916,3 | 24,7 % | 24,93 kW | 8 079 € | 0,1078 | 0,9168 | +1,3453 |

### Dónde se pierde la presión (taller, 8,0 barg, sin reparar)

| Zona | q declarado | q fuga | q total | Δp ramal | Δp terminal | Relación | p útil / p mín |
|---|---|---|---|---|---|---|---|
| Bancos de montaje | 400,0 | 166,0 | 566,0 | 0,0107 | 0,3508 | ×32,9 | 7,140 / 5,0 |
| Cabina de granallado | 700,0 | 63,9 | 763,9 | 0,0082 | 0,4236 | ×51,7 | 7,070 / 5,5 |
| Llaves de impacto | 250,0 | 51,1 | 301,1 | 0,0097 | 0,3065 | ×31,4 | 7,185 / 6,2 |
| Prensa neumática | 300,0 | 255,2 | 555,2 | 0,0171 | 0,3681 | ×21,5 | 7,116 / 5,0 |
| Pistolas de soplado | 200,0 | 12,8 | 212,8 | 0,0034 | 0,3062 | **×90,1** | 7,192 / 4,0 |

> El ramal que **más** caudal lleva no es el que más pierde: el terminal de la pistola de soplado, que sólo transporta 212,8 Nl/min, pierde treinta veces más que el ramal de los bancos, que transporta 566,0. Lo que manda es la sección de paso, no el caudal.

### Los tres ensayos de auditoría

| Ensayo | Qué ve | Qué declara (taller) | Error | Por qué |
|---|---|---|---|---|
| Caída del depósito | Sólo lo colgado del tronco: **2 de 8** | 95,8 Nl/min | **−82,55 %** | La caída es exponencial; la fórmula lineal devuelve la **media logarítmica**, no el caudal inicial |
| Ciclos carga/vacío | La red entera | +0,02 % sobre el total | ≈ 0 **por casualidad** | Mide a la presión media del ciclo (−5,66 %), y ese sesgo cancela al contrario |
| Censo ultrasónico | Las 8, una a una | El valor exacto | — | Es la referencia contra la que se juzgan los otros dos |

En la **nave exterior**, con los mismos dos ensayos, los errores son **−94,78 %** y **+7,29 %**: la cancelación del taller no era una propiedad del método, era una coincidencia aritmética.

### Los siete criterios y el censo del barrido

Barrido completo: **5 plantas × 256 conjuntos de reparación × 5 consignas = 6 400** combinaciones. Pasan las siete a la vez **1 175** (196 · 266 · 207 · 374 · 132).

| Criterio | Tumba | Decide él solo |
|---|---|---|
| Presión en el punto de uso | **3 288** | **1 954** |
| Caudal del compresor | 25 | **0** |
| Capacidad del secador | 391 | **0** |
| Ventana de mantenimiento | 570 | 264 |
| Ventana de paro de máquina | 1 280 | 469 |
| Objetivo de ahorro | 1 273 | 772 |
| Plazo de retorno | 308 | **0** |

> Tres criterios —caudal, secado y retorno— **nunca** deciden en solitario: cuando tumban una combinación, siempre hay otro que también la tumba. Es un hecho del censo, no una opinión, y desmonta la costumbre de dimensionar mirando sólo el compresor.

### La ventana de paro no es la misma restricción en las cinco plantas

En el **taller** la ventana de paro es **cero** y hay una sola fuga que exige parar (la junta de cilindro, 3 h). Ahí, «tapar esa fuga» y «pasarse de ventana de paro» son literalmente el mismo conjunto de **640 intervenciones**: es un teorema, no una casualidad. En las otras cuatro plantas la ventana da para algo, y de hecho **las cuatro óptimas reparan una fuga que exige parar** (f4 con 3,5 h en embalaje, f4 con 2 h en pintura, f8 con 2,5 h en laboratorio y f1 con 4 h en la nave exterior). La única que no puede es la del taller.

### Las cinco soluciones óptimas

| Planta | Repara | Consigna | Inversión | Ahorro/año | Retorno | Coste 5 años | Sin tocar nada | Δ |
|---|---|---|---|---|---|---|---|---|
| Taller | 5 de 8 | 8,0 → **7,0** | 477,60 € | 1 403,76 € | 4,08 meses | 22 430,62 € | 28 971,83 € | **−22,58 %** |
| Embalaje | 6 de 8 | 7,5 → **7,0** | 543,00 € | 7 087,00 € | 0,92 meses | 135 748,10 € | 170 640,12 € | −20,45 % |
| Pintura | 7 de 8 | 8,0 → **7,5** | 413,60 € | 3 985,25 € | 1,25 meses | 67 658,67 € | 87 171,33 € | −22,38 % |
| Laboratorio | 5 de 8 | 7,5 → **7,0** | 638,00 € | 1 473,31 € | 5,20 meses | 15 756,20 € | 22 484,75 € | **−29,92 %** |
| Exterior | 6 de 8 | 8,0 → **7,5** | 596,80 € | 1 822,52 € | 3,93 meses | 31 878,91 € | 40 394,68 € | −21,08 % |

**Ninguna de las cinco empata con nadie**: hay tantos costes de propiedad distintos como intervenciones válidas, de modo que el óptimo es único por construcción y no por redondeo. Y en ninguna de las cinco la respuesta es «repararlo todo».

---

## Modos del simulador

- **FUGA.** Una fuga a la vez, con su régimen —bloqueado o subsónico—, su caudal, su nivel sonoro y su coste anual. Aquí se comprueban las dos leyes del orificio y se ve por qué la presión entra en primera potencia.
- **RED.** La red entera resuelta por punto fijo, zona a zona: caudal declarado, caudal de fuga, caída de ramal, caída de terminal y presión en el punto de uso contra la que exige el pliego.
- **ENSAYO.** Los tres métodos de auditoría enfrentados al censo real, con su sesgo declarado y su explicación.
- **CATÁLOGO.** El barrido completo de la planta: 256 conjuntos de reparación × 5 consignas, con el censo de criterios y el coste de propiedad de cada combinación.
- **RETO.** Se sortea una planta y arrancas con el plan mal puesto. Eliges qué fugas reparas y a qué consigna dejas el compresor. Si el plan no vale, el diagnóstico da la **cifra y el límite** del criterio caído; si vale pero no es el óptimo, compara costes. Nunca da la respuesta.

### Qué dicen —y qué no dicen— las pistas

Las tres pistas destapan **un eje cada una**: la consigna a la que trabaja el óptimo, cuántas fugas repara y cuál es la fuga que más se repite entre los planes válidos. Ninguna es una promesa: en las cinco plantas **hay planes válidos que no reparan la fuga que anuncia la tercera pista**. Y con las tres sobre la mesa siguen quedando candidatos por decidir:

| Planta | Válidas | Tras la 1.ª | Tras la 2.ª | Tras la 3.ª |
|---|---|---|---|---|
| Taller | 196 | 52 | 17 | **15** |
| Embalaje | 266 | 136 | 4 | **2** |
| Pintura | 207 | 133 | **1** | 1 |
| Laboratorio | 374 | 121 | 34 | **31** |
| Exterior | 132 | 87 | 12 | **10** |

> En **pintura** —y sólo en pintura— las dos primeras pistas ya dejan un único plan válido. Se dice aquí porque el alumno tiene derecho a saber cuándo la ayuda deja de serlo.

---

## Qué NO modela

- **La termodinámica real del compresor.** La potencia es la **isotérmica** de compresión corregida por un rendimiento global de grupo (0,55). No hay etapas, ni refrigeración intermedia, ni curva de carga/vacío del motor.
- **La dinámica del arranque y la parada.** El ensayo de ciclos usa el reparto carga/vacío como dato de proyecto; no simula el arranque del motor ni el control del compresor.
- **La calidad del aire aguas abajo.** El secador se juzga por capacidad derateada con la presión; no se modelan clases ISO 8573-1, ni punto de rocío, ni el arrastre de aceite (eso es materia de MEC-101, unidad FRL).
- **El envejecimiento de las fugas.** Cada fuga tiene un diámetro fijo durante los cinco años del horizonte económico. En la realidad crecen.
- **La disponibilidad de repuestos ni la subcontratación.** La mano de obra es una tarifa única (42 €/h) y el repuesto un precio de catálogo.

---

## Verificación

**Capa 1 — motor sellado, 141 602 comprobaciones, 0 fallos** (`scratchpad/motor_fugas.mjs`, `verif_fugas.mjs`, `quiz_fugas.mjs`, `cofallo_fugas.mjs`, `empates_fugas.mjs`, `pista_fugas.mjs`): la ecuación del orificio y sus dos ramas, la relación crítica, la proporcionalidad exacta con el área y con la presión absoluta, la convergencia de la cascada de presiones, Colebrook sobre la densidad de la línea, la bisección del terminal, la potencia isotérmica, el derateo del secador, la media logarítmica de los dos ensayos de campo, la validez de los siete criterios sobre las 6 400 combinaciones, la unicidad del óptimo de cada planta y el censo completo de bajas totales y suspensos en solitario.

**Capa 2 — laboratorio construido en un navegador real, 539 comprobaciones, 0 fallos** (`scratchpad/pw_fugas.mjs`, 21 secciones): superficie de depuración, constantes publicadas, catálogo de plantas campo por campo, física del orificio en el navegador, **contraste cifra a cifra del barrido completo de 6 400 puntos contra el motor sellado**, censo de criterios, unicidad del óptimo, reparto ramal/terminal, los tres ensayos, el derateo del secador, el formato sellado de cifras, los cinco paneles, la telemetría, el informe, el cuestionario, el reto y sus siete explicaciones, las tres pistas y su embudo real, el escenario nuevo, las nueve piezas sin un solo `NaN`, el recorrido guiado completo y la escena 3D.

> Regla de la casa aplicada sin excepción: **toda cifra citada en la prosa —ficha, briefing, catálogo, informe y cuestionario— está rederivada del motor sellado**, y las unidades se leen del motor, nunca del nombre de la variable.
