# MEC-90 · Adquisición de Sensores: el Convertidor A/D y la Cuantización

**Dominio:** D3 · Sistemas Digitales y Automatización
**Práctica del backlog:** d3-14 — Adquiere sensores con el ADC y analiza la cuantización: `LSB = VREF/2ⁿ`, aprovechamiento del rango, ruido, Nyquist, alias y ventana de adquisición. **Molde S+P** — **D3 14/16**
**Simulador:** `/labs/adc-cuantizacion.html`
**Slug de construcción:** `adc-cuantizacion`

## Qué enseña

1. **Un convertidor no mide: compara.** Parte su rango en `2ⁿ` escalones de `LSB = VREF/2ⁿ` y devuelve el índice del escalón. El banco da **4,882813 mV** (10 b · 5 V), **2,500000 mV** (10 b · 2,56 V), **1,220703 mV** (12 b · 5 V) y **0,625000 mV** (12 b · 2,56 V). *La referencia pesa tanto como los bits: bajar VREF de 5 V a 2,56 V afina el escalón casi el doble sin tocar el convertidor.*

2. **El medio LSB de la reconstrucción no es un adorno.** El silicio **trunca** (`código = floor(V/LSB)`); si al código se le atribuye su borde inferior en lugar de su centro, toda la escala queda desplazada **−LSB/2**. Con `V̂ = (código+½)·LSB`, el horno bien acondicionado lee **288,4909 °C** de unos **288,500 °C** reales: **−0,009 °C**. Sin el medio LSB serían −0,08 °C sistemáticos en todo el rango.

3. **Los bits de la hoja de datos NO son los bits que se cobran.** `bits útiles = n + log₂(uso)`. Ocupar **la mitad** del rango cuesta **exactamente un bit**. El termopar tipo K conectado directo ocupa el **0,72 %** del rango de 2,56 V y se queda en **4,884 bits** de los 12: *tira 7,1 bits*. Con `×100` sube al **72,07 %** y da **11,527 bits**.

4. **Resolución y aprovechamiento son la MISMA desigualdad escrita dos veces.** `res = LSB/(g·s)`: con el mismo convertidor de 12 bits y referencia interna, el horno da **15,244 °C** por código sin amplificar, **3,049 °C** con ×5, **0,762 °C** con ×20 y **0,152 °C** con ×100. El requisito es 0,25 °C: sólo la última cumple, y es también la única que llega al 40 % de aprovechamiento.

5. **El amplificador no mejora el convertidor: mejora la pregunta que se le hace.** Sube la señal y sube el ruido del sensor **exactamente igual**, así que la relación señal-ruido a su entrada no cambia. Lo que cambia es dónde cae la señal dentro del rango.

6. **Hay un suelo por debajo del cual añadir bits EMPEORA la medida.** Si `LSB < 2σ`, los códigos de abajo describen el ruido y no la señal. En el molino, `b12v5` mejora la resolución de **0,244 A a 0,061 A** y aun así **`ruidoOk = false`**: `LSB = 1,2207 mV` frente a `2σ = 1,6971 mV`. *Es el único criterio del laboratorio que va al revés que la intuición.*

7. **La referencia se elige por la instalación, no por su valor.** Con el 5 V del tablero ensuciado por los contactores (`ruidoAlim`), **todo** convertidor referido a Vcc queda descartado aunque sus cifras cuadren: `b12v5` da 0,298 °C —que ya fallaría el requisito— pero es que además `guardAdc = false`. La regla recíproca (`ratio` ⇒ referencia = Vcc) está implementada; ninguna de estas cuatro estaciones la ejerce.

8. **Un amplificador de alimentación simple no puede sacar 0 V.** La excursión real va de **0,050 V a 4,800 V**, y por eso `amp5` y `amp20` en el horno tienen `guardCond = false` pese a caber holgadamente en el rango del convertidor: su extremo inferior (0,0103 V y 0,0410 V) queda por debajo de lo que el amplificador puede entregar.

9. **Nyquist y el filtro antialias son criterios DISTINTOS y ninguno implica al otro.** `f_s ≥ 5·f_banda` dice cuántas muestras hacen falta; `att(f) = 1/(1+(f/f_c)²)` dice qué hacer con lo que está fuera de la banda. Cumplir uno y saltarse el otro deja una medida que parece correcta y no lo es.

10. **Un filtro demasiado cerrado no protege: BORRA.** La línea hidráulica a 10 S/s tiene `f_c = 4 Hz` y una banda útil de 30 Hz: `att(30, 4) = 0,0175`. Pasa el **1,75 %** de la señal que se quería medir. `guardMues = false` no por el alias, sino por la banda.

11. **El alias puede caer en 0 Hz EXACTOS y disfrazarse de error de calibración.** `fold(f, f_s) = |f − round(f/f_s)·f_s|`: la portadora de **4 kHz** del variador muestreada a **200 S/s** pliega a **0,0 Hz**. Ahí no parece ruido: parece un offset, y ningún filtro digital posterior lo puede sacar porque ya está encima de la señal. *En la configuración válida el residuo es de sólo 0,0100 mV; lo que enseña la cifra es dónde CAE, no cuánto vale.*

12. **Muestrear más rápido no siempre protege más.** La misma portadora a **5 kS/s** se pliega a **1 000 Hz** con **5,0000 mV** de residuo frente a un `½ LSB` de **0,6104 mV** —ocho veces el escalón— y a **50 kS/s**, a 4 000 Hz con **24,04 mV**. Lo que protege es la posición relativa entre `f_s`, `f_c` y la interferencia, no la velocidad por sí sola.

13. **El condensador del muestreo y retención necesita tiempo, y la ventana se lo quita.** `t_asent = (n+1)·ln2·(R_out+R_MUX)·C_SH` frente a `t_ventana = 0,25/f_s`. El acelerómetro conectado directo (**100 kΩ**) pide **10,7812 µs** y a 50 kS/s la ventana ofrece **5,000 µs**: el número que sale es el de la muestra anterior.

14. **El seguidor presta dos servicios distintos y a veces decide el segundo.** Además de amplificar, baja `R_out` a **100 Ω** y el asentamiento a **0,1174 µs**. En el rodamiento la ganancia `×5` se elige por el aprovechamiento del rango, pero es la **impedancia** lo que hace posible la medida: `directo` cumple `guardCond` y falla por `setOk`.

15. **Seis criterios, tres decisiones, una sola solución.** `resOk · usoOk · ruidoOk · nyqOk · aliasOk · setOk` sobre `{convertidor, acondicionamiento, muestreo}`. Barridas las **64 combinaciones** en cada máquina: exactamente **1** válida, y las cuatro máquinas tienen soluciones **distintas**.

## Lógica (verificada `verify_adc.mjs` — 108/108)

El motor del laboratorio es **el código del verificador pegado verbatim** (`// 2. MOTOR (VERIFICADO 108/108 — VERBATIM)`).

```
lsbOf(a) = a.vref/2^a.n            nCodes(a) = 2^a.n
codeOf(v,a) = clamp(floor(v/lsb), 0, N−1)          truncamiento, como el SAR
vHat(code,a) = (code+0.5)·lsb      xHat = (vHat/g − v0)/s      qErr = vHat − v
resFis(sc,c,a) = lsb/(c.g·sc.s)    usoOf = (spanHi−spanLo)/vref     enobUso = n + log2(uso)
vRuido(sc,c)   = hypot(g·vnSens, g·vnAmp, VN_ADC)
att(f,fc) = 1/(1+(f/fc)^2)         fold(f,fs) = |f − round(f/fs)·fs|
vAlias = g·vInt·att(fInt, fc)      tAcq = 0.25/fs
tauSH = (rOut + R_MUX)·C_SH        tSet = (n+1)·ln2·tauSH        rOut = buf ? 100 : sc.rs
guardAdc / guardCond / guardMues   instalación, excursión y plataforma ANTES de simular
okAdc / okCond / okMues + GOOD     los tres criterios del Reto, cada uno con los otros dos correctos
```

Constantes: `VCC = 5,000 V` · `VN_ADC = 0,200 mV` · `C_SH = 14 pF` · `R_MUX = 1 kΩ` · excursión `0,050–4,800 V` · `USE_MIN = 40 %` · `OS_MIN = 5` · `ATT_BW = 1/√2` (−3 dB) · `K_RUIDO = 2` · `K_ACQ = 0,25`.

Los seis criterios del punto de trabajo:

```
resOk   = res ≤ sc.reqRes                    la resolución física llega al requisito
usoOk   = uso ≥ 0.40                         la señal ocupa al menos el 40 % del rango
ruidoOk = lsb ≥ 2·vn                         el escalón no baja del suelo de ruido
nyqOk   = fs ≥ 5·fBw                         sobremuestreo mínimo sobre la banda útil
aliasOk = vAlias < lsb/2                     lo que el filtro deja pasar cabe en medio escalón
setOk   = tAcq ≥ tSet                        el condensador se asienta dentro de la ventana
```

Pool de 4 máquinas: **Horno de tratamiento térmico** (termopar tipo K de 41,0 µV/°C, 50–500 °C, requisito 0,25 °C, `ruidoAlim`, red de 60 Hz colándose) · **Línea hidráulica con variador** (transmisor 4-20 mA sobre 220 Ω, 0–10 bar, requisito 0,01 bar, portadora de 4 kHz, banda de 30 Hz) · **Accionamiento de un molino** (shunt de 1 mΩ, 10–150 A, requisito 0,5 A, portadora de 16 kHz, `fsMax = 20 kS/s`) · **Vigilancia de un rodamiento** (acelerómetro piezoeléctrico con red de 100 kΩ, 0,2–2,0 g, requisito 0,005 g, banda de 1,2 kHz, fuente conmutada de 150 kHz).

## Reto (calificación triple, ortogonal)

Tres decisiones independientes, cada una evaluada **con las otras dos correctas** sobre el mismo motor verificado:

```js
const cfgWith = (sc, o) => ({ ...GOOD(sc), ...o });

okAdc (sc, k) = cfgOk(sc, cfgWith(sc, { adc:  k }))   // bits y referencia
okCond(sc, k) = cfgOk(sc, cfgWith(sc, { cond: k }))   // ganancia e impedancia
okMues(sc, k) = cfgOk(sc, cfgWith(sc, { mues: k }))   // velocidad y filtro antialias

cfgOk = guardAdc(alimentación sucia · medida ratiométrica)
     && guardCond(rango del convertidor · excursión del amplificador)
     && guardMues(plataforma · el filtro no puede comerse la banda)
     && runC(...).ok    // res · uso · ruido · Nyquist · alias · asentamiento
```

- **Convertidor** — `b10v5 / b10v256 / b12v5 / b12v256`. Soluciones: **`b12v256 · b12v5 · b10v5 · b10v256`**, una distinta en cada máquina. El horno descarta los dos de Vcc por **alimentación sucia** y `b10v256` por **resolución** (0,610 °C > 0,25); el molino descarta los de 12 bits por **ruido** y `b10v256` por **saturación** (uso 109,38 %).
- **Acondicionamiento** — `directo / amp5 / amp20 / amp100`. Soluciones: **`amp100 · directo · amp20 · amp5`**. En el horno los descartes son por **excursión del amplificador** (`amp5`, `amp20`) y por **aprovechamiento** (`directo`, 0,72 %); en el rodamiento, `directo` cae por **asentamiento** (10,78 µs > 5 µs) y `amp20`/`amp100` por **rango** (3,2–8,0 V y 16–40 V sobre un VREF de 2,56 V).
- **Muestreo** — `m10 / m200 / m5k / m50k`. Soluciones: **`m10 · m200 · m5k · m50k`**, una por máquina. En la línea hidráulica `m10` cae por **filtro** (`att(30, 4) = 0,0175`), y `m5k`/`m50k` por **alias** (5,0000 mV y 24,04 mV contra ½ LSB de 0,6104).

Barrido de las **64 combinaciones** (4 convertidores × 4 acondicionamientos × 4 velocidades) en cada máquina: exactamente **1** es válida. La semilla del Reto está deliberadamente **mal en las tres** (`seedReto` toma con `firstWrong` la primera opción que falla en cada eje): `b10v5/directo/m200` · `b10v5/amp5/m10` · `b10v256/directo/m10` · `b10v5/directo/m10`.

Cifras de cada terna buena: horno **LSB 0,6250 mV · res 0,15244 °C · uso 72,07 % · 11,527 bits · 2σ 0,4899 mV · alias 0,0265 mV** · hidráulica **LSB 1,2207 mV · res 0,00347 bar · uso 70,40 % · 11,494 bits · alias 0,0100 mV** · molino **LSB 4,8828 mV · res 0,24414 A · uso 56,00 % · 9,163 bits · 2σ 1,6971 mV** · rodamiento **LSB 2,5000 mV · res 0,00375 g · uso 46,87 % · 8,907 bits · t_asent 0,1174 µs de 5,000 µs**.

## Anclas de honestidad

- **«Bits útiles» ≠ ENOB.** Aquí significa `n + log₂(uso)`. El ENOB de la **IEEE Std 1241-2010** se mide con **SINAD** sobre una senoide de prueba y no es lo que calcula este laboratorio. El propio pizarrón lo dice.
- **El modelo cuantiza por truncamiento**, no por redondeo; la corrección de ½ LSB se aplica en la **reconstrucción**, que es donde corresponde.
- **El alias en 0 Hz no es un caso de laboratorio**: es exactamente lo que hace una portadora que es múltiplo entero de la frecuencia de muestreo, y en la configuración *válida* de la línea hidráulica ocurre —con un residuo despreciable de 0,0100 mV—. Se cita para enseñar **dónde cae**, no para asustar.
- **El ruido es el único criterio que castiga tener más bits.** El resto de la práctica empuja hacia arriba; éste, hacia abajo. No se disimula: se pone como estación completa.
- **Ninguna estación de este pool ejerce la guarda ratiométrica** (`ratio: false` en las cuatro). La regla está implementada y se explica, pero no se presenta como si estuviera en juego.

## Convenciones

- Molde **S+P**: pizarrón de 1024×768 con Explora / Aplica / Reto **más** panel de instrumentos de 600×400 pintado sobre el bastidor 3D (`drawPanel3D`), repintado en cada fotograma junto a la telemetría lateral.
- `curCfg()` **no es el mismo punto de trabajo en los tres modos**: en Explora sólo cambia el convertidor (`{adc: expAdc, cond: sc.cond, mues: sc.mues}`), en Aplica manda el panel y en Reto, la elección del alumno. Todo harness que contraste cifras narradas tiene que comparar contra el modo en uso.
- Los puntos de la escala que ofrece Explora son `XFR = [0, 0,19, 0,37, 0,53, 0,78, 1,0]` y **no** fracciones redondas: las redondas caían justo sobre transiciones de código y daban un error idéntico de −LSB/2 en los seis puntos, que enseña lo contrario de lo que se quiere enseñar.
- Ninguna cifra citada en la ficha, el briefing, el pizarrón o el recorrido guiado es inventada: todas salen de `verify_adc.mjs` a través de `dump_adc.mjs`.
- Quiz barajado con Fisher-Yates; `runAuto` responde con `findIndex(o => o.ok)`, nunca con un índice fijo.
- Nunca `onclick` inline en el HTML generado: todo se cablea con `el(id).onclick = () => fn()`.

## Verificación en dos capas

1. **Numérica** (`scratchpad/verify_adc.mjs`): **108/108**, incluido el barrido de las 64 combinaciones en cada máquina que demuestra la unicidad de la solución.
2. **Dinámica** (Playwright + `window.__labDebug` sobre servidor HTTP local): `scratchpad/pw_adc.mjs` y `scratchpad/pw_adc_auto.mjs`, que además **contrasta contra el motor cada cifra que narra el recorrido guiado** antes de ejecutarlo, y termina en Reto **resuelto en las tres decisiones**. **Cero errores de consola.**

## Referencias

- W. Kester (ed.), *Data Conversion Handbook*, Analog Devices / Newnes, cap. 2 *Fundamentals of Sampled Data Systems*
- IEEE Std 1241-2010, *Standard for Terminology and Test Methods for Analog-to-Digital Converters* (referencia de contraste para el ENOB)
- ATmega328P *Datasheet*, §24 *Analog-to-Digital Converter* (referencia interna, condensador de muestreo, impedancia de fuente recomendada)
- A. V. Oppenheim y R. W. Schafer, *Discrete-Time Signal Processing*, cap. 4 *Sampling of Continuous-Time Signals*
- Analog Devices **MT-047** / **MT-048**, *Op Amp Noise* y *Op Amp Noise Relationships*
- Texas Instruments **SBAA051**, *Principles of Data Acquisition and Conversion*
- NAMUR NE 43 e IEC 60584 (contexto de las estaciones; el lazo de 4-20 mA se estudia en MEC-87)
