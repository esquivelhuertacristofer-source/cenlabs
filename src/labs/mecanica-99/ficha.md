# MEC-99 · Circuitos Electroneumáticos con Relevadores

**Dominio:** D4 · Hidráulica y Neumática
**Práctica del backlog:** d4-07 — «Diseña circuitos electroneumáticos con relevadores»
**Simulador:** `/labs/circuitos-electroneumaticos-relevadores.html`
**Slug de construcción:** `circuitos-electroneumaticos-relevadores`

---

## Qué enseña

1. **Al faltar la tensión decide la VÁLVULA, no el circuito de mando.** Con el corte al 50 % de la carrera hay **tres** desenlaces distintos y la terna no cambia con la estación: monoestable **0 %**, biestable **100 %**, 5/3 de centros cerrados **53–58 %**.
2. **La biestable no congela el actuador: congela la ORDEN.** El carrete se queda en la última posición mandada y el aire sigue empujando, así que el vástago **termina el movimiento** y se queda fuera. Es lo contrario de «se para donde está».
3. **Ni la 5/3 congela del todo.** El aire es compresible y el carrete tiene fugas: se contabiliza una deriva de `0,005` de carrera por segundo, y por eso el criterio «se queda donde está» se declara con una tolerancia del **10 %** de la carrera — el centrado del carrete tarda 28 ms y en un cilindro rápido eso ya es casi un 9 %.
4. **Ninguna de las tres respuestas es «la buena».** La pinza tiene que **sostener**, el expulsor tiene que **retirarse**, la mesa cargada tiene que **pararse**. El comportamiento ante el fallo es un requisito de la estación, no una preferencia de proyecto.
5. **El sello muere con la tensión, y eso es una virtud.** `K1 = (S1 + K1) · S̄2 · F̄IN` sostiene la orden cuando se suelta el pulsador y se cae con la alimentación, así que al volver no hay ninguna etapa activa: **IEC 60204-1 §7.5**.
6. **Ese criterio se mide sin la mano del operario.** El ensayo de rearranque suprime la orden de retroceso durante los 2 s de observación: un retroceso mandado a mano dentro de la ventana se contaría como rearranque automático, que es justo lo contrario de lo que se comprueba.
7. **El selector mantenido no cicla: TIEMBLA.** Mientras siga dado, la orden de avance revive en cuanto el vástago se separa del tope: **160 / 185 / 177 / 175 conmutaciones** del carrete y **0 ciclos** en pinza, expulsor, mesa y prensa.
8. **Donde la ventana del reed pesa mucho, el temblor impide completar la carrera.** La pinza (25 mm de carrera, ventana del **16,0 %**) no pasa del **91 %** y acaba clavada en el **83 %**.
9. **Y donde el reed no es alcanzable no hay ni temblor.** En el empujador del almacén el tope está en el 82 % y la ventana empieza en el 97,5 %: **1 sola conmutación** y el vástago se queda en el **82 %**. El síntoma es distinto porque la causa es distinta.
10. **La ventana del reed es un porcentaje, no un milímetro.** Los mismos 4 mm valen el **1,0 %** en la mesa de 400 mm y el **16,0 %** en la pinza de 25 mm.
11. **El temporizador SIEMPRE paga tiempo frente al final de carrera.** Ajustado al peor caso más un 10 %: expulsor 640 → 753 ms (**2 338 → 2 178** ciclos/h, y pide 2 250: deja de cumplir); mesa 1 631 → 1 985 ms (**274 → 267**, y pide 270: deja de cumplir).
12. **Por eso no se elige por barato: se elige cuando el final de carrera no existe.** En el almacén da 983 ms y **1 064 ciclos/h** sobre los 860 pedidos, y es la **única** opción posible.
13. **La memoria también se paga en energía.** Sostener una monoestable durante el ensayo consume **4,745 mWh**; mandar una biestable a pulsos, **2,188 mWh** — idéntico en las cuatro estaciones de doble efecto.
14. **Sólo el mando momentáneo puede excitar las dos bobinas a la vez.** El sello, la cadena y el selector construyen el retroceso como negación del avance, así que el solape es imposible por construcción; con pulsadores independientes, no.
15. **Cumplir no basta: hay que cumplir con el mínimo.** De las **240** propuestas del banco sólo **9** son válidas, y la mesa elevadora tiene **una sola**.

---

## Lógica (verificada `verif_electroneum.mjs` — 308/308)

### Constantes selladas

| Constante | Valor | Origen |
|---|---|---|
| `DT` | 1 ms | paso de integración del mando |
| `T_REL_ON` / `T_REL_OFF` | 8 / 4 ms | relé de mando 24 V CD, operación y reposición (rangos 5–15 y 2–10) |
| `T_SOL` | 12 ms | excitación del solenoide de la electroválvula (rango 10–30) |
| `T_CARRETE` | 8 ms | carrera del carrete (rango 5–12) |
| `T_MUELLE` | 20 ms | retorno por muelle de la válvula (rango 15–40) |
| `T_REED` | 1 ms | respuesta del sensor reed (rango 0,5–3) |
| `T_V_ON` = `T_SOL`+`T_CARRETE` | **20 ms** | orden eléctrica → carrete en posición |
| `T_V_OFF` = `T_MUELLE`+`T_CARRETE` | **28 ms** | cae la orden → carrete en reposo |
| `VENT_REED` | 4 mm | ventana magnética del reed (rango 2–6) |
| `P_BOB` | 4,5 W | potencia de una bobina de electroválvula (rango 2–6) |
| `DERIVA` | 0,005 carrera/s | fugas del carrete con centros cerrados |
| `TOL` | 0,02 | tolerancia de posición (fracción de carrera) |
| `TOL_CONG` | 0,10 | «se queda donde está»: los 28 ms de centrado ya son ~9 % en un cilindro rápido |
| `TOL_MOV` | 0,03 | desplazamiento mínimo que cuenta como movimiento tras volver la tensión |
| `K_TEMP` | 1,10 | el temporizador se ajusta al peor caso más un 10 % |
| `T_MARCHA` | 200–450 ms | pulso de marcha del operario (250 ms) |
| `T_RETORNO` | 4 000–5 500 ms | orden de retroceso del operario, mantenida |
| `T_CORTE` / `T_OBS` | 600 / 2 000 ms | corte de tensión y observación posterior |
| `T_FIN` | 8 000 ms | duración del ensayo de ciclo |

### Reglas del motor

- **Contactos con retardo de un ciclo.** `paso(estado, condición, tOn, tOff)` sólo conmuta cuando la condición se sostiene el tiempo del aparato; los contactos que lee la lógica son los del scan anterior.
- **Órdenes de cada mando:** momentáneo `AV = S1`, `RE = FIN`; sello `AV = K1`, `RE = ¬K1`; mantenido `AV = S3 · ¬FIN`, `RE = ¬(S3 · ¬FIN)`; cadena `AV = K1 · ¬K2`, `RE = K2`.
- **Bobinas de los relevadores:** sello `cK1 = U · S̄2 · (S1 + K1) · F̄IN`; cadena `cK1 = U · S̄2 · (S1 + K1) · K̄2` y `cK2 = U · ((FIN · K1) + K2) · B̄0`.
- **Señal de fin de carrera:** operario → la orden `SR`; final de carrera → el reed `B1`; temporizador → `KT`, que cuenta mientras la orden de avance se mantiene y se pone a cero si cae.
- **Carrete:** con 1 solenoide sigue a `Y1`; con memoria mantiene la última posición si no hay orden única; con centros vuelve a `C`. Sólo conmuta si la orden se sostiene `T_V_ON` (por bobina) o `T_V_OFF` (por muelle).
- **Actuador:** `A` avanza `DT/tOut`, `B` retrocede `DT/tIn`, `C` deriva `DERIVA·DT/1000` sólo si la estación es vertical.
- **Reed:** umbral `umb = VENT_REED / carrera`; `B0` con `x ≤ umb`, `B1` con `x ≥ 1 − umb`.
- **Preajuste del temporizador:** `PT = round(1,10 × tOutMax)`.
- **Cadencia:** `ciclosH = 3600 / (tCicloAuto/1000 + pausa)`, y `tCicloAuto = tVolvió − tMarcha` sólo si volvió **solo**.
- **Coste:** solenoides de la válvula + relevadores y sensores del mando + relevadores y sensores del cierre.

### Los siete criterios y cuántas veces falla cada uno EN SOLITARIO

| Criterio | Se muestra | Falla solo |
|---|---|---|
| `okEfecto` — válvula acorde al cilindro | 84 | **6** |
| `okSalida` — completa la carrera de trabajo | 37 | **0** (refina a `okCiclo`) |
| `okCiclo` — sale y vuelve al reposo | 44 | **1** |
| `okFalla` — comportamiento correcto al faltar la tensión | 49 | **10** |
| `okArranque` — sin rearranque al volver la tensión | 5 | **3** |
| `okModo` — automático o manual según se pide | 9 | **4** |
| `okRitmo` — ritmo de producción | 3 | **3** |

Familias de fallo más frecuentes: 13 `okSalida+okCiclo+okFalla+okModo` · 12 `okSalida+okCiclo+okModo+okRitmo` · **10 `okFalla` a solas** · 9 propuestas válidas. Al alumno se le enseña siempre el **primer** criterio que falla en el orden de la tabla, y `porQue()` se apoya en la misma función que la tabla de criterios para que el diagnóstico y el panel no puedan desincronizarse.

---

## Las cinco estaciones

| Estación | Cilindro | Carrera | Pide al faltar la tensión | Modo | Ritmo |
|---|---|---|---|---|---|
| Pinza de sujeción | doble efecto | 25 mm | **sostener** la pieza | manual | — |
| Expulsor de la prensa | doble efecto | 100 mm | **retirarse** | automático | 2 250 /h |
| Empujador del almacén | simple efecto | 160 mm | **retirarse**, sin final de carrera posible | automático | 860 /h |
| Mesa elevadora | doble efecto | 400 mm | **quedarse donde esté** (carga vertical) | automático | 270 /h |
| Prensa de marcado manual | doble efecto | 120 mm | **retirarse** (subir) | manual | — |

### Solución mínima de cada estación

| Estación | Válvula + mando + cierre | Coste | Eléctrico | Ciclo | Cadencia |
|---|---|---|---|---|---|
| Pinza | 5/2 biest + Momentáneo + Operario | **2** (2 sol, 0 relés, 0 sens) | 430 ms | — | manual |
| Expulsor | 5/2 mono + Sello + Final de carrera | **3** (1, 1, 1) | 340 ms | 640 ms | 2 338 /h de 2 250 |
| Almacén | 3/2 mono + Sello + Temporizador | **3** (1, 2, 0) | 443 ms | 983 ms | 1 064 /h de 860 |
| Mesa | 5/3 cerr + Cadena + Final de carrera | **6** (2, 2, 2) | 909 ms | 1 631 ms | 274 /h de 270 |
| Prensa | 5/2 mono + Sello + Operario | **2** (1, 1, 0) | 497 ms | — | manual |

**Barrido completo:** 5 estaciones × 48 propuestas = 240. Válidas: 2 en la pinza, 2 en el expulsor, 2 en el almacén, **1** en la mesa y 2 en la prensa — **9 de 240**. En cada estación hay exactamente **una** propuesta de coste mínimo.

---

## El corte de tensión al 50 % de la carrera

| Estación | 5/2 monoestable | 5/2 biestable | 5/3 centros cerrados |
|---|---|---|---|
| Pinza | 0 % | 100 % | **56 %** |
| Expulsor | 0 % | 100 % | **58 %** |
| Mesa | 0 % | 100 % | **53 %** |
| Prensa | 0 % | 100 % | **56 %** |

Y al **volver** la tensión, sin tocar nada: la solución de la mesa se mueve un **1,0 %** (la deriva vertical de la 5/3) y las otras cuatro un **0,0 %**. El umbral del criterio es el 3 % de la carrera.

## La ventana del reed, en porcentaje de carrera

| Estación | Carrera | Ventana |
|---|---|---|
| Pinza | 25 mm | **16,0 %** |
| Expulsor | 100 mm | 4,0 % |
| Prensa | 120 mm | 3,3 % |
| Almacén | 160 mm | 2,5 % |
| Mesa | 400 mm | **1,0 %** |

## El precio del temporizador frente al final de carrera

| Estación | `PT` | Final de carrera | Temporizador | Pide |
|---|---|---|---|---|
| Expulsor | 440 ms | 640 ms · **2 338** /h | 753 ms · **2 178** /h | 2 250 /h |
| Almacén | 704 ms | — · **0** /h (el reed no es alcanzable) | 983 ms · **1 064** /h | 860 /h |
| Mesa | 1 265 ms | 1 631 ms · **274** /h | 1 985 ms · **267** /h | 270 /h |

---

## Anclas de honestidad

- **El selector mantenido con final de carrera no cicla despacio: no cicla.** 160–185 conmutaciones del carrete y **cero** ciclos completos. El síntoma en planta no es una parada, es una vibración contra el tope y un desgaste que nadie atribuye al circuito de mando.
- **En la pinza, el temblor ni siquiera deja completar la carrera:** máximo 91 %, final 83 %. Es la única estación donde eso pasa, y pasa porque su ventana de reed vale el 16 % de la carrera.
- **En el almacén no hay temblor porque no hay reed alcanzable:** 1 conmutación y el vástago clavado en el 82 %. Dos síntomas opuestos de la misma decisión equivocada.
- **La 5/3 no es una posición de bloqueo real.** Se declara su deriva y se mide: 1,0 % en 2 s en la mesa vertical. Presentarla como «congela el actuador» sería mentir.
- **`okSalida` nunca falla en solitario** — siempre arrastra a `okCiclo`, que es su refinamiento. Se declara en vez de esconderlo: el criterio existe para nombrar el síntoma, no para decidir él solo.
- **El ensayo de rearranque suprime la orden del operario.** Si no se suprimiera, un retroceso mandado a mano dentro de la ventana de 2 s se contaría como rearranque automático y el criterio quedaría invertido.
- **Con `cierre: 'operario'` el actuador SÍ acaba en reposo**, porque el ensayo inyecta una orden de retroceso a los 4 s: lo que falla no es que no vuelva, sino que no vuelve **solo** — y eso es lo que mide `okModo` en una estación automática.
- **Los tiempos de carrera son dato de banco**, medidos con su dispersión por presión de red (5,0–6,5 bar) y por carga. Este laboratorio calcula la parte **eléctrica** del ciclo; la dinámica del aire (caudal, ISO 6358) es materia de **MEC-97** y **MEC-98**.
- Los tiempos de aparato, la ventana del reed y la potencia de bobina son **criterios de fabricante con su rango declarado**, no valores normativos. El «coste» del reto es un recuento de aparatos —solenoides, relevadores y sensores—, no un precio de mercado.
- **No se modela** el rebote mecánico de contactos ni su antirrebote, la categoría de seguridad de la parada de emergencia (IEC 60204-1 §9.2 e ISO 13849, **citadas**), el cableado real y sus protecciones, ni la programación en PLC del mismo esquema (IEC 61131-3, **citada**). Las cinco estaciones se dibujan sobre el mismo banco horizontal: la carga vertical de la mesa vive en los números, no en la geometría.

---

## Molde y estructura

**Molde S** (banco 3D + pizarrón 1024×768 fuera de pantalla + panel de telemetría HTML), cuatro modos:

| Modo | Contenido |
|---|---|
| `valvula` | Corte de tensión en plena carrera con las cuatro válvulas del catálogo; posición de entrada, de salida y desplazamiento tras restablecer, con el criterio de la estación al lado |
| `mando` | Esquema de escalera vivo (IEC 61131-3) con las bobinas y contactos de K1, K2 y KT; quién sostiene la orden al soltar el pulsador, conmutaciones del carrete y ciclos cerrados |
| `cierre` | Los tres cierres frente a frente: preajuste del temporizador, ventana del reed sobre la carrera real, tiempo de ciclo y cadencia contra la pedida |
| `reto` | Estación sorteada; se proyectan válvula, mando y cierre con calificación triple ortogonal, y se exige válido **Y** mínimo |

El banco 3D contiene el cilindro con su camisa y sus dos detectores reed, la electroválvula con su carrete y sus bobinas Y1/Y2, los relevadores K1/K2/KT, los pulsadores del armario y los LEDs de los siete criterios, todos con *picking* por hover. La propuesta de partida del reto (`startCfg`) está mal en los **tres** ejes a la vez.

**Reto de calificación triple ortogonal:** cada eje (`valvula`, `mando`, `cierre`) se califica con los otros dos ya en su valor correcto, y `okEje` exige que la propuesta sea válida **y** de coste mínimo. Cuando los tres ejes son correctos pero el conjunto no es mínimo, el mensaje lo dice con las cifras: «funciona, pero cuesta N aparatos frente a los M de la solución mínima».

---

## Verificación en dos capas

**Capa 1 — numérica:** `verif_electroneum.mjs`, **308 comprobaciones, 0 fallos**. Cubre los rangos declarados de todas las constantes, el barrido completo de las 240 propuestas con su recuento de válidas y de coste mínimo, que ningún criterio es texto muerto y cuántas veces falla cada uno en solitario, la ortogonalidad de los tres ejes de calificación, los tres desenlaces del corte de tensión en las cuatro estaciones de doble efecto, que el sello muere con la tensión, que el pulso corto sólo completa la carrera si la válvula recuerda, el temblor del selector mantenido con su recuento de conmutaciones y ciclos, el precio en cadencia del temporizador, la inalcanzabilidad del reed en el almacén, la ventana del reed como fracción de la carrera, el solape de bobinas y la energía de las bobinas, la ficha completa de las cinco estaciones y el formato SI de todas las cifras.

**Capa 2 — navegador:** Playwright contra `window.__labDebug` sobre servidor HTTP local, en dos arneses: estado estático —modos, telemetría, esquema de escalera, reto— con **426 comprobaciones, 0 fallos**, y recorrido guiado completo (`runAuto`) con **68 comprobaciones, 0 fallos** sobre las 14 narraciones del recorrido.

**Capa 3 — regresión del proyecto:** `npx tsc --noEmit` limpio y `npx jest` completo, con los *golden snapshots* actualizados en modo aditivo.

---

## Referencias

- **ISO 1219-1** — Símbolos gráficos: electroválvulas 3/2, 5/2 monoestable, 5/2 biestable y 5/3 de centros cerrados, pilotajes eléctricos y muelles, cilindros de simple y doble efecto.
- **IEC 60204-1 §7.5** — Prevención del rearranque automático al restablecerse la alimentación. **Criterio activo del laboratorio**, medido sin acción del operario.
- **IEC 60204-1 §9.2** e **ISO 13849** — Funciones de mando y categorías de seguridad: **citadas, no simuladas**.
- **IEC 61131-3** — Notación de la lógica de contactos del esquema de escalera: **citada** como el lenguaje en el que se escribiría el mismo circuito en un PLC.
- **IEC 60617** — Símbolos gráficos para esquemas eléctricos: bobinas, contactos NA/NC y contactos temporizados.
- **IEC 60947-5-1** — Aparamenta de mando: marco de los tiempos de operación y reposición declarados.
- **ISO 4414** — Reglas generales y requisitos de seguridad de los sistemas neumáticos: marco del criterio de mínimo. **No** se realiza apreciación de riesgos.
- **Criterios de fabricante con rango declarado** — relé 8/4 ms (5–15 / 2–10), solenoide 12 ms (10–30), carrete 8 ms (5–12), muelle 20 ms (15–40), reed 1 ms (0,5–3), ventana del reed 4 mm (2–6), potencia de bobina 4,5 W (2–6), margen del temporizador +10 %.
- **Verificación numérica propia** — 308 comprobaciones, barrido de 240 propuestas, 9 válidas.
- **Relación con MEC-97 y MEC-98** — aquéllos resuelven la lógica y la secuencia **neumáticas** (Y/O, temporización, método cascada) con la dinámica del aire según la ISO 6358; éste sustituye el mando por relevadores de 24 V y pregunta lo que aquéllos no pueden preguntar: qué pasa cuando se va la tensión y qué pasa cuando vuelve.
