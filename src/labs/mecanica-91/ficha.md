# MEC-91 · Análisis de tramas: UART, I²C y SPI en el analizador lógico

**Dominio:** D3 · Sistemas Digitales y Automatización
**Práctica del backlog:** d3-15 — «Analiza tramas de comunicación con un analizador lógico» — **Molde S+P** — **D3 15/16**
**Simulador:** `/labs/analizador-buses.html`
**Slug de construcción:** `analizador-buses`

---

## Qué enseña

1. **Un analizador lógico no lee bytes: mide tensiones en instantes.** El nombre del protocolo, la dirección del esclavo, el ACK y el texto de la báscula son interpretaciones que alguien configuró; entre la línea y el volcado hexadecimal hay tres decisiones independientes.
2. **La punta decide si hay señal.** Máximo absoluto de entrada 3,6 V y umbral de decisión 1,40 V. El máximo es criterio de **daño**, no de calidad: los ±9 V de una línea EIA/TIA-232 sobre la punta directa no dan una medida mala, queman la punta.
3. **Un bus de colector abierto sin polarización nunca sube.** La línea se queda pegada a cero y no hay señal que leer: no es un fallo del decodificador ni del analizador.
4. **El mismo divisor sirve o no según el bus.** El divisor 1:3 deja el nivel alto en **1,67 V** sobre un bus de 5 V —por encima del umbral— y en **1,10 V** sobre uno de 3,3 V —por debajo—. La punta no es «buena» o «mala» en abstracto.
5. **La punta que invierte es la peor.** Entrega el complemento exacto de cada byte, con tramas limpias y sin una sola bandera de error. Un fallo que no se parece a un fallo.
6. **El tiempo de subida acota la polarización por arriba.** `t_r = ln(7/3)·R·C_b = 0,8473·R·C_b`, medido entre el 30 % y el 70 % de V_DD según la UM10204, con tope de **1 µs** en modo estándar (100 kHz) y **300 ns** en modo rápido (400 kHz).
7. **La corriente de sumidero la acota por abajo.** `I_OL = (V_DD − V_OL)/R` con `V_OL = 0,4 V`, limitada a **3 mA**: es la corriente que el esclavo debe tragar para bajar la línea.
8. **Los dos criterios tiran en sentidos opuestos.** Con 470 Ω y 150 pF el bus sube en **60 ns** y exige **6,17 mA**; con 10 kΩ el esclavo hunde **290 µA** y el bus tarda **1,27 µs**.
9. **La ventana de polarización puede quedarse vacía.** Con 400 kHz y 150 pF la ventana es **967 Ω … 2,4 kΩ**; con 400 pF pasa a **967 Ω … 885 Ω**, es decir VACÍA: ahí la salida es bajar la velocidad o reducir la capacidad, no elegir mejor resistencia.
10. **El analizador se elige con tres cuentas independientes.** Muestras por bit `f_s/f_bit ≥ 4`; paso `Δt = 1/f_s ≤ detalle/4`; ventana `= profundidad/f_s ≥ duración de la señal`.
11. **Con memoria fija, resolución y ventana son el mismo compromiso.** 1 M de muestras son **1,000 s** a 1 MS/s, **100,00 ms** a 10 MS/s, **20,00 ms** a 50 MS/s y **5,00 ms** a 200 MS/s. Los 200 MS/s son la **única** opción válida en el SPI de 8 MHz y son **inválidos** en los otros tres bancos.
12. **Capturar de menos no se parece a un error.** Con la báscula y 100 ms de ventana salen **11 bytes** impecables y faltan 22; el volcado no dice nada.
13. **CPOL y CPHA son una sola pregunta.** Los modos SPI **0 y 3 muestrean en flanco de subida**, los modos **1 y 2 en bajada**. Con el modo equivocado el **8A** del convertidor se lee como **45**, sin huecos y con la misma tipografía.
14. **En I²C la trama correcta es la que «tiene un error».** El maestro cierra la lectura con un **NACK deliberado** en el último byte; exigir «todos los bytes con ACK» declararía mala la única trama bien formada.
15. **Leer 8N1 como 8E1 no da error: da mentiras.** Los **mismos 33 valores** con **6** banderas de paridad rotas. La tolerancia de reloj es `0,5/(n_bits − 0,5)`: **5,26 %** en 8N1 y **4,76 %** en 8E1; un decodificador a 115200 sobre 9600 va **1100 %** desviado.
16. **La dirección de 7 bits sale del byte de dirección desplazado.** `0xA0 >> 1 = 0x50` en la EEPROM y `0x30 >> 1 = 0x18` en el sensor de vibración: el bit 0 es R/W, no parte de la dirección.

---

## Lógica (verificada `verif_buses.mjs` — 152/152)

**Constantes selladas del motor** (idénticas en el verificador y en el laboratorio, copiadas verbatim entre los marcadores `MOTOR` / `FIN MOTOR`):

| Símbolo | Valor | Origen |
|---|---|---|
| `V_MAX` | 3,6 V | máximo absoluto de entrada del analizador |
| `V_TH` | 1,40 V | umbral de decisión de la entrada |
| `C_IN` | 10 pF | capacidad de entrada de la punta |
| `V_OL` | 0,4 V | UM10204 tabla 10 |
| `I_OL_MAX` | 3 mA | UM10204 tabla 10 |
| `K_TR` | 0,8473 | `ln(7/3)`, niveles 30 %–70 % |
| `OS_MIN` | 4 | muestras por bit mínimas |
| `N_DET` | 4 | pasos por detalle mínimo |
| `TR_MAX` | 1 µs (100 kHz) · 300 ns (400 kHz) | UM10204 tabla 10 |

**Cuatro instalaciones** (`POOL`), con su duración de señal y su solución única:

| Banco | Bus | Duración `tSig` | Bytes ok | Terna válida |
|---|---|---|---|---|
| Báscula de camiones | EIA/TIA-232, 9600 8N1 | **416,90 ms** | 33 (`"P 12480 kg\r"`) | `rs232` · `a1M` · `u96n` |
| EEPROM de recetas | I²C 400 kHz, 150 pF | **6,87 ms** | 304 (`a0 01 00 a1` …) | `pu2k2` · `a50M` · `i2c7` |
| Convertidor A/D | SPI 8 MHz, modo 1 | **3,90 µs** | 3 (`8a 00 00`) | `div5` · `a200M` · `spi1` |
| Sensor de vibración | I²C 100 kHz, 80 pF | **36,33 ms** | 403 | `pu10k` · `a10M` · `i2c7` |

**Punta** (`sondaEval`): nivel alto entregado frente a `V_TH`, daño si el pico supera `V_MAX`, línea muerta si el bus es abierto y la punta no polariza, inversión como XOR entre punta y línea. En buses abiertos añade `tr`, `iol` y la ventana `[Rmin, Rmax]` con su bandera `vacia`. `f3 = 1/(2π·R_th·C_in)` se **muestra como dato** (23,87 MHz en el divisor 1:5) y **nunca entra en el criterio** de aprobación.

**Analizador** (`anaEval`): `os = f_s/f_bit ≥ 4`; `dt = 1/f_s ≤ reqDt/4`; `win = depth/f_s ≥ tSig`. Los tres se evalúan por separado y se muestran por separado.

**Decodificador** (`decode`): `decUart` con `nbits`, paridad y baudios; `decI2c` con dirección de 7 bits, R/W y ACK por byte; `decSpi` con muestreo en subida (modos 0 y 3) o bajada (1 y 2). La bandera de trama es `every(ok)` salvo en I²C, donde exige `todos los intermedios con ACK y el último con NACK`.

---

## Reto (calificación triple, ortogonal)

Tres decisiones sobre la instalación asignada: **punta**, **analizador** y **decodificador**. Cada criterio se califica con los otros dos ya correctos (`cfgWith = (sc,o) => ({...GOOD(sc), ...o})`), de modo que acertar dos de tres sigue siendo una captura inservible y ningún criterio puede aprobarse «de rebote».

- **5 puntas × 4 analizadores × 6 decodificadores = 120 combinaciones** por instalación, barridas una a una en las cuatro: **exactamente una válida** en cada banco, y las cuatro soluciones son distintas entre sí.
- La configuración de partida está deliberadamente mal en **los tres** ejes (`firstWrong` por eje): báscula `div5/a10M/u96e`, EEPROM `div5/a1M/u96n`, A/D `pu470/a1M/u96n`, vibración `div5/a1M/u96n`.
- `whyCfg` sobre la terna correcta devuelve cadena vacía en las cuatro instalaciones.

---

## Anclas de honestidad

- **La punta que invierte no falla: miente.** Entrega tramas limpias con el complemento exacto de cada byte y ninguna bandera de error. Se dice explícitamente en la pantalla.
- **Leer 8N1 como 8E1 no rompe la trama.** Salen los mismos 33 valores con 6 banderas de paridad rotas. «No da error: da mentiras.»
- **La trama I²C correcta contiene un NACK.** El último byte de una lectura debe tener `ack=false`; un criterio ingenuo de «todos con ACK» reprobaría la única captura bien formada.
- **El máximo absoluto es criterio de daño, no de calidad.** Los ±9 V de la línea EIA/TIA-232 sobre la punta directa no dan una lectura mala: destruyen la entrada.
- **Hay un bus sin solución de polarización.** Con 400 kHz y 400 pF la ventana es `967 Ω … 885 Ω`, vacía. El laboratorio lo dice con esas palabras en vez de fingir que existe una resistencia adecuada.
- **El analizador más rápido no es el mejor.** Los 200 MS/s son la única opción en el SPI y son inválidos en los otros tres bancos, porque la ventana cae a 5,00 ms.
- **Ancho de banda de la punta como dato, no como criterio.** `f3` se muestra (23,87 MHz en el divisor 1:5) y se comprueba explícitamente que **no** participa en `ok` (`sondaEval(POOL[2],'div5').bwOk === undefined`).
- **Regla de texto muerto cumplida.** Cada mensaje de diagnóstico —umbral, daño, línea muerta, inversión, tiempo de subida, corriente de sumidero, ventana vacía, muestras por bit, resolución, memoria y cada modo de decodificación— tiene al menos un caso del barrido que lo dispara.

---

## Convenciones

- Coma decimal, punto de millar, unidades SI con espacio (`60 ns`, `6,17 mA`, `2,4 kΩ`).
- Los tiempos se presentan con `fdur` (µs/ms/s según magnitud) y los intervalos cortos con `fns`; el formateo es **solo de presentación** y nunca vuelve al motor.
- Sin `onclick` en línea en el HTML generado: todo el cableado es `el(id).onclick = () => fn()`.
- Quiz barajado con Fisher-Yates; `runAuto` responde con `findIndex(o => o.ok)`.

---

## Verificación en dos capas

1. **Numérica** — `scratchpad/verif_buses.mjs`: **152 comprobaciones, 0 fallos**. Incluye el barrido completo de 120 combinaciones × 4 instalaciones, la unicidad de la terna, la ortogonalidad de los tres criterios, las anclas de honestidad y la cobertura de todos los mensajes de diagnóstico.
2. **Navegador** — Playwright contra `window.__labDebug` sobre un servidor HTTP local que sirve `public/`: capa funcional (modos, escenarios, zoom, telemetría, reto en sus tres ejes, quiz) y recorrido guiado completo (`runAuto`) con captura de avisos por `MutationObserver`.
3. **Suite** — `npx tsc --noEmit`, `npx jest` completo y `npx jest golden -u` con diferencia **solo por inserción**.

---

## Referencias

- NXP Semiconductors, **UM10204 «I²C-bus specification and user manual»**, rev. 7 (2021): tabla 10 (`V_OL`, `I_OL`, `t_r`), tabla 12 y §7.1 (resistencia de polarización y capacidad de bus).
- TIA/EIA-232-F, **«Interface Between Data Terminal Equipment and Data Circuit-Terminating Equipment Employing Serial Binary Data Interchange»** (niveles de señal de la línea serie).
- Motorola/Freescale, **«SPI Block Guide» v03.06**, §2.3: modos CPOL/CPHA y flanco de muestreo.
- IEC 61131-2, **«Programmable controllers — Equipment requirements and tests»**: inmunidad y cableado de señal en entorno industrial.
