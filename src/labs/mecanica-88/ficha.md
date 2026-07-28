# MEC-88 · GPIO: Antirrebote e Interrupciones en un Microcontrolador

**Dominio:** D3 · Sistemas Digitales y Automatización
**Práctica del backlog:** d3-12 — Entradas digitales de un microcontrolador: polarización, antirrebote y estrategia de adquisición. **Molde S** — **D3 12/16**
**Simulador:** `/labs/gpio-antirrebote-interrupciones.html`
**Slug de construcción:** `gpio-antirrebote-interrupciones`

## Qué enseña

1. **Un pin sin polarizar no tiene dos estados, tiene tres.** El contacto sólo puede llevar el nodo a **un** riel; al otro lo tiene que llevar una resistencia. *La entrada flotante funciona en el banco y falla en la máquina: en el laboratorio se le inyecta el semiperiodo de 60 Hz (8333 µs) y la señal que llega al pin se llena de transiciones que el contacto nunca hizo.* Es el error que más veces sobrevive a las pruebas porque el fallo no está en el diagrama lógico.

2. **El pull-up interno es un RANGO, y hacen falta los dos extremos.** La hoja de datos da 20–50 kΩ: el extremo **bajo** (20 kΩ) es el peor caso para el **consumo** (`i = Vcc/R = 0,250 mA`) y el **alto** (50 kΩ) es el peor caso para el **nivel** garantizado. *Diseñar con un valor «típico» intermedio es diseñar para un chip que no existe.* En el motor son dos campos distintos, `rI` y `rV`, no uno.

3. **Un filtro RC NO es un antirrebote.** Con `τ_carga = R₁C = 1000 µs` frente a un tren de rebotes de **60 000 µs**, la señal sale igual de sucia. *Lo único que el filtro mejora es la limpieza de los flancos y la impedancia del nodo.* La práctica lo enseña poniendo la misma pulsación con y sin filtro una encima de otra.

4. **Lo que decide la inmunidad al ruido es la IMPEDANCIA, no la resistencia.** El acoplamiento del cable de un variador es capacitivo y se modela como fuente de corriente `i = 2πfCV`; lo que se convierte en tensión es `Z = R/√(1+(ωRC)²)`. A 4 kHz: pull-up interno **50,0 kΩ**, externo **4,70 kΩ**, filtro RC **398 Ω**. *Bajar de 50 kΩ a 10 kΩ de resistencia divide el ruido por cinco; añadir el condensador lo divide por ciento veinticinco.*

5. **Fuga y ruido entran por caminos distintos y se modelan distinto.** La fuga superficial de un bornero sucio es un **divisor resistivo** (`Vcc·R_pu/(R_pu+R_fuga)`); el ruido acoplado es una **fuente de corriente** sobre la impedancia. *Con 62 kΩ de fuga el reposo de un pull-up interno de 50 kΩ cae a **2,77 V** —por debajo de V_IH = 3,0 V— mientras el de 4,7 kΩ apenas baja a 4,65 V.* La entrada «se activa sola» y no hay ningún pin quemado.

6. **La corriente de humectación es un criterio de diseño, no una curiosidad.** Un contacto de **plata** necesita del orden de **1 mA** para atravesar su propia película de sulfuro; el pull-up interno da 0,250 mA y el externo 1,064 mA. *El montaje con pull-up interno funciona el día de la puesta en marcha y falla seis meses después.* Un contacto **chapado en oro** admite circuito seco y no impone ese piso: por eso el criterio está en el escenario (`iMinIn`) y no en la resistencia.

7. **El consumo en reposo decide el mantenimiento.** Con una batería de 2700 mAh: pull-up interno **450 días**, filtro RC **248**, pull-up externo **106**. *La opción eléctricamente «mejor» cuadruplica el coste de mantenimiento del nodo a pilas —y es exactamente la que la humectación pedía en la estación de al lado—.*

8. **`t_est > t_reb/2` aquí no se enuncia: se MIDE.** Un duplicado exige **dos** tramos contiguos —cierre y falso reposo— que el antirrebote confirme por separado; como los dos suman a lo sumo `t_reb`, el mejor reparto para el atacante es `t_reb/2 + t_reb/2`. `worstPairOf(worstBounce(0, tb))` da **exactamente** `tb/2` en las cuatro estaciones, y ningún tren aleatorio lo supera. *La regla es una cota medida sobre el propio tren, no una fórmula asumida.*

9. **Es un PISO, no un objetivo: una ventana más larga no es más segura.** Pasado el techo el antirrebote se traga pulsaciones enteras o huecos enteros, y **en cada instalación el techo lo pone una causa distinta** —el hueco de rearme, la anchura mínima del pulso o la separación entre dos pulsaciones seguidas—. *El rango válido es un intervalo cerrado por los dos lados;* el barrido logarítmico medido de 48 puntos entre 100 µs y 200 ms lo dibuja con duplicados a la izquierda y pérdidas a la derecha.

10. **Las interrupciones no son la opción por defecto, son un recurso escaso.** El MCU objetivo ofrece **2** pines de interrupción externa y hay estaciones con 4 y con 6 entradas; el sondeo por temporizador exige un temporizador que el PWM puede tener ocupado; y un nodo a pilas tiene que poder **dormir**, cosa que el sondeo en el lazo no permite. *La estrategia se elige contra los recursos del chip, no contra la elegancia del código.*

11. **Una interrupción sin antirrebote SIEMPRE multiplica.** En el contador de piezas entra a la ISR **128** veces para 24 maniobras; con antirrebote, **24** entradas y **10 µs** de latencia máxima. *Y al revés: el sondeo lento filtra las espigas gratis pero pierde el pulso corto —1,6 ms de imán no los ve ningún lazo de 25 ms—.* Cada estrategia se equivoca por una razón distinta.

12. **El sondeo se evalúa en su PEOR FASE.** La misma configuración puede acertar o fallar según dónde caiga la muestra respecto del suceso, así que cada corrida barre cuatro desfases (`0 · T/4 · T/2 · 3T/4`) y **se queda con el peor**. *Evaluar una sola fase es medir la suerte del arranque, no el diseño.*

## Lógica (verificada `verify_gpio.mjs` — 291/291)

Base de tiempo **entera en µs**. El motor del laboratorio es **el código del verificador pegado verbatim** (`// 2. MOTOR (VERIFICADO 291/291 — VERBATIM)`).

```
bounceEdges(t0, tb, rnd)        tren de rebotes: 3, 5 o 7 transiciones irregulares dentro de tb
worstBounce(t0, tb)             el peor tren posible: [t0, t0+tb/2, t0+tb]
worstPairOf(tr)                 max de min(tramo_i, tramo_i+1) — la cota que debe superar t_est
iQuiesc(e) = Vcc/R_pu·1000      mA en reposo            zNoise(e) = R/√(1+(2πfRC)²)  a 4 kHz
iAcOf(sc) = 2πf·C_acopl·V_var   ruido como FUENTE DE CORRIENTE
vLeak(sc,e) = Vcc·R_pu/(R_pu+R_fuga)                    fuga como DIVISOR RESISTIVO
vRest = Vcc − (vLeak + vAc)     tensión del nodo sin pulsar      diasPila(mAh, mA)
rcFilter(E, tEnd)               RC + Schmitt 74HC14 integrado ANALÍTICAMENTE tramo a tramo
rcTrace(E, t0, t1, n)           la misma tensión, muestreada para dibujarla
integrador(E, tEnd, T, tEst, off)   antirrebote por muestreo: exige t_est de nivel estable
lockout(E, tEnd, tEst, tIsr)        antirrebote por bloqueo: acepta el flanco y se ciega
attribute(ev, presses)          → {events, n, missed, dupes, spurious, maxLat, cnt, lat}
runC(sc, cfg)                   barre 4 desfases de muestreo y se queda con el PEOR (score)
guardEnt / guardAdq             recursos y límites del chip ANTES de simular
okEnt / okTest / okAdq + GOOD   los tres criterios del Reto, cada uno con los otros dos correctos
```

Constantes: `Vcc = 5 V` · `V_IH = 3,0 V` · `V_IL = 1,5 V` · `V_T+ = 2,9 V` · `V_T− = 2,0 V` (74HC14) · `V_N,máx = 0,5 V` de caída admitida en reposo · `R_int = 20 kΩ (consumo) / 50 kΩ (nivel)` · `R_ext = 4,7 kΩ` · filtro `10 kΩ + 1 kΩ + 100 nF` ⇒ `τ_carga = 1000 µs`, `τ_descarga = 90,9 µs`, `V_cerrado = 0,455 V`, `t_bajada = 98,1 µs`, `t_subida = 772,2 µs`, **hueco muerto 674,1 µs** · `T_ISR = 10 µs` · `N_INT = 2` · `T_timer = 1000 µs` · 24 pulsaciones por corrida con la nº 3 al ancho mínimo, la nº 7 al hueco mínimo y la nº 11 con el **peor** tren de rebotes.

Pool de 4 instalaciones: **Contador de piezas** (reed de **plata**, t_reb 0,4 ms, pulso 1,6 ms) · **Final de carrera** (microswitch de **oro**, 4 entradas, bornera con fuga de 62 kΩ) · **Botón a pilas** (presupuesto de 0,30 mA, tiene que dormir) · **Selector junto a un variador** (6 entradas, temporizador ocupado por el PWM, 80 pF acoplando 400 V a 4 kHz). `RETO_POOL = [0, 1, 2, 3]`.

Comprobaciones por sección: tren de rebotes 32/32 · señal, niveles y secuencia 32/32 · filtro RC + Schmitt 18/18 · impedancia del nodo y ruido acoplado 14/14 · consumo en reposo y presupuesto de pila 11/11 · integrador 10/10 · lockout 6/6 · el sondeo filtra las espigas y la interrupción no 5/5 · la interrupción sin antirrebote siempre multiplica 16/16 · unicidad del acondicionamiento 12/12 · unicidad del tiempo estable 20/20 · unicidad de la estrategia 8/8 · ortogonalidad de los tres ejes 16/16 · barrido completo 4×4×4 por estación 8/8 · latencias 16/16 · casos que explican cada descarte 29/29 · coherencia de los escenarios y de las cifras citadas 34/34 · determinismo 4/4.

## Reto (calificación triple, por COMPORTAMIENTO)

Tres decisiones ortogonales, cada una evaluada **con las otras dos correctas** sobre el mismo motor verificado:

```js
const cfgWith = (sc, o) => ({ ...GOOD(sc), ...o });

okEnt(sc, k)  = cfgOk(sc, cfgWith(sc, { ent: k }))    // acondicionamiento
okTest(sc, t) = cfgOk(sc, cfgWith(sc, { tEst: t }))   // ventana de estabilidad
okAdq(sc, k)  = cfgOk(sc, cfgWith(sc, { adq: k }))    // estrategia de adquisición

cfgOk = guardEnt(nivel · consumo · humectación · ruido)
     && guardAdq(pines de interrupción · temporizador libre · poder dormir)
     && runC(...).ok      // 0 perdidos · 0 duplicados · 0 espurios · latencia ≤ t_lat,máx
```

- **Acondicionamiento** — flotante / interno / externo 4,7 kΩ / filtro RC. Soluciones: `externo · externo · interno · rc`. Cada descarte tiene una causa distinta: el flotante no define reposo, el interno no humecta la plata **ni** aguanta la fuga de 62 kΩ, el externo no cabe en el presupuesto del nodo a pilas, y sólo el RC baja la impedancia lo suficiente junto al variador.
- **Ventana** — 1 / 5 / 20 / 50 ms. Soluciones: `1 · 20 · 5 · 50 ms`. El piso es `t_reb/2` **medido**; el techo lo pone la instalación.
- **Estrategia** — sondeo en el lazo / sondeo por temporizador / interrupción cruda / interrupción con antirrebote. Soluciones: `intDeb · timer · intDeb · lazo`. La estación 1 no puede usar interrupción (4 entradas, 2 pines) y la 3 no puede usar temporizador (lo ocupa el PWM).

Barrido de las **64 combinaciones** (4 acondicionamientos × 4 ventanas × 4 estrategias) en cada instalación: exactamente **1** es válida. La semilla está deliberadamente **mal en las tres** (`seedReto` toma la primera opción que falla en cada eje).

## Convenciones

- Todo el tiempo es **entero en µs**; el filtro RC se integra **analíticamente** tramo a tramo, sin error de paso.
- Cada configuración de sondeo se evalúa en **cuatro desfases** y se conserva el peor (`score = missed·1e9 + dupes·1e6 + spurious·1e3 + maxLat/1e6`).
- Las señales son deterministas (`lcg(seed)` por estación): dos corridas con la misma configuración dan el mismo resultado.
- Los valores imposibles se dicen, no se maquillan: `< 0 V` cuando el ruido supera el riel, `> 99 V` en la caída acoplada, `sin definir` en la entrada flotante.
- Quiz barajado con Fisher-Yates; `runAuto` responde con `findIndex(o => o.ok)`, nunca con un índice fijo.
- Nunca `onclick` inline en el HTML generado: todo se cablea con `el(id).onclick = () => fn()`.
- Ninguna cifra citada en la ficha, el briefing o el pizarrón es inventada: todas salen del verificador.

## Verificación en dos capas

1. **Numérica** (`scratchpad/verify_gpio.mjs`, 633 líneas, 18 secciones): **291/291**.
2. **Dinámica** (Playwright + `window.__labDebug` sobre servidor HTTP local): `scratchpad/pw_gpio.mjs` **158/158** en 14 secciones —arranque y escena, constantes eléctricas, acondicionamiento (corriente, impedancia, autonomía de la pila), rebote y **regla de la mitad comprobada con 400 trenes aleatorios por estación**, el filtro RC no es antirrebote, la ventana de `t_est` medida, las cuatro estrategias, unicidad de la solución por instalación, Explora, los cuatro estudios de Aplica, ortogonalidad del Reto eje a eje, interfaz y controles, quiz barajado, nuevo escenario— y `scratchpad/pw_gpio_auto.mjs` **26/26**, que además **contrasta contra el motor cada cifra que narra el recorrido guiado** (4,34 V · 4,93 V · 1,06 mA · 98 µs · 772 µs · 128 ISR frente a 24) antes de ejecutarlo: recorrido de **102 s**, termina en Reto resuelto en las tres decisiones. **Cero errores de consola** en ambas corridas.

## Referencias

- ATmega328P *Datasheet* (pull-up interno 20–50 kΩ, umbrales de entrada, interrupciones externas INT0/INT1)
- 74HC14 *Datasheet* (disparador Schmitt: V_T+ y V_T− a Vcc = 5 V)
- IEC 60947-5-1, *Low-voltage switchgear — Control circuit devices and switching elements*
- IEC 61131-2, *Programmable controllers — Equipment requirements and tests* (entradas digitales)
- ANSI/EIA-364, *Electrical Connector/Socket Test Procedures* (corriente de humectación de contactos)
- IEC 61000-4-4, *Electrical fast transient/burst immunity test*
- IEEE 518, *Guide for the Installation of Electrical Equipment to Minimize Electrical Noise Inputs to Controllers*
