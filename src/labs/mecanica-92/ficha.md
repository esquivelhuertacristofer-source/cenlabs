# MEC-92 · Sistema domótico: bus, escenas y canal del actuador

**Dominio:** D3 · Sistemas Digitales y Automatización
**Práctica del backlog:** d3-16 — «Proyecta una instalación domótica: bus, escenas y actuadores» — **Molde S** — **D3 16/16 · CIERRA EL DOMINIO**
**Simulador:** `/labs/domotica-escenas.html`
**Slug de construcción:** `domotica-escenas`

---

## Qué enseña

1. **Una instalación domótica no se «programa»: se dimensiona, se escribe y se conecta.** Las tres cosas fallan por su cuenta y ninguna avisa de las otras.
2. **El bus lleva datos y alimentación por el mismo par.** Por eso el proyecto eléctrico no es un trámite previo a la programación: es la mitad del trabajo, y es la mitad que no se ve cuando algo va mal.
3. **Cinco criterios que se cumplen a la vez o no vale.** `n ≤ 64` dispositivos, `I_bus ≤ I_max` de la fuente, `U_mín ≥ 21,0 V` partiendo de 30,0 V, fuente→dispositivo `≤ 350 m` y dispositivo→dispositivo `≤ 700 m`.
4. **La resistencia del par se calcula, no se supone.** `R' = 2·ρ_Cu/(π·(d/2)²) = 68,60 Ω/km` con `ρ_Cu = 0,01724 Ω·mm²/m` y `d = 0,8 mm` (sección **0,503 mm²**). Es el número que convierte metros en voltios.
5. **La caída se acumula tramo a tramo, no con la corriente total.** Cada tramo transporta el consumo de **todo lo que queda más allá**: el primer metro lleva la corriente entera y el último casi nada.
6. **Mover la fuente es la decisión más barata del proyecto.** El anexo pasa de **19,89 V** a **29,88 V** en el peor dispositivo sin cambiar un metro de cable: la corriente ya no recorre 350 m antes de repartirse, sino 15.
7. **Lo que la posición NO arregla es la corriente.** Ese mismo anexo sigue pidiendo **440 mA** a una fuente de 320 mA (**138 %** de uso) esté donde esté; y con 640 mA en el cuadro aprueba en corriente y **suspende en tensión** (19,89 V).
8. **Los criterios de distancia son de instalación, no de física.** En las aulas, la fuente en el cuadro deja al último dispositivo a **620 m** —por encima de 350— y eso basta para descartar la solución aunque los **23,41 V** aún superen el mínimo.
9. **El repetidor parte el bus a efectos eléctricos y cuesta corriente.** La residencia pasa de 66 dispositivos, 780 mA y 9,69 V a dos segmentos de **34** dispositivos, **410 mA** y **28,53 V**; el consumo total sube a **800 mA** porque el repetidor cuenta como dispositivo en cada segmento.
10. **La respuesta es la solución válida MÁS BARATA.** En la vivienda las **seis** soluciones cumplen los cinco criterios: la respuesta es la de 6 unidades de coste. Sobredimensionar no es prudencia, es otra respuesta equivocada.
11. **La escena reparte autoridad, no órdenes.** Escribir el valor deja al pulsador y al detector mandando; inhibir calla al detector; bloquear se lo quita a todos; forzar y liberar devuelve el estado **previo**, no el de la escena.
12. **El mismo programa aprueba en un edificio y suspende en el de al lado.** En la vivienda el usuario debe recuperar el mando con el pulsador (bloquear suspende); en el aula el examen exige que el pulsador **no** mande (bloquear es la única respuesta).
13. **El canal no lo decide la potencia.** Cuatro comprobaciones independientes: tipo de carga, corriente nominal, pico de conexión y potencia máxima del regulador.
14. **Un fallo por una décima de amperio es un fallo entero.** La bomba consume **10,1 A** y el relé de 10 A da **10,0 A**: el margen ya está dentro del número del fabricante.
15. **El pico manda.** 24 pantallas LED de 40 W consumen **4,17 A** y arrancan con **480 A** (×115): dos relés de 16 A que sobran en régimen permanente quedan descartados. En la vivienda, 18 focos regulables piden **0,94 A** y arrancan con **216 A** (×230), y la salida no es un relé mayor sino un regulador, que no cierra contacto sobre la carga.
16. **Un bus consume las 8 760 horas del año, encendido o apagado.** `P_red = (30 V·I_bus + P_vacío·n_seg)/η`, con rendimientos de 0,72 / 0,80 / 0,84 según la fuente.
17. **La domótica no ahorra por definición.** En las aulas el balance anual es **+586,9 kWh**; en el anexo de bombeo es **−122,4 kWh** (164,8 consumidos frente a 42,3 ahorrados): esa instalación se justifica por control y seguridad, no por ahorro.

---

## Lógica (verificada `verif_domotica.mjs` — 170/170)

**Constantes selladas del motor** (idénticas en el verificador y en el laboratorio, copiadas verbatim entre los marcadores `MOTOR` / `FIN MOTOR`):

| Símbolo | Valor | Origen |
|---|---|---|
| `U_PS` | 30,0 V | tensión de la fuente de bus en vacío |
| `U_MIN` | 21,0 V | mínimo de funcionamiento del dispositivo |
| `RHO_CU` | 0,01724 Ω·mm²/m | resistividad del cobre a 20 °C |
| `D_PAR` | 0,8 mm | diámetro del conductor del par (sección 0,503 mm²) |
| `R_M` | **68,60 Ω/km** | `2·ρ/(π·(d/2)²)`, resistencia de **bucle** |
| `I_UL` | 10 mA | unidad de carga: consumo de bus de un dispositivo |
| `N_MAX` | 64 | dispositivos por segmento |
| `L_PS_MAX` | 350 m | fuente → dispositivo |
| `L_DD_MAX` | 700 m | dispositivo → dispositivo |
| `L_SEG_MAX` | 1 000 m | longitud de segmento — **dato, no criterio** |
| `V_BUS` | 9 600 bit/s | velocidad del bus — **dato, no criterio** |

**Catálogos.** Seis soluciones de bus (`BUSES`, coste 6/9/10/14/15/33) combinando tres fuentes (`FUENTES`: 160/320/640 mA, con 0,8/1,4/2,6 W de vacío y η = 0,72/0,80/0,84), dos posiciones (`cab` = cuadro general, `cen` = centro del grupo) y uno o dos segmentos. Seis programas de escena (`PROGS`, coste no aplicable: se califican por comportamiento). Cinco canales de actuador (`CANALES`, coste 4/6/7/9/12).

**Cuatro instalaciones** (`POOL`), con su geometría y su terna única:

| Instalación | Dispositivos | Tendido | Carga | Terna válida |
|---|---|---|---|---|
| Vivienda unifamiliar | 14 (14 UL) | 5 … 85 m | 18 focos LED regulables, 0,94 A / 216 A pico / 216 W | `b1` · `l_det` · `cdim` |
| Anexo remoto de bombeo | 44 (44 UL) | 320 … 350 m | bomba 2,2 kW, 10,1 A / 54 A pico | `b5` · `l_dir` · `c16` |
| Edificio de aulas | 30 (30 UL) | 20 … 620 m | 24 pantallas LED, 4,17 A / 480 A pico | `b3` · `l_blq` · `c16c` |
| Residencia de estudiantes | 66 (78 UL) | 10 … 760 m | persiana motorizada 200 W, 0,9 A | `b6` · `l_tmp` · `cper` |

**Bus** (`segEval` / `busEval`): reparto de la corriente hacia los dos lados desde `xps` (0 si la fuente va en el cuadro, punto medio del vano de dispositivos si va centrada), acumulando en cada tramo el consumo de todo lo que queda más allá. Con dos segmentos, la lista ordenada se parte por `Math.ceil(n/2)` y el repetidor —una unidad de carga— se añade a **ambas** mitades. El veredicto agrega el **peor** de los segmentos en cada criterio. `okBus` exige `ok && coste === busCosteMin(sc)`.

**Escena** (`runEsc` / `logEval`): motor de estados por pasos con `on`, `blq`, `det`, `pres`, `lux`, `tOff` y `tLib`, sobre un guion de eventos (`esc`, `puls`, `pres`, `fin`, `lux`). Los requisitos de cada instalación son preguntas sobre la traza (`tr[7].on === false`, `tr.slice(3,15).every(r => r.on === true)`), no opiniones.

**Canal** (`canEval`): `tipoOk` (conmutación / persiana / regulación), `iOk` (`I_carga ≤ I_nom`), `picoOk` (`I_pico_carga ≤ I_pico` del contacto, con `null` = sin contacto que cerrar en el regulador) y `pOk` (≤ 250 W sólo en el regulador). `okCan` exige `ok && coste === canCosteMin(sc)`.

**Balance** (`consumo`): `P_bus = 30 V · Σ I_seg`, `P_red = (P_bus + P_vacío·n_seg)/η`, `kWh_sis = P_red·8760/1000`, `kWh_ahorro = P_lum·h_ahorro·365/1000`.

| Instalación | Bus | `P_red` | `kWh` sistema | `kWh` ahorro | **Balance** |
|---|---|---|---|---|---|
| Vivienda | `b1` | 6,94 W | 60,8 | 118,3 | **+57,4** |
| Anexo | `b5` | 18,81 W | 164,8 | 42,3 | **−122,4** |
| Aulas | `b3` | 13,00 W | 113,9 | 700,8 | **+586,9** |
| Residencia | `b6` | 34,76 W | 304,5 | 492,8 | **+188,2** |

---

## Reto (calificación triple, ortogonal)

Tres decisiones sobre la instalación asignada: **solución de bus**, **programa de escena** y **canal del actuador**. Cada criterio se califica con los otros dos ya correctos (`cfgWith = (sc,o) => Object.assign({}, GOOD(sc), o)`), de modo que acertar dos de tres sigue siendo una instalación que no vale y ningún criterio puede aprobarse «de rebote».

- **6 buses × 6 programas × 5 canales = 180 combinaciones** por instalación, barridas una a una en las cuatro: **exactamente una válida** en cada una, y las cuatro soluciones son distintas entre sí.
- La configuración de partida está deliberadamente mal en **los tres** ejes, y la opción equivocada varía con la estación para que el alumno no memorice el punto de partida.
- `whyCfg` sobre la terna correcta devuelve cadena vacía en las cuatro instalaciones.

---

## Anclas de honestidad

- **El balance del anexo es NEGATIVO y se dice con la cifra delante.** 44 dispositivos consumen 164,8 kWh al año para ahorrar 42,3: **−122,4 kWh/año**. La instalación se justifica por control remoto y seguridad, no por ahorro.
- **Mover la fuente no arregla la corriente.** El anexo con la fuente centrada aprueba en tensión (29,88 V) y sigue suspendiendo en corriente (440 mA sobre 320 mA); con 640 mA en el cuadro ocurre lo contrario. Dos fallos distintos de la misma instalación.
- **Dos criterios nunca fallan solos.** El número de dispositivos (`nOk`) y la distancia entre dispositivos (`ddOk`) no aparecen aislados en ningún caso del banco: se evalúan y se muestran porque el proyecto los exige, y se declara que cuando saltan ya han saltado otros antes.
- **Un fallo por una décima de amperio es un fallo entero.** La bomba de 10,1 A y el relé de 10,0 A: no hay margen que negociar porque el margen ya está dentro del número del fabricante.
- **El pico descarta canales que sobran en corriente.** Los relés de 10 A y 16 A aguantan de sobra los 4,17 A de las aulas y quedan fuera por los 480 A de arranque.
- **Sobredimensionar cuenta como error.** En la vivienda las seis soluciones de bus cumplen; sólo la más barata es la respuesta. La calificación es «válida **Y** más barata», no «válida».
- **Partir el bus no ahorra energía.** La residencia sube de 780 mA a 800 mA al añadir el repetidor: hace viable la instalación, no la hace más eficiente.
- **El guion avanza por pasos, no por segundos.** El motor de escenas es discreto y el laboratorio lo declara en el contrato de fidelidad y lo imprime bajo el eje de la traza. No se modelan telegramas, direcciones de grupo, colisiones ni tiempos reales.
- **`L_SEG_MAX` y `V_BUS` se muestran como datos, no como criterios.** Los 1 000 m de segmento y los 9 600 bit/s forman parte de la regla de instalación y se declara explícitamente que aquí no deciden nada.
- **Regla de texto muerto cumplida.** Los **23** mensajes de diagnóstico distintos —los cinco criterios de bus, el «cumple pero hay una más barata», los requisitos de escena de las cuatro instalaciones y las cuatro comprobaciones de canal— tienen al menos un caso del barrido que los dispara.

---

## Convenciones

- Coma decimal, punto de millar, unidades SI con espacio (`29,88 V`, `440 mA`, `68,60 Ω/km`).
- Tres formateadores de corriente separados por magnitud: `fmtIb` en mA para el bus, `fmtIc` en A para la carga y `fmtIp` en A enteros para el pico. El formateo es **solo de presentación** y nunca vuelve al motor.
- Los adaptadores de dibujo (`partesDevs`, `perfil`) replican el reparto de `busEval` en vez de recalcularlo por su cuenta, de modo que el perfil dibujado y el veredicto calificado son el mismo número.
- Sin `onclick` en línea en el HTML generado: todo el cableado es `el(id).onclick = () => fn()`.
- Quiz barajado con Fisher-Yates; `runAuto` responde con `findIndex(o => o.ok)`.

---

## Verificación en dos capas

1. **Numérica** — `scratchpad/verif_domotica.mjs`: **170 comprobaciones, 0 fallos**. Incluye el barrido completo de 180 combinaciones × 4 instalaciones, la unicidad de la terna, la ortogonalidad de los tres criterios, las anclas de honestidad y la cobertura de los 23 mensajes de diagnóstico.
2. **Navegador** — Playwright contra `window.__labDebug` sobre un servidor HTTP local que sirve `public/`: capa funcional (modos, instalaciones, soluciones de bus, los cuatro estudios de Aplica, telemetría, reto en sus tres ejes, quiz) y recorrido guiado completo (`runAuto`) con captura de avisos por `MutationObserver`.
3. **Suite** — `npx tsc --noEmit`, `npx jest` completo y `npx jest golden -u` con diferencia **solo por inserción**.

---

## Referencias

- **ISO/IEC 14543-3** (partes 1 a 7), «Information technology — Home Electronic System (HES) architecture»: arquitectura del bus domótico normalizado (KNX), alimentación y datos sobre el mismo par.
- **EN 50090** (serie), «Home and Building Electronic Systems (HBES)»: requisitos generales, seguridad y compatibilidad.
- **KNX Association**, «KNX System Specifications — Twisted Pair 1 (TP1)» y guía de instalación: 30 V nominales, mínimo de funcionamiento del dispositivo, 64 dispositivos por segmento, 350 m fuente→dispositivo, 700 m dispositivo→dispositivo, 1 000 m de segmento y 9 600 bit/s.
- **IEC 60669-2-1**, «Switches for household and similar fixed electrical installations — Part 2-1: Electronic switches»: interruptores y reguladores electrónicos, corriente nominal y cargas capacitivas.
- **IEC 60947-4-1**, «Contactors and motor-starters»: categorías de empleo y distinción entre corriente permanente y capacidad de cierre del contacto.
- **IEC 60364-5-52**: caída de tensión admisible y resistividad del cobre a 20 °C.
