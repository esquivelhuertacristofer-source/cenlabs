# MEC-96 · Mando directo e indirecto: diagrama espacio-fase

**Dominio:** D4 · Hidráulica y Neumática
**Práctica del backlog:** d4-04 — «Diseña mandos directo e indirecto con diagrama espacio-fase» — **Molde S** — **D4 4/18**
**Simulador:** `/labs/mando-directo-indirecto-espacio-fase.html`
**Slug de construcción:** `mando-directo-indirecto-espacio-fase`

---

## Qué enseña

1. **La diferencia entre mando directo e indirecto no es de estilo: es DÓNDE vive la válvula de potencia.** En directo, el órgano de mando y la válvula de potencia son la misma pieza y el tubo largo lleva **todo el caudal del cilindro**. En indirecto, la de potencia va junto al cilindro (0,3 m de tubo) y el tubo largo lleva sólo **pilotaje a 2,5 bar**.
2. **El indirecto se paga con una válvula más.** Directo monta tantas válvulas como señales; indirecto monta señales + 1. Ese es literalmente el primer campo del coste del reto.
3. **Las señales en serie se comen el caudal como `Qn/√n`.** Composición `1/Qn_eq² = Σ 1/Qn_i²`: dos señales cuestan **29,3 %** y tres **42,3 %**. En directo ese peaje cae sobre la **potencia**; en indirecto cae sobre el **pilotaje**, donde no estorba.
4. **La prensa de mando a dos manos es el caso puro de ese peaje.** Dos G 1/8 en directo dejan **247,5 l/min** efectivos y la estación pide **275,5**. En indirecto la válvula de potencia entrega sus **350** íntegros.
5. **La distancia mata al mando directo.** La puerta de la cabina, con **15 m** entre el puesto y la máquina, no tiene **ningún** tubo del catálogo que la salve en directo: los finos disparan la velocidad del aire, los gordos disparan el tiempo. No es cuestión de buscar mejor tubo — la arquitectura está mal elegida.
6. **En pilotaje, el criterio del tubo se INVIERTE.** Como el aire de trabajo ya no pasa por la línea larga, gana el tubo **más fino** del catálogo (Ø4, interior 2,5 mm): cada milímetro de más es volumen muerto que hay que llenar para nada.
7. **El indirecto no es «lo moderno».** La grapadora tiene **18 ternas válidas de 40** y la mínima es **directa**. Montar indirecto ahí es comprar una válvula que no hace falta.
8. **Por encima de 350 l/min el directo no es caro: es inexistente.** El volteador Ø80 pide **793,2 l/min** con K = 1,5 y el catálogo ya no ofrece órgano de mando manual a ese caudal. De las 40 combinaciones, **una sola** es válida.
9. **El método directo del diagrama espacio-fase tiene una convención y se declara:** cada movimiento lo ordena el final de carrera que alcanzó el movimiento anterior; el primero lo ordena la marcha.
10. **Un conflicto de señales no es una avería.** Es que la señal que ordena un movimiento y la que ordena el contrario están a 1 **a la vez**, con todos los componentes funcionando. El carrete recibe dos órdenes y la secuencia se para.
11. **Lo que decide si el método directo sirve es la FORMA de la secuencia, no la marcha.** Con marcha momentánea: anidada 2 conflictos, en serie 1, simple y cruzada 0.
12. **La marcha mantenida añade exactamente un conflicto a cada estación.** Las cinco pasan de {2, 1, 0, 0, 0} a {3, 2, 1, 1, 1}.
13. **El arreglo clásico quita un conflicto y NO quita el autoarranque.** Condicionar la primera orden a `m · posición de partida` devuelve las cinco estaciones al recuento de la momentánea, pero el autoarranque sigue en pie en **las cinco**. Eso pide cascada o memorias — es la práctica siguiente.
14. **La fase ordena; no cronometra.** Las cuatro fases del volteador ocupan lo mismo en la rejilla y duran de **0,060 a 0,417 s**; dos de ellas salen en el **tope de 1500 mm/s** porque ahí manda la amortiguación del cilindro, no la válvula.

---

## Lógica (verificada `verif_mando.mjs` — 498/498)

**Constantes selladas del motor** (idénticas en el verificador y en el laboratorio, copiadas verbatim entre los marcadores `MOTOR` / `FIN MOTOR`):

| Símbolo | Valor | Origen |
|---|---|---|
| `P_ANR` / `P_ATM` | 1,000 / 1,013 bar | aire de referencia normal ANR (ISO 8778) y presión atmosférica |
| `K_VALV` | 1,5 | factor de selección de válvula sobre el consumo del cilindro (**rango** de catálogo 1,3–1,6) |
| `V_AIRE_MAX` | 20 m/s | velocidad máxima recomendada del aire en la tubería (**rango** 15–20) |
| `P_PILOT` | 2,5 bar | presión de pilotaje (**rango** de catálogo 1,5–3,0) |
| `V_CIL_MAX` | 1500 mm/s | techo de velocidad del cilindro por su amortiguación (**rango** 1000–1500) |
| `T_FC` | 0,02 s | retardo de final de carrera + conmutación (**rango** 0,010–0,030) |
| `QN_MANUAL` | 350 l/min | por encima, el catálogo ya no ofrece órgano de mando manual |
| `QN_SENAL` | 100 l/min | caudal nominal de una válvula de señal de pilotaje |
| `L_POT` | 0,3 m | tubo de potencia entre la válvula y el cilindro en mando indirecto |
| `CIL_ISO` | 32→12 · 40→16 · 50→20 · 63→20 · 80→25 · 100→25 | parejas émbolo-vástago de la ISO 15552 |

**Fórmulas del motor**

| Magnitud | Expresión |
|---|---|
| Área del émbolo (cm²) | `A_emb = π·D²/4 / 100` |
| Área anular (cm²) | `A_anu = (π·D²/4 − π·d²/4) / 100` con `d = CIL_ISO[D]` |
| Consumo del cilindro (l/min ANR) | `q = A·(v/10)·0,06·(p + P_ATM)/P_ANR` |
| Caudal requerido | `req = K_VALV · q` |
| Velocidad teórica del vástago (mm/s) | `v_teo = Qn / (A·0,06·(p + P_ATM)/P_ANR) · 10` |
| Velocidad real | `v = min(v_teo, V_CIL_MAX)` |
| Sección del tubo (cm²) | `A_t = π·d_int²/4 / 100` |
| Volumen del tubo (cm³) | `V_t = A_t · L · 100` |
| Velocidad del aire (m/s) | `v_aire = A·(v/10)/A_t / 100` |
| Tiempo de llenado (s) | `t = (V_t/1000 · (p + P_ATM)/P_ANR) / (Qn/60)` |
| Composición en serie | `Qn_eq = Qn/√n` (de `1/Qn_eq² = Σ 1/Qn_i²`) |

**Tiempo de respuesta según la arquitectura**

| Arquitectura | Expresión |
|---|---|
| Directo | `t = t_llenado(d_int_tubo, L, p_trabajo, Qn/√n_señales)` |
| Indirecto | `t = t_llenado(d_int_tubo, L, P_PILOT, QN_SENAL/√n) + t_llenado(d_rosca_válvula, L_POT, p_trabajo, Qn)` |

**Catálogo de válvulas**

| Clave | Rosca | Qn (l/min) | Tubo de rosca (mm) | Coste | ¿Admite mando manual? |
|---|---|---|---|---|---|
| `M5` | M5 | 100 | 4 | 1 | sí |
| `G18` | G 1/8 | 350 | 6 | 2 | sí (es el techo) |
| `G14` | G 1/4 | 700 | 8 | 3 | **no** |
| `G38` | G 3/8 | 1600 | 9 | 4 | **no** |

**Catálogo de tubo de poliuretano** (parejas comerciales, no normativas)

| Clave | Exterior (mm) | Interior (mm) | Sección (cm²) | Coste |
|---|---|---|---|---|
| `t4` | 4 | 2,5 | 0,049 | 1 |
| `t6` | 6 | 4,0 | 0,126 | 2 |
| `t8` | 8 | 6,0 | 0,283 | 3 |
| `t10` | 10 | 8,0 | 0,503 | 4 |
| `t12` | 12 | 9,0 | 0,636 | 5 |

**Los cuatro criterios del mando**

| Criterio | Condición |
|---|---|
| `okDisp` | Si es **directo**, la válvula debe admitir órgano de mando manual (`Qn ≤ 350`). En indirecto siempre se cumple. |
| `okCaudal` | El caudal **efectivo** de la arquitectura cubre `req = 1,5 · q_cilindro` |
| `okTubo` | La velocidad del aire en la línea que lleva el caudal no pasa de **20 m/s** |
| `okTiempo` | El tiempo de la primera orden no pasa del `tMax` de la estación |

**Cada criterio puede fallar en solitario** (barrido completo de las **200** combinaciones; casos con exactamente un criterio incumplido): `okDisp` **25** · `okCaudal` **6** · `okTubo` **5** · `okTiempo` **34**. Ninguno es texto muerto y el que más manda es el **tiempo de respuesta**.

**Coste (orden de complejidad, no precio):** `[nº de válvulas, tamaño de rosca, tamaño de tubo]`, comparado lexicográficamente. Primero se ahorra hierro, después rosca, después tubo.

---

## Las cinco estaciones (barrido 2 × 4 × 5 = 40 por estación · **200 en total**)

| Estación | Cilindro | Ø | v (mm/s) | p (bar) | L (m) | Señales | tMax (s) | Secuencia | Marcha | Terna mínima | Válidas | Directas válidas |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Expulsor de recortes de una troqueladora | + pisador Ø40×60 | 32 × 100 | 300 | 6 | 1,5 | 1 | 0,15 | anidada `B+ A+ A− B−` | momentánea | **directo · G 1/8 · Ø6** | 13/40 | 4 |
| Puerta de una cabina de pintura | simple | 50 × 400 | 200 | 6 | 15 | 1 | 0,30 | simple `A+ A−` | **mantenida** | **indirecto · G 1/8 · Ø4** | 3/40 | **0** |
| Prensa de ensamble con mando a dos manos | + expulsor Ø32×80 | 63 × 150 | 140 | 6 | 3 | **2** | 0,25 | serie `A+ A− B+ B−` | momentánea | **indirecto · G 1/8 · Ø4** | 6/40 | **0** |
| Volteador de una línea de horno | + pinza Ø32×60 | 80 × 300 | 250 | 6 | 12 | **2** | 0,40 | cruzada `B+ A+ B− A−` | momentánea | **indirecto · G 3/8 · Ø4** | **1/40** | **0** |
| Grapadora de cajas de cartón | simple | 40 × 80 | 400 | 5 | 0,8 | 1 | 0,12 | simple `A+ A−` | momentánea | **directo · G 1/8 · Ø8** | 18/40 | 3 |

**En las cinco estaciones hay exactamente UNA terna válida y de coste mínimo.** El barrido lo comprueba una por una.

**Cifras de la terna ganadora** (todas calculadas por el motor, ninguna escrita a mano)

| Estación | q cilindro (l/min ANR) | req = ×1,5 | Qn efectivo | v_aire (m/s) | t_respuesta (s) | Válvulas montadas | Ciclo (s) |
|---|---|---|---|---|---|---|---|
| Expulsor | 101,5 | 152,3 | 350,0 | 19,20 | 0,0227 | 1 | 0,429 |
| Puerta | 165,2 | 247,9 | 350,0 | 13,89 | 0,1654 | 2 | 1,923 |
| Prensa | 183,6 | 275,5 | 350,0 | 15,43 | 0,0541 | 3 | 1,326 |
| Volteador | 528,8 | 793,2 | 1600,0 | 19,75 | 0,1806 | 3 | 1,075 |
| Grapadora | 181,3 | 272,0 | 350,0 | 17,78 | 0,0233 | 1 | 0,234 |

**Diagrama espacio-tiempo del volteador** (el que rompe la confusión fase ≠ tiempo): `B+` 0,221 s a **1500 mm/s (TOPE)** · `A+` 0,417 s a 756 mm/s · `B−` 0,060 s a **1500 mm/s (TOPE)** · `A−` 0,378 s a 838 mm/s. Cuatro fases idénticas en la rejilla, siete veces de diferencia en duración.

---

## Espacio-fase: conflictos y autoarranque

Recuento (conflictos / autoarranque) sobre las cinco estaciones, con la secuencia de cada una:

| Estación | Forma | Secuencia | Momentánea | Mantenida **sin** arreglo | Mantenida **con** arreglo |
|---|---|---|---|---|---|
| Expulsor | anidada | `B+ A+ A− B−` | **2** / 0 | 3 / 1 | **2** / **1** |
| Puerta | simple | `A+ A−` | 0 / 0 | 1 / 1 | 0 / **1** |
| Prensa | serie | `A+ A− B+ B−` | **1** / 1 | 2 / 2 | **1** / **2** |
| Volteador | cruzada | `B+ A+ B− A−` | 0 / 0 | 1 / 1 | 0 / **1** |
| Grapadora | simple | `A+ A−` | 0 / 0 | 1 / 1 | 0 / **1** |

**Disparos del método directo** (con el arreglo aplicado a la primera orden):

| Estación | A+ | A− | B+ | B− |
|---|---|---|---|---|
| Expulsor | `b1` | `a1` | `m·b0` | `a0` |
| Puerta | `m·a0` | `a1` | — | — |
| Prensa | `m·a0` | `a1` | `a0` | `b1` |
| Volteador | `b1` | `b0` | `m·b0` | `a1` |
| Grapadora | `m·a0` | `a1` | — | — |

Sólo la señal arreglada lleva el `·`: el arreglo toca **una** orden, la primera, y ninguna más.

---

## Anclas de honestidad

- **El arreglo quita exactamente un conflicto y NO quita el autoarranque en ninguna de las cinco estaciones.** Es su límite real y el laboratorio lo dice con esas palabras, en vez de vender el ampersand como la solución.
- **Con marcha momentánea el arreglo es INERTE en las cinco estaciones.** No cambia nada, y por eso el modo lo muestra sólo cuando la marcha es mantenida.
- **Con marcha mantenida y sin arreglo, TODAS las estaciones tienen conflicto.** Incluida la simple, que en momentánea estaba limpia.
- **El mando indirecto no es superior por defecto.** Gana en tres estaciones y pierde en dos. En la grapadora, con 18 ternas válidas, la mínima es directa: montar indirecto es comprar una válvula de más.
- **En la puerta no falla el tubo, falla la arquitectura.** Cero ternas directas válidas de 20: recorrer el catálogo entero no encuentra nada, y ese cero es el mensaje.
- **El volteador tiene UNA sola terna válida en 40.** No es un reto con margen: es una estación donde el catálogo apenas alcanza.
- **La velocidad del cilindro satura.** Dos de los cuatro movimientos del volteador salen en el tope de 1500 mm/s: la válvula daría más, el cilindro no lo admite, y ahí manda su amortiguación.
- **El tiempo de llenado es una estimación de primer orden, no ISO 6358.** Reparte el volumen de la línea al caudal nominal; el transitorio real es más lento al final de la carrera. El sesgo actúa **igual en las dos arquitecturas**, así que la comparación entre ellas se sostiene — y se declara en pantalla.
- **K = 1,5 · 20 m/s · 2,5 bar · 1500 mm/s · 0,02 s son criterios de FABRICANTE, no valores normativos.** Todos se muestran con su rango.
- **Las parejas exterior/interior del tubo son de catálogo comercial**, no de norma. Las parejas émbolo-vástago sí son ISO 15552.
- **El mando a dos manos de la prensa se CITA, no se simula.** La ISO 13851 / EN 574 exige simultaneidad, desfase máximo y comprobación de liberación; aquí las dos señales son un caso de **caudal**, no un dispositivo de seguridad certificado. El distractor del cuestionario lo dice explícitamente.
- **El `coste` es un orden de complejidad, no un precio de mercado.**
- **No se modela** la pérdida de carga de racores y codos, la caída de presión a lo largo de la línea, la dinámica del vástago, el estrangulamiento meter-in/meter-out (MEC-107), la lógica de simultaneidad y selectora ni la temporización (MEC-97), el método de cascada ni los secuenciadores con memorias (MEC-98), la electroneumática con relevadores, ni el tratamiento del aire (MEC-99).

---

## Molde y estructura

**Molde S** (banco 3D + pizarrón de 1024×768 con cuatro modos):

- **Mando:** las dos arquitecturas dibujadas sobre la misma estación, con la válvula de potencia y las de señal en su sitio real, el recuento de válvulas, el caudal requerido frente al efectivo y el tiempo de respuesta de **las dos** a la vez, para que la comparación no dependa de recordar la pantalla anterior.
- **Línea:** el circuito de la arquitectura elegida con **los cinco tubos del catálogo evaluados a la vez** — velocidad del aire, volumen ANR de la línea larga y tiempo de primer llenado — de modo que se ve de un vistazo dónde se cruzan los dos criterios.
- **Fase:** la rejilla espacio-fase del método directo (una columna por fase, posición de cada cilindro antes y después, la señal que ordena y la opuesta evaluadas a la vez, las fases en conflicto en rojo) con el diagrama espacio-**tiempo** debajo y el ciclo completo.
- **Reto:** calificación **triple ortogonal** (arquitectura / válvula / tubo), cada eje evaluado con los otros dos correctos, más el criterio de mínimo y dos paneles de diagnóstico que explican por qué no sirve cada arquitectura y cada válvula descartada.
- **Banco 3D:** puesto del operador con sus válvulas de señal, válvula de potencia junto al cilindro, línea larga cuyo **grosor sigue al diámetro interior** elegido, cuatro LED de criterio y el cilindro moviéndose con la relación real entre su velocidad de salida y la de retorno (en cámara lenta: conserva la proporción, no cronometra).
- **Cuestionario:** 4 opciones barajadas (Fisher-Yates) por modo, con los distractores verificados falsos contra el motor.

---

## Verificación en dos capas

1. **Numérica:** `scratchpad/verif_mando.mjs` — **498 comprobaciones, 0 fallos** en 11 secciones (áreas ISO 15552; caudal ANR; velocidad del aire, volumen y tiempo de llenado del tubo; coherencia del catálogo y composición de señales en serie; barrido completo del reto con terna única válida y mínima por estación; fallo en solitario de cada criterio; las **30 familias de diagnóstico** todas alcanzables; espacio-fase con sus conflictos y su autoarranque; espacio-tiempo; coherencia global; y el efecto exacto del arreglo de la marcha).
2. **Navegador:** arnés Playwright contra `window.__labDebug` sobre servidor HTTP local, más el recorrido guiado completo (`runAuto`) con la narración verificada paso a paso.

---

## Referencias

- **ISO 1219-1** — Transmisiones hidráulicas y neumáticas, símbolos gráficos y esquemas de circuito, parte 1: símbolos gráficos. De aquí salen las casillas de posición, los accionamientos y la distinción entre línea de potencia y línea de pilotaje.
- **ISO 15552** — Cilindros neumáticos de simple y doble efecto con montaje desmontable, series 32 a 320 mm. Normaliza las parejas émbolo-vástago con las que se calculan las áreas y, con ellas, el consumo distinto de la salida y del retorno.
- **ISO 8778** — Neumática: aire de referencia normal (1000 hPa, 20 °C, 65 % HR). Es la referencia a la que se expresa todo el caudal del laboratorio.
- **ISO 6358** — Neumática: determinación de las características de caudal de los componentes que utilizan fluido compresible. Define el caudal por conductancia sónica `C` y relación crítica `b`. **Citada y no simulada**: aquí se usa el `Qn` de catálogo y una estimación de primer orden del llenado.
- **ISO 4414** — Transmisiones neumáticas: reglas generales y requisitos de seguridad. Referencia de fondo del análisis de **autoarranque**.
- **ISO 13851 / EN 574** — Seguridad de las máquinas: dispositivos de mando a dos manos. **Citada y no simulada**: justifica que la prensa lleve dos señales, pero el laboratorio no simula simultaneidad, desfase ni liberación.
- **ISO 11727** — Neumática: identificación de los orificios y de los dispositivos de accionamiento de las válvulas de control direccional. Da sentido a la distinción entre línea de potencia (por el 1) y de pilotaje (por el 12 y el 14); su detalle completo es MEC-95.
- **Criterios de proyecto de fabricante** (Festo y SMC, manuales de neumática y catálogos de válvulas y tubo): `K` 1,3–1,6 (se usa 1,5), velocidad del aire 15–20 m/s (se usa 20), pilotaje 1,5–3,0 bar (se usa 2,5), velocidad máxima del cilindro 1000–1500 mm/s (se usa 1500) y retardo de final de carrera 0,010–0,030 s (se usa 0,020). Recomendaciones de ingeniería, **no** valores normativos.
