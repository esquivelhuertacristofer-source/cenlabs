# Panorama de necesidades del sector mecánica–electrónica

**Qué debe cubrir la plataforma CEN Labs para ser relevante en carreras técnicas de mecatrónica, autotrónica, electrónica, electricidad, electromecánica y automotriz — fundamentado en los programas oficiales de la SEP.**

> **Propósito.** Responder, con base en documentos oficiales (no en generalidades), a la
> pregunta: *¿qué sistemas, fenómenos y habilidades debe poder simular la plataforma para
> ser defendible ante un bachillerato/universidad técnica y ante un experto del sector?*
>
> Complementa a [`MODELO-PEDAGOGICO-SECTOR-MECANICA.md`](./MODELO-PEDAGOGICO-SECTOR-MECANICA.md),
> que destila el **cómo** (redacción de actividades, evaluación, secuencia). Este documento
> destila el **qué** (necesidades técnicas a cubrir) y lo organiza en *dominios de simulación*.
>
> Fecha de síntesis: **2026-07-08**. Reforma vigente: **MCCEMS** (Acuerdo 09/08/23).
> Método: WebSearch de fuentes oficiales → descarga de PDF → `pdftotext -enc UTF-8` →
> minería de módulos/submódulos y perfiles de egreso.

---

## 1. Fuentes oficiales analizadas (ampliadas)

Los PDF están en `docs/curriculas-mecanica/oficiales-sep/` (gitignored: públicos pero pesados).

| Carrera | Documento | Clave / año | Emisor | Estructura |
|---|---|---|---|---|
| **Mecatrónica** | Programa de Estudios | 3071300008-23 (2ª ed. jul-2024) | SEMS/COSFAC (común DGETI/CECyTE/CONALEP/DGETAyCM) | 5 módulos · 13 submódulos |
| **Electromecánica** | Programa de Estudios | Presencial-2024 | SEMS / COSAC | 5 módulos · 15 submódulos |
| **Electricidad** | Programa de Estudios | ED-2022 | CECyTE / COSAC | 5 módulos |
| **Electrónica** | Programa de Estudios (Técnico en Electrónica) | ED-2022 (DGETI) | DGETI / COSAC | 5 módulos · 10 submódulos · 1200 h |
| **Autotrónica** | Mapa Curricular + Perfil de Egreso | Plan 2023 | CONALEP | ~18 módulos de servicio + trayectos técnicos |
| **Autotrónica** | Programa de Estudios (respaldo) | Presencial-2017 | CECyTE | 93 pág., detalle de submódulos |
| **Autotrónica** | Guía de Equipamiento | — | CONALEP | inventario de sistemas/bancos didácticos |

**Nivel superior (para la sección §6):**

| Programa | Fuente | Uso |
|---|---|---|
| **Ing. Mecánica** (mapa curricular completo) | UAEMEX (Fac. Ingeniería) | ver qué asignaturas de laboratorio existen a nivel licenciatura |
| **TSU Mecánica área Automotriz** | Universidades Tecnológicas (UTs) | puente bachillerato→superior en automotriz |

Las cinco primeras carreras comparten el **formato SEMS/CONALEP por competencias** (mismo
esqueleto: Módulo → Resultado de Aprendizaje → Submódulo → Actividad clave → Evidencia).

---

## 2. Las carreras del sector y su "necesidad nuclear"

Perfil de egreso condensado — *lo que el egresado debe ser capaz de HACER* (verbatim recortado de los programas):

| Carrera | Necesidad nuclear (qué hace el egresado) | Nº módulos |
|---|---|---|
| **Electrónica** | Da mantenimiento a sistemas eléctricos/electrónicos; repara audio/TV; programa **PLC** y **microcontroladores**; instala sistemas electrónicos **automatizados** (edificios inteligentes, industria). | 5 (1200 h) |
| **Mecatrónica** | Construye circuitos electrónicos; construye sistemas mecatrónicos (mecánicos + **neumática/hidráulica**); programa control (**PLC**, embebidos); opera **manufactura flexible** (CNC, **robótica**); automatiza y mantiene sistemas. | 5 |
| **Electromecánica** | Instala sistemas electromecánicos; instala/mantiene **máquinas eléctricas rotativas**; fabrica piezas (**torno/fresa CNC**); control electromecánico; mantiene equipos neumáticos, hidráulicos, de **refrigeración** y **fotovoltaicos**. | 5 |
| **Electricidad** | Diseña/realiza **instalaciones** residenciales, comerciales e industriales; mantiene **motores y generadores CA/CC**; control electromagnético/electrónico; **iluminación** y **energía renovable**; **media/baja tensión** y subestaciones. | 5 |
| **Autotrónica** | Mantiene sistemas automotrices mecánicos, hidráulicos y **eléctricos controlados por electrónica**; diagnostica con **escáner OBD**; da servicio a gasolina, **diésel** e **híbrido**. | ~18 servicios |
| **Automotriz (TSU)** | Diagnostica y repara sistemas automotrices con software y equipo de diagnóstico; manufactura elementos mecánicos con máquinas-herramienta. | 6 cuatrim. |

**Lectura clave:** las seis carreras se solapan fuertemente en un núcleo común de fenómenos
físicos (circuitos, máquinas eléctricas, fluidos a presión, control lógico, térmica). Ese
solape es lo que hace rentable una plataforma de simuladores: **un motor de simulación bien
hecho sirve a varias carreras**.

---

## 3. Inventario técnico consolidado por carrera

> Los inventarios de Mecatrónica/Electromecánica/Electricidad están en
> [`MODELO-PEDAGOGICO §6`](./MODELO-PEDAGOGICO-SECTOR-MECANICA.md). Aquí se agregan los dos
> que faltaban a detalle — **Electrónica** y **Autotrónica** — que son los huecos que este
> documento cierra.

### 3.1 ELECTRÓNICA (DGETI 2022 · 5 módulos · 10 submódulos · 1200 h)
- **I. Realiza mantenimiento a sistemas eléctricos y electrónicos**
  - Utiliza equipo/herramienta en circuitos eléctricos · Arma y comprueba circuitos eléctricos ·
    Energiza y opera **motores de CA, de CD y relevadores** · Arma circuitos de **electrónica análoga** ·
    Arma circuitos de **electrónica digital**.
- **II. Repara equipos de audio y receptores de televisión** — audio · receptores de TV HD.
- **III. Mantiene sistemas electrónicos que contienen PLC** — programa **PLC** · sistemas de uso comercial.
- **IV. Mantiene sistemas electrónicos operados con microcontroladores** — programa **microcontroladores** · sistemas de uso industrial.
- **V. Mantiene sistemas electrónicos automatizados** — **edificios inteligentes** (domótica) · automatización industrial.

### 3.2 AUTOTRÓNICA (CONALEP 2023 · componente laboral, servicios) — inventario completo
Motor y tren motriz:
- Reparación de **motor de combustión interna** (gasolina) · Diagnóstico y servicio a **motor a diésel** ·
  Mantenimiento de **sistemas de lubricación** · Mantenimiento de **sistemas de transmisión** ·
  **transmisión electrónica**.

Chasis / dinámica del vehículo:
- Mantenimiento de **frenos** · Diagnóstico y servicio a **frenos ABS** · Mantenimiento de **suspensión** ·
  **suspensión electrónica** · Reparación de **dirección** (estándar / asistida).

Eléctrico-electrónico:
- Mantenimiento de **sistemas eléctricos y electrónicos** · Servicio a **unidades de control electrónicas (ECU)** ·
  Emisión del **diagnóstico** (con escáner OBD) · Servicio a **sistema de comunicaciones** (redes CAN/bus) ·
  Servicio a **audio y video**.

Confort y energía:
- Diagnóstico y servicio a **aire acondicionado automotriz** · Servicio a **vehículos híbridos**.

Trayectos técnicos (especialización): climatización · carrocerías · generación (solar/eólica) · motocicletas · equipos industriales.

> Cruce con la **Guía de Equipamiento CONALEP**: consola de inyección, prototipo de ignición
> en 3 fases, banco didáctico de diésel, análisis de gases de escape, cierre centralizado,
> pre/post-calentamiento diésel. Estos son *exactamente* los sistemas que ya modelan (o deben
> modelar) los labs de mecánica iframe-3D.

---

## 4. Dominios de simulación — la vista que importa para la plataforma

Esta es la síntesis central. Colapsando el inventario de las 6 carreras, las necesidades
técnicas se agrupan en **~10 dominios de simulación** (familias de física/motor). Un dominio
bien construido sirve a varias carreras. Para cada uno se declara: **qué fenómeno se modela**,
**qué carreras lo exigen**, y el **contrato de fidelidad** (qué SÍ debe modelar / qué NO puede
simplificar sin decirlo — el principio anti-"motor con sólo pistones y rotores").

| # | Dominio de simulación | Fenómeno físico núcleo | Carreras que lo exigen |
|---|---|---|---|
| **D1** | **Circuitos CD/CA** | Ley de Ohm, Kirchhoff, RLC, potencia, relevadores | Electrónica, Electricidad, Electromecánica, Mecatrónica, Autotrónica |
| **D2** | **Electrónica analógica** | Semiconductores (diodo, BJT, MOSFET), fuentes reguladas, amplificadores, filtros | Electrónica, Mecatrónica |
| **D3** | **Electrónica digital y lógica programable** | Compuertas, álgebra booleana, **PLC**, **microcontroladores**, embebidos, escalera (ladder) | Electrónica, Mecatrónica, Electricidad, Electromecánica |
| **D4** | **Neumática / hidráulica y electro-fluidos** | Presión, caudal, fuerza, cilindros, válvulas, simbología **ISO 1219** | Mecatrónica, Electromecánica, Autotrónica (frenos/suspensión) |
| **D5** | **Máquinas eléctricas rotativas** | Motores/generadores CA-CD, transformadores, curva par-velocidad, deslizamiento, bobinados | Electricidad, Electromecánica, Mecatrónica |
| **D6** | **Motor de combustión interna** | Ciclos Otto/Diésel, inyección, ignición, tiempos, gases de escape | Autotrónica, Automotriz |
| **D7** | **Dinámica del vehículo** | Frenado/**ABS**, suspensión, dirección, transmisión (relaciones, par) | Autotrónica, Automotriz |
| **D8** | **Manufactura y mecanismos** | Torno/fresa, **CNC** (código G), **robótica** (cinemática), mecanismos, transmisión de potencia | Mecatrónica, Electromecánica |
| **D9** | **Térmica y energía** | Refrigeración (ciclo), aire acondicionado, transferencia de calor, **fotovoltaica** | Electromecánica, Electricidad, Autotrónica |
| **D10** | **Instrumentación y diagnóstico** | Metrología dimensional/eléctrica, multímetro, osciloscopio, **escáner OBD**, códigos DTC | *Todas* |

### Contrato de fidelidad por dominio (regla anti-sobreafirmación)
Cada simulador de un dominio **debe declarar explícitamente** (campos 🔒 de la ficha):
- **Ecuación(es) de gobierno** que sí resuelve (p.ej. D1: Kirchhoff; D5: modelo de la máquina;
  D6: ciclo termodinámico idealizado).
- **Qué NO modela** (p.ej. "el motor no modela detonación ni transferencia de calor a las
  paredes"; "el circuito asume componentes ideales sin tolerancias").
- **Normatividad** aplicable citada por clave (NOM-018-STPS, ISO 1219, NOM eléctricas, etc.).

Esto convierte la exigencia del cliente ("precisión nivel ingeniería, sin decir que un motor
sólo tiene pistones y rotores") en un **requisito verificable por el experto**, dominio por dominio.

---

## 5. Estado en CEN Labs y huecos (matriz de cobertura — AUDITADA)

Cruce verificado contra el catálogo real (`src/labs/`, auditado 2026-07-08): **50 labs** =
10 física + 10 química + 10 matemáticas + 10 biología (2.5D) + 10 mecánica (iframe-3D). Cada
celda cita el/los lab(s) que la sustentan, para que el estado sea trazable y no una estimación.

> **Hallazgo transversal:** los 10 labs de mecánica están **fuertemente sesgados a autotrónica
> moderna / vehículo eléctrico** (PMSM, inversor, carga EV, BMS, EPS, ABS, inyección) + 2 de
> mecatrónica (robot, PLC). Es una base fuerte y actual, pero deja fuera el tronco "clásico"
> del sector (electricidad industrial, electrónica de dispositivos, manufactura, diagnóstico).

| Dominio | Estado real | Labs que lo cubren hoy | Hueco concreto que falta |
|---|---|---|---|
| D1 Circuitos CD/CA | **Parcial (sólo CD)** | fisica-8 (Ley de Ohm CD), fisica-9 (Electrostática) | **CA/RLC, Kirchhoff multi-malla, potencia y factor de potencia** |
| D2 Electrónica analógica | **Hueco (nivel dispositivo)** | Sólo a nivel *sistema*: mecanica-4 (inversor), mecanica-8 (BMS), mecanica-5 (carga EV) | **Semiconductores (diodo, BJT, MOSFET), fuentes reguladas, amplificadores, filtros** |
| D3 Digital / PLC / microcontrolador | **Parcial (PLC sí)** | mecanica-9 (PLC + neumática) | **Microcontroladores/embebidos y lógica digital (compuertas, booleana, ladder guiado)** |
| D4 Neumática / hidráulica | **Parcial** | mecanica-9 (neumática c/PLC), fisica-5 (prensa hidráulica) | **Electro-hidráulica proporcional, simbología ISO 1219 completa, circuitos secuenciales** |
| D5 Máquinas eléctricas | **Parcial** | mecanica-1 (PMSM), fisica-10 (motor simple) | **Generadores, transformadores, motor de inducción (deslizamiento), curva par-velocidad, bobinados** |
| D6 Motor de combustión | **Sí (gasolina)** | mecanica-2 (4 tiempos), mecanica-6 (inyección) | **Diésel, ciclo termodinámico cuantitativo, análisis de gases de escape** |
| D7 Dinámica del vehículo | **Parcial** | mecanica-7 (ABS), mecanica-10 (EPS) | **Suspensión, transmisión (relaciones/par), tren motriz** |
| D8 Manufactura / CNC / robótica | **Parcial (robótica sí)** | mecanica-3 (brazo robótico 4 ejes) | **CNC (código G), torno/fresa, mecanismos, transmisión de potencia** |
| D9 Térmica / refrigeración / FV | **Parcial (térmica básica)** | fisica-7 (dilatación), tangencial: mecanica-5/8 (térmico EV), quimica-9 (electroquímica) | **Ciclo de refrigeración, aire acondicionado, fotovoltaica** |
| D10 Instrumentación / diagnóstico | **Hueco (disperso, sin lab dedicado)** | Sabor diagnóstico en mecanica-6 (inyección) | **Escáner OBD/DTC, multímetro/osciloscopio como instrumento, metrología dimensional/eléctrica** |

> **Conclusión operativa (revisada tras auditoría).** El catálogo cubre mejor de lo estimado en
> **D3 y D8** (el PLC ya existe en mecanica-9; la robótica en mecanica-3), así que esos dejan de
> ser huecos totales. Los **huecos reales de mayor retorno** son:
> 1. **D2 electrónica analógica a nivel dispositivo** — no existe ningún lab de semiconductores;
>    es núcleo de electrónica y mecatrónica.
> 2. **D10 instrumentación/diagnóstico** — no hay lab dedicado y es habilitador de todas las carreras
>    (especialmente el escáner OBD para autotrónica, que hoy tiene 7 labs pero ninguno de diagnóstico).
> 3. **D1 corriente alterna (CA/RLC)** — sólo existe CD; la CA la piden 5 carreras.
>
> Huecos de segundo orden (profundizar lo que ya hay): D5 (generadores/transformadores/inducción),
> D9 (refrigeración/FV), D6 (diésel).

---

## 6. Cómo cambia la necesidad en nivel superior (TSU e Ingeniería)

El mismo sector existe en tres niveles; **los dominios no cambian, cambia el rigor exigido.**

**Ing. Mecánica (UAEMEX) — mapa curricular real.** Las asignaturas de laboratorio calzan casi
1:1 con los dominios anteriores, pero a nivel cuantitativo/diseño:
- D-mecánica: Mecánica de la partícula, **Estática**, **Dinámica**, **Mecánica de materiales**,
  Mecánica del medio continuo, **Vibraciones mecánicas**, Análisis de mecanismos.
- D1/D2/D3/D5: **Electricidad y magnetismo**, **Circuitos eléctricos**, **Máquinas eléctricas**,
  **Electrónica**, **Control clásico**, **Automatización de procesos industriales**, Instalaciones eléctricas.
- D9: **Termodinámica**, **Ingeniería térmica**, **Transferencia de calor**, **Mecánica de fluidos**,
  Turbomaquinaria, Diseño de equipo térmico.
- D8/D10: **Metrología dimensional**, **Metrología eléctrica y electrónica**, Procesos de manufactura,
  Diseño de elementos de máquinas, Diseño de transmisiones.

**Qué hay que "subir de nivel" para servir a TSU/Ingeniería** (no es otra plataforma, es otra profundidad):
1. **Salidas cuantitativas** — no sólo mostrar el fenómeno, sino reportar valores (par, caída de
   tensión, factor de potencia, esfuerzo, eficiencia del ciclo) con unidades y ecuaciones visibles.
2. **Variación paramétrica** — que el alumno cambie parámetros y el simulador recalcule (barrido,
   sensibilidad), no un escenario fijo.
3. **Tareas de diseño**, no sólo de observación (dimensionar, seleccionar, verificar contra norma).
4. **Trazabilidad a estándares** (NOM/ISO/IEC) y a fuentes de ingeniería (libro/datasheet con página).

> Un simulador construido con el "contrato de fidelidad" del §4 ya nace apto para escalar a
> superior: sólo se exponen más las ecuaciones de gobierno y se abren los parámetros.

---

## 7. Necesidades transversales de producto (restricciones que deben cumplirse)

Salen de leer los subsistemas destino, no del gusto:
1. **Veracidad de ingeniería auditable** — cada lab declara ecuación de gobierno + qué NO modela +
   normatividad; el experto revisa sólo los campos 🔒 (ver ficha en MODELO-PEDAGOGICO §7).
2. **Trazabilidad curricular** — cada lab cita el submódulo oficial que cubre ("cubre Submódulo X
   del programa clave Y"). Es el argumento de venta ante directivos y el gate de pertinencia.
3. **Lenguaje pedagógico del sector** — actividad = verbo observable + objeto técnico específico +
   condiciones + norma; evidencia = producto + desempeño; instrumento = lista de cotejo / guía de
   observación / rúbrica.
4. **Bajo ancho de banda / operable sin laboratorio físico** — relevante si además se entra a
   telebachillerato (ver §8): muchos planteles no tienen laboratorios ni internet garantizado.

---

## 8. Nota sobre otros subsistemas (contexto, no foco de este documento)

Investigación paralela (registrada punto por punto) sobre subsistemas donde la plataforma también
podría entrar, con una **necesidad distinta** a la del sector técnico:

- **Telebachillerato Comunitario (TBC, DGB/SEP)** y **telebachilleratos estatales (p.ej. TEBAEV)**:
  bachillerato **general** en localidades de ≤2,500 hab. Su equipamiento mínimo oficial es aulas,
  mobiliario, un sanitario, luz eléctrica; **internet es "deseable" y el espacio digital
  "prescindible"**, y **no se listan laboratorios**. El MCCEMS les exige el área *Ciencias
  Naturales, Experimentales y Tecnología* con "prácticas de ciencia e ingeniería". → **Dolor real:
  deben enseñar ciencia experimental sin laboratorio.** Oportunidad para simuladores de física/
  química/biología que corran **offline / bajo ancho de banda**. (No es el sector técnico; es
  ciencia general.)
- **Superior (TSU/Ingeniería)**: cubierto en §6.

> Si se decide entrar a telebachillerato, la restricción dura de producto es **operación
> offline y en hardware modesto**; conviene documentarlo antes de comprometer alcance.

---

## 9. Conclusión — qué debe cubrir la plataforma

1. **Un núcleo de 10 dominios de simulación** (§4) cubre las necesidades técnicas de las 6
   carreras del sector. Priorizar por solape entre carreras, no por carrera aislada.
2. **Los huecos de mayor retorno** (confirmados por auditoría del catálogo, §5) son **D2
   electrónica analógica a nivel dispositivo**, **D10 instrumentación/diagnóstico (OBD)** y
   **D1 corriente alterna (CA/RLC)** — núcleo compartido y hoy sin lab dedicado. *Nota: D3 (PLC)
   y D8 (robótica) NO son huecos totales; ya existen (mecanica-9, mecanica-3) y sólo hay que
   profundizarlos.*
3. **Cada simulador debe nacer con contrato de fidelidad** (ecuación de gobierno + qué no modela +
   norma) para sostener "precisión nivel ingeniería" ante expertos.
4. **El mismo motor escala a TSU/Ingeniería** subiendo salidas cuantitativas, variación paramétrica
   y tareas de diseño (§6).
5. **Trazabilidad curricular por submódulo** es el argumento de pertinencia y el criterio de
   priorización de las ≥150 prácticas.

### Siguientes pasos sugeridos
- **(A) ✅ HECHO (2026-07-08)** — Auditado el catálogo real (`src/labs/`, 50 labs). Resultado
  incorporado a §5: D3/D8 ya cubiertos parcialmente; huecos reales = D2, D10, D1-CA.
- **(B)** Elegir **1 dominio hueco de alta prioridad** y hacer **1 lab piloto** con el contrato
  de fidelidad completo, para calibrar profundidad de ingeniería antes de escalar. Candidatos,
  ahora fundados en la auditoría:
  - **D10 escáner OBD / diagnóstico** — máximo apalancamiento: habilita las 6 carreras y da
    sentido a los 7 labs de autotrónica que ya existen (hoy ninguno diagnostica).
  - **D2 electrónica analógica** (fuente regulada o amplificador con diodo/BJT/MOSFET) — cierra
    el hueco más grande de electrónica/mecatrónica.
  - **D1 circuito CA/RLC** — completa el par CD/CA que piden 5 carreras.
- **(C)** Cuando el cliente suelte sus currículas en `docs/curriculas-mecanica/`, cruzarlas contra
  §3–§4 para fijar el subconjunto y el orden de las ≥150.
