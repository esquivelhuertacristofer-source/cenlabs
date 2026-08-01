# MEC-100 · Dimensiona un Sistema de Vacío para Pick&Place

**Dominio:** D4 · Hidráulica y Neumática
**Práctica del backlog:** d4-08 — «Dimensiona un sistema de vacío para pick&place»
**Simulador:** `/labs/vacio-pick-and-place.html`
**Slug de construcción:** `vacio-pick-and-place`

---

## Qué enseña

1. **El vacío no lo pone el generador: lo pone la ATMÓSFERA.** Un eyector Venturi da el 85 % de la presión atmosférica **local**. A 2 660 m eso son **622 mbar** y al nivel del mar **861**: la altitud se lleva el **27,8 %** de la fuerza antes de elegir nada.
2. **La fuerza no sale del peso sino del caso de la maniobra.** Vertical `F = m(g+a)·S`, horizontal por rozamiento `F = m(g+a/μ)·S`, lateral `F = (m/μ)(g+a)·S`. La chapa pesa **8 kg** y exige **477,68 N**; el vidrio pesa **12 kg** y exige **259,36 N**.
3. **El área que trabaja es la EFECTIVA.** Ø 50 exterior son Ø 47 útiles; como el área va con el cuadrado, ese 6 % de diámetro es un **12 % de fuerza**.
4. **Repartir es la única palanca gratis.** El vidrio pide **1 495 mbar** con una ventosa plana Ø 50 —imposible en cualquier punto del planeta— y **374** con cuatro.
5. **Más ventosas agarran ANTES, no después.** 93,5 ms con 4 y **69,0 ms** con 6: el volumen crece con n pero el umbral baja con n, y gana el umbral.
6. **La fuga fija un equilibrio, no un retraso.** La caja porosa se clava en **378 mbar** con 2 ventosas y en **255** con 6; la misma caja sin poros llegaría a **622**. No tarda más: no llega nunca.
7. **Y sin embargo la fuerza SUBE al bajar el vacío:** 70,8 N con 2 ventosas y **71,5 N** con 6. El objetivo nunca fue el vacío, sino su producto por el área.
8. **Con fuga, el antirretorno no sirve.** El mismo eyector que sostiene una pieza estanca **más de 30 s** sin energía sostiene la caja porosa **0,01 s**.
9. **Dos generadores idénticos que no valen lo mismo.** Básico y de ahorro de aire dan el mismo vacío final (622 mbar) y el mismo tiempo de agarre (93,5 ms) — sus curvas se superponen — y uno suelta el panel en **0,15 s** al faltar la energía (**ISO 4414**).
10. **Y además gasta 26 veces menos:** 2,15 Nl y **0,2153 Wh** por ciclo el básico; 0,08 Nl y **0,0083 Wh** el de ahorro, con un ciclo de trabajo del **0,7 %**. La diferencia no es el Venturi: es el sensor.
11. **El pico decide el marcado, no el valor final.** El envase de plástico aguanta 650 mbar y el eyector de alto caudal llega a **656** en Ciudad de México: se pasa antes de que el sensor reaccione.
12. **La estación más difícil es la más pequeña.** El plástico exige **24,85 N** y sólo tiene **1** propuesta válida de 64: la isla plana mide 35 × 35 mm, sólo cabe una ventosa y la pared es curva.
13. **El criterio de fuerza NUNCA falla en solitario.** Aparece **121** veces como primer fallo y **0** como fallo único: si no alcanza el vacío tampoco llega a tiempo. Es el que explica la avería, no el que la detecta.
14. **El coste mínimo NO es monótono con la altitud.** Del mar a 2 660 m: vidrio **10 → 14**, cartón **12 → 9**, chapa **14 → 18**, bidón **21 → 30**.
15. **Hay altitudes sin solución.** El plástico se resuelve a 0 m y a 2 660 m y **no** en Denver, Puebla ni Ciudad de México: el generador pequeño ya tarda 62 ms cuando el ciclo da 50, y el grande todavía llega a 656 mbar cuando la pared aguanta 650.
16. **Cuando no queda más que pagar.** El bidón necesita 639 mbar y un eyector se queda en 622: sólo la bomba de paletas (92 %) llega a **673**. Una casilla verde de 64, y a **30** unidades de coste.

---

## Lógica (verificada `verif_vacio.mjs` — 912/912)

### Constantes selladas

| Constante | Valor | Origen |
|---|---|---|
| `P0_MAR` | 1 013,25 mbar | ISO 2533 |
| `L_TROPO` / `T0_ISA` / `EXP_ISA` | 0,0065 K/m · 288,15 K · 5,255 | ISO 2533 — `p(h) = P0·(1 − L·h/T0)^EXP` |
| `H_BANCO` | 2 660 m | altitud del banco → **732,0 mbar** |
| `G_GRAV` | 9,806 65 m/s² | valor normal |
| `P_NORM` | 1 013,25 mbar | referencia del Nl |
| `P_FUGA_REF` | 600 mbar | referencia a la que se declara la fuga de la interfaz |
| `T_VALV` | 10 ms | respuesta de la válvula de vacío (rango 5–20) |
| `E_AIRE` | 0,10 kWh/Nm³ | consumo específico a 7 bar (rango industrial 0,09–0,12) |
| `A_LAT_MAX` | 2,0 m/s² | límite de aceleración lateral de una ventosa de fuelle |
| `SEP_VENT` | 10 mm | separación mínima entre ventosas |
| `HIST_ASC` | 30 mbar | histéresis del vacuostato del eyector con sensor (rango 20–50) |
| `DT_SIM` | 0,5 ms | paso de integración del transitorio |
| `T_TOPE` | 6,0 s | tope del ensayo de agarre |
| `T_TOPE_F` | 30,0 s | tope del ensayo de retención — «aguanta al menos 30 s» |
| `T_COLAPSO` | 0,15 s | colapso del vacío sin antirretorno (hipótesis declarada) |

### Reglas del motor

- **Atmósfera local:** `pAtm(h) = P0_MAR · (1 − L_TROPO·h/T0_ISA)^EXP_ISA`; el vacío máximo de un generador es `vacPct · pAtm(h)`, **no** un dato absoluto del aparato.
- **Fuerza requerida:** `vert` → `m(g+a)·S`; `horiz` → `m(g+a/μ)·S`; `lat` → `(m/μ)(g+a)·S`.
- **Vacío requerido por ventosa:** `pvReq = F / (n · A(dEf)) `, con `A` en cm² y el resultado en mbar.
- **Transitorio:** `V·dp/dt = −p·S(p) + p₀·Q(p)` integrado con `DT_SIM`, con `S(p) = S₀·(1 − pv/pv_max)` y la fuga referida a `P_FUGA_REF`. El **equilibrio** se resuelve además por bisección de 200 pasos y se contrasta contra la integración.
- **Agarre:** `tAgarre = t(P_ATM − p ≥ pvReq) + T_VALV`; si no se alcanza en `T_TOPE`, la propuesta se marca `alcanza:false` y todo lo demás queda a `Infinity`/0.
- **Sujeción:** con antirretorno y sensor, control por histéresis — deja de bombear con `pv ≥ pvReq + HIST_ASC` y vuelve a bombear con `pv ≤ pvReq`; se registran `pvMin`, `pvPico` y el tiempo soplando, de donde salen el ciclo de trabajo y el aire consumido.
- **Retención:** sin antirretorno → `T_COLAPSO`; con antirretorno y sin fuga → `T_TOPE_F`; con antirretorno y fuga → se integra con el generador parado hasta que `pv < pvReq`.
- **Energía:** `aire·E_AIRE + P_elec·tCiclo`, con el aire en Nm³ y la potencia eléctrica activa durante **todo** el ciclo.
- **Colocación:** paso = `dExt + SEP_VENT`; caben `floor((útil − dExt)/paso) + 1` por lado. La plana no sella sobre desnivel; el fuelle se dobla por encima de `A_LAT_MAX`.
- **Coste:** `n · coste(ventosa) + coste(fuente)` — recuento de unidades de catálogo, no un precio.

### Los seis criterios y cuántas veces falla cada uno EN SOLITARIO

| Criterio | Primer fallo | Falla solo |
|---|---|---|
| `okSuperficie` — la ventosa es compatible con la pieza | 156 | **78** |
| `okFuerza` — fuerza de sujeción con el factor de seguridad | 121 | **0** (arrastra siempre a `okTiempo`) |
| `okMarca` — la pieza no se marca ni se deforma | 3 | **1** |
| `okTiempo` — agarre dentro del tiempo disponible | 5 | **3** |
| `okFalla` — la pieza no cae al faltar la energía | 13 | **6** |
| `okConsumo` — energía por ciclo dentro de lo contratado | 4 | **4** |

Al alumno se le enseña siempre el **primer** criterio que falla en el orden de la tabla, y `whyCfg()` se apoya en la misma función que la tabla de criterios para que el diagnóstico y el panel no puedan desincronizarse.

---

## El catálogo del banco

### Ventosas

| Ventosa | Ø ext / Ø ef | Área efectiva | Volumen | Coste | Forma |
|---|---|---|---|---|---|
| Plana Ø 30 | 30 / 28 mm | 6,16 cm² | 1,5 cm³ | 1 | sólo superficie plana |
| Plana Ø 50 | 50 / 47 mm | **17,35 cm²** | 4,0 cm³ | 2 | sólo superficie plana |
| Fuelle 1,5 pliegues Ø 40 | 40 / 37 mm | 10,75 cm² | 12,0 cm³ | 3 | compensa desnivel · máx. 2,0 m/s² lat. |
| Fuelle 3,5 pliegues Ø 30 | 30 / 27 mm | 5,73 cm² | **20,0 cm³** | 4 | la más flexible y la de más volumen muerto |

### Generadores

| Fuente | Vacío | Bombeo | Aire / eléctrica | Antirretorno | Coste |
|---|---|---|---|---|---|
| Eyector Venturi básico | 85 % de p_atm | 55 l/min | 50 Nl/min soplando siempre | no | 3 |
| Eyector de alto caudal | 85 % de p_atm | 130 l/min | 120 Nl/min | no | 5 |
| Eyector con antirretorno y sensor | 85 % de p_atm | 55 l/min | 50 Nl/min con histéresis de 30 mbar | **sí** | 6 |
| Bomba de vacío de paletas | **92 %** de p_atm | 100 l/min | 0,25 kW eléctricos | no | 12 |

---

## Las cinco estaciones

| Estación | Masa · maniobra · S | `F` requerida | Zona útil | Tolera | Tiempo | Falta de energía | Energía |
|---|---|---|---|---|---|---|---|
| Panel de vidrio | 12,0 kg · vertical 1,0 m/s² · 2,0 | **259,36 N** | 1 000 × 800 mm | 900 mbar | 600 ms | exige 2,00 s | 0,30 Wh |
| Caja de cartón corrugado | 3,0 kg · vertical 2,0 m/s² · 2,0 | **70,84 N** | 400 × 300 mm | 450 mbar | 400 ms | no exige | 0,22 Wh |
| Chapa de acero aceitada | 8,0 kg · horizontal 3,0 m/s² · μ 0,10 · 1,5 | **477,68 N** | 600 × 400 mm | 900 mbar | 300 ms | exige 2,00 s | 0,30 Wh |
| Envase de plástico | 0,9 kg · vertical 4,0 m/s² · 2,0 | **24,85 N** | **35 × 35 mm** | **650 mbar** | **50 ms** | no exige | 0,20 Wh |
| Bidón por la pared | 6,0 kg · lateral 0,5 m/s² · μ 0,30 · 2,0 | **412,27 N** | 600 × 400 mm | 900 mbar | 2,00 s | no exige | 0,60 Wh |

La caja de cartón tiene además superficie desnivelada y **fuga de 6 Nl/min por ventosa**; el envase y el bidón tienen pared curva.

### Solución de coste mínimo (banco a 2 660 m)

| Estación | Ventosa × n + generador | Coste | Válidas de 64 | `pvReq` / `pvEq` | `tAgarre` | Energía | Retención |
|---|---|---|---|---|---|---|---|
| Vidrio | plana Ø 50 × 4 + ahorro de aire | **14** | 3 | 374 / 622 | 93,5 ms | 0,0083 Wh | **30,00 s** |
| Cartón | fuelle Ø 40 × 2 + eyector básico | **9** | 12 | 329 / **378** | 79,5 ms | 0,1058 Wh | 0,15 s |
| Chapa | plana Ø 50 × 6 + ahorro de aire | **18** | **1** | 459 / 622 | 226,0 ms | 0,0225 Wh | **30,00 s** |
| Plástico | fuelle Ø 30 × 1 + alto caudal | **9** | **1** | 434 / 622 | 35,0 ms | 0,1050 Wh | 0,15 s |
| Bidón | fuelle Ø 40 × 6 + **bomba** | **30** | **1** | 639 / **673** | 1 593,5 ms | 0,4167 Wh | 0,15 s |

**Barrido completo:** 5 estaciones × 4 ventosas × 4 repartos × 4 generadores = **320** propuestas. Válidas: **18**. En cuatro de las cinco estaciones la solución de coste mínimo es **única**.

---

## Los cuatro efectos que hay que ver

### La altitud (vidrio, plana Ø 50 × 2, eyector básico)

| Altitud | p_atm | Vacío máximo | `F` disponible |
|---|---|---|---|
| 0 m (mar) | 1 013,3 mbar | 861 mbar | 259,4 N |
| 1 609 m (Denver) | 834,3 | 709 | 246,1 N |
| 2 135 m (Puebla) | 781,8 | 664 | 230,6 N |
| 2 240 m (CDMX) | 771,6 | 656 | 227,6 N |
| **2 660 m (banco)** | **732,0** | **622** | **215,9 N** |

Con **4** ventosas: **597,7 N** al nivel del mar y **431,8 N** en el banco — **27,8 %** de pérdida.

### El número de ventosas (vidrio, plana Ø 50, eyector básico)

| n | Volumen | `pvReq` | `tAgarre` | Aire | Energía |
|---|---|---|---|---|---|
| 1 | 0,017 l | 1 495 | — (no alcanza) | — | — |
| 2 | 0,033 l | 747 | — (no alcanza) | — | — |
| 4 | 0,066 l | 374 | **93,5 ms** | 2,15 Nl | 0,2153 Wh |
| 6 | 0,100 l | 249 | **69,0 ms** | 2,13 Nl | 0,2133 Wh |

### La fuga (cartón, fuelle Ø 40, eyector básico)

| n | `pvReq` | `pvEq` | `F` de sujeción |
|---|---|---|---|
| 1 | 659 | 445 | 47,8 N (no llega) |
| 2 | 329 | **378** | **70,8 N** |
| 4 | 165 | 301 | 71,4 N |
| 6 | 110 | **255** | **71,5 N** |

La misma caja **sin poros** con n = 2 llegaría a **622 mbar**. El vacío baja al añadir ventosas y la fuerza sube.

### El generador (vidrio, plana Ø 50 × 4)

| Fuente | Energía / ciclo | Aire | `pvEq` | `tAgarre` | Retención | Veredicto |
|---|---|---|---|---|---|---|
| Eyector básico | 0,2153 Wh | 2,15 Nl | 622 | 93,5 ms | 0,15 s | falla `okFalla` |
| Alto caudal | 0,5070 Wh | 5,07 Nl | 622 | 45,0 ms | 0,15 s | falla `okFalla` |
| **Ahorro de aire** | **0,0083 Wh** | 0,08 Nl | 622 | 93,5 ms | **30,00 s** | **VÁLIDA** |
| Bomba de paletas | 0,4167 Wh | 0 Nl | **673** | 99,0 ms | 0,15 s | falla `okFalla` |

Ahorro del eyector con sensor por estación: vidrio **96,1 %** (duty 0,7 %) · chapa 77,8 % · plástico 87,0 % · **cartón sólo 23,5 %** (duty 75,1 %, retención **0,01 s**).

### El coste mínimo no es monótono

| Altitud | Vidrio | Cartón | Chapa | Plástico | Bidón |
|---|---|---|---|---|---|
| 0 m | 10 | 12 | 14 | 10 | 21 |
| 1 609 m | 14 | 9 | 18 | **—** | 21 |
| 2 135 m | 14 | 9 | 18 | **—** | 21 |
| 2 240 m | 14 | 9 | 18 | **—** | 21 |
| **2 660 m** | **14** | **9** | **18** | **9** | **30** |

El plástico se resuelve en los dos extremos y **no en el medio**: en CDMX el eyector básico tarda 62 ms (el ciclo da 50) y el de alto caudal llega a 656 mbar (la pared aguanta 650).

---

## Anclas de honestidad

- **El tope de retención se muestra como `30,00 s` y significa «aguanta al menos 30 s»**, no «aguanta exactamente 30». Es el final del ensayo, no una medida.
- **Los 0,15 s de colapso sin antirretorno son una hipótesis declarada del modelo**, no un dato de catálogo. Lo que sí es firme es el orden de magnitud del contraste: décimas de segundo frente a decenas.
- **La 5ª cifra del ahorro de aire tiene letra pequeña:** el 96,1 % del panel de vidrio se convierte en **23,5 %** en la caja porosa, y su retención en **0,01 s**. La mejora hay que justificarla pieza a pieza, no por catálogo.
- **`okFuerza` nunca falla en solitario** — siempre arrastra a `okTiempo`, porque un sistema que no alcanza el vacío requerido tampoco agarra dentro del tiempo. Se declara en vez de esconderlo.
- **El criterio que más decide no es de vacío sino de geometría:** `okSuperficie` suspende **156** de las 320 propuestas y **78** de ellas él solo. En el envase de plástico, el proyecto lo decidió el molde de la pieza.
- **La regla de colocación se comprobó explícitamente contra el texto muerto:** se verifica que cambia el veredicto en propuestas reales, no que exista en el código.
- **Los porcentajes de vacío (85 % / 92 %), los caudales, los volúmenes internos, el tiempo de válvula y la histéresis del vacuostato son valores nominales representativos de catálogo con su rango declarado**, no valores normativos. Los factores de seguridad, tolerancias de marcado, tiempos disponibles y contratos de energía de cada estación son **criterios de proyecto** declarados, no valores de norma.
- **El «coste» es un recuento de unidades de catálogo**, no un precio de mercado ni una amortización.
- **No se modela** la generación ni el tratamiento del aire (compresor, depósito, secador, FRL, ISO 8573-1 **citada**: **MEC-99** y la práctica de la unidad de mantenimiento), la pérdida de carga de la tubería (representada sólo por su volumen muerto), la dinámica del pórtico (las aceleraciones son dato de estación), el vacío alto y su régimen molecular, la elasticidad y fatiga del fuelle, la compatibilidad química del elastómero, las fugas aguas arriba, el reparto real de carga entre ventosas de una pieza flexible, la certificación completa según **EN 13155**, la seguridad funcional según **ISO 13849** ni el mando electroneumático del ciclo (**MEC-99**).

---

## Molde y estructura

**Molde E+S** (ensamble 3D con *mode-lock* + banco 3D + pizarrón 1024×768 fuera de pantalla + panel de telemetría HTML), cinco modos:

| Modo | Contenido |
|---|---|
| `ensamble` | Se monta el cabezal pieza por pieza —brazo, colector, placa de ventosas, eyector, válvula 3/2, vacuostato y pieza—; hasta terminarlo no se abre ningún modo de análisis |
| `fuerza` | Diagrama de cuerpo libre de la maniobra con la fórmula que le toca, área efectiva, vacío requerido y fuerza disponible, más la barra de las cinco altitudes con la línea de la fuerza necesaria |
| `circuito` | Dos paneles independientes —evacuación y sujeción— porque 93 ms, 2,5 s y 30 s no caben en el mismo eje; telemetría de volumen, fuga, equilibrio, pico, ciclo de trabajo, aire, energía y retención con los seis criterios |
| `proyecto` | Malla de 4 ventosas × 4 repartos para el generador elegido, con las válidas en verde y su coste y las inválidas con la letra del criterio que suspende primero; recuento de válidas y solución mínima |
| `reto` | Estación sorteada; se proyectan ventosa, número y generador con calificación triple ortogonal, y se exige válido **Y** mínimo. El reto fija siempre la altitud del banco |

El ciclo de pick&place se anima en siete fases —baja, agarra, sube, lleva, posa, suelta y vuelve— con la duración de la fase de agarre **proporcional al tiempo de agarre calculado** para la configuración elegida: una elección lenta se ve lenta.

**Reto de calificación triple ortogonal:** cada eje (`ventosa`, `numero`, `fuente`) se califica con los otros dos ya en su valor óptimo, y el veredicto exige que la propuesta sea válida **y** de coste mínimo. La configuración de partida está mal en los **tres** ejes a la vez.

---

## Verificación en dos capas

**Capa 1 — numérica:** `verif_vacio.mjs`, **912 comprobaciones, 0 fallos**. Cubre la atmósfera tipo en las cinco altitudes, las tres fórmulas de fuerza con sus casos límite, el área efectiva y su dependencia cuadrática, la regla de colocación de ventosas y su condición de no-texto-muerto, la integración del transitorio contrastada con su equilibrio calculado por bisección, la coherencia entre tiempo de agarre, pico y ciclo de trabajo, el control por histéresis, la retención en los tres casos (sin antirretorno, con antirretorno estanco y con antirretorno con fuga), la energía por ciclo con las dos tecnologías, el barrido de las 320 propuestas con sus 18 válidas, que ninguno de los seis criterios es texto muerto y cuántas veces falla cada uno en solitario, la unicidad de la solución mínima en cuatro estaciones, la no monotonía del coste con la altitud, el hueco de altitudes sin solución del envase de plástico, la ortogonalidad de los tres ejes del reto y el formato SI de todas las cifras.

**Capa 2 — navegador:** Playwright contra `window.__labDebug` sobre servidor HTTP local: estado estático —*mode-lock* del ensamble, los cinco modos, telemetría, malla del proyecto, quiz y reto— y recorrido guiado completo (`runAuto`) contrastando cada narración contra el motor.

**Capa 3 — regresión del proyecto:** `npx tsc --noEmit` limpio y `npx jest` completo, con los *golden snapshots* actualizados en modo aditivo.

---

## Referencias

- **ISO 2533** — Atmósfera tipo internacional. De ella sale `p_atm(h)` y con ella el techo de vacío de cada altitud: **criterio activo** del laboratorio, no una nota al pie.
- **ISO 4414** — Reglas generales y requisitos de seguridad de los sistemas neumáticos: previsión del comportamiento ante fallo de la alimentación de energía. **Criterio activo**, medido integrando la pérdida de vacío con el generador parado.
- **EN 13155** — Equipos amovibles de aprehensión de cargas: factor de seguridad mínimo 2 en sujeción por vacío horizontal y previsión de la pérdida de vacío. **No** se certifica ningún equipo.
- **ISO 8573-1** — Clases de pureza del aire comprimido: **citada** como condición de vida del eyector. Aquí el aire se supone seco, limpio y estable.
- **ISO 1219-1** — Símbolos gráficos del circuito de vacío: generador Venturi, vacuostato, válvula 3/2 y ventosa.
- **ISO 13849** — Seguridad funcional del enclavamiento de vacío: **citada, no simulada**.
- **Valores nominales de catálogo con rango declarado** — vacío del eyector 85 % (80–90), de la bomba 92 % (90–95), caudales 55/100/130 l/min, consumo 50/120 Nl/min, volumen de ventosa 1,5–20 cm³, Ø efectivo 2–3 mm menor que el exterior, válvula 10 ms (5–20), histéresis 30 mbar (20–50), aire comprimido 0,10 kWh/Nm³ (0,09–0,12).
- **Verificación numérica propia** — 912 comprobaciones, barrido de 320 propuestas, 18 válidas.
- **Relación con MEC-93 a MEC-99** — aquéllos resuelven la potencia y el mando neumáticos con aire a presión; éste invierte el signo de la presión y pregunta lo que ninguno puede preguntar: cuánta fuerza cabe por debajo de la atmósfera, y cuánta menos hay a 2 660 m que al nivel del mar.
