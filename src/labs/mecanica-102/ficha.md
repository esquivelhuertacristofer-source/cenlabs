# MEC-102 · Caracteriza la Curva P–Q de una Bomba Hidráulica

**Dominio:** D4 · Hidráulica y Neumática
**Práctica del backlog:** d4-10 — «Caracteriza la curva P–Q de una bomba hidráulica»
**Simulador:** `/labs/curva-pq-bomba-hidraulica.html`
**Slug de construcción:** `curva-pq-bomba-hidraulica`

---

## Qué enseña

1. **El caudal del catálogo no existe.** La bomba de engranajes de 25 cm³/rev a 1750 min⁻¹ desplaza **43,75 L/min**, pero a 210 bar sólo llegan **37,29** al actuador: **−14,8 %**. Paletas −8,9 % a 175 bar, pistones −7,8 % a 350 bar.
2. **La presión NO la pone la bomba: la pone la CARGA.** Con el orificio de canto vivo del banco (Cd = 0,62), cerrar de 40 a 3 mm² lleva la presión de **3,7 a 116,5 bar** sin tocar la bomba — y el caudal hace el camino inverso, de 43,64 a 41,71 L/min entre 40 y 9 mm².
3. **El rendimiento total tiene un MÁXIMO INTERIOR.** Con VG 46 a 50 °C: **0,258 a 1 bar · 0,8732 en su máximo de 59,3 bar · 0,8016 a 210 bar**. Abajo manda el par de rozamiento; arriba manda la fuga.
4. **Por qué se dobla:** ηV **baja siempre** con la presión (fuga) y ηM **sube siempre** con ella (el par de rozamiento es casi constante, así que pesa menos cuanto más trabajo útil hay). Dos pérdidas opuestas ⇒ óptimo intermedio.
5. **El rendimiento volumétrico NO depende de la cilindrada.** A 150 bar, las cuatro cilindradas de engranajes dan **ηV = 0,8946** exactamente, porque `Qs` y `Qt` son ambos proporcionales a D y el cociente se simplifica. Lo que sí es proporcional es la potencia de eje: **3,741 · 7,482 · 11,690 · 18,704 kW**.
6. **La limitadora es un componente con CURVA, no un tope ideal.** Tarada a 195 bar, la de acción directa (25 % de sobrepresión) pide **243,75 bar** a la bomba —fuera de los 210 de la de engranajes—; la pilotada (6 %) se queda en **206,70** y entra. **Seis unidades de coste en una válvula deciden si la bomba puede ser la barata.**
7. **El aceite es gratis y decide más que la bomba.** Los tres grados ISO 3448 cuestan lo mismo. El VG 46 recorre dos décadas: **1474 mm²/s a −10 °C** y **11,1 a 80 °C**.
8. **La viscosidad tiene dos frentes opuestos.** Espesar el aceite baja la fuga **y** ahoga la aspiración en frío. Con bomba de pistones, el **VG 68 no arranca por debajo de 33 °C**.
9. **La cavitación es un problema de ARRANQUE, no de trabajo.** En la grúa a −5 °C el VG 32 va a **510,2 mm²/s**, el Reynolds cae a **26** (laminar puro) y el aceite entra al oído a **0,9215 bar** absolutos.
10. **A veces lo que salva la instalación es el montaje.** El término de columna de esa grúa es **negativo** (hAsp = −0,25 m): el depósito está por encima de la bomba y le da carga. Sin eso, la grúa no arranca ninguna mañana de invierno.
11. **El caudal que sobra no desaparece: se convierte en calor.** En el elevador, la fase de **sostener** pide 0 L/min y 147,29 bar: la bomba entrega 26,35 L/min por la limitadora, consume **7,13 kW de eje** y entrega **0,00 kW útiles**. Es la fase que más calienta y la única que no se puede descargar.
12. **La misma máquina, diecinueve veces más calor.** Prensa con engranajes/25/VG 46/directa: **72,5 °C · 110,9 kJ/ciclo · motor de 18,5 kW · 43 386 kWh/año**. Cambiando **sólo** la bomba a cilindrada variable: **27,5 °C · 5,8 kJ · 5,5 kW · 5 684 kWh**.
13. **El equilibrio térmico se resuelve, no se estima.** Bisección sobre T con la viscosidad recalculada en cada iteración (el calor cambia la fuga y la fuga cambia el calor), y **26 de las 720** configuraciones se declaran **NO CONVERGIDAS** en vez de devolver un número inventado.
14. **Los siete criterios se pelean entre sí.** Subir la cilindrada arregla el caudal y rompe el motor; espesar el aceite baja la fuga y rompe la aspiración; abaratar la limitadora rompe la presión. De **720 configuraciones sólo 38** pasan los siete a la vez.
15. **Ninguno de los siete es texto muerto:** cada uno puede fallar **EL SOLO** — caudal 82 · energía 51 · viscosidad 9 · aspiración 5 · motor 5 · térmico 4 · presión 3.
16. **Las estaciones difíciles no perdonan:** 15 válidas en el banco, 9 en la prensa, 8 en el elevador, 4 en la inyectora y **sólo 2 en la grúa de invierno**, siempre sobre 144.

---

## Lógica (verificada `verif_bomba.mjs` — 36 797/36 797)

### Constantes selladas

| Constante | Valor | Origen |
|---|---|---|
| `PATM_BAR` / `G` | 1,013 25 bar abs · 9,81 m/s² | referencia del banco |
| `N_BOMBA` | 1 750 min⁻¹ | motor asíncrono de 4 polos a 60 Hz con deslizamiento |
| `CD_ORIF` | **0,62** | orificio de canto vivo (rango clásico 0,60–0,65) |
| `RE_CRIT` | 2 300 | transición laminar–turbulento |
| `ALFA_RHO` / `T_REF_RHO` | 0,000 65 K⁻¹ · 15 °C | dilatación del aceite mineral |
| `WAL_C` | 0,7 | constante de la ecuación de Walther |
| `T_WAL_MIN` / `T_WAL_MAX` | **−20 … 120 °C** | banda de validez **declarada** de la ASTM D341 |
| `NU_MIN_TRAB` | 10 mm²/s | mínimo de película — criterio de fabricante |
| `NU_OPT_MIN` / `NU_OPT_MAX` | 16 … 36 mm²/s | ventana óptima recomendada (informativa) |
| `T_MAX_ACEITE` | 60 °C | régimen máximo para aceite mineral y juntas estándar |
| `MARGEN_LIM` / `MARGEN_COMP` / `MARGEN_SEG` | +15 · +10 · +25 bar | tarado sobre la carga máxima del ciclo |
| `P_DESC` | 3 bar | presión del grupo descargado |
| `MOTORES` | 3,7 · 5,5 · 7,5 · 11 · 15 · 18,5 · 22 kW | serie normalizada con rendimiento IE3 creciente (0,885 → 0,928) |

### Reglas del motor

| Magnitud | Ecuación |
|---|---|
| Caudal teórico | `Qt = D·n/1000` |
| Fuga (Wilson) | `Qs = Cs·Dp·Δp/μ`, con `Dp = D/2π` |
| Rendimiento volumétrico | `ηV = 1 − Cs·Δp/(μ·ω)` — **no aparece D** |
| Par de eje | `T = Δp·Dp + Cf·Δp·Dp + Cv·Dp·μ·ω` |
| Rendimiento mecánico | `ηM = 1/(1 + Cf + Cv·μ·ω/Δp)` |
| Rendimiento total | `ηT = ηV·ηM = Ph/Peje` |
| Potencia hidráulica | `Ph = p·Q/600` (bar, L/min → kW) |
| Viscosidad–temperatura | `log₁₀log₁₀(ν + 0,7) = A − B·log₁₀(T_K)` (Walther / ASTM D341), A y B ajustados con ν₄₀ y ν₁₀₀ de la ISO 3448 |
| Limitadora | `pFull = pc·(1 + ovr)` · `Qlim = Qnom·(p − pc)/(pc·ovr)` |
| Orificio de carga | `Q = Cd·A·√(2Δp/ρ)` |
| Punto de trabajo | bisección sobre p hasta `Q_bomba − Q_orificio − Q_limitadora = 0` |
| Aspiración | `p_oído = p_atm − ρ·g·h − f·(L/d)·ρv²/2 − kFil·μ·Q`, con `f = 64/Re` en laminar |
| Equilibrio térmico | bisección sobre T con ν recalculada; **no converge ⇒ se declara** (residuo > 0,05) |

### Los siete criterios y cuántas veces falla cada uno

| Letra | Criterio | Falla en | Falla **EL SOLO** |
|---|---|---:|---:|
| Q | Alcanza el caudal de todas las fases | 329 | **82** |
| P | La limitadora cabe en la presión máxima de la bomba | 192 | **3** |
| V | Viscosidad de trabajo y de arranque dentro de la ventana | 251 | **9** |
| A | Sin cavitación en el arranque en frío | 192 | **5** |
| T | Temperatura de régimen bajo el límite del aceite | 207 | **4** |
| M | El motor cabe en la acometida eléctrica de la estación | 268 | **5** |
| E | Consumo anual dentro de lo contratado | 403 | **51** |

Sobre **720** configuraciones: **38 válidas**, 682 inválidas, **26 sin convergencia térmica**.

---

## El catálogo del banco

### Bombas (4 familias, modelo de Wilson)

| Familia | Cs | Cv | Cf | pMax | ν trabajo | ν arranque | Coste |
|---|---|---|---|---|---|---|---|
| Engranajes externos | 3,30·10⁻⁸ | 6,0·10⁴ | 0,050 | 210 bar | ≤ 300 mm²/s | ≤ 2 000 | ×1,00 |
| Paletas equilibradas | 2,40·10⁻⁸ | 8,5·10⁴ | 0,045 | 175 bar | ≤ 160 | ≤ 1 000 | ×1,45 |
| Pistones axiales fija | 1,05·10⁻⁸ | 4,5·10⁴ | 0,030 | 350 bar | ≤ 100 | ≤ 800 | ×3,20 |
| Pistones con compensador | 1,05·10⁻⁸ | 4,5·10⁴ | 0,030 | 350 bar | ≤ 100 | ≤ 800 | ×4,60 |

Cilindradas: **8 · 16 · 25 · 40 cm³/rev**. Presión mínima admisible en el oído: **0,75 · 0,80 · 0,85 bar** absolutos.

### Limitadoras (3)

| Válvula | Sobrepresión | Q nominal | Descarga | Coste |
|---|---|---|---|---|
| Acción directa | **25 %** | 40 L/min | no | 6 |
| Pilotada | **6 %** | 100 L/min | no | 16 |
| Pilotada con descarga | 6 % | 100 L/min | **sí (3 bar)** | 26 |

### Aceites (3, ISO 3448 — los tres cuestan lo mismo)

| Grado | ν₄₀ | ν₁₀₀ | ρ₁₅ | ν a 50 °C | ν a −10 °C |
|---|---|---|---|---|---|
| ISO VG 32 | 32 | 5,4 | 872 kg/m³ | 21,5 mm²/s | 805 mm²/s |
| ISO VG 46 | 46 | 6,8 | 875 kg/m³ | 30,0 mm²/s | 1 474 mm²/s |
| ISO VG 68 | 68 | 8,7 | 878 kg/m³ | 42,9 mm²/s | 2 823 mm²/s |

### Las cinco estaciones

| Estación | Ciclo | T amb / frío | Acometida | h/año | hAsp |
|---|---|---|---|---|---|
| Prensa de embutido 60 t | 10 s · rápido 32@25 · **embutición MEDIDA 3@180** · retorno 26@45 · pausa 2,5 s | 25 / 12 °C | 18,5 kW | 3 000 | +0,25 m |
| Plataforma elevadora | 19 s · subida 18@130 · **sostener 0@130** · bajada 18@15 · pausa 4 s | 20 / 8 °C | 7,5 kW | 1 200 | +0,15 m |
| Unidad de cierre de inyectora | 10,5 s · cierre 45@30 · aprox 8@60 · **bloqueo 2@250 durante 6 s** · apertura 40@40 | 30 / 22 °C | 22 kW | 6 000 | +0,30 m |
| Grúa sobre camión, invierno | 33 s · maniobra 22@160 · **espera descargable 25 s** | 0 / **−5 °C** | 11 kW | 600 | **−0,25 m** |
| Banco de ensayo | 60 s · ensayo continuo 12@100 · purga 12@10 | 28 / 20 °C | 5,5 kW | 7 000 | +0,10 m |

### Solución de coste mínimo (única en las cinco)

| Estación | Óptimo | T régimen | η ciclo | Coste | kWh/año | Motor | Válidas |
|---|---|---|---|---|---|---|---|
| Prensa | variable / 25 / VG 32 / directa | 27,3 °C | 63,9 % | **134** | 5 502 | 3,7 kW | 9 / 144 |
| Elevador | pistones / 16 / VG 32 / pilotada+descarga | 56,8 °C | 51,3 % | **116** | 4 526 | 7,5 kW | 8 / 144 |
| Inyectora | variable / 40 / VG 46 / pilotada | 32,2 °C | 46,3 % | **187** | 18 943 | 5,5 kW | 4 / 144 |
| Grúa | engranajes / 16 / VG 32 / pilotada+descarga | 11,8 °C | 50,1 % | **84** | 1 865 | 11 kW | **2 / 144** |
| Banco | engranajes / 8 / VG 32 / directa | 29,7 °C | **87,0 %** | **39** | 18 874 | 3,7 kW | 15 / 144 |

Ejes del reto (calificados por separado, cada uno con los otros tres ya correctos). El eje del aceite admite **dos** valores válidos en elevador, inyectora y grúa (VG 32 y VG 46 empatan en coste y en criterios); en prensa y banco sólo el VG 32.

---

## Los cinco efectos que hay que ver

### La curva P–Q en el banco (engranajes 25 cm³, VG 46 @ 50 °C)

| Orificio | Presión | Caudal | Comentario |
|---|---|---|---|
| 40 mm² | 3,7 bar | 43,64 L/min | casi el teórico: sin carga no hay presión |
| 9 mm² | **66,4 bar** | 41,71 L/min | punto por defecto del banco |
| 3 mm² | 116,5 bar | — | la carga es quien manda |

### El máximo interior de ηT (mismo punto)

| Presión | ηT |
|---|---|
| 1 bar | **0,258** |
| **59,3 bar** | **0,8732** ← máximo |
| 210 bar | 0,8016 |

### La cilindrada no mueve ηV (a 150 bar)

| D | ηV | Potencia de eje |
|---|---|---|
| 8 cm³ | 0,8946 | 3,741 kW |
| 16 cm³ | 0,8946 | 7,482 kW |
| 25 cm³ | 0,8946 | 11,690 kW |
| 40 cm³ | 0,8946 | 18,704 kW |

### La limitadora barata contra la bomba barata (tarado 195 bar)

| Válvula | Presión a caudal pleno | ¿Cabe en la de engranajes (210 bar)? |
|---|---|---|
| Directa (25 %) | **243,75 bar** | **NO** |
| Pilotada (6 %) | 206,70 bar | sí |

### La factura de la prensa (VG 46, limitadora directa)

| Bomba | T régimen | Calor/ciclo | Motor | kWh/año | Pilotos |
|---|---|---|---|---|---|
| Engranajes 25 cm³ | **72,5 °C** | **110,9 kJ** | 18,5 kW | **43 386** | P, T, E en rojo |
| Cilindrada variable | 27,5 °C | 5,8 kJ | 5,5 kW | 5 684 | los siete en verde |

---

## Anclas de honestidad

- Los coeficientes de Wilson (Cs, Cv, Cf) de las cuatro familias son **valores representativos de cada tecnología**, coherentes con los órdenes de magnitud de catálogo — **no** las constantes medidas de un modelo comercial. La ecuación es de la literatura; los números son de proyecto.
- También son criterios de **fabricante**, no normativos: las presiones mínimas de aspiración (0,75 / 0,80 / 0,85 bar abs), las ventanas de viscosidad, `kDis` y `kFil` de cada estación, `NU_MIN_TRAB = 10 mm²/s` y `T_MAX_ACEITE = 60 °C`.
- **Sí** son normativos: los grados ISO 3448 con sus dos puntos de medida, la relación de la ASTM D341 y las reglas de proyecto de la ISO 4413.
- El campo **«coste» es un orden de complejidad relativo, no un precio de mercado**, y así se declara en pantalla.
- La banda de validez de Walther (**−20…120 °C**) se declara y el laboratorio **avisa cuando extrapola** en lugar de callárselo.
- El **compensador** de la bomba variable se trata como **ideal e instantáneo**; su curva en el banco de ensayo se dibuja como **REFERENCIA ILUSTRATIVA** y así se rotula.
- Las **26 configuraciones sin convergencia térmica** se marcan como tales: no se devuelve un número inventado.
- Queda fuera y se dice: meter-in/meter-out (d4-11), contrabalance (d4-12), transmisión hidrostática (d4-13), proporcionales (d4-14, d4-A4), acumuladores (d4-A1), pérdidas en impulsión y retorno (d4-A2), compresibilidad, golpe de ariete, pulsación, envejecimiento del aceite (ISO 4406 citada, no simulada), desgaste de la bomba y apreciación de riesgos.

---

## Molde y estructura

- **Molde S** (simulador con modos y posiciones de cámara). **Sin ensamble ni `PARTS`.**
- **Cinco modos:** `Banco de ensayo` · `Aceite y aspiración` · `Ciclo de la máquina` · `Proyecto del grupo` · `Reto`.
- Escena 3D: depósito con mirilla de nivel, colador de aspiración, bomba con acoplamiento, motor asíncrono con **placa de datos legible**, manómetro de aguja que sigue la presión calculada, limitadora con su tornillo de tarado, tubería de aspiración con su altura real **(positiva o negativa según la estación)** y tablero de **siete pilotos** de criterio.
- Elementos inspeccionables: bomba, motor y placa, manómetro, limitadora, colador, mirilla y tablero.
- **Cuestionario de 4 opciones barajadas por modo**, con los distractores verificados falsos contra el motor.
- **Recorrido guiado automático** por los cinco modos narrando sólo cifras calculadas.
- Formato SI sellado con `f1`: coma decimal, **espacio fino (U+202F)** de millares y `—` para lo no finito.

---

## Verificación en dos capas

| Capa | Herramienta | Resultado |
|---|---|---|
| 1 · Física y lógica | `scratchpad/verif_bomba.mjs` | **36 797 / 36 797** comprobaciones, 0 fallos |
| 2 · Navegador real | `scratchpad/pw_bomba.mjs` (Playwright sobre `window.__labDebug`) | **180 / 180** aserciones, 0 fallos, 0 errores de consola |

La capa 2 cubre las 14 secciones: arranque, constantes selladas, física del punto de banco, limitadora y tarado, viscosidad y aspiración, ciclo y térmico, censo de proyecto, navegación por los cinco modos, **interacción real por clic** en la barra de control, reto por ejes (los cuatro mal ⇒ los cuatro `false`; el óptimo ⇒ los cuatro `true`), cuestionario en los cinco modos (fallo y acierto), formato y acentos, recorrido guiado completo y errores de consola.

---

## Referencias

1. **ISO 4413** — Transmisiones hidráulicas: reglas generales y requisitos de seguridad. Es lo que obliga a justificar cada componente frente a las condiciones **reales** de servicio y no frente al caso nominal; los siete criterios simultáneos son su traducción operativa. El laboratorio proyecta el grupo, **no** realiza la apreciación de riesgos ni lo certifica.
2. **ISO 3448** — Clasificación por viscosidad de lubricantes industriales (VG 32 → 28,8–35,2 mm²/s; VG 46 → 41,4–50,6; VG 68 → 61,2–74,8).
3. **ASTM D341** — Ecuación de Walther, `log₁₀log₁₀(ν + 0,7) = A − B·log₁₀(T_K)`, con banda declarada ≈ −20…120 °C.
4. **Modelo de pérdidas de W. E. Wilson** (formulación clásica en Ivantysyn & Ivantysynova, *Hydrostatic Pumps and Motors*, y en Manring, *Hydraulic Control Systems*).
5. **Darcy–Weisbach** con `f = 64/Re` para la línea de aspiración (Re del arranque en frío entre 26 y 251 en las cinco estaciones: laminar puro).
6. **Ecuación del orificio de canto vivo** `Q = Cd·A·√(2Δp/ρ)` con Cd = 0,62.
7. **Criterios de proyecto de fabricante** (Bosch Rexroth, Parker, Eaton/Vickers) para viscosidad mínima de trabajo, máxima de arranque, temperatura de régimen y presión mínima en el oído — recomendaciones de ingeniería, mostradas con su rango.
8. **ISO 4406 / ISO 4021** — citadas como marco de la hipótesis de aceite limpio, que este laboratorio **no** simula.
