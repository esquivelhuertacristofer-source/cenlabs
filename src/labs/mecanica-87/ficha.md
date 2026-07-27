# MEC-87 · Lazo 4–20 mA: Escalado y Control On/Off con Histéresis

**Dominio:** D3 · Sistemas Digitales y Automatización
**Práctica del backlog:** d3-11 — Lazo de corriente 4–20 mA, NAMUR NE 43 y control todo-nada con banda muerta. **Molde S+P** — **D3 11/16**
**Simulador:** `/labs/lazo-4-20ma-histeresis.html`
**Slug de construcción:** `lazo-4-20ma-histeresis`

## Qué enseña

1. **La señal de campo es CORRIENTE, y por eso el cable no falsea la medida.** El lazo es un circuito serie: la misma corriente atraviesa el transmisor, el par de cobre y la resistencia de medida. *La caída del cable no cambia la lectura; lo único que hace es consumir margen de tensión.* Toda la práctica se apoya en esa distinción entre «falsear» y «gastar presupuesto».

2. **El cero vivo no es una convención estética.** Con 4 mA en el mínimo, «el proceso está en el valor más bajo» y «el lazo está cortado» son dos lecturas distintas. *Un 0–20 mA no puede distinguirlas: es la razón técnica por la que el 0–20 desapareció del campo.*

3. **NE 43: seis estados, no dos.** Medida válida de 3,8 a 20,5 mA; avería en ≤ 3,6 y ≥ 21,0 mA; y entre ambas, **bajo rango** (3,6–3,8) y **sobre rango** (20,5–21,0), que **no son averías**: el transmisor sigue midiendo y avisa de que el proceso se salió del rango calibrado. *Confundir esas dos zonas con una avería es lo que hace que se sustituyan transmisores sanos; tratar una señal de avería como medida hace que el control deduzca un nivel absurdo —el laboratorio lo muestra en pantalla—.*

4. **El extremo del proceso NO coincide con el extremo del rango.** En la cisterna el recorrido real es 0,20–4,20 m sobre un transmisor 0–5 m: el mínimo entrega 4,64 mA y el máximo 17,44 mA. *La holgura por los dos lados es el criterio, no un descuido de calibración.*

5. **Un rango se puede equivocar por los dos lados.** Demasiado estrecho deja el proceso fuera de banda; demasiado ancho lo cubre pero el **0,5 % del span** del transmisor se convierte en centímetros de incertidumbre. *El barrido demuestra que de los cuatro rangos ofrecidos sólo uno satisface las dos condiciones a la vez.*

6. **El cable se dimensiona contra 20,5 mA, no contra 20,0.** Con 24 V y `V_tx,mín = 12 V`, `R_máx` pasa de **600 Ω a 585,4 Ω**: **14,6 Ω** menos de margen. *El lazo dimensionado al filo satura exactamente cuando el proceso se sale de rango, que es cuando la información vale más.* La resistencia del par se cuenta **ida y vuelta**: `R = 2·ρ(AWG)·L/1000`.

7. **Cero y span son errores distintos y se corrigen en orden.** El error de cero desplaza la recta en paralelo (el mismo error en todos los puntos); el de span la inclina pivotando en 4 mA (error nulo en el LRV, máximo en el URV). *Comprobar sólo el cero no detecta un error de span.* El ajuste de dos puntos se **calcula** sobre el error inyectado y deja residuo nulo en toda la escala — pero sólo si se ajusta primero el cero.

8. **Sin banda muerta el contactor traquetea por el RUIDO, no por el proceso.** La conmutación se decide sobre el nivel **medido**, no sobre el real. *Ése es el chatter: el proceso está quieto y el arrancador trabaja.*

9. **El ruido se COME la banda muerta.** La oscilación real del nivel resulta **algo menor** que la banda nominal (0,239 m medidos frente a 0,25 m en la cisterna) porque el ruido adelanta la conmutación —y por eso mismo los arranques por hora **suben** por encima del cálculo ideal. *Es contraintuitivo y sale del modelo, no de la teoría.*

10. **El peor caso de arranques/hora está en `q_in = q_out/2`, no en el caudal máximo.** El periodo del ciclo es proporcional a `1/q_in + 1/(q_out − q_in)`, mínimo justo a la mitad. Cota cerrada: **arranques máx/h = 15·q_out/(DB·A·1000)**. *Quien dimensiona en el caudal máximo deja el arrancador desprotegido precisamente en su condición más exigente.*

11. **La banda muerta se elige por el arrancador y se comprueba contra el proceso.** Estrecha, incumple los arranques/hora; ancha, saca el nivel de tolerancia. *De las cuatro opciones sólo una pasa las dos pruebas.*

12. **Un lazo mal dimensionado rompe el CONTROL, no sólo la lectura.** Si el cobre no sostiene 20,5 mA, la señal se congela y el control on/off deja de ver la parte alta del tanque. *Instrumentación y maniobra no son dos temas separados.*

## Lógica (verificada `verify_lazo420.mjs` — 183/183)

Base de simulación de tanque `DT_T = 1 s`, `TOT_T = 23400 s` (6,5 h) con `WARM = 1800 s` descartados. El motor del laboratorio es **el código del verificador pegado verbatim**.

```
mAideal(pv, r) = 4 + 16·(pv − lrv)/span      pvFromMA(i, r) = lrv + (i − 4)/16·span
mAout(pv, r)                                 recorta a [3,8 · 20,5] — la banda de medida NE 43
statusOf(i)                                  abierto | fallaBaja | bajoRango | medida | sobreRango | fallaAlta
rCable(awg, L) = 2·RHO[awg]·L/1000           RHO Cu 20 °C: 16→13,17 · 18→20,95 · 20→33,31 · 22→52,96 Ω/km
rTotal(lp) = rMedida + rCable + rExtra       iMax(lp) = (vsup − vtxmin)/rTotal · 1000
rMaxAt(lp, i) = (vsup − vtxmin)/i·1000       okAt(lp, i) ⇔ iMax ≥ i        iLoop(i, lp) = min(i, iMax)
iWithErr(pv, r, e) = mAideal + zero + span·(mAideal − 4)
calib2p(r, e) / iCalibrado(...)              ajuste de dos puntos: cero en el LRV, span en el URV
runTank(sc, cfg, opt)                        conmuta sobre el nivel MEDIDO; mide starts/h, banda, rebose, vaciado
cicloMin / startsTeor / qinPeor / startsPeor peor caso q_in = q_out/2 → 15·q_out/(DB·A·1000)
okRango / okAwg / okDb + GOOD(sc)            los tres criterios del Reto, cada uno con los otros dos correctos
```

Pool de 4 instalaciones: **Cisterna de bombeo** (0–5 m, 250 Ω, 4 km) · **Pozo de achique** (0–3 m) · **Tanque de proceso** (barrera de 250 Ω que obliga a AWG 16) · **Depósito de reactivo** (500 Ω de medida ⇒ 2–10 V). Las cuatro a **24 V** con `V_tx,mín = 12 V`. `RETO_POOL = [0, 1, 2, 3]`.

Comprobaciones por sección: escalado 8/8 · NAMUR NE 43 9/9 · lazo eléctrico y cumplimiento de tensión 12/12 · errores de cero y de span 9/9 · unicidad del rango 16/16 · calibre mínimo que sostiene 20,5 mA 16/16 · teoría del ciclo de histéresis 6/6 · simulación vs teoría (el ruido se come la banda muerta) 20/20 · unicidad de la banda muerta 12/12 · chatter 12/12 · filtro de entrada 2/2 · ortogonalidad de los tres criterios del Reto 16/16 · barrido completo 4×4×4 por instalación 8/8 · el lazo mal dimensionado rompe el control 5/5 · coherencia de los escenarios 16/16 · valores que el laboratorio cita 4/4 · clasificación NE 43 de la corriente leída 12/12.

## Reto (calificación triple, por COMPORTAMIENTO)

Tres decisiones ortogonales, cada una evaluada **con las otras dos correctas** sobre el mismo motor verificado:

```js
const cfgWith = (sc, o) => ({ ...GOOD(sc), ...o });

okRango(sc, rg) = inBand(hProc[0], rg) && inBand(hProc[1], rg)      // cubre el proceso...
                  && ERR_SPAN * spanOf(rg) <= sc.tolMeas            // ...y resuelve lo pedido
okAwg(sc, a)    = okAt(lpWith(sc, {awg: a}), NE43.hi)               // sostiene 20,5 mA, no 20,0
                  && !okAt(lpWith(sc, {awg: siguiente_más_fino}), NE43.hi)
okDb(sc, db)    = runC(sc, cfgWith(sc, {db}), {qin: qinPeor(sc)}).startsH <= sc.maxStarts
                  && db/100 * spanOf(GOOD(sc).rango) <= sc.tolBand
```

- **Rango** — `ERR_SPAN = 0,5 %` del span. Los rangos correctos son 0–5 / 0–3 / 0–4 / 0–2 m.
- **Calibre** — el **más fino** que sostiene 20,5 mA: AWG 20 / 18 / 16 / 20. La barrera de 250 Ω del tanque de proceso es la que fuerza el 16.
- **Banda muerta** — evaluada **en el peor caso** (`q_in = q_out/2`) y contra la tolerancia del proceso: 5 / 6 / 8 / 7 %.

Barrido de las **64 combinaciones** (4 rangos × 4 calibres × 4 bandas) en cada instalación: exactamente **1** es válida. Semilla deliberadamente **mal en las tres**: primer rango que falla, calibre **sub**dimensionado (AWG 22, el más grueso que falla) y la banda muerta más estrecha, que traquetea.

## Convenciones

- `DT_T = 1 s`, 6,5 h simuladas, primera **media hora descartada** como calentamiento.
- La conmutación se decide sobre el nivel **medido** (con ruido y con saturación del lazo), nunca sobre el real.
- El ruido es determinista (`lcg(20260726)`): dos corridas con la misma configuración dan el mismo resultado.
- Los fotogramas 3D se derivan de una corrida medida, nunca se escriben a mano.
- Quiz barajado con Fisher-Yates; `runAuto` responde con `findIndex(o => o.ok)`, nunca con un índice fijo.
- Nunca `onclick` inline en el HTML generado: todo se cablea con `el(id).onclick = () => fn()`.
- Ninguna cifra citada en la ficha, el briefing o el pizarrón es inventada: todas salen del verificador.

## Verificación en dos capas

1. **Numérica** (`scratchpad/verify_lazo420.mjs`, 446 líneas, 17 secciones): **183/183**.
2. **Dinámica** (Playwright + `window.__labDebug` sobre servidor HTTP local): `scratchpad/pw_lazo420.mjs` **130/130** en 14 secciones —arranque y escena, escalado y su inversa, los seis estados NE 43 comprobados uno a uno, cumplimiento de tensión (600 Ω a 20,0 mA frente a 585,4 Ω a 20,5), errores de calibración y residuo del ajuste de dos puntos, unicidad del rango, control on/off con el peor caso y la banda real medida, Explora con las cinco averías, los tres estudios de Aplica, ortogonalidad del Reto criterio a criterio en las cuatro instalaciones, barrido de unicidad 64×4 dentro del navegador, interfaz y controles, quiz barajado, nuevo escenario— y `scratchpad/pw_lazo420_auto.mjs` **11/11** (recorrido guiado completo, 91,6 s, termina en Reto resuelto en las tres decisiones). **Cero errores de consola** en ambas corridas.

## Referencias

- NAMUR NE 43, *Standardization of the signal level for the failure information of digital transmitters*
- IEC 60381-1, *Analogue signals for process control systems — Part 1: Direct current signals*
- ANSI/ISA-50.00.01, *Compatibility of Analog Signals for Electronic Industrial Process Instruments*
- IEC 61508-2, *Functional safety of E/E/PE safety-related systems — Requirements for E/E/PE systems*
- IEC 60228, *Conductors of insulated cables* (secciones nominales y resistencia del cobre)
- NFPA 79 e IEEE 518 (separación y apantallamiento de circuitos de señal)
- ANSI/HI 9.6.x (límites de arranques por hora en bombas centrífugas)
