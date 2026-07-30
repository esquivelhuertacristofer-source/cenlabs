# MEC-95 · Válvulas direccionales: vías, posiciones y mandos básicos

**Dominio:** D4 · Hidráulica y Neumática
**Práctica del backlog:** d4-03 — «Identifica válvulas direccionales y arma mandos básicos» — **Molde S** — **D4 3/18**
**Simulador:** `/labs/valvulas-direccionales-mandos.html`
**Slug de construcción:** `valvulas-direccionales-mandos`

---

## Qué enseña

1. **Los dos números no son un código de fabricante.** El primero cuenta los orificios de trabajo (vías) y el segundo las posiciones estables del carrete: 3/2 son tres orificios y dos posiciones, 5/3 son cinco y tres.
2. **La 5/2 no añade «una vía» a la 3/2.** Añade una **segunda salida de trabajo con su propio escape**: el 3 vacía la salida 2 y el 5 vacía la salida 4. Por eso la 3/2 mueve un simple efecto y la 5/2 uno de doble efecto.
3. **El número del pilotaje dice lo que hace.** ISO 11727: el **12** conecta el 1 con el 2, el **14** conecta el 1 con el 4. No hay que memorizar nada — el nombre es la función.
4. **Una 3/2 NC en reposo NO bloquea la línea de trabajo: la pone a ESCAPE** (comunica 2 con 3). Ese detalle es lo que permite que el muelle del cilindro expulse su aire y vuelva; si la vía quedara cerrada, el vástago se clavaría con aire atrapado.
5. **La válvula no decide sola la posición de reposo del vástago.** La **misma** 3/2 NC deja el expulsor **dentro** y el tope **fuera** al soltar. Lo que cambia es el muelle del cilindro: `seRet` retrae, `seAva` avanza.
6. **Monoestable pide una orden; biestable y 5/3 piden dos.** Con un solo mando sobre una válvula de dos pilotajes, la segunda posición de trabajo no se puede ordenar nunca: mando incompleto, no avería del componente. El matiz importa porque las dos fallan distinto — la **5/2 biestable se queda pegada** donde la dejó el pulso, mientras que la **5/3 sí vuelve al centro** por sus muelles. El diagnóstico del banco se ve en el **elevador**, la única estación con válvula de tres posiciones y orden eléctrica.
7. **El muelle de reposición se paga, y se paga como RANGO.** El Ø32 a 6 bar da **482,5 N** teóricos y **410,2 N** útiles (η = 0,85); el muelle se lleva entre **48,3 y 96,5 N**, así que queda una fuerza neta de **313,7 a 361,9 N**. El 10 %–20 % es criterio de catálogo de fabricante, no valor normalizado.
8. **Presurizar las dos cámaras a la vez no bloquea el cilindro: lo hace salir con la fuerza del ÁREA DEL VÁSTAGO.** En el elevador Ø63 a 6 bar son **160,2 N** frente a **1589,8 N** de avance normal, **9,92 veces menos**. Identidad verificada: esos 160,2 N son exactamente la fuerza útil del vástago Ø20 a 6 bar.
9. **Sólo un muelle sostiene una posición.** Con la red despresurizada, la barrera y la mordaza (doble efecto) quedan **libres** — la barrera cae por su propio peso — mientras el expulsor y el tope conservan su posición de muelle.
10. **El centro cerrado guarda la POSICIÓN, no la presión.** Las dos cámaras del elevador quedan `bloqueada` con y sin red: mantiene el vástago quieto, pero la ISO 4414 no admite el aire atrapado como medio de retención de una carga suspendida.
11. **Cruzar las salidas de trabajo no es siempre un error de montaje.** El **único** conexionado válido de la barrera es **cruzado**: es la forma de obtener con una 5/2 monoestable la posición de reposo que la estación pide.
12. **Tapar los escapes produce dos averías distintas según el cilindro.** En un doble efecto, el vástago no se mueve aunque la válvula conmute; en un simple efecto, la orden se cumple y lo que se pierde es el **retorno**.
13. **Cumplir no basta: gana el mando que cumple Y cuesta menos.** El expulsor y el tope tienen **dos** ternas funcionales cada uno, pero la segunda usa una 5/2 monoestable donde bastaba una 3/2 — sobredimensionar cuenta como error.
14. **Hay opciones del catálogo que no ganan en ninguna estación.** La **3/2 NA**, la **5/3 de centros a escape**, la **palanca enclavada** y el conexionado **con escapes obturados** no son la respuesta en ningún caso, y están ahí a propósito.

---

## Lógica (verificada `verif_valvulas.mjs` — 132/132)

**Constantes selladas del motor** (idénticas en el verificador y en el laboratorio, copiadas verbatim entre los marcadores `MOTOR` / `FIN MOTOR`):

| Símbolo | Valor | Origen |
|---|---|---|
| `ETA` | 0,85 | rendimiento del cilindro (fricción de juntas y guías) |
| `MUELLE_MIN` / `MUELLE_MAX` | 0,10 / 0,20 | fracción de la fuerza teórica que absorbe el muelle de reposición (**rango** de catálogo) |
| `P_REF_MUELLE` | 6 bar | presión de referencia con la que el fabricante tabula la fuerza del muelle |
| `CIL_ISO` | 32→12 · 40→16 · 50→20 · 63→20 · 80→25 · 100→25 | parejas émbolo-vástago de la ISO 15552 |

**Fórmulas del motor**

| Magnitud | Expresión |
|---|---|
| Área del émbolo | `A_emb = π·D²/4` |
| Área anular | `A_anu = π·(D² − d²)/4` |
| Fuerza teórica | `F_teo = p·A` |
| Fuerza útil | `F_útil = η·p·A` |
| Fuerza del muelle | `F_muelle = f · p_ref · A_emb` con `f` ∈ [0,10 · 0,20] |
| Fuerza diferencial (ambas cámaras a presión) | `F_dif = η·p·(A_emb − A_anu)` = fuerza del **área del vástago** |

**Catálogo de válvulas**

| Clave | Designación | Vías | Posiciones | Estado | Reposo | Coste | Comunica |
|---|---|---|---|---|---|---|---|
| `v32nc` | 3/2 NC | 3 | 2 | mono | pos. a | 1 | a: 2–3 · b: 1–2 |
| `v32na` | 3/2 NA | 3 | 2 | mono | pos. a | 1 | a: 1–2 · b: 2–3 |
| `v52m` | 5/2 mono | 5 | 2 | mono | pos. a | 2 | a: 1–2, 4–5 · b: 1–4, 2–3 |
| `v52b` | 5/2 bi | 5 | 2 | **bi** | ninguno | 3 | igual que la 5/2 mono, pero sin reposo |
| `v53c` | 5/3 centro cerrado | 5 | 3 | centro | centro | 4 | centro: **nada** |
| `v53e` | 5/3 centros a escape | 5 | 3 | centro | centro | 4 | centro: 2–3, 4–5 |

`costo` es un **orden de complejidad**, no un precio: 3/2 < 5/2 mono < 5/2 biestable < 5/3.

**Orificios (ISO 11727)**

| Puerto | Función | 3/2 (letras antiguas) | 5/2 (letras antiguas) |
|---|---|---|---|
| `1` | Alimentación | P | P |
| `2` | Salida de trabajo | A | B |
| `3` | Escape | R | S |
| `4` | Salida de trabajo | — | A |
| `5` | Escape | — | R |
| `12` | Pilotaje: conecta 1 con 2 | Z | Z |
| `14` | Pilotaje: conecta 1 con 4 | — | Y |

**Accionamientos**

| Clave | Nombre | Origen | Órdenes | ¿Sostiene? |
|---|---|---|---|---|
| `pulsMuelle` | Pulsador con retorno por muelle | manual | 1 | no |
| `palanca` | Palanca enclavada | manual | 1 | sí |
| `rodillo` | Rodillo de fin de carrera | mecánico | 1 | no |
| `solenoideMuelle` | Solenoide con retorno por muelle | eléctrico | 1 | sí |
| `pilotoDoble` | Doble pilotaje neumático | neumático | 2 | — |
| `solenoideDoble` | Dos solenoides | eléctrico | 2 | — |

**Los cuatro criterios del mando**

| Criterio | Condición |
|---|---|
| `okFunc` | La válvula tiene **salidas suficientes** para el cilindro (3/2 al simple efecto, 5/x al doble efecto) y el centro que la estación necesita |
| `okMando` | El accionamiento **da tantas órdenes como la válvula pide** y su origen y clase (momentánea / mantenida / memoria / centro) coinciden con la estación |
| `okTubos` | Con la orden dada, el vástago hace **el movimiento que la estación pide** |
| `okReposo` | Al soltar la orden, el vástago queda **donde la estación exige** |

**Cada criterio puede fallar en solitario** (barrido completo; casos con exactamente un criterio incumplido): `okMando` 25 · `okTubos` 7 · `okReposo` 2 · coste mínimo 2. **`okFunc` nunca falla en solitario y eso se afirma explícitamente**: cuando la válvula no tiene salidas para el cilindro, el conexionado o el reposo fallan a la vez por construcción (aparece en 162 casos, siempre acompañado). Es una imposibilidad **estructural**, no texto muerto — y se documenta como tal en lugar de disimularla.

---

## Las cinco estaciones (barrido completo 6 × 6 × 3 = 108 por estación · **540 en total**)

| Estación | Cilindro | Ø | Red | Origen de la orden | Clase | Con la orden | Al soltar | Sin aire | Terna única | Válidas | Válidas **y mínimas** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Expulsor de recortes de una guillotina | simple efecto, muelle retrae | 32 | 6 bar | manual | momentánea | avanza | dentro | dentro | `3/2 NC · pulsador+muelle · convención` | 2/108 | **1** |
| Tope retráctil de una línea de palets | simple efecto, muelle avanza | 32 | 6 bar | mecánico | momentánea | retrocede | fuera | fuera | `3/2 NC · rodillo · convención` | 2/108 | **1** |
| Barrera de acceso de doble efecto | doble efecto | 40 | 6 bar | eléctrico | mantenida | retrocede | fuera | **libre** | `5/2 mono · solenoide+muelle · CRUZADO` | 1/108 | **1** |
| Mordaza de sujeción de una fresadora | doble efecto | 50 | 5 bar | neumático | memoria | avanza | apretando | **libre** | `5/2 bi · doble pilotaje · convención` | 1/108 | **1** |
| Plataforma elevadora de carga | doble efecto | 63 | 6 bar | eléctrico | centro (parada intermedia) | avanza | bloqueado | bloqueado | `5/3 CC · dos solenoides · convención` | 1/108 | **1** |

**En cada estación hay exactamente una opción válida por eje** con los otros dos correctos — un solo modelo de válvula, un solo accionamiento y un solo conexionado. Y las cinco ternas son distintas.

**Las dos ternas válidas pero NO mínimas** (el único caso en que cumplir no basta): el expulsor también funciona con `5/2 mono · pulsador+muelle · convención` y el tope con `5/2 mono · rodillo · cruzado`, ambas de coste 2 donde bastaba coste 1. Comprar cinco vías para un cilindro de simple efecto funciona y se penaliza.

**Fuerzas de cada estación** (todas calculadas por el motor, ninguna escrita a mano)

| Estación | A_émbolo (cm²) | A_anular (cm²) | Ratio | F_teórica (N) | F_útil avance (N) | F_útil retroceso (N) | F_diferencial (N) | F_avance / F_dif |
|---|---|---|---|---|---|---|---|---|
| Expulsor Ø32 · 6 bar | 8,0425 | 6,9115 | 0,8594 | 482,5 | 410,2 | 352,5 | 57,7 | 7,11 |
| Tope Ø32 · 6 bar | 8,0425 | 6,9115 | 0,8594 | 482,5 | 410,2 | 352,5 | 57,7 | 7,11 |
| Barrera Ø40 · 6 bar | 12,5664 | 10,5558 | 0,8400 | 754,0 | 640,9 | 538,3 | 102,5 | 6,25 |
| Mordaza Ø50 · 5 bar | 19,6350 | 16,4934 | 0,8400 | 981,7 | 834,5 | 701,0 | 133,5 | 6,25 |
| Elevador Ø63 · 6 bar | 31,1725 | 28,0309 | 0,8992 | 1870,3 | 1589,8 | 1429,6 | 160,2 | **9,92** |

**Fuerza neta tras el muelle** (sólo los cilindros de simple efecto, y siempre como rango): Ø32 a 6 bar → muelle **48,3 a 96,5 N**, neta **313,7 a 361,9 N** de los 410,2 N útiles.

**Estado de las cámaras al soltar la orden, con la terna ganadora**

| Estación | Con red | Veredicto | Sin red | Veredicto |
|---|---|---|---|---|
| Expulsor | trasera a escape · anular atmósfera | dentro por muelle | igual | dentro por muelle |
| Tope | trasera atmósfera · anular a escape | fuera por muelle | igual | fuera por muelle |
| Barrera | trasera a presión · anular a escape | avanza | trasera atmósfera · anular a escape | **libre** |
| Mordaza | trasera a presión · anular a escape | avanza (aprieta) | trasera atmósfera · anular a escape | **libre** |
| Elevador | ambas **bloqueadas** | bloqueado | ambas **bloqueadas** | bloqueado |

**Diagnósticos vivos**: `whyValv` 7 · `whyAcc` 15 · `whyCon` 3 — **25 mensajes distintos**, todos alcanzables en el barrido. Los tres del conexionado cubren los dos casos de escapes obturados por separado (doble efecto: no se mueve; simple efecto: se mueve y no vuelve).

---

## Anclas de honestidad

- **La 3/2 NC en reposo pone la salida a ESCAPE, no la bloquea.** Es el punto que más se enseña mal, y aquí se ve en el símbolo generado por el motor.
- **El número del pilotaje no es decorativo.** 12 conecta 1 con 2 y 14 conecta 1 con 4 (ISO 11727). La regla se enuncia y se comprueba en la tabla de orificios.
- **La misma válvula da reposos opuestos.** Expulsor dentro y tope fuera con la misma 3/2 NC: la posición de reposo la decide el **cilindro**, no la válvula. Es el mismo componente en dos estaciones consecutivas, a propósito.
- **La fuerza del muelle se declara como RANGO (10 %–20 %), nunca como cifra.** 48,3–96,5 N en el Ø32, neta 313,7–361,9 N. El 10 %–20 % y el η = 0,85 son criterios de catálogo de fabricante, **no** valores de la ISO 15552.
- **Presurizar las dos cámaras no bloquea nada.** El vástago sale con la fuerza del área del vástago: 160,2 N contra 1589,8 N en el Ø63, 9,92 veces menos. Verificado como identidad contra el área del vástago Ø20.
- **Un doble efecto sin aire no tiene posición.** La barrera cae por su propio peso. El laboratorio lo dice con esas palabras en lugar de dejar el vástago quieto en la animación.
- **El centro cerrado guarda posición, no presión.** `bloqueada` ≠ `presion`: la mordaza biestable sigue apretando, el elevador sólo se queda quieto. ISO 4414: el aire atrapado no es medio de retención de una carga suspendida.
- **Cruzar las salidas puede ser la solución.** El único conexionado válido de la barrera es el cruzado. Se presenta como decisión de proyecto, no como error de montaje.
- **Los escapes obturados no dan un síntoma único.** Doble efecto: no se mueve. Simple efecto: se mueve y no vuelve. Son dos mensajes distintos y el motor elige según el cilindro.
- **`okFunc` no puede fallar en solitario, y se dice.** El barrido lo confirma (0 casos solos, 162 acompañados). En lugar de esconder el cero se afirma la imposibilidad estructural y se explica.
- **Cuatro opciones del catálogo no ganan nunca:** 3/2 NA, 5/3 de centros a escape, palanca enclavada y escapes obturados. Están para descartarlas con un motivo, no para rellenar la lista.
- **No se modela** el caudal ni la velocidad de conmutación (eso es MEC-94), ni el solape del carrete, la fuga interna, la caída de presión, el estrangulamiento meter-in/meter-out, el servopilotaje, la lógica secuencial ni la dinámica del vástago.

---

## Molde y estructura

**Molde S** (banco 3D + pizarrón de 1024×768 con cuatro modos):

- **Vías:** el símbolo ISO 1219-1 **dibujado por el motor** a partir de la tabla de conexiones —una caja por posición, la caja activa resaltada, las flechas de paso y los escapes— con la tabla de orificios de la ISO 11727 al pie y la nota de la regla 12/14.
- **Mando:** traza de tres fases (reposo → orden → soltada) con la posición del carrete, el estado de las dos cámaras y el veredicto del vástago en cada una, la cuenta de órdenes que da el accionamiento frente a las que la válvula pide, y la fuerza útil frente a la neta tras el muelle.
- **Sin aire:** el conexionado dibujado sobre la caja activa (convención, cruzado o escapes obturados), el estado de las cámaras con y sin red, y el veredicto —incluida la fuerza diferencial cuando las dos cámaras se presurizan.
- **Reto:** calificación **triple ortogonal** (válvula / accionamiento / conexionado), cada eje evaluado con los otros dos correctos, más el criterio de coste mínimo y el diagnóstico por eje.
- **Banco 3D:** válvula seccionada con el carrete que se desplaza a la posición activa, los cinco orificios numerados, el accionamiento que cambia de pieza según la elección, los tubos que se recolorean según lo que llevan (presión, escape, atmósfera, bloqueado) y el cilindro de la estación con su muelle visible.
- **Cuestionario:** 4 opciones barajadas (Fisher-Yates) por modo, con los distractores verificados falsos contra el motor.

---

## Verificación en dos capas

1. **Numérica:** `scratchpad/verif_valvulas.mjs` — **132 comprobaciones, 0 fallos** (consistencia del catálogo de válvulas y de la tabla de orificios, accionamientos, áreas y fuerzas —teórica, útil, muelle como rango y diferencial con la identidad del área del vástago—, la máquina de estados del montaje en las tres fases, el barrido completo de las **540** combinaciones con terna única válida y mínima en cada estación y una sola opción válida por eje, que cada criterio puede fallar en solitario —y que `okFunc` no puede, con la razón—, los 25 mensajes de diagnóstico y la configuración de partida del reto).
2. **Navegador:** arnés Playwright contra `window.__labDebug` sobre servidor HTTP local, más el recorrido guiado completo (`runAuto`) con la narración verificada paso a paso.

---

## Referencias

- **ISO 1219-1** — Transmisiones hidráulicas y neumáticas, símbolos gráficos y esquemas de circuito, parte 1: símbolos gráficos de uso convencional y de procesamiento de datos. Es la norma del símbolo de cajas y flechas que el laboratorio dibuja.
- **ISO 11727** — Neumática: identificación de los orificios y de los solenoides de válvulas de control direccional. Fija 1 alimentación, 2 y 4 salidas, 3 y 5 escapes, 12 y 14 pilotajes, con la regla de que el pilotaje `1x` conecta el 1 con el `x`.
- **ISO 5599-1** — Válvulas neumáticas de control direccional de cinco vías: interfaces de montaje sin conexiones eléctricas. Norma de la que provienen las series de montaje de las 5/2 y 5/3.
- **ISO 15552** — Cilindros neumáticos de simple y doble efecto con montaje desmontable: parejas émbolo-vástago (32/12, 40/16, 50/20, 63/20, 80/25, 100/25) usadas para el área anular.
- **ISO 4414** — Transmisiones neumáticas: reglas generales y requisitos de seguridad. Base del criterio de que el aire atrapado no es un medio de retención para una carga suspendida.
- **IEC 60947-5-1** — Aparamenta de baja tensión, dispositivos de circuitos de mando: lado eléctrico de los solenoides y de los finales de carrera del banco.
- **Criterios de proyecto de fabricante** (Festo y SMC, manuales de válvulas y actuadores): rendimiento η = 0,85 del cilindro y fuerza del muelle de reposición entre el 10 % y el 20 % de la fuerza teórica a la presión de referencia. Recomendaciones de ingeniería, **no** valores normativos.
