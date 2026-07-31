# MEC-98 · Secuencias Multicilindro por Método Cascada

**Dominio:** D4 · Hidráulica y Neumática
**Práctica del backlog:** d4-06 — «Resuelve secuencias multicilindro por método cascada»
**Simulador:** `/labs/secuencias-cascada-multicilindro.html`
**Slug de construcción:** `secuencias-cascada-multicilindro`

---

## Qué enseña

1. **El conflicto es real y tiene nombre.** En A+ B+ B− A− el final de carrera que ordena B− sigue pisado cuando toca ordenar A−: el carrete de la válvula de A recibe dos órdenes contrarias y la máquina se clava sin que se rompa nada.
2. **Sin cascada no se mueve nada.** Con un solo grupo, las **cinco** estaciones del banco ejecutan **cero** movimientos. Ése es el punto de partida del método, y se puede comprobar.
3. **El número de grupos lo fija el entrelazado, no los cilindros.** 2 cil / 2 grupos (marcadora, transfer), **2 cil / 3 grupos** (punzonado), **3 cil / 3 grupos** (encajadora), **3 cil / 4 grupos** (envasadora).
4. **El hardware sale del reparto.** `inversores = grupos − 1`: una 5/2 biestable por frontera, que se conmuta y se queda.
5. **La señal de cambio es una consecuencia, no una decisión.** Es el final de carrera del **último movimiento del grupo que termina**. Cambia el reparto y la señal correcta cambia con él.
6. **Todos los repartos válidos funcionan.** 4 válidos en la marcadora, 5 en el transfer, 2 en el punzonado, **8** en la encajadora y 4 en la envasadora — y **todos ejecutan la secuencia completa**. «Funciona en el banco» no valida nada.
7. **El grupo de más se paga.** +0,157 a +0,397 s de ciclo, +0,263 a +0,469 l de aire de mando, un inversor y de 108 a **209 ciclos/h**, con idéntico resultado en la pieza.
8. **Un mando roto tiene TRES desenlaces, y el más frecuente no se para.** *Órdenes opuestas* sobre un cilindro = la máquina se clava y el reparto está mal hecho. *Espera una señal* que ya no se va a pisar = se clava y el final de carrera de cambio está mal elegido. Y el tercero, **la cascada da la vuelta**: las líneas conmutan una tras otra, nadie se para, el ciclo cierra en tiempo normal y faltan movimientos. De los 457 mandos rotos del barrido de 480, **343 acaban así**. El criterio no es «¿se paró?» sino «¿ejecutó la secuencia entera?».
9. **El mando no es gratis.** Las conmutaciones se llevan del **13,1 %** del ciclo (transfer) al **27,5 %** (punzonado). En secuencias cortas con muchos grupos es la partida que decide.
10. **El tiempo muerto se integra.** Cada cambio de línea llena el tubo de mando real (Ø2,5 mm) más los pilotajes del grupo: 0,19–0,49 s por conmutación.
11. **Fuerza y velocidad tiran al revés.** En el transfer el Ø32 da 1944 ciclos/h y se descarta: 1,300 m/s > 1,00.
12. **El grande no es el rápido.** Encajadora de Ø32 a Ø100: 1124, **1282**, 1262, 1203, 1120, 1011 ciclos/h. Óptimo **interior** en 4 de las 5 estaciones.
13. **Una ventana puede cerrarse casi del todo.** En el punzonado el Ø63 no tiene fuerza (0,951) y el Ø100 no llega al ritmo (1979 de 2000): **un solo diámetro válido** en toda la estación.
14. **El retorno no es la ida.** El área anular de la ISO 15552 es menor: el retorno es más rápido, gasta menos y tiene menos fuerza — hay que dimensionar contra el movimiento **más** exigente, no contra el promedio.

---

## Lógica (verificada `verif_cascada.mjs` — 236/236)

### Constantes selladas

| Constante | Valor | Origen |
|---|---|---|
| `P_ANR` | 1,000 bar abs | ISO 8778 (aire de referencia normal) |
| `P_ATM` | 1,013 bar abs | atmósfera de referencia |
| `B_CRIT` | 0,45 | ISO 6358, valor típico dentro del rango 0,2–0,5 |
| `P_PILOT` | 2,5 bar | criterio de fabricante (rango 1,5–3,0) |
| `RENDIM` | 0,90 | rendimiento mecánico del cilindro (rango 0,85–0,95) |
| `CARGA_MAX` | 0,70 | relación de carga máxima (rango 0,50–0,80) |
| `V_MAX` | 1,00 m/s | velocidad admisible del vástago (rango 0,5–1,5) |
| `C_MAN_1M` | 12,5 | conductancia de 1 m de tubo de mando de Ø2,5 mm |
| `D_MAN` | 2,5 mm | diámetro interior del tubo de mando |
| `V_PIL` | 0,008 l | volumen de pilotaje por válvula |
| `E_AIRE` | 0,11 kWh/m³ | coste energético del aire comprimido (rango 0,10–0,12) |

### Fórmulas

| Magnitud | Expresión |
|---|---|
| Caudal ISO 6358 sónico (`r ≤ b`) | `Q = C · p1` |
| Caudal ISO 6358 subsónico (`r > b`) | `Q = C · p1 · √(1 − ((r − b)/(1 − b))²)`, con `r = p2/p1` |
| Factor del caudal nominal | `F_QN = 7·√(1 − ((6/7 − b)/(1 − b))²) = 4,706247` |
| Coeficiente sónico desde catálogo | `C = Qn / F_QN` → `Qn 100 → C = 21,2484`; `Qn 200 → C = 42,4967` |
| Área de émbolo / anular | `πD²/4` y `π(D² − d²)/4` con las parejas ISO 15552 |
| Relación de carga | `F / (p · A · RENDIM) ≤ 0,70` en el movimiento más exigente |
| Tiempo de carrera | integración del llenado de la cámara con ISO 6358 |
| Tiempo muerto de cambio de línea | llenado del tubo de mando (`C = C_MAN_1M / L`) + `V_PIL` por válvula del grupo |
| Ciclo | `Σ tiempos de movimiento + Σ tiempos de cambio de línea` (igualdad exacta verificada) |
| Inversores | `grupos − 1` |
| Coste (orden lexicográfico) | `[nº de grupos, índice del diámetro]` |

### Reglas del método

| Regla | Enunciado | Por qué |
|---|---|---|
| Separación | Ningún cilindro se repite dentro de un grupo | si se repite, los dos pilotajes de su memoria cuelgan de la misma línea viva; el choque puede llegar a producirse (la máquina se clava) o no llegar nunca porque la cascada da la vuelta antes, pero el reparto es inválido en los dos casos |
| Mínimo | Entre los válidos, gana el de menos grupos | cada grupo cuesta un inversor, tiempo muerto y aire de mando sin cambiar el resultado |
| Señal de cambio | Final de carrera del **último movimiento del grupo que termina** | cualquier otro deja la máquina esperando una señal que ya no se va a pisar, o —lo más habitual— la lanza a conmutar de línea antes de tiempo hasta dar la vuelta con la secuencia a medias |

### Criterios (6) y cuántas veces falla cada uno EN SOLITARIO

| Capa | Criterio | Qué comprueba | Fallos en solitario |
|---|---|---|---|
| Diseño | `okSep` | Ningún cilindro repetido dentro de un grupo | **144** |
| Diseño | `okMin` | El reparto usa el número mínimo de grupos | 108 |
| Diseño | `okCam` | La señal de cambio es el final de carrera correcto | 114 |
| Dimensionado | `okFza` | Relación de carga ≤ 0,70 | 2 |
| Dimensionado | `okVel` | Velocidad del vástago ≤ 1,00 m/s | 3 |
| Dimensionado | `okRit` | Se alcanza el ritmo pedido | 4 |

Las dos capas están **encadenadas**: si el mando no ejecuta, los criterios de dimensionado no significan nada. Barrido completo: **2880 combinaciones, 10 válidas**; los **2742** mandos rotos fallan los 2742 al ejecutar.

---

## Las cinco estaciones

| Estación | Secuencia | Red | Qn | Mando | Ritmo pedido | Cilindro crítico |
|---|---|---|---|---|---|---|
| Marcadora de piezas | A+ B+ B− A− | 6 bar | 100 | 8 m | 1200 /h | **B** — cabezal marcador, 120 mm, 1400 N |
| Transfer de dos ejes | A+ B+ A− B− | 6 bar | 200 | 10 m | 1400 /h | **A** — carro horizontal, 400 mm, 250 N |
| Prensa de punzonado | A+ A− B+ B− | 6 bar | 100 | 6 m | 2000 /h | **A** — punzón, 60 mm, 1600 N |
| Encajadora de producto | A+ B+ B− C+ C− A− | 6 bar | 200 | 12 m | 1200 /h | **A** — empujador de cajas, 300 mm, 350 N |
| Envasadora vertical | A+ A− B+ B− C+ C− | 6 bar | 100 | 9 m | 1000 /h | **C** — mordaza de sellado, 40 mm, 1500 N |

### Terna ganadora de cada estación

| Estación | Reparto | Grupos | Inversores | Señal | Ø | Carga | v | Ciclo | Ciclos/h | Aire/ciclo | Mando | Válidos |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Marcadora | A+ B+ \| B− A− | 2 | 1 | `b1` | 80 | 0,516 | 0,313 m/s | 2,647 s | **1360** | 5,818 l | 15,3 % | 4/8 |
| Transfer | A+ B+ \| A− B− | 2 | 1 | `b1` | 63 | 0,165 | 0,884 m/s | 2,154 s | **1671** | 7,796 l | 13,1 % | 5/8 |
| Punzonado | A+ \| A− B+ \| B− | **3** | 2 | `a1` | 80 | 0,589 | 0,275 m/s | 1,720 s | **2093** | 3,682 l | **27,5 %** | 2/8 |
| Encajadora | A+ B+ \| B− C+ \| C− A− | 3 | 2 | `b1` | 40 | 0,614 | 0,933 m/s | 2,809 s | **1282** | 8,123 l | 21,5 % | **8/32** |
| Envasadora | A+ \| A− B+ \| B− C+ \| C− | **4** | 3 | `a1` | 80 | 0,553 | 0,275 m/s | 3,260 s | **1104** | 6,581 l | 27,4 % | 4/32 |

El reparto por el algoritmo voraz resulta válido, mínimo **y único** en las cinco estaciones.

---

## Tabla de diámetros (reparto y señal ya correctos) — `*` = válido

| Estación | Ø32 | Ø40 | Ø50 | Ø63 | Ø80 | Ø100 |
|---|---|---|---|---|---|---|
| Marcadora | carga 3,224 ✗ | 2,063 ✗ | 1,320 ✗ | 0,832 ✗ | **0,516 · 1360 \*** | 0,330 · 1245 \* |
| Transfer | v 1,300 ✗ (1944) | v 1,281 ✗ | v 1,117 ✗ | **0,165 · 1671 \*** | 0,102 · 1469 \* | ritmo 1236 ✗ |
| Punzonado | 3,684 ✗ | 2,358 ✗ | 1,509 ✗ | 0,951 ✗ (1500) | **0,589 · 2093 \*** | ritmo **1979** ✗ |
| Encajadora | 0,938 ✗ · 1124 ✗ | **0,614 · 1282 \*** | 0,393 · 1262 \* | 0,231 · 1203 \* | ritmo 1120 ✗ | ritmo 1011 ✗ |
| Envasadora | 3,454 ✗ | 2,210 ✗ | 1,415 ✗ | 0,891 ✗ | **0,553 · 1104 \*** | 0,354 · 1079 \* |

Cuando la relación de carga supera 1 el cilindro **no se mueve**: el ciclo es infinito y el laboratorio lo muestra como *no cierra*, no como un ritmo bajo.

**Ritmo máximo por estación:** marcadora Ø80 · transfer **Ø32** · punzonado Ø80 · encajadora **Ø40** · envasadora Ø80. En **4 de 5** el óptimo es interior: el mayor diámetro nunca es el más rápido.

---

## El coste de un grupo de más

| Estación | Grupos | Ciclo | Aire de mando | Ciclos/h |
|---|---|---|---|---|
| Marcadora | 2 → 3 | 2,647 → 2,876 s (**+0,229**) | 0,887 → 1,219 l (+0,332) | 1360 → 1252 (−108) |
| Transfer | 2 → 3 | 2,154 → 2,463 s (+0,309) | 1,025 → 1,425 l (+0,400) | 1671 → 1462 (−209) |
| Punzonado | 3 → 4 | 1,720 → 1,877 s (+0,157) | 1,012 → 1,275 l (+0,263) | 2093 → 1918 (−175) |
| Encajadora | 3 → 4 | 2,809 → 3,205 s (**+0,397**) | 1,744 → 2,213 l (**+0,469**) | 1282 → 1123 (−159) |
| Envasadora | 4 → 5 | 3,260 → 3,528 s (+0,268) | 1,800 → 2,166 l (+0,366) | 1104 → 1020 (−84) |

Más un inversor de hardware en cada caso, y con **el mismo resultado en la pieza**.

---

## Anclas de honestidad

- **Sin cascada no se mueve nada.** Un solo grupo ejecuta **cero** movimientos en las cinco estaciones. El método no es una optimización: es lo que hace que la máquina exista.
- **El número de grupos no se deduce del número de cilindros.** El punzonado (2 cil → 3 grupos) y la encajadora (3 cil → 3 grupos) son contraejemplos mutuos dentro del mismo banco.
- **Todo reparto válido ejecuta, incluso el que no es mínimo.** Verificado sobre el barrido completo. Por eso «funciona en el banco» no es un criterio de aceptación.
- **Ningún reparto con cilindro repetido ejecuta jamás.** También verificado sobre el barrido completo: no hay casos afortunados.
- **La señal de cambio no es una decisión independiente.** Sale del reparto. Se califica aparte en el reto sólo para que el alumno vea **cuál** de las dos cosas ha fallado.
- **El diámetro más grande no es el más rápido** en 4 de las 5 estaciones. La cadencia sube y luego baja.
- **La ventana puede cerrarse hasta un solo diámetro** (punzonado). Cuando eso pasa en un proyecto real, la salida no es forzar el catálogo: es renegociar presión de red, tubo o ritmo pedido.
- **Cuando la carga excede la capacidad, el ciclo es infinito.** No se muestra «un ritmo bajo»: se muestra *no cierra*.
- Los mandos regulados (estrangulación meter-in/meter-out, escape rápido) **no** se simulan: aquí la velocidad es **consecuencia** del diámetro. La lógica combinacional Y/O y la temporización neumática son materia de **MEC-97**; la electroneumática con relevadores y la calidad del aire de la ISO 8573-1 quedan para otros laboratorios del dominio.
- La relación de carga máxima, el rendimiento, la velocidad admisible, la presión y el volumen de pilotaje y el coste del aire son **criterios de fabricante declarados con su rango**, no valores normativos. `b = 0,45` es un valor típico dentro del rango 0,2–0,5 que admite la ISO 6358. El «coste» del reto es un orden de complejidad, no un precio.

---

## Molde y estructura

**Molde S** (banco 3D + pizarrón 1024×768 fuera de pantalla + panel de telemetría HTML), cuatro modos:

| Modo | Contenido |
|---|---|
| `reparto` | La secuencia como fichas con frontera conmutable entre cada par; cilindros repetidos en rojo; tabla por grupo con contenido, tiempo muerto y aire de mando; recuento de repartos posibles / válidos / mínimos |
| `mando` | Circuito de cascada ISO 1219-1 completo; se elige la señal de cambio y se ve la línea viva, el orden realmente ejecutado frente al pedido y el desenlace nombrado. Como el reparto de este modo siempre es válido, las «órdenes opuestas» son **imposibles por construcción**: de sus 24 combinaciones, 5 ejecutan, 15 dan la vuelta y 4 esperan una señal |
| `ritmo` | Barras de carga, velocidad y cadencia contra sus límites; ciclo desglosado en movimiento y mando; tabla de los seis diámetros con su veredicto |
| `reto` | Estación sorteada; se proyectan reparto, señal y diámetro con calificación triple ortogonal |

El banco 3D contiene tres estaciones de cilindro (camisa, vástago, carga, dos finales de carrera y válvula 5/2 con carrete visible), el panel de líneas de mando con un tubo por línea y un inversor por frontera, la placa de datos de la estación y seis LEDs de criterio, todos con *picking* por hover. La animación conserva las **proporciones** reales entre movimientos y conmutaciones, y con un mando roto reproduce el orden real: se detiene donde se detiene la máquina, o cierra el ciclo a medias si la cascada da la vuelta.

**Reto de calificación triple ortogonal:** cada eje (`cortes`, `cambio`, `diam`) se califica con los otros dos ya correctos. El barrido de las 2880 combinaciones confirma una sola terna válida y de coste mínimo por estación. El veredicto exige **válido Y mínimo**.

---

## Verificación en dos capas

**Capa 1 — numérica:** `verif_cascada.mjs`, **236 comprobaciones, 0 fallos**. Cubre las dos ramas de la ISO 6358 y su continuidad en la relación crítica, la conversión `Qn → C` en el punto normalizado, las áreas ISO 15552, la igualdad exacta entre el ciclo total y la suma de movimientos y conmutaciones, que ningún reparto con cilindro repetido ejecuta, que todo reparto válido sí ejecuta, que un solo grupo no ejecuta nada, la validez / minimalidad / unicidad del reparto voraz en las cinco estaciones, el barrido de 2880 combinaciones con terna única por estación, los recuentos de fallo en solitario de los seis criterios y el formato SI de todas las cifras.

**Capa 2 — navegador:** Playwright contra `window.__labDebug` sobre servidor HTTP local, en dos arneses: estado estático (modos, telemetría, circuito, reto) y recorrido guiado completo (`runAuto`).

**Capa 3 — regresión del proyecto:** `npx tsc --noEmit` limpio y `npx jest` completo, con los *golden snapshots* actualizados en modo aditivo.

---

## Referencias

- **ISO 1219-1** — Símbolos gráficos: cilindro de doble efecto, válvula 5/2 con pilotaje, final de carrera 3/2 de rodillo, inversor biestable, líneas de trabajo, pilotaje y escape.
- **ISO 6358** — Características de caudal de componentes neumáticos: **simulada** con sus dos ramas y con `b` dentro del rango normativo.
- **ISO 15552** — Cilindros neumáticos: diámetros y parejas émbolo-vástago (32/12 … 100/25).
- **ISO 8778** — Aire de referencia normal (ANR): 1000 hPa, 20 °C, 65 % HR.
- **ISO 4414** — Reglas generales y requisitos de seguridad de los sistemas neumáticos: marco del criterio de mínimo y del diagnóstico de fallos de mando. **No** se realiza apreciación de riesgos.
- **ISO 8573-1** — Clases de pureza del aire comprimido: **citada, no simulada**.
- **Criterios de fabricante con rango declarado** — relación de carga 0,70 (0,50–0,80), rendimiento 0,90 (0,85–0,95), velocidad 1,00 m/s (0,5–1,5), pilotaje 2,5 bar (1,5–3,0), volumen de pilotaje 0,008 l/válvula, coste del aire 0,11 kWh/m³ (0,10–0,12).
- **Verificación numérica propia** — 236 comprobaciones, barrido de 2880 combinaciones, 10 válidas.
- **Relación con MEC-97** — aquel laboratorio resuelve la lógica combinacional y la temporización sobre una sola orden; éste resuelve la **secuencia**, que es el problema que aquél deja explícitamente abierto.
