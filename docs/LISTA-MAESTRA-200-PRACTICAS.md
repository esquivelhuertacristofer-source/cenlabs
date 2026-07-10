# Lista Maestra — 150 Prácticas Núcleo + 50 Adicionales

> **Estado:** VERIFICADA — contraste curricular, normativo y de benchmarks completado; correcciones de normas aplicadas (ver `VERIFICACION-LISTA-MAESTRA.md`). Autorizada para construcción por tandas.
> **Fecha:** 2026-07-09 · **Verificación:** 2026-07-09
> **Base:** PANORAMA-NECESIDADES-SECTOR.md (los 10 dominios + huecos auditados), MODELO-PEDAGOGICO-SECTOR-MECANICA.md (formato oficial + ficha YAML), ESTANDAR-MOLDE-LAB-3D-MECANICA.md (molde de 2 capas), PLAN-ESCALABILIDAD-200-LABS.md (arquitectura), y las currículas oficiales estudiadas línea por línea.

---

## 1. Fuentes estudiadas (trazabilidad)

| Clave | Programa oficial | Estructura confirmada |
|-------|-----------------|----------------------|
| **MEC** | Mecatrónica SEMS 3071300008-23 | 5 módulos / 13 submódulos |
| **EM** | Electromecánica SEMS-2024 | 5 módulos / 15 submódulos |
| **ELE** | Electricidad CECyTE ED-2022 | 5 módulos / 12 submódulos |
| **ETR** | Electrónica DGETI ED-2022 | 5 módulos / 10 submódulos / 1200 h |
| **AUT-C** | Autotrónica CONALEP Plan 2023 | ~18 servicios + trayectos técnicos TT1 (ABS, suspensión y transmisión electrónicas), TT3 (tablero, accesorios, CAN-BUS), TT6-TT8 |
| **AUT-Y** | Autotrónica CECyTE 2017 (respaldo, 93 pág.) | Módulos: eléctrico/electrónicos · frenos/ABS/suspensión · OBD I-II/ECU · transmisión man/auto/CVT · motores/inyección |
| **UAX** | UAEMEX Ing. Mecánica (mapa curricular) | Circuitos, máquinas eléctricas, electrónica, control, automatización, térmica, fluidos, mecanismos, metrología, transmisiones, sistemas automotrices |
| **TSU** | TSU Automotriz | Diagnóstico y servicio, nivel 5B |

Notación de trazabilidad: `MEC-I.2` = Mecatrónica, Módulo I, Submódulo 2.

## 2. Convenciones

**Molde** (del ESTANDAR-MOLDE + PANORAMA §5):
- **E** — Ensamble/servicio 3D (banco three.js de 2 capas, referencia `ensamble-freno-disco.html`)
- **P** — Panel-instrumento virtual (multímetro, osciloscopio, escáner, manómetros… sobre señales simuladas)
- **S** — Esquemático-simulación numérica (diagrama normalizado IEC 60617 / ISO 1219 / ladder IEC 61131-3 con motor de cálculo)

**Contrato de "máximo nivel"** — TODA práctica cumple:
1. Ecuación(es) de gobierno visibles y calculables en vivo (columna *Física*).
2. Tarea de **diseño o diagnóstico cuantitativo**, no solo observación (verbo observable en el título = actividad clave del formato oficial).
3. Variación paramétrica: el alumno cambia entradas y predice antes de simular.
4. Declaración explícita de **qué NO modela** (regla de honestidad: rangos, jamás cifras inventadas; "consulte el manual del fabricante del modelo específico").
5. Norma citada **por clave solo cuando aplica de verdad**; las prácticas puramente físicas anclan en la ecuación, no en una norma forzada.
6. Doble modo: guiado (bachillerato, apertura/desarrollo/cierre = briefing/simulador/quiz) y de diseño (TSU/Ingeniería, per PANORAMA §6 y mapa UAEMEX).
7. Ficha YAML del MODELO-PEDAGOGICO §7 con campos 🔒 marcados para revisión experta.

**Prioridad por dominio** (de la matriz de cobertura auditada):
- 🔴 **P1 — hueco total:** D2 (semiconductores a nivel dispositivo), D10 (OBD/diagnóstico), D1-CA (solo existe CD en fisica-8)
- 🟠 **P2 — hueco mayor:** D5 (generadores/transformadores/inducción), D9 (refrigeración/FV), D6-diésel
- 🟡 **P3 — cobertura parcial:** D3 (PLC→mecanica-9), D4, D7 (ABS→mecanica-7), D8 (robótica→mecanica-3), D1-CD

## 3. Distribución

| Dominio | Núcleo | Adic. | Prioridad |
|---------|-------:|------:|-----------|
| D1 Circuitos eléctricos CD/CA | 18 | 5 | 🔴 CA / 🟡 CD |
| D2 Electrónica analógica y potencia | 18 | 5 | 🔴 |
| D3 Digital, PLC y microcontroladores | 16 | 5 | 🟡 |
| D4 Neumática e hidráulica | 14 | 4 | 🟡 |
| D5 Máquinas eléctricas | 16 | 5 | 🟠 |
| D6 Motor de combustión | 14 | 5 | 🟠 |
| D7 Dinámica del vehículo y chasis | 14 | 5 | 🟡 |
| D8 Manufactura, CNC, robótica y mecanismos | 14 | 6 | 🟡 |
| D9 Térmica, refrigeración y fotovoltaica | 12 | 5 | 🟠 |
| D10 Instrumentación, diagnóstico y metrología | 14 | 5 | 🔴 |
| **Total** | **150** | **50** | |

---

## D1 — Circuitos eléctricos CD y CA (18 + 5)

| # | ID | Práctica (actividad clave) | Molde | Física de gobierno | Norma ancla | Trazabilidad |
|---|----|---------------------------|-------|--------------------|-------------|--------------|
| 1 | d1-01 | Caracteriza la curva V–I de resistores y valida tolerancias | S+P | V=IR; ajuste por mínimos cuadrados | IEC 60062 (marcado) | ETR-I.1; MEC-I.1 |
| 2 | d1-02 | Resuelve redes multimalla y verifica las leyes de Kirchhoff | S | ΣI=0; ΣV=0; análisis nodal | — | ETR-I.1; ELE-I |
| 3 | d1-03 | Diseña divisores de tensión y corriente considerando el efecto de carga | S | Vo=V·R2/(R1+R2) con RL | — | MEC-I.1 |
| 4 | d1-04 | Obtiene experimentalmente los equivalentes de Thévenin y Norton | S+P | Vth; Rth=Voc/Isc | — | ETR-I.1; UAX Circuitos |
| 5 | d1-05 | Optimiza la transferencia de potencia a una carga | S | Pmáx en RL=Rth; η=50 % | — | UAX Circuitos |
| 6 | d1-06 | Analiza el transitorio RC y mide τ en el osciloscopio | S+P | v(t)=V(1−e^(−t/τ)) | — | ETR-I.1 |
| 7 | d1-07 | Analiza el transitorio RL y la sobretensión inductiva | S+P | v=L·di/dt; diodo volante | — | MEC-I.1 |
| 8 | d1-08 | Diagnostica fallas en circuitos CD: abiertos, cortos y derivas | S+P | Localización por bisección de mediciones | — | ETR-I.2 |
| 9 | d1-09 🔴 | Representa señales senoidales como fasores y mide desfases | S+P | v(t)=Vm·sen(ωt+φ) | — | ELE-II; UAX |
| 10 | d1-10 🔴 | Calcula y mide impedancias RLC serie y paralelo | S+P | Z=R+j(ωL−1/ωC) | — | ELE-II |
| 11 | d1-11 🔴 | Sintoniza la resonancia y caracteriza Q y ancho de banda | S+P | f₀=1/(2π√LC); Q=f₀/Δf | — | ETR-II |
| 12 | d1-12 🔴 | Mide P, Q, S y factor de potencia de cargas reales | S+P | S=P+jQ; FP=cos φ | — | ELE-I; UAX |
| 13 | d1-13 🔴 | Diseña el banco de capacitores para corregir el FP a 0.95 | S | Qc=P(tan φ₁−tan φ₂) | CFE: FP mín. 0.90 (<1 MW), 0.95→0.97 (≥1 MW); Código de Red RES/550/2021 | ELE-III |
| 14 | d1-14 🔴 | Analiza sistemas trifásicos Y/Δ balanceados y verifica secuencia | S+P | VL=√3·VF; P=√3·VL·IL·cos φ | NOM-001-SEDE-2022 | ELE-V; EM-I.2 |
| 15 | d1-15 | Analiza el desbalance trifásico y la corriente por el neutro | S | ΣI fases; intro a componentes simétricas | NOM-001-SEDE-2022 | ELE-V |
| 16 | d1-16 | Dimensiona conductores y protecciones de un circuito derivado | S | Ampacidad; caída ≤3 %: e=2ρLI/S | NOM-001-SEDE-2022 Art. 310 | ELE-I.1–I.2; EM-I.2 |
| 17 | d1-17 | Diseña el sistema de puesta a tierra y mide su resistencia | E+S | Resistividad; método Wenner | NOM-001-SEDE-2022 Art. 250; IEEE 81; NOM-022-STPS-2015 | ELE-I |
| 18 | d1-18 | Coordina protecciones con curvas tiempo-corriente | S | Curvas B/C/D; I²t | IEC 60898; NOM-001-SEDE-2022 | ELE-V.1 |
| A1 | d1-A1 | Mide resistencias de precisión con puente de Wheatstone | S+P | Rx=R2·R3/R1; sensibilidad | — | ETR-I.1 |
| A2 | d1-A2 | Cuantifica el THD de cargas no lineales y propone filtrado | S+P | THD=√(ΣVh²)/V1 | IEEE 519 | ELE-III |
| A3 | d1-A3 | Diseña filtros pasivos y traza sus diagramas de Bode | S+P | fc=1/(2πRC); −20 dB/déc | — | ETR; MEC-I |
| A4 | d1-A4 | Balancea las fases de un tablero de distribución | S | Reparto de cargas por fase | NOM-001-SEDE-2022 | ELE-I.2 |
| A5 | d1-A5 | Interpreta el diagrama unifilar de una subestación compacta | S | Unifilar; TC/TP; enlace | NOM-001-SEDE-2022 (media tensión) | ELE-V.2 |

## D2 — Electrónica analógica y de potencia (18 + 5) 🔴

| # | ID | Práctica (actividad clave) | Molde | Física de gobierno | Norma ancla | Trazabilidad |
|---|----|---------------------------|-------|--------------------|-------------|--------------|
| 1 | d2-01 | Caracteriza la curva I–V del diodo y ajusta el modelo exponencial | S+P | I=Is(e^(V/nVT)−1); recta de carga | — | MEC-I.2; ETR-I.2 |
| 2 | d2-02 | Construye rectificadores de media y onda completa y mide el rizado | S+P | Vr≈I/(fC); PIV | — | ETR-I.2; EM-I.3 |
| 3 | d2-03 | Diseña reguladores Zener y evalúa la regulación línea/carga | S+P | Iz mín/máx; % regulación | — | ETR-I.2 |
| 4 | d2-04 | Integra una fuente lineal completa a especificación | S+P | Cadena trafo→rect→filtro→78xx; disipación | — | ETR-I.2 |
| 5 | d2-05 | Polariza LED y diodos especiales (Schottky, TVS) | S+P | R=(Vs−Vf)/If | — | MEC-I.2 |
| 6 | d2-06 | Establece y estabiliza el punto Q de un BJT | S+P | IC=βIB; divisor de base; estabilidad térmica | — | MEC-I.2; ETR-I.2 |
| 7 | d2-07 | Conmuta cargas inductivas con BJT y diodo volante | S+P | Saturación; v=L·di/dt | — | EM-I.3 |
| 8 | d2-08 | Mide ganancia e impedancias de un amplificador emisor común | S+P | Av=−gm·RC; recorte | — | ETR-I.2 |
| 9 | d2-09 | Caracteriza el MOSFET y su driver de compuerta | S+P | ID=k(VGS−Vth)²; carga de compuerta Qg | — | MEC-I.2 |
| 10 | d2-10 | Evalúa pérdidas de un MOSFET de potencia en PWM | S+P | Pcond=I²·RDS(on); Psw=½VI·fsw(tr+tf) | — | MEC-III.1 (liga mecanica-4) |
| 11 | d2-11 | Diseña amplificadores inversor y no inversor con op-amp | S+P | Av=−Rf/Ri; producto GBW | — | ETR-I.2 |
| 12 | d2-12 | Aplica comparadores con histéresis (Schmitt) | S+P | VTH/VTL; anti-rebote analógico | — | MEC-I.2 |
| 13 | d2-13 | Genera temporizaciones y oscilaciones con el 555 | S+P | f=1.44/((RA+2RB)C) | — | ETR-I.2 |
| 14 | d2-14 | Diseña filtros activos Sallen-Key de 2.º orden | S+P | fc; Q; respuesta Butterworth | — | ETR-II.1 |
| 15 | d2-15 | Diseña un convertidor buck y selecciona L y C | S+P | D=Vo/Vin; ΔIL=Vo(1−D)/(L·f) | — | MEC-III.1 |
| 16 | d2-16 | Analiza boost/flyback y los modos CCM/DCM | S+P | Vo=Vin/(1−D) | — | MEC-III.1 |
| 17 | d2-17 | Acondiciona un puente de galgas con amplificador de instrumentación | S+P | Vo=G·ΔV; CMRR | — | MEC-III.3 |
| 18 | d2-18 | Dimensiona la etapa de salida clase AB y su disipador | S+P | Distorsión de cruce; Tj=Ta+P·ΣRθ | JEDEC JESD51 (Rθ) | ETR-II.1 |
| A1 | d2-A1 | Aísla señales con optoacopladores y valida el CTR | S+P | CTR=IC/IF; degradación | — | ETR |
| A2 | d2-A2 | Controla potencia CA por ángulo de fase con SCR/TRIAC | S+P | Vrms(α); dv/dt; snubber | — | MEC-III.1; ELE-III.2 |
| A3 | d2-A3 | Compara MOSFET vs IGBT en conmutación de potencia | S+P | Pérdidas vs fsw; corriente de cola | — | MEC-III.1 |
| A4 | d2-A4 | Acondiciona sensores analógicos: NTC, LM35, LDR | S+P | Steinhart–Hart; linealización | — | MEC-III.3 |
| A5 | d2-A5 | Realiza el diseño térmico completo de un semiconductor | S+P | Tj=Ta+P(Rθjc+Rθcs+Rθsa) | JEDEC JESD51 | ETR |

## D3 — Digital, PLC y microcontroladores (16 + 5)

| # | ID | Práctica (actividad clave) | Molde | Física de gobierno | Norma ancla | Trazabilidad |
|---|----|---------------------------|-------|--------------------|-------------|--------------|
| 1 | d3-01 | Sintetiza funciones lógicas y simplifica con Karnaugh | S | SOP/POS; costo en compuertas | — | MEC-I.3; ETR-I.2 |
| 2 | d3-02 | Implementa mux, decodificadores y display de 7 segmentos | S | Tablas de verdad; habilitación | — | MEC-I.3 |
| 3 | d3-03 | Construye sumadores y comparadores binarios | S | Acarreo; complemento a 2 | — | MEC-I.3 |
| 4 | d3-04 | Diseña contadores síncronos módulo N | S | Tablas de excitación JK/D | — | MEC-I.3; ETR |
| 5 | d3-05 | Aplica registros de desplazamiento a conversión serie/paralelo | S | SIPO/PISO; diagrama de tiempos | — | ETR |
| 6 | d3-06 | Diseña una máquina de estados para un proceso industrial | S | Moore/Mealy; diagrama de estados | — | MEC-I.3 |
| 7 | d3-07 | Programa arranque-paro con sello y enclavamientos en ladder | S | Lógica de contactos | IEC 61131-3 | MEC-III.2; EM-IV.2; ELE-III.3; ETR-III.1 |
| 8 | d3-08 | Programa temporizadores y contadores en secuencias | S | TON/TOF/CTU | IEC 61131-3 | MEC-III.2 |
| 9 | d3-09 | Programa el arranque estrella-delta temporizado | S | Transición Y→Δ; enclavamiento | IEC 61131-3; IEC 60947-4-1 | ELE-III.3; EM-IV.2 |
| 10 | d3-10 | Secuencia cilindros neumáticos desde PLC con GRAFCET | S | A+B+B−A−; etapas/transiciones | IEC 60848; IEC 61131-3 | MEC-III.2 (liga mecanica-9) |
| 11 | d3-11 | Escala señales analógicas 4–20 mA y controla con histéresis | S+P | y=mx+b; banda muerta | Lazo 4–20 mA (ISA) | MEC-III.2; ETR-III.2 |
| 12 | d3-12 | Programa GPIO con antirrebote e interrupciones en un MCU | S | Polling vs ISR; debounce | — | MEC-III.3; ETR-IV.1 |
| 13 | d3-13 | Controla la velocidad de un motor CD por PWM desde MCU | S+P | D=ton/T; valor medio | — | MEC-III.3 |
| 14 | d3-14 | Adquiere sensores con el ADC y analiza la cuantización | S+P | LSB=VREF/2ⁿ; Nyquist | — | MEC-III.3; ETR-IV.1 |
| 15 | d3-15 | Analiza tramas UART, I²C y SPI en el analizador lógico | S+P | Baud; start/stop; ACK | EIA/TIA-232 (niveles) | ETR-IV.1 |
| 16 | d3-16 | Integra un sistema domótico con sensores y actuadores | S | Lógica de escenas; consumos | ISO/IEC 14543 (KNX) | ETR-V.1 |
| A1 | d3-A1 | Diseña pantallas HMI con alarmas y tendencias | S+P | Jerarquía de navegación | ISA-101 | MEC-V.1 |
| A2 | d3-A2 | Aplica bloques de comparación, movimiento y PID en ladder | S | PID discreto | IEC 61131-3 | EM-IV.2 |
| A3 | d3-A3 | Decodifica un encoder incremental en cuadratura | S+P | Resolución ×4; sentido de giro | — | MEC-III.3 |
| A4 | d3-A4 | Analiza tramas Modbus RTU y diagnostica la red | S+P | CRC-16; función 03 | Espec. Modbus | ETR-V.2 |
| A5 | d3-A5 | Genera señales con DAC y filtro de reconstrucción | S+P | Escalera; imágenes espectrales | — | ETR-IV |

## D4 — Neumática e hidráulica (14 + 4)

| # | ID | Práctica (actividad clave) | Molde | Física de gobierno | Norma ancla | Trazabilidad |
|---|----|---------------------------|-------|--------------------|-------------|--------------|
| 1 | d4-01 | Aplica la ley de Pascal en una prensa hidráulica | E+S | F₂=F₁·A₂/A₁; conservación de volumen | — | MEC-II.3 |
| 2 | d4-02 | Calcula fuerza, velocidad y consumo de un cilindro neumático | S | F=P·A−Fr; Q=A·v | ISO 1219-1 | MEC-II.3; EM-V.1 |
| 3 | d4-03 | Identifica válvulas direccionales y arma mandos básicos | S | 3/2, 5/2; pilotajes | ISO 1219-1 | MEC-II.3 |
| 4 | d4-04 | Diseña mandos directo e indirecto de cilindros | S | Diagrama espacio-fase | ISO 1219-1 | MEC-II.3 |
| 5 | d4-05 | Implementa lógica neumática Y/O y temporización | S | Válvulas de simultaneidad/selectora | ISO 1219 | MEC-II.3 |
| 6 | d4-06 | Resuelve secuencias multicilindro por método cascada | S | Grupos; líneas de mando | ISO 1219 | MEC-II.3 |
| 7 | d4-07 | Integra circuitos electroneumáticos con relevadores | S | Diagrama eléctrico + neumático | IEC 60617 + ISO 1219 | MEC-II.3; EM-V.1 |
| 8 | d4-08 | Dimensiona un sistema de vacío para pick&place | E+S | F=ΔP·A/n; factor de seguridad | — | MEC-IV.2 |
| 9 | d4-09 | Configura la unidad FRL y evalúa la calidad del aire | E+S | Presión regulada; clases de pureza | ISO 8573-1 | EM-V.1 |
| 10 | d4-10 | Caracteriza la curva P–Q de una bomba hidráulica | S+P | Ph=p·Q; η volumétrica/total | ISO 4413 | EM-V.1 |
| 11 | d4-11 | Ajusta válvulas limitadoras y reguladoras de caudal | S | Velocidad del actuador; meter-in/out | ISO 4413 | EM-V.1 |
| 12 | d4-12 | Controla cargas negativas con válvula de contrabalance | S | Presión inducida | ISO 4413 | EM-V.1 |
| 13 | d4-13 | Analiza una transmisión hidrostática bomba-motor | S | T=Δp·D/2π | — | EM-II.3 |
| 14 | d4-14 | Opera válvulas proporcionales con rampas y consignas | S+P | Histéresis; banda muerta | ISO 4413 | MEC-II.3 |
| A1 | d4-A1 | Dimensiona un acumulador y su precarga de N₂ | S | p₁V₁ⁿ=p₂V₂ⁿ | ISO 4413 | EM-V.1 |
| A2 | d4-A2 | Calcula pérdidas de carga y selecciona conducciones | S | Darcy–Weisbach; número de Reynolds | — | UAX Fluidos |
| A3 | d4-A3 | Audita fugas y eficiencia de una red de aire comprimido | S | Caudal de fuga; costo kWh/m³ | ISO 8573 | EM-V.1 |
| A4 | d4-A4 | Posiciona un actuador hidráulico en lazo cerrado | S+P | PID; error en régimen permanente | — | MEC-III |

## D5 — Máquinas eléctricas (16 + 5) 🟠

| # | ID | Práctica (actividad clave) | Molde | Física de gobierno | Norma ancla | Trazabilidad |
|---|----|---------------------------|-------|--------------------|-------------|--------------|
| 1 | d5-01 | Determina la relación y polaridad de un transformador | E+P | a=N₁/N₂; prueba de polaridad | IEC 60076 | ELE-II; EM-I |
| 2 | d5-02 | Obtiene el circuito equivalente por ensayos de vacío y cortocircuito | S+P | Rc, Xm, Req, Xeq; % regulación; η | IEC 60076 | ELE-II; UAX Máquinas |
| 3 | d5-03 | Conecta bancos trifásicos y grupos vectoriales | S | Dyn11; desfase de 30° | IEC 60076-1 | ELE-V |
| 4 | d5-04 | Controla par y velocidad de un motor de CD | E+S | T=KΦIa; Ea=KΦω | — | ELE-II.1 |
| 5 | d5-05 | Caracteriza generadores de CD y su curva de magnetización | S+P | Autoexcitación; resistencia crítica | — | ELE-II.2 |
| 6 | d5-06 | Mide el deslizamiento y traza la curva par-velocidad del motor de inducción | E+S | s=(ns−n)/ns; Tmáx | IEEE 112; IEC 60034 | ELE-II.1; EM-II.1 |
| 7 | d5-07 | Compara métodos de arranque y sus corrientes de irrupción | S+P | Y-Δ: I/3 y T/3; autotransformador | IEC 60947-4-1; NEMA ICS | ELE-III; EM-IV.1 |
| 8 | d5-08 | Deriva el circuito equivalente del motor de inducción por ensayos | S+P | Vacío + rotor bloqueado | IEEE 112 | UAX Máquinas |
| 9 | d5-09 | Interpreta placas de datos y selecciona motores | S | FS; letra de código; clases IE | NOM-016-ENER-2025; NEMA MG-1 | EM-II.1 |
| 10 | d5-10 | Diagnostica motores monofásicos de fase partida y capacitor | E+S | Par de arranque; devanado auxiliar | — | ELE-II.1 |
| 11 | d5-11 | Sincroniza un alternador a la red | S+P | Igualdad de V, f, secuencia y fase | IEC 60034 | ELE-II.2 |
| 12 | d5-12 | Opera el motor síncrono como compensador de FP | S+P | Curvas V; sobreexcitación | — | UAX Máquinas |
| 13 | d5-13 | Controla un motor de inducción con variador V/f | S+P | V/f=cte; rampas; par constante | — | EM-IV; MEC-III.1 |
| 14 | d5-14 | Analiza la conmutación de un PMSM/BLDC | S+P | Six-step; back-EMF | — | Extiende mecanica-1 |
| 15 | d5-15 | Cablea la inversión de giro con contactores y enclavamiento | E+S | Contactores; relevador térmico | IEC 60947-4-1 | EM-IV.1; ELE-III.1 |
| 16 | d5-16 | Compara frenados dinámico, regenerativo y a contracorriente | S+P | Energía disipada/recuperada | — | ELE-II (liga mecanica-8) |
| A1 | d5-A1 | Mide con TC y TP en media tensión | S+P | Relaciones; burden; clase de exactitud | IEC 61869 | ELE-V.2 |
| A2 | d5-A2 | Caracteriza el motor universal | S+P | Par en CA y CD | — | ELE-II |
| A3 | d5-A3 | Prueba aislamientos con megóhmetro e índice de polarización | E+P | IP=R₁₀/R₁ | IEEE 43 | EM-II.2 |
| A4 | d5-A4 | Diagnostica máquinas por espectro de vibraciones | S+P | Componentes 1×, 2×; bandas laterales | ISO 20816 | EM-II.2 |
| A5 | d5-A5 | Balancea un rotor en uno y dos planos | E+S | Vectores de prueba | ISO 21940 | EM-II.2 |

## D6 — Motor de combustión y tren motriz térmico (14 + 5) 🟠

| # | ID | Práctica (actividad clave) | Molde | Física de gobierno | Norma ancla | Trazabilidad |
|---|----|---------------------------|-------|--------------------|-------------|--------------|
| 1 | d6-01 | Analiza el ciclo Otto y su eficiencia vs relación de compresión | S+P | η=1−r^(1−γ); diagrama P-V | — | AUT-Y motores; UAX Termo |
| 2 | d6-02 | Contrasta el ciclo Diésel y el autoencendido | S+P | η(r, rc); retardo de ignición | — | AUT-C diésel |
| 3 | d6-03 | Sincroniza la distribución y verifica la puesta a punto | E | Marcas; traslape; interferencia | Manual del fabricante (rangos) | AUT-Y motores (liga mecanica-2) |
| 4 | d6-04 | Diagnostica el sellado con pruebas de compresión y fugas | E+P | % de fuga; compresión relativa | — | AUT-Y motores |
| 5 | d6-05 | Evalúa el circuito de lubricación y sus presiones | E+S | Viscosidad; lubricación hidrodinámica | SAE J300 | AUT-C lubricación |
| 6 | d6-06 | Balancea térmicamente el sistema de enfriamiento | E+S | Q=ṁ·cp·ΔT; termostato | — | AUT-C enfriamiento |
| 7 | d6-07 | Mide pulsos de inyección y corrige mezcla con lambda | P+S | AFR 14.7:1; λ; ancho de pulso | — | AUT-Y inyección (liga mecanica-6) |
| 8 | d6-08 | Interpreta formas de onda de los sensores del motor | P | MAP/MAF/TPS/CKP/CMP/O₂ | — | AUT-Y electrónicos |
| 9 | d6-09 | Diagnostica el encendido en sus tres fases | P | Dwell; kV de demanda; tiempo de quemado | — | AUT-C ignición |
| 10 | d6-10 | Analiza gases de escape y aprueba la verificación | P+S | CO, HC, NOx, λ; límites | NOM-041/047-SEMARNAT; NOM-167-SEMARNAT-2017 | AUT-C gases |
| 11 | d6-11 | Evalúa la eficiencia del catalizador con O₂ pre/post | P+S | Conversión; oscilación de λ | NOM-047-SEMARNAT; NOM-167-SEMARNAT-2017 | AUT-C gases |
| 12 | d6-12 | Diagnostica el common-rail diésel y el precalentamiento | P+S | Presión de riel; bujías incandescentes | — | AUT-C diésel |
| 13 | d6-13 | Opera la sobrealimentación: turbo, wastegate e intercooler | E+S | Relación de presiones; mapa del compresor | — | AUT-Y motores |
| 14 | d6-14 | Mide par y potencia en dinamómetro y corrige a norma | S+P | P=T·ω; factor de corrección | SAE J1349 | UAX; TSU |
| A1 | d6-A1 | Diagnostica el sistema de arranque por caídas de tensión | E+P | Caídas parciales; corriente de arranque | SAE J537 | AUT-C arranque |
| A2 | d6-A2 | Evalúa el sistema de carga y su regulación | E+P | Curva del alternador; rizado de diodos | — | AUT-C carga |
| A3 | d6-A3 | Analiza el EGR y su efecto en NOx | S | % EGR; temperatura de combustión | — | AUT-C gases |
| A4 | d6-A4 | Estudia la distribución variable (VVT) | S+P | Avance de leva; traslape variable | — | AUT-Y motores |
| A5 | d6-A5 | Compara la inyección directa GDI vs MPI | S | Presiones; carga estratificada | — | AUT-Y inyección |

## D7 — Dinámica del vehículo y chasis (14 + 5)

| # | ID | Práctica (actividad clave) | Molde | Física de gobierno | Norma ancla | Trazabilidad |
|---|----|---------------------------|-------|--------------------|-------------|--------------|
| 1 | d7-01 | Dimensiona el circuito hidráulico de frenos y su reparto | E+S | p=F/A; par de frenado | FMVSS 135 | AUT-Y frenos (liga freno-disco) |
| 2 | d7-02 | Da servicio a frenos de tambor y su autoenergización | E | Factor de freno; autoajuste | ECE R13 | AUT-Y frenos |
| 3 | d7-03 | Analiza el ciclo de control del ABS sobre la curva μ-deslizamiento | S+P | λ=(v−ωr)/v; μ(λ) | ECE R13-H; NOM-194-SE-2021 | AUT-Y frenos S2 (liga mecanica-7) |
| 4 | d7-04 | Evalúa el EBD y la transferencia de carga en frenado | S | ΔFz=m·a·h/L | — | AUT-Y frenos |
| 5 | d7-05 | Simula el ESC y el momento de guiñada correctivo | S | Mz; sensores de yaw y volante | FMVSS 126; NOM-194-SE-2021 | AUT-C TT1 |
| 6 | d7-06 | Modela la suspensión de ¼ de vehículo | S+P | mẍ+cẋ+kx=F; ζ; fn | ISO 2631 (confort) | AUT-Y suspensión |
| 7 | d7-07 | Diagnostica una suspensión electrónica adaptativa | E+S | Amortiguamiento variable | — | AUT-C TT1-5.º |
| 8 | d7-08 | Ajusta la geometría de dirección: Ackermann y alineación | E+S | cot δo−cot δi=t/L; camber/caster/toe | Especif. del fabricante | AUT-Y suspensión |
| 9 | d7-09 | Analiza la asistencia de una dirección EPS | S+P | Par de asistencia; mapas por velocidad | — | AUT-C dirección (liga mecanica-10) |
| 10 | d7-10 | Calcula relaciones y flujos de par en la transmisión manual | E+S | i=ω_in/ω_out; T·i·η | — | AUT-Y transmisión |
| 11 | d7-11 | Analiza el convertidor de par y los trenes planetarios | E+S | Multiplicación; fórmula de Willis | — | AUT-Y transmisión |
| 12 | d7-12 | Estudia la CVT y su relación continuamente variable | S | Radio efectivo de poleas | — | AUT-Y transmisión (man/auto/CVT) |
| 13 | d7-13 | Resuelve la cinemática del diferencial en curva | E+S | ω_ext>ω_int; deslizamiento limitado | — | AUT-Y transmisión |
| 14 | d7-14 | Caracteriza el neumático: deriva, presión y designación | S | Fy=Cα·α; código de medida | ISO 4000 | AUT-C; TSU |
| A1 | d7-A1 | Cuantifica la transferencia de peso longitudinal | S | ΔFz=m·a·h/L; reparto óptimo | — | UAX dinámica |
| A2 | d7-A2 | Estima el arrastre aerodinámico y la potencia requerida | S | F=½ρCdAv² | SAE J1263 | UAX |
| A3 | d7-A3 | Diagnostica la transmisión electrónica y sus solenoides | P+S | Patrones de cambio; TCM | — | AUT-C TT1-6.º |
| A4 | d7-A4 | Compara arquitecturas híbridas serie/paralelo | S | Flujos de potencia; power-split | SAE J1711 | AUT-C (híbridos) |
| A5 | d7-A5 | Analiza la dinámica básica de la motocicleta | S | Estabilidad; frenada combinada | — | AUT-C TT (motocicletas) |

## D8 — Manufactura, CNC, robótica y mecanismos (14 + 6)

| # | ID | Práctica (actividad clave) | Molde | Física de gobierno | Norma ancla | Trazabilidad |
|---|----|---------------------------|-------|--------------------|-------------|--------------|
| 1 | d8-01 | Programa parámetros de corte en torno convencional | E+S | Vc=πDN; Ra vs avance | ISO 3685 | EM-III.1 |
| 2 | d8-02 | Ejecuta fresado periférico y frontal con MRR controlado | E+S | MRR=ae·ap·vf | — | EM-III.1 |
| 3 | d8-03 | Selecciona la herramienta y predice su vida útil | S | Taylor: V·Tⁿ=C | ISO 3685 | EM-III |
| 4 | d8-04 | Programa un ciclo de cilindrado en torno CNC | S+P | Código G; G71/G01 | ISO 6983 | EM-III.2 |
| 5 | d8-05 | Programa interpolaciones lineales y circulares en fresadora CNC | S+P | G02/G03; absoluto/incremental | ISO 6983 | EM-III.2 |
| 6 | d8-06 | Aplica compensación de herramienta y offsets | S+P | G41/G42; corrección por desgaste | ISO 6983 | EM-III.2 |
| 7 | d8-07 | Genera trayectorias CAM a partir del plano | S | Postproceso; sobrematerial | — | MEC-IV.1 |
| 8 | d8-08 | Ajusta parámetros de soldadura SMAW/GMAW | E+P | Calor aportado=V·I/v | AWS D1.1; AWS A2.4 | EM-III.3 |
| 9 | d8-09 | Diseña uniones atornilladas y soldadas de estructuras | S | Cortante; garganta efectiva | AWS D1.1 | EM-III.3 |
| 10 | d8-10 | Analiza un mecanismo de 4 barras y el criterio de Grashof | S | s+l≤p+q; ángulo de transmisión | — | MEC-II.2; UAX mecanismos |
| 11 | d8-11 | Sintetiza perfiles de levas para un ciclo de movimiento | S | Diagramas SVAJ; jerk finito | — | MEC-II.2 |
| 12 | d8-12 | Calcula trenes de engranes simples y compuestos | E+S | mG=∏N; módulo; interferencia | ISO 6336 (conceptos) | EM-II.3; UAX transmisiones |
| 13 | d8-13 | Resuelve la cinemática directa de un robot de 3 GDL | E+S | Parámetros DH | ISO 10218 | MEC-IV.2 (liga mecanica-3) |
| 14 | d8-14 | Programa un pick&place punto a punto | E+S | Trayectorias; zonas de seguridad | ISO 10218 | MEC-IV.2 |
| A1 | d8-A1 | Resuelve la cinemática inversa de un brazo 2R | S | cos θ₂=(x²+y²−l₁²−l₂²)/2l₁l₂ | — | MEC-IV.2 |
| A2 | d8-A2 | Aplica tolerancias y ajustes del sistema ISO | S | Agujero base; H7/g6 | ISO 286 | EM-III.1; UAX |
| A3 | d8-A3 | Interpreta GD&T en un plano de fabricación | S | Posición; condición máxima de material | ASME Y14.5 | UAX |
| A4 | d8-A4 | Optimiza parámetros de impresión 3D FDM | E+S | Anisotropía; % de relleno | ISO/ASTM 52900 | MEC-IV.1 |
| A5 | d8-A5 | Balancea una celda de manufactura flexible | S | Tiempo takt; cuello de botella | — | MEC-IV.1; MEC-V.1 |
| A6 | d8-A6 | Selecciona transmisiones por banda y cadena | S | Relación; tensiones; potencia nominal | — | EM-II.3 |

## D9 — Térmica, refrigeración, A/C y fotovoltaica (12 + 5) 🟠

| # | ID | Práctica (actividad clave) | Molde | Física de gobierno | Norma ancla | Trazabilidad |
|---|----|---------------------------|-------|--------------------|-------------|--------------|
| 1 | d9-01 | Traza el ciclo de refrigeración en el diagrama P-h | S+P | COP=qL/w; entalpías | ASHRAE 34 | EM-V.2 |
| 2 | d9-02 | Ajusta el sobrecalentamiento y el subenfriamiento | S+P | SH=T_succión−T_evap | — | EM-V.2 |
| 3 | d9-03 | Relaciona presión-temperatura de refrigerantes | S+P | Tablas P-T; GWP; R-134a→R-1234yf | ASHRAE 34; Enmienda de Kigali | EM-V.2 |
| 4 | d9-04 | Diagnostica fallas con el manómetro de manifold | P | Patrones presión alta/baja vs falla | — | EM-V.2 |
| 5 | d9-05 | Da servicio completo al A/C automotriz | E+P | Ciclo; embrague del compresor; carga | SAE J639 | AUT-C A/C |
| 6 | d9-06 | Calcula las cargas térmicas de un espacio refrigerado | S | Q=U·A·ΔT + infiltraciones | — | EM-V.2 |
| 7 | d9-07 | Evalúa una bomba de calor y su COP | S | COP_cal=COP_frío+1 | NOM-023-ENER-2018 (minisplit reversible no-inverter) | ELE-IV |
| 8 | d9-08 | Modela conducción, convección y radiación en serie | S | q=ΔT/ΣR térmica | — | UAX transferencia |
| 9 | d9-09 | Caracteriza la curva I-V de un panel fotovoltaico | S+P | Punto de máxima potencia; efecto de G y T | IEC 61215 | EM-V.3; ELE-IV.3 |
| 10 | d9-10 | Dimensiona un sistema FV autónomo | S | Horas solar pico; banco Ah; MPPT | NOM-001-SEDE-2022 Art. 690 | EM-V.3 |
| 11 | d9-11 | Configura un sistema FV interconectado a red | S | Inversor grid-tie; anti-isla | NOM-001-SEDE-2022 Art. 690; IEC 62109 | ELE-IV.3 |
| 12 | d9-12 | Diseña la iluminación de un local por método de lúmenes | S | E=Φ·CU·FM/A | NOM-025-STPS | ELE-IV.1 |
| A1 | d9-A1 | Evalúa un calentador solar de agua | S | Eficiencia del colector; balance | NMX-ES-001-NORMEX | ELE-IV.3 |
| A2 | d9-A2 | Resuelve procesos en la carta psicrométrica | S+P | HR; bulbo húmedo; mezcla de aire | ASHRAE Handbook | UAX aire acond. |
| A3 | d9-A3 | Dimensiona una cámara frigorífica y su aislamiento | S | Espesor vs condensación superficial | — | EM-V.2 |
| A4 | d9-A4 | Analiza el ciclo Rankine de una planta de vapor | S | η térmico; título de vapor | NOM-020-STPS (recipientes) | UAX generadores de vapor |
| A5 | d9-A5 | Estima la potencia de un aerogenerador | S | P=½ρAv³Cp; límite de Betz | IEC 61400 | ELE-IV.3 |

## D10 — Instrumentación, diagnóstico y metrología (14 + 5) 🔴

| # | ID | Práctica (actividad clave) | Molde | Física de gobierno | Norma ancla | Trazabilidad |
|---|----|---------------------------|-------|--------------------|-------------|--------------|
| 1 | d10-01 | Domina el multímetro: exactitud, resolución y categorías | P | ±(% lectura + dígitos) | IEC 61010-1 (CAT I–IV) | ETR-I.1; AUT-Y eléctrico |
| 2 | d10-02 | Mide corriente con gancho y shunt sin alterar el circuito | P | Efecto de inserción | — | ETR-I.1 |
| 3 | d10-03 | Configura el osciloscopio: base de tiempo, acoplamiento y trigger | P | Vpp; frecuencia; fase | — | ETR-I.1 |
| 4 | d10-04 | Aplica FFT, cursores y sondas atenuadas 10:1 | P | Ancho de banda; aliasing | — | ETR-I.2 |
| 5 | d10-05 | Caracteriza sistemas con el generador de funciones | P | Respuesta en frecuencia | — | ETR-I |
| 6 | d10-06 | Opera el escáner OBD-II: DTC, datos vivos y freeze frame | P | PID; códigos P0xxx | SAE J1979/J1978; ISO 15031 | AUT-Y OBD; AUT-C escáner |
| 7 | d10-07 | Diagnostica un misfire P0300 con árbol de decisión | P+S | Contadores de misfire; modo 06 | SAE J1979 | AUT-Y OBD |
| 8 | d10-08 | Verifica monitores y readiness para la verificación vehicular | P | Ciclos de manejo; OBD I vs II | NOM-167-SEMARNAT-2017 (método SDB); NOM-047-SEMARNAT | AUT-Y OBD S1 |
| 9 | d10-09 | Analiza la trama CAN y diagnostica el bus con osciloscopio | P+S | CAN H/L; arbitraje; terminación 60 Ω | ISO 11898 | AUT-C TT3; AUT-Y ECU |
| 10 | d10-10 | Diagnostica la ECU: alimentaciones, tierras y comunicación | P+S | Pinout; tensiones de referencia | — | AUT-Y ECU S2 |
| 11 | d10-11 | Mide con calibrador Vernier y estima su incertidumbre | E+P | Resolución 0.05 mm; paralaje | — | UAX metrología; EM-III |
| 12 | d10-12 | Mide con micrómetro y comparador: runout y planitud | E+P | Resolución 0.01 mm | — | UAX metrología |
| 13 | d10-13 | Calcula la incertidumbre y verifica la trazabilidad de una medición | S | GUM: uc=√Σu²; k=2 | JCGM 100 (GUM); trazabilidad CENAM | UAX metrología |
| 14 | d10-14 | Mide temperatura con termopar, RTD e infrarrojo | P | Efecto Seebeck; Pt100; emisividad | IEC 60584; IEC 60751 | ETR-I.1 |
| A1 | d10-A1 | Interpreta el tablero de instrumentos y sus testigos | P | Redes del tablero | ISO 2575 (símbolos) | AUT-C TT3 |
| A2 | d10-A2 | Prueba sensores automotrices contra patrones de onda | P | Formas de onda de referencia | — | AUT-Y electrónicos |
| A3 | d10-A3 | Interpreta el análisis de 5 gases para diagnóstico | P+S | Química de combustión; λ calculada | NOM-047-SEMARNAT | AUT-C gases |
| A4 | d10-A4 | Calibra transductores de presión contra patrón | P+S | Histéresis; linealidad | — | UAX metrología |
| A5 | d10-A5 | Aplica celdas de carga y puentes en básculas | P+S | Sensibilidad mV/V | OIML R60 | MEC-III.3 |

---

## 4. Cobertura curricular (verificación inversa)

Cada submódulo profesional de las 5 carreras queda cubierto por ≥1 práctica:

- **MEC I–V:** I.1→d1/d2 · I.2→d2 · I.3→d3 · II.1→d8-07 · II.2→d8-10/11 · II.3→d4 · III.1→d2-10/15, d5-13 · III.2→d3-07..11 · III.3→d3-12..15, d2-17 · IV.1→d8-07/A4/A5 · IV.2→d8-13/14 · V→d3-A1, d8-A5
- **EM I–V:** I→d1-16, d2-07 · II→d5-06/09, d5-A3..A5, d8-12/A6 · III→d8-01..06, d8-08/09 · IV→d5-15, d3-09/A2 · V→d4-09..12, d9-01..06, d9-09..11
- **ELE I–V:** I→d1-16/17, d9-12 · II→d5-04..06, d5-10/11 · III→d5-07/15, d2-A2, d3-07/09 · IV→d9-07/09..12, d9-A1/A5 · V→d1-14/15/18, d1-A5, d5-A1
- **ETR I–V:** I→d10-01..05, d2-01..08 · II→d1-11, d2-14/18 · III→d3-07/11 · IV→d3-12..15, d3-A5 · V→d3-16, d3-A4
- **AUT:** motores→d6-01..06/13 · inyección→d6-07, d6-A5 · ignición→d6-09 · eléctrico→d6-A1/A2 · gases→d6-10/11, d10-A3 · frenos/ABS→d7-01..05 · suspensión→d7-06..08 · dirección→d7-09 · transmisión→d7-10..13, d7-A3 · diésel→d6-02/12 · A/C→d9-05 · OBD/ECU/CAN→d10-06..10 · tablero→d10-A1

## 5. Propuesta de ejecución (a discutir)

**Recomendación: por tandas de 10, tema coherente, orden por prioridad de huecos.**

| Tanda | Contenido | Por qué primero |
|-------|-----------|-----------------|
| T1 | d2-01…d2-10 (semiconductores: diodo→MOSFET) | Hueco total D2; base de toda la electrónica |
| T2 | d10-01…d10-10 (instrumentos + OBD/CAN) | Hueco total D10; los paneles P se reutilizan en D2/D6 |
| T3 | d1-09…d1-18 (CA + instalaciones) | Hueco D1-CA; prerequisito de D5 |
| T4 | d2-11…d2-18 + d5-01/02 (op-amps, fuentes, transformador) | Cierra D2; abre D5 |
| T5+ | D5 → D9 → D6 → D3 → D4 → D7 → D8 → resto D1 → adicionales | Orden P2→P3 |

**Ventajas de la tanda temática:** el framework del molde (paneles de instrumentos, motor de circuitos, escenario 3D) se construye una vez por tema y se amortiza en las 10 prácticas; la revisión científica se hace en bloque con el mismo marco teórico.

**Compuertas antes de la Tanda 1:**
1. **Fases 0–2 del PLAN-ESCALABILIDAD** (~1.5 días: andamiaje + facades + golden tests). Su §10 es explícito: *no arrancar la producción de 200 labs sobre la arquitectura actual*.
2. Confirmar el **molde por tipo**: E ya está estandarizado (freno-disco v3); P y S necesitan su primera implementación de referencia (candidatas: d10-01 multímetro para P, d1-02 Kirchhoff para S) con el mismo estándar de 2 capas (simulador + ficha técnica).

**Alternativa (una por una):** máxima calidad por unidad, pero sin amortización del framework; a ~200 prácticas el costo fijo por lab se multiplica. Solo la recomendaría para las 2 prácticas de referencia de los moldes P y S.
