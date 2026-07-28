# MEC-89 · PWM desde el Microcontrolador: Velocidad de un Motor de CD

**Dominio:** D3 · Sistemas Digitales y Automatización
**Práctica del backlog:** d3-13 — Control de velocidad de un motor de CD por PWM desde un microcontrolador: temporizador, tiempo muerto y modo de recirculación. **Molde S+P** — **D3 13/16**
**Simulador:** `/labs/pwm-motor-cd.html`
**Slug de construcción:** `pwm-motor-cd`

## Qué enseña

1. **Frecuencia y resolución no son dos decisiones: son la MISMA.** `f = f_clk/(prescaler·(TOP+1))` y `N = TOP+1` comparten el mismo `TOP`. Con 16 MHz, las cuatro configuraciones dan **62,5 kHz con 256 códigos (8 bits)**, **15,625 kHz con 1024 (10 bits)**, **7 812,5 Hz con 256** y **1 953,125 Hz con 1024**. *El prescaler sí mueve sólo la frecuencia; el TOP mueve las dos a la vez.* Un temporizador de 16 bits con `TOP = 255` da exactamente los mismos 256 códigos que uno de 8 bits: el ancho del registro pone el máximo, no el valor.

2. **`V_media = D·Vcc` sólo vale si el nodo apagado se queda en cero.** En los modos bipolares el nodo se va al riel contrario y la recta pasa a ser `(2D−1)·Vcc`: el **50 % de duty es el reposo** y el **0 % es plena marcha atrás**. La misma orden numérica sobre el mismo motor produce dos máquinas distintas.

3. **Con diodo de rueda libre, duty cero no da cero voltios sino −0,70 V.** Es la caída directa del propio diodo durante el tramo apagado. La rectificación síncrona la sustituye por `I·R_ds` y sí lleva el valor medio exactamente a cero, a cambio de exigir puente completo —y por tanto tiempo muerto—.

4. **La curva n(D) es una recta AFÍN, no una proporción.** El equilibrio se resuelve con `kt·I = tl + bv·ω + tf·signo(ω)` e `I = (vt − ke·ω)/(R_a + R_eq)`: hasta que el par no supera la fricción seca de Coulomb más la carga, el eje **no gira**. En la cinta, `D = 10 %` todavía da **0 rpm** mientras `D = 25 %` ya da **151 rpm**, y `D = 50 %` da **812 rpm** de los 2 134 del tope, no la mitad.

5. **De los códigos de duty no valen todos.** El laboratorio barre los `N` códigos y cuenta cuántos caen dentro de la banda útil de la máquina: en la cinta sólo **173 de 256** quedan entre 300 y 2 000 rpm. *Se pierde la tercera parte, por abajo en la zona muerta y por arriba pasada la velocidad máxima.* Por eso «tengo 10 bits» no es una respuesta: la pregunta es cuántos escalones caen donde la máquina trabaja.

6. **El rizado es máximo en D = 0,5 y cero en los dos extremos.** `ΔI ≈ Vcc·D(1−D)/(L·f)` es la excursión de la corriente dentro del periodo, no su valor: con duty 100 % el transistor **no conmuta** y el rizado es exactamente cero aunque la corriente media sea la mayor de todas. El mismo motor pasa de **0,056 A a 62,5 kHz** a **1,794 A a 1,953 kHz** —treinta y dos veces más, porque ΔI va con 1/f—.

7. **En bipolar el rizado vale exactamente el doble, y no por lo que suele decirse.** No es porque conmuten dos transistores —eso duplica las **pérdidas de conmutación**, que es otra cuenta— sino porque el escalón de tensión que ve la inductancia es **2·Vcc** en lugar de Vcc: `0,1067 A` frente a `0,0533 A` en la misma configuración.

8. **El tiempo muerto se RESTA del tramo activo antes de promediar.** `ΔD = (bipolar?2:1)·t_d/T` crece con la frecuencia porque el periodo mengua: 5 µs sobre 16 µs son el **31,25 %** del duty (62,5 % en bipolar); los mismos 5 µs sobre 512 µs cuestan el **0,98 %**. No es una corrección estética: son códigos de duty que dejan de existir.

9. **De ahí sale un techo de frecuencia que el temporizador no conoce.** Exigir `ΔD ≤ ΔD_máx` equivale a exigir `f ≤ ΔD_máx/((bip?2:1)·t_d)`: **200 kHz** en la cinta (150 ns, 3 %), **28 571 Hz** en la mesa (700 ns, 4 %, bipolar) y apenas **5 000 Hz** en el polipasto (3 µs, 3 %). *Quien limita la conmutación es el driver de puerta, no el MCU.*

10. **Los dos modos bipolares son numéricamente idénticos: lo que los separa es la función.** Signo-magnitud y antifase enclavada dan la misma recta y el mismo rizado hasta el último decimal (comprobado a `1e-12`). La antifase sostiene el eje **rígido y quieto** con una sola señal al 50 % —lo que necesita un lazo de posición—, pero perder esa señal equivale a plena marcha atrás, y por eso queda **prohibida** donde soltar el habilitador debe dejar el par en cero.

11. **Una carga que arrastra no se para sola.** Con carga direccional (`tl < 0`, la gravedad del polipasto) y decaimiento lento, a **duty cero el eje sigue bajando** y por encima de la velocidad máxima admitida: sólo un modo bipolar puede aplicar tensión media **negativa** y frenar. En ese punto la corriente es negativa —el motor devuelve energía, no la consume—.

12. **Cada descarte tiene una causa distinta, y no la que se supone.** En la cinta el diodo se descarta por **pérdidas** (con el rizado en regla) y el bipolar por **resolución** (con las pérdidas en regla); el ventilador descarta 62,5 kHz por el **driver** y 1 953 Hz por **rizado**; la mesa descarta 62,5 kHz por **resolución**, no por guarda. *El laboratorio nombra la causa concreta en cada caso en vez de decir «no cumple».*

13. **El rizado no aporta par y sí calienta.** `I_rms² = I² + ΔI²/12`: un puente que se calienta sin dar empuje suele estar pagando rizado. Las pérdidas se separan por mecanismo —conducción `I²·n_sw·R_ds`, diodo de cuerpo `V_f·|I|` durante el tiempo muerto y conmutación `½·Vcc·|I|·(t_r+t_f)·f·(bip?2:1)`—, de modo que subir la frecuencia se paga **dos veces**: en distorsión de duty y en pérdidas dinámicas.

## Lógica (verificada `verify_pwm.mjs` — 207/207)

El motor del laboratorio es **el código del verificador pegado verbatim** (`// 2. MOTOR (VERIFICADO 207/207 — VERBATIM)`).

```
fPwm(t)  = FCLK/(presc·(top+1))     nCod(t) = top+1     bitsOf(t) = log2(top+1)
perNs(t) = 1e9/fPwm(t)              ddLoss(m,td,T) = (m.bip?2:1)·td/T
nSwOf(sc)                           transistores en serie con el motor (chopper 1 · puente 2)
vTerms(sc,m,D,td,T)                 recta V_avg(I) = vt − req·I, con el tiempo muerto RESTADO
solve(sc,m,D,td,T)                  equilibrio con zona muerta → {w,rpm,i,vavg,vt,dI,pCond,pSw,pBr,pCu,de}
runC(sc,cfg)                        barre los N códigos → {pasos,dIMax,pBrMax,cubre,rpmLo,rpmHi,f,N,bits,dd}
guardTim / guardMod / guardTd       recursos y límites del accionamiento ANTES de simular
okTim / okTd / okMod + GOOD         los tres criterios del Reto, cada uno con los otros dos correctos
```

Constantes: `f_clk = 16 MHz` · borde audible `F_AUD = 20 kHz` · `V_F = 0,70 V` (diodo de cuerpo / rueda libre) · temporizadores `p1t255 = 62,5 kHz/256` · `p1t1023 = 15,625 kHz/1024` · `p8t255 = 7 812,5 Hz/256` · `p8t1023 = 1 953,125 Hz/1024` · tiempos muertos `0 · 200 · 1 000 · 5 000 ns` · modos `diodo · sincrono · rapido · antifase` (`bip`, `hb`).

Ecuaciones del punto de equilibrio:

```
tc    = tf + (cargaDir ? 0 : |tl|)          par que se opone al giro en cualquier sentido
tdir  = cargaDir ? tl : 0                   par direccional (gravedad)
drive = kt·vt/R − tdir                      con R = ra + req
w     = drive > tc ? (drive−tc)/den : drive < −tc ? (drive+tc)/den : 0      den = kt·ke/R + bv
dI    = max(0, (vOn − vavg)·t_on/La)        vOn = Vcc − n_sw·|i|·Rds
pSw   = ½·Vcc·|i|·t_sw·f·(bip?2:1)          I_rms² = i² + dI²/12
```

Pool de 4 máquinas (`RETO_POOL = [0,1,2,3]`): **Cinta de una envasadora** (12 V, junto a dos operarios ⇒ `silencio`, banda 300–2 000 rpm, ≥120 escalones) · **Ventilador de tablero** (24 V sobre **chopper de un cuadrante**, `fMax = 10 kHz` por la puerta del MOSFET) · **Mesa de posicionamiento** (24 V, `holdCero`: el lazo debe sostener el eje parado, banda 100–600 rpm, ≥60 escalones) · **Descenso de polipasto** (24 V, **carga direccional** `tl = −0,55 N·m`, `paroSeguro`, `tdMin = 3 µs`).

Comprobaciones por sección: temporizador 15 · duty y valor medio 15 · la velocidad no es proporcional 12 · rizado 9 · los pasos de duty no son pasos de velocidad 7 · tiempo muerto 13 · pérdidas del puente 8 · guardas de modo 5 · la carga que arrastra 9 · unicidad del temporizador 13 · unicidad del tiempo muerto 10 · unicidad del modo 9 · ortogonalidad de los tres ejes 16 · barrido 4×4×4 por estación 8 · las cuatro cumplen con su terna 20 · causas de descarte una por una 12 · coherencia de escenarios y cifras citadas 22 · determinismo 4.

## Reto (calificación triple, por COMPORTAMIENTO)

Tres decisiones ortogonales, cada una evaluada **con las otras dos correctas** sobre el mismo motor verificado:

```js
const cfgWith = (sc, o) => ({ ...GOOD(sc), ...o });

okTim(sc, k) = cfgOk(sc, cfgWith(sc, { tim: k }))   // temporizador: frecuencia + códigos
okTd (sc, v) = cfgOk(sc, cfgWith(sc, { td:  v }))   // tiempo muerto del driver
okMod(sc, k) = cfgOk(sc, cfgWith(sc, { mod: k }))   // modo de recirculación

cfgOk = guardTim(techo del driver · banda audible)
     && guardMod(topología · sostener el eje · paro seguro)
     && guardTd (rama complementaria · piso del driver · distorsión del duty)
     && runC(...).ok    // cubre la banda · escalones útiles · rizado · pérdidas del puente
```

- **Temporizador** — `p1t255 / p1t1023 / p8t255 / p8t1023`. Soluciones: `p1t255 · p8t255 · p1t1023 · p8t1023`, una distinta en cada máquina. La cinta descarta 15 625 Hz **por audible**, el ventilador descarta 62,5 kHz **por el driver**, y la mesa y el polipasto descartan por **resolución** con la guarda en verde.
- **Tiempo muerto** — `0 / 200 / 1 000 / 5 000 ns`. Soluciones: `200 · 0 · 1 000 · 5 000 ns`. En el chopper el único válido es **0** (no hay rama complementaria que proteger); en las tres máquinas con puente el intervalo está **cerrado por los dos lados**: por debajo hay conducción cruzada y por encima el tiempo muerto se come el duty.
- **Modo** — `diodo / sincrono / rapido / antifase`. Soluciones: `sincrono · diodo · antifase · rapido`. El chopper no admite ningún modo de puente; `holdCero` deja **sólo** antifase; `paroSeguro` **prohíbe** antifase; y donde las cuatro topologías son posibles decide el comportamiento —pérdidas y resolución—.

Barrido de las **64 combinaciones** (4 temporizadores × 4 tiempos muertos × 4 modos) en cada máquina: exactamente **1** es válida. La semilla está deliberadamente **mal en las tres** (`seedReto` toma la primera opción distinta de la buena en cada eje).

Cifras de cada terna buena: cinta **62,5 kHz · 256 códigos · 173 escalones · ΔI 0,053 A · 0,223 W · ΔD 1,25 %** · ventilador **7 812,5 Hz · 171 escalones · ΔI 0,198 A · sin tiempo muerto** · mesa **15,625 kHz · 1024 códigos · 124 escalones · ΔD 3,13 % de un 4 % admitido** · polipasto **1 953,125 Hz · 94 escalones · ΔI 0,502 A · 1,181 W · ΔD 1,95 %**.

## Convenciones

- Molde **S+P**: pizarrón de 1024×768 con Explora / Aplica / Reto **más** panel de instrumentos de 600×400 pintado sobre el bastidor 3D (`drawPanel3D`), repintado en cada fotograma junto a la telemetría lateral.
- El tiempo muerto siempre se resta **antes** de promediar, nunca después: `de = max(0, D − t_d/T)`.
- Ninguna cifra citada en la ficha, el briefing, el pizarrón o el recorrido guiado es inventada: todas salen de `verify_pwm.mjs` a través de `nums_pwm.mjs` y `dump_pwm.mjs`.
- Las figuras de **Explora** (est 0, `t_d = 0`, diodo) y las de la **terna buena** (est 0, 200 ns, síncrono) son conjuntos distintos y no se mezclan: 812 rpm a `D = 0,5` en el primero, 841 rpm en el segundo.
- Quiz barajado con Fisher-Yates; `runAuto` responde con `findIndex(o => o.ok)`, nunca con un índice fijo.
- Nunca `onclick` inline en el HTML generado: todo se cablea con `el(id).onclick = () => fn()`.
- `RUN_CACHE` memoiza `runC` por `sc.id|tim|td|mod`: el barrido de 64 combinaciones por estación es instantáneo y determinista.

## Verificación en dos capas

1. **Numérica** (`scratchpad/verify_pwm.mjs`, 18 secciones): **207/207**, incluido el barrido de las 64 combinaciones en cada máquina que demuestra la unicidad de la solución.
2. **Dinámica** (Playwright + `window.__labDebug` sobre servidor HTTP local): `scratchpad/pw_pwm.mjs` y `scratchpad/pw_pwm_auto.mjs`, que además **contrasta contra el motor cada cifra que narra el recorrido guiado** (0 rpm a `D = 10 %` · 151 rpm a `25 %` · 5,65 V y 812 rpm a `50 %` · rizado 0 a `100 %` · 1,794 A a 1,95 kHz · −0,70 V con diodo · −12 V y marcha atrás en bipolar · 31,25 % de duty perdido con 5 µs) antes de ejecutarlo, y termina en Reto **resuelto en las tres decisiones**. **Cero errores de consola.**

## Referencias

- ATmega328P *Datasheet*, §15 *16-bit Timer/Counter1 with PWM* (prescaler, TOP, modos de PWM rápido y de fase correcta)
- Mohan, Undeland y Robbins, *Power Electronics: Converters, Applications and Design*, cap. 7 (convertidores de CD-CD conmutados; PWM unipolar y bipolar)
- Krishnan, *Electric Motor Drives: Modeling, Analysis and Control*, cap. 3–4 (accionamientos de motor de CD alimentados por chopper)
- Texas Instruments **SLVA504**, *Understanding Motor Driver Current Ratings* y **SLVA321**, *Current Recirculation and Decay Modes* (decaimiento lento, rápido y rectificación síncrona)
- Fitzgerald, Kingsley y Umans, *Electric Machinery*, cap. 7 (máquina de corriente continua)
- IEC 60034-1, *Rotating electrical machines — Rating and performance*
