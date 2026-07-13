# Verificación de la Lista Maestra — 200 Prácticas

> **Fecha:** 2026-07-09
> **Objeto:** `LISTA-MAESTRA-200-PRACTICAS.md` (150 núcleo + 50 adicionales, dominios D1–D10)
> **Mandato:** el usuario delegó la aprobación técnica del temario: *"necesito que realices una investigación exhaustiva y contraste para verificar que son adecuados"*. Este documento es el sustituto formal de esa revisión.
> **Veredicto:** ✅ **ADECUADA** para las pretensiones del proyecto (labs de máximo nivel anclados en las currículas oficiales del sector mecánica-electrónica), **con 7 hallazgos normativos ya corregidos** en la lista.

---

## 1. Metodología

Tres contrastes independientes:

1. **Contraste curricular** — cada cita de trazabilidad (`MEC-III.2`, `ELE-V`, …) se verificó textualmente contra los programas oficiales descargados en `docs/curriculas-mecanica/oficiales-sep/*.txt` (grep línea por línea, no de memoria).
2. **Contraste normativo** — cada norma ancla (NOM, IEC, ISO, SAE, IEEE, ASHRAE…) se investigó vía web para confirmar **vigencia 2026** y **aplicabilidad real** a la práctica que la cita, priorizando fuentes primarias (DOF).
3. **Contraste de benchmarks internacionales** — la cobertura temática se comparó contra los estándares de programas reconocidos: ASE Education Foundation 2024 (automotriz, EE. UU.) y Festo Didactic serie TP (neumática/hidráulica/PLC, referencia industrial global).

## 2. Contraste curricular (fuentes primarias)

Resultado: **cero discrepancias**. Toda cita módulo/submódulo de la lista existe en el programa oficial correspondiente.

| Fuente | Archivo verificado | Evidencia (ubicación en el .txt) |
|--------|--------------------|----------------------------------|
| MEC — Mecatrónica SEMS 3071300008-23 | `mecatronica-sems-2023.txt` | Módulos I–V con sus 13 submódulos confirmados (líneas ~350–371) |
| EM — Electromecánica SEMS-2024 | `electromecanica-sems-2024.txt` | 5 módulos / 15 submódulos (líneas ~342–365; detalle de módulos para prácticas en ~4980–4984) |
| ELE — Electricidad CECyTE ED-2022 | `electricidad-cecyte-2022.txt` | 5 módulos / 12 submódulos (líneas ~369–394) |
| ETR — Electrónica DGETI ED-2022 | `electronica-dgeti-2022.txt` | 5 módulos / 10 submódulos / 1200 h (líneas ~187–206) |
| AUT-C — Autotrónica CONALEP 2023 | `autotronica-conalep-mapa-2023.txt` | Servicios de transmisión, frenos, diésel, A/C, suspensión, dirección, híbridos, ABS, CAN-BUS, motocicletas (líneas ~242–628) |
| AUT-Y — Autotrónica CECyTE 2017 | `autotronica-cecyte-2017.txt` | Inyección electrónica, ABS, OBD I/II, ECU, transmisión man/auto/CVT, encendido |

Además, la **verificación inversa** (§4 de la lista maestra) confirma que todo submódulo profesional de las 5 carreras queda cubierto por ≥1 práctica — no hay submódulo huérfano.

## 3. Contraste normativo — hallazgos y correcciones aplicadas

7 hallazgos; todos ya corregidos en `LISTA-MAESTRA-200-PRACTICAS.md` (2026-07-09).

| # | Hallazgo | Corrección aplicada | Prácticas afectadas | Fuente |
|---|----------|--------------------|--------------------|--------|
| 1 | **NOM-001-SEDE-2022** (DOF 13-mar-2023) sustituyó a la 2012; requisitos de interruptores RCD exigibles desde 2025-01-01; incorpora carga de VE y conserva Art. 690 (FV) | Toda cita `NOM-001-SEDE-2012` / `NOM-001-SEDE` sin año → `NOM-001-SEDE-2022` | d1-14, d1-15, d1-16 (Art. 310), d1-17 (Art. 250), d1-18, d1-A4, d1-A5, d9-10 (Art. 690), d9-11 (Art. 690) | DOF 13-mar-2023 |
| 2 | **NOM-016-ENER-2025** sustituyó a la 2016 (eficiencia de motores trifásicos jaula de ardilla) | `NOM-016-ENER-2016` → `NOM-016-ENER-2025` | d5-09 | DOF 2025 |
| 3 | **NOM-194-SE-2021** (cancela NOM-194-SCFI-2015): ABS y ESC + 25 dispositivos obligatorios en vehículos ligeros nuevos (ESC desde MY2025) — norma mexicana directamente aplicable que faltaba | Añadida junto a ECE R13-H y FMVSS 126 | d7-03 (ABS), d7-05 (ESC) | [DOF](https://www.dof.gob.mx/nota_detalle.php?codigo=5666804) |
| 4 | **NOM-167-SEMARNAT-2017**: método de prueba OBD/SDB obligatorio en la verificación vehicular de la megalópolis (CDMX, EdoMex, Hidalgo, Morelos, Puebla) para vehículos MY2006+ de 400–3857 kg — faltaba en las prácticas de OBD/gases | Añadida | d10-08 (método SDB), d6-10, d6-11 | [DOF](https://dof.gob.mx/nota_detalle.php?codigo=5496105) |
| 5 | **Factor de potencia CFE**: el requisito real es FP ≥ 0.90 (<1 MW) y 0.95 (≥1 MW) que sube a **0.97 después del 8-abr-2026** (Código de Red RES/550/2021; acuerdo CRE A/073/2023 §5.5) — el ancla genérica era imprecisa | Ancla reescrita con los umbrales y el Código de Red | d1-13 | RES/550/2021; A/073/2023 |
| 6 | **NOM-041-SEMARNAT-2015** confirmada **vigente** (límites de emisiones de vehículos a gasolina en circulación); pareo con NOM-047 correcto | Sin cambio (confirmación) | d6-10, d6-11, d10-A3 | [DOF](https://sidof.segob.gob.mx/notas/docFuente/5396063) |
| 7 | **NOM-023-ENER-2018** aplica a minisplit/multisplit **incluido ciclo reversible** (bomba de calor, 1–19 050 Wt) pero **excluye inverter** — se acota el alcance para no sobre-citar | `NOM-023-ENER` → `NOM-023-ENER-2018 (minisplit reversible no-inverter)` | d9-07 | [DOF](https://www.dof.gob.mx/nota_detalle.php?codigo=5531685) |

**Principio aplicado:** norma citada por clave solo cuando aplica de verdad (contrato de máximo nivel, punto 5). Las normas internacionales de ingeniería citadas (IEC 60617/60898/61131-3/60034/61869, ISO 1219/4413/6983/10218/286, SAE J1979/J1349/J639, IEEE 112/43/519, ASHRAE 34, AWS D1.1, ASME Y14.5, JCGM 100/GUM, OIML R60…) son las referencias estándar correctas de cada tema y no tienen sustituciones vigentes que las invaliden para uso didáctico.

## 4. Contraste con benchmarks internacionales

**ASE Education Foundation — 2024 Automobile Program Standards** ([PDF oficial](https://aseeducationfoundation.org/uploads/2024-Automobile-Program-Standards-1.pdf)): sus áreas de tareas mapean sobre la lista sin huecos relevantes para simulación:

| Área ASE 2024 | Cobertura en la lista |
|---------------|----------------------|
| Engine Repair / Engine Performance | D6 completo (d6-01…14 + adicionales) |
| Automatic Transmission / Manual Drive Train | d7-10…13, d7-A3 |
| Brakes | d7-01…05 |
| Suspension & Steering | d7-06…09, d7-14 |
| Electrical/Electronic Systems | d6-A1/A2, d10-06…10, D1/D2 base |
| HVAC | d9-05 (+ ciclo d9-01…04) |

**Festo Didactic — serie TP** (referencia industrial de formación en fluidos/automatización): TP101/102 (neumática básica/avanzada) → d4-01…06; TP201 (electroneumática) → d4-07; hidráulica → d4-10…13; proporcional → d4-14; vacío → d4-08; sensórica/PLC → d3-07…11. **Mapeo uno a uno con D4/D3** — el alcance elegido coincide con el estándar de la industria didáctica.

Conclusión del contraste: la selección temática no es idiosincrática; reproduce las áreas que los dos referentes internacionales consideran esenciales, añadiendo el anclaje normativo mexicano que a ellos les falta.

## 5. Veredicto

1. **Adecuación curricular:** ✔ — 100 % de las citas de trazabilidad verificadas contra fuente primaria; cobertura inversa completa de las 5 carreras.
2. **Rigor normativo:** ✔ tras correcciones — 7 hallazgos detectados y aplicados; la lista cita ahora solo normas vigentes a 2026 y con alcance acotado honestamente.
3. **Nivel internacional:** ✔ — cobertura equivalente o superior a ASE 2024 (automotriz) y Festo TP (fluidos/automatización) en los dominios comparables.

**La lista maestra queda VERIFICADA y autorizada para construcción por tandas**, sujeta a las dos compuertas técnicas del §5 de la propia lista: (1) Fases 0–2 del PLAN-ESCALABILIDAD antes de cualquier lab nuevo, y (2) implementación de referencia de los moldes P (d10-01) y S (d1-02).

**Vigilancia futura:** re-verificar anclas normativas al inicio de cada tanda que las use (las NOM se renuevan; p. ej. el umbral CFE 0.95→0.97 cambia en abr-2026, ya reflejado). Los campos 🔒 de las fichas YAML siguen requiriendo revisión experta humana antes de publicar cada lab.

---

## 6. Re-verificación previa a Tanda 2 (d10-01…d10-10, instrumentos + OBD/CAN)

> **Fecha:** 2026-07-12 · **Método:** 2 investigaciones independientes con fuentes primarias (SAE Mobilus, iso.org — triangulado vía organismos miembro SIS/NEN y catálogos espejo genorma.com cuando iso.org bloqueó fetch directo con 403; DOF/SIDOF para normas mexicanas).

d10-01 (multímetro, IEC 61010-1) y d10-06 (escáner OBD-II) ya existen como `mecanica-12` y `mecanica-11` respectivamente; esta ronda solo cubre las normas que gobiernan los 8 labs nuevos de la tanda (d10-02…d10-05, d10-07…d10-10).

| Norma | Edición asumida | Edición vigente 2026 confirmada | Acción |
|---|---|---|---|
| SAE J1978 | — (faltaba citar) | J1978_202205 | Añadida a la ficha de d10-06 (`mecanica-11`) |
| SAE J1979 | sin año | J1979_202505 (reafirmada, sin cambio técnico) | Sin cambio |
| SAE J2012 | sin año / 2016 | **J2012_202509** | Ficha de d10-06 actualizada con edición explícita |
| SAE J1850 / ISO 9141-2 | legacy | J1850_202212 ("Stabilized", no retirado) / ISO 9141-2:1994+Amd1:1996 (confirmada 2021) | Sin cambio — siguen citables como legacy |
| SAE J1962 | 2016 | J1962_201607 | Sin cambio de fondo |
| ISO 15031-5 / -6 | 2015 | **2015 confirmado vigente**, pero en revisión periódica ISO (stage 90.20) desde 2026-04-15 | Sin cambio ahora; ⚑ añadida en ficha de d10-06 para reverificar en 6–12 meses |
| ISO 15765-4 | 2021 | ISO 15765-4:2021 | Sin cambio |
| **ISO 11898-1** | 2015 (supuesto) | **2024** (ed. 3; la 2015 está retirada) | Usar `ISO 11898-1:2024` al construir d10-09 |
| **ISO 11898-2** | 2016 (supuesto) | **2026** (ed. 4, publicada may-2026, ~7 semanas antes de esta verificación; corrige inconsistencias de figuras de la ed. 2024 detectadas por CiA — valor eléctrico 120 Ω/extremo sin evidencia de cambio) | Usar `ISO 11898-2:2026` al construir d10-09 |
| ISO 11898-3 | 2006 | 2006 (ed. 1, reconfirmada 2026-05-27) | Sin cambio; enmarcar como legacy pedagógico (bus de confort pre-CAN de alta velocidad) en d10-09 |
| NOM-047-SEMARNAT | 2014 | 2014 confirmada | Sin cambio |
| NOM-167-SEMARNAT | 2017 | 2017 confirmada (PROY-NOM-167-SEMARNAT-2023 sigue en consulta pública, no publicado como definitivo) | Sin cambio; vigilar el proyecto 2023 a futuro |
| NOM-041-SEMARNAT | 2015 | 2015 confirmada | Sin cambio |

**Hallazgo relevante:** el par ISO 11898-1/-2 tuvo movimiento normativo real en los últimos ~24 meses (retiros en 2024-03, 2024-05, 2026-03 y 2026-05-21, con nueva edición 11898-2 apenas semanas antes de esta verificación). De haber construido d10-09 con la edición 2016 asumida por defecto, la cita habría quedado obsoleta en dos ediciones. La cifra técnica de terminación (120 Ω ±1 % en cada extremo físico del bus; ≈60 Ω es la resistencia diferencial combinada vista desde cualquier nodo, no un componente instalado) no tiene evidencia de haber cambiado — se usa esa redacción precisa en el lab, no la forma abreviada "terminación 60 Ω".

**Acción aplicada:** norma ancla de d10-09 en `LISTA-MAESTRA-200-PRACTICAS.md` actualizada a `ISO 11898-1:2024 / ISO 11898-2:2026`; ficha de `mecanica-11` (d10-06) actualizada con SAE J1978, edición explícita de J2012, y bandera de revisión periódica ISO 15031-5/-6.

**Veredicto:** ✅ **Tanda 2 (d10-02…d10-10) autorizada para construcción** con las ediciones normativas de la tabla anterior.

---

## 7. Corrección terminológica y normativa d10-02 (pinza + shunt) — previa a `mecanica-24`

> **Fecha:** 2026-07-12 · **Método:** 2 investigaciones independientes con fuentes primarias (datasheets de fabricante — Fluke, Klein, UNI-T, Extech, Kyoritsu, Milwaukee, AEMC, Tektronix, Ohmite, Riedon, Vishay, Isabellenhütte, Eaton —; IEC webstore triangulado vía SIS/NEN/genorma/ANSI/CSA/GlobalSpec; CENAM, TESOEM, UNADM, UNLP; OpenStax College Physics 2e).

d10-02 ("mide corriente con gancho y shunt sin alterar el circuito") no tiene norma curricular en disputa (ETR-I.1 ya verificada en §2), pero la física de gobierno y la norma ancla de la fila original en la lista maestra no estaban verificadas contra literatura real. El mandato exige investigación exhaustiva incluso cuando no hay una norma de cumplimiento externa qué contrastar, así que se investigó a fondo la ingeniería de pinzas amperimétricas y shunts antes de escribir una sola línea del simulador.

| Hallazgo | Verificación | Corrección aplicada |
|---|---|---|
| Física de gobierno | "Efecto de inserción" no está atestiguado en fuentes de metrología en español (choca incluso con jerga no relacionada de producción de audio); el término primario correcto es **"efecto de carga"**, confirmado textualmente por CENAM ("existe un efecto de carga que debe ser considerado") y por TESOEM/UNADM; **"error de inserción"** es un sinónimo aceptado (UNLP y TESOEM lo equiparan explícitamente) | `Efecto de inserción` → `Efecto de carga (error de inserción)` |
| Norma ancla | **IEC 61010-2-032 Ed. 5.0:2023-09-20** ("Particular requirements for hand-held and hand-manipulated current sensors for electrical test and measurement") es la norma de seguridad real y vigente para pinzas de corriente, confirmada en 8 fuentes (IEC webstore directo + SIS/NEN/genorma/ANSI/CSA/GlobalSpec). Hallazgo negativo confirmado por ambas investigaciones: **no existe** norma IEC/IEEE de EXACTITUD para pinzas ni para shunts de propósito general — IEEE C57.13/IEC 61869 solo cubren TCs de instalación fija, IEC 60051 solo cubre accesorios de instrumentos analógicos de bobina móvil; la exactitud de ambos instrumentos es enteramente de hoja de datos del fabricante, igual que un DMM | `—` → `IEC 61010-2-032 (seguridad, pinza) · sin norma de exactitud` |

**Hallazgo relevante (informa el diseño de `mecanica-24`):** una pinza de efecto Hall mide CD y CA (requiere "puesta en cero" antes de CD, para anular offset/campo terrestre); una pinza de transformador de corriente (CT) mide **solo CA**, no por limitación de fabricación sino porque la ley de Faraday (E=−N·dΦ/dt) exige flujo *cambiante* — con CD el secundario del CT simplemente no induce corriente. Pinzar ambos conductores (vivo+neutro) de un circuito CA monofásico cancela casi toda la lectura por ley de Ampère — error clásico documentado verbatim por Fluke y AEMC, y es además el principio de operación de las pinzas/interruptores diferenciales (GFCI/RCD). A diferencia de la pinza (genuinamente no invasiva, cero resistencia insertada), el shunt **sí** perturba el circuito medido — el efecto de carga es una perturbación real y cuantificable, no solo una advertencia cualitativa, y así se modelará en el simulador (ΔI y %error calculados en vivo, no afirmados).

**Fuentes primarias clave:** Fluke y Tektronix (artículos técnicos de "burden voltage" con ejemplos numéricos resueltos); CENAM, TESOEM, UNADM, UNLP (terminología en español); IEC webstore + organismos espejo (61010-2-032); Riedon/Ohmite/Vishay/Isabellenhütte (datasheets de shunt Kelvin de 4 terminales); OpenStax College Physics 2e (física de carga de amperímetro); AEMC (manual de pinza — error de posición/centrado ~0.5 %).

**Acción aplicada:** fila d10-02 de `LISTA-MAESTRA-200-PRACTICAS.md` corregida (columnas "Física de gobierno" y "Norma ancla"; ver §3 para el formato de tabla). La corrección se aplicó ANTES de construir `mecanica-24`, no como parche posterior a un simulador ya escrito con el término impreciso.

**Veredicto:** ✅ terminología y norma ancla de d10-02 verificadas y corregidas; `mecanica-24` (pinza-shunt) autorizado para construcción con esta base.

---

## 8. Verificación de norma ancla y física de gobierno d10-03 (osciloscopio) — previa a la siguiente implementación del molde P

> **Fecha:** 2026-07-12 · **Método:** investigación con fuentes primarias (datasheets de fabricante — Tektronix, Keysight, Rigol, Siglent —; IEC webstore; búsquedas técnicas cruzadas para la física de base de tiempo, acoplamiento, trigger y fasor). Nota metodológica: los dos intentos iniciales de delegar esta investigación a un Agent murieron por límite de sesión antes de producir salida utilizable; se recuperó con búsqueda y fetch directos, con verificación extra de fuente primaria cuando el resumen sintetizado del buscador resultó inconsistente entre consultas casi idénticas (ver hallazgo metodológico abajo).

d10-03 ("configura el osciloscopio: base de tiempo, acoplamiento y trigger") tenía "—" en la columna Norma ancla de la lista maestra. El mandato exige investigar incluso cuando la fila ya dice "sin norma" — igual que en d10-02 (§7), no basta con asumir que el "—" original era correcto.

| Hallazgo | Verificación | Corrección aplicada |
|---|---|---|
| Norma ancla | El osciloscopio digital SÍ tiene una norma de seguridad particular vigente: **IEC 61010-2-030 Ed. 3.0:2023-09-20** ("Particular requirements for equipment having testing or measuring circuits which are connected for test or measurement purposes to devices or circuits outside the measurement equipment itself"), que junto con IEC 61010-1 (ya ancla d10-01) es la base de certificación eléctrica real de osciloscopios comerciales. Confirmado en fuente primaria directa (datasheet Tektronix TBS1000C, sección Regulatory verbatim: UL61010-1 + **UL61010-2-030** + CAN/CSA equivalentes + EN61010-1 + **EN61010-2-030**) y corroborado en 3 fabricantes adicionales (Keysight Infiniium XR8: "IEC 61010-1:2010, AMD1:2016 / IEC 61010-2-030"; Rigol DS7000/DS8000: EN 61010-2-030:2010; Siglent SDS1000X-E/X-U: UL 61010-2-030:2018 + CAN/CSA-C22.2 No. 61010-2-030:2018). Hallazgo negativo confirmado en paralelo: no existe norma IEC/IEEE de EXACTITUD de cumplimiento obligatorio para osciloscopios — IEEE 1057-2017 ("IEEE Standard for Digitizing Waveform Recorders") existe como marco voluntario de especificación y método de prueba para comparar specs entre fabricantes, pero no aparece citado en las secciones de certificación/cumplimiento de los datasheets revisados (a diferencia de 61010-1/-2-030, que sí aparecen ahí); ancho de banda, exactitud vertical y horizontal siguen siendo de hoja de datos del fabricante, usando convenciones de la industria (punto de −3 dB ≈ 70.7 %) sin una norma única que las fije. | `—` → `IEC 61010-1 + IEC 61010-2-030 (seguridad, osciloscopio) · sin norma de exactitud` |

**Hallazgo relevante (informa el diseño del próximo lab):** la física de gobierno que ya listaba la fila ("Vpp; frecuencia; fase") se verificó completa contra fuentes técnicas independientes y no requirió corrección: acoplamiento AC = filtro paso-alto por capacitor en serie con frecuencia de corte típica de **5–10 Hz** (varía por modelo — Tektronix TDS1000B/2000B usan 10 Hz, Rigol 1000Z usa 5 Hz; se redacta como rango, no cifra única, por la regla de honestidad de las fichas), útil solo para señales por encima de ese corte; DC = acoplamiento directo, muestra la señal completa incluida su componente de CD; GND = desconecta la entrada y muestra la referencia de 0 V. Los tres modos de trigger (Auto/Normal/Single) y su nivel/pendiente se confirmaron: Normal solo dispara si se cumple la condición (si no, pantalla congelada/vacía); Auto fuerza un barrido periódico aunque no se cumpla la condición (útil para confirmar presencia de señal); Single dispara una sola vez y requiere rearme manual — sin disparo estable, el punto de inicio del barrido varía cada ciclo y la onda "camina" en pantalla en vez de verse estacionaria. Las relaciones Vpp = 2×Vpico y Vrms = Vpico×0.707 (=Vpico/√2) para onda senoidal, y la fórmula de fase Δφ° = 360°×(Δt/T) por cruces por cero equivalentes, se confirmaron sin discrepancias.

**Decisión de enrutamiento normativo:** se identificó también **IEC 61010-031 Ed. 3.0:2022** ("Safety requirements for hand-held and hand-manipulated probe assemblies for electrical test and measurement") como la norma particular que gobierna las PUNTAS/sondas del osciloscopio (categoría CAT de la sonda), distinta del instrumento mismo. No se encontró un datasheet de sonda específica que la cite textualmente (a diferencia de 61010-2-030, verificado en 4 fabricantes de instrumento), así que se trata como hallazgo de catálogo oficial IEC/ANSI, no de fuente primaria de producto — y se reserva para **d10-04** ("aplica FFT, cursores y **sondas atenuadas 10:1**"), donde la sonda es el objeto de estudio explícito, en vez de citarla aquí donde el objeto es el instrumento (base de tiempo/acoplamiento/trigger) con conexión de sonda genérica.

**Hallazgo metodológico (informa el proceso, no el contenido del lab):** durante esta investigación, dos búsquedas casi idénticas sobre si 61010-2-030 cubre osciloscopios produjeron resúmenes sintetizados inconsistentes entre sí (uno afirmaba cobertura explícita, el siguiente la omitía). Se resolvió yendo a la fuente primaria real (fetch directo del datasheet Tektronix) en vez de confiar en el resumen del buscador — el resumen de búsqueda no es fuente primaria fiable para afirmaciones normativas con carga (citables en una ficha), y de aquí en adelante toda cita normativa de este proyecto debe verificarse contra un documento primario real, no solo contra el resumen sintetizado de la búsqueda.

**Fuentes primarias clave:** Tektronix (datasheet TBS1000C, sección Regulatory verbatim — fuente primaria directa); Keysight (datasheet Infiniium XR8); Rigol (certificación EN 61010-2-030:2010 de las series DS7000/DS8000); Siglent (manual de usuario SDS1000X-E/X-U); IEC webstore (61010-2-030 Ed. 3.0:2023-09-20; 61010-031 Ed. 3.0:2022); IEEE SA (1057-2017); Keysight Blogs, Tektronix, Picotech (acoplamiento AC / respuesta en baja frecuencia); fuentes técnicas en español (Unicrom, ISA Uniovi, UCO) para trigger, Vpp/Vrms y medida de fase por cruces por cero.

**Acción aplicada:** fila d10-03 de `LISTA-MAESTRA-200-PRACTICAS.md` corregida (columna "Norma ancla"; "Física de gobierno" confirmada sin cambio).

**Veredicto:** ✅ norma ancla y física de gobierno de d10-03 verificadas; próximo lab del molde P autorizado para construcción con esta base.

---

## 9. Verificación de norma ancla y física de gobierno d10-04 (FFT, cursores y sondas atenuadas 10:1) — previa a la siguiente implementación del molde P

> **Fecha:** 2026-07-12 · **Método:** extracción directa de texto completo (no resumen de buscador) de 2 manuales/datasheets de sonda de fabricante — Tektronix P2220 (071-1464-00) y Keysight N2862B/N2863B/N2889A/N2890A (N2889-97002, 5.ª edición, jul-2023) —, ambos obtenidos con la técnica establecida en el hallazgo metodológico de abajo; IEC webstore para confirmar edición vigente; búsquedas técnicas cruzadas para la física de Nyquist/aliasing/resolución en frecuencia, compensación de sonda y convenciones de cursor.

d10-03 (§8) dejó explícitamente pendiente para este lab la verificación de **IEC 61010-031**, la norma particular que gobierna las sondas atenuadas (a diferencia de 61010-2-030, que gobierna el instrumento). En §8 esa norma se trató como hallazgo de catálogo IEC only, porque no se había encontrado todavía un datasheet de sonda que la citara textualmente. Esta sección cierra esa verificación pendiente y añade la física de FFT/aliasing, compensación de sonda y cursores que exige el mandato antes de construir el lab.

| Hallazgo | Verificación | Corrección aplicada |
|---|---|---|
| Norma ancla (sonda) | **IEC 61010-031** ("Safety requirements for hand-held and hand-manipulated probe assemblies for electrical test and measurement") confirmada, ahora con fuente primaria de producto — no solo de catálogo. Manual Tektronix P2220, tabla "Certifications and Compliances": fila Safety = *"IEC/EN 61010-031; 2002"* (el mismo documento usa también la forma legada *"EN61010-2-031:1994"* en su encabezado descriptivo — ambas formas en el mismo documento, reflejando la renumeración histórica propia de la norma, no un error de fabricante ni del buscador). Guía de usuario Keysight N2862B/N2889A (documento moderno, 5.ª edición 2023): fila Safety = *"Conformance to CAN/CSA-C22.2 No. 61010-031:17/A1:20, ANSI/UL 61010-031, Edition 2 + AMD 1:2020, IEC 61010-031: 2015/AMD1:2018"* — solo la forma independiente "61010-031", sin "2-031" en ningún punto del documento. IEC webstore confirma edición vigente **Ed. 3.0:2022** (sustituye Ed. 2.0:2015+AMD1:2018, que sustituyó la edición 2002+AMD1:2008). Hallazgo negativo confirmado en paralelo, igual que en §7/§8: no existe norma de EXACTITUD para sondas — atenuación (±2–3 % típico), ancho de banda y rango de compensación son de hoja de datos del fabricante. | `—` → `IEC 61010-1 + IEC 61010-031 (seguridad, sonda) · sin norma de exactitud` |
| Física de gobierno (FFT/aliasing) | Confirmada sin discrepancias contra múltiples fuentes técnicas independientes: frecuencia de Nyquist = mitad de la tasa de muestreo del osciloscopio; contenido por encima de Nyquist se pliega (alias) hacia el espectro visible, apareciendo reflejado desde el borde derecho de la pantalla FFT; resolución en frecuencia Δf ≈ 1/T_captura ≈ tasa_muestreo/N_muestras (captura más larga → picos más finos; captura más corta → picos más anchos/borrosos); funciones de ventana (Hamming, Hanning, Blackman-Harris) intercambian ancho de lóbulo principal contra fuga espectral hacia bins vecinos ("spectral leakage") cuando la señal no coincide exactamente con una frecuencia de bin. | Sin cambio — física ya correcta en la fila original ("Ancho de banda; aliasing"). |
| Física de gobierno (compensación de sonda) | Confirmada contra fuente técnica general (Rohde & Schwarz) y contra el procedimiento verbatim del manual Tektronix P2220 (pág. 11, figura de 3 formas de onda): la entrada del osciloscopio tiene una capacitancia paralela (decenas de pF) que junto a su resistencia de entrada forma un filtro paso-bajo a alta frecuencia; el capacitor de ajuste (trimmer) de la sonda 10:1 debe compensar esa carga para formar un divisor atenuador independiente de la frecuencia. Diagnóstico con la onda cuadrada de calibración (~1 kHz) del propio osciloscopio: sub-compensada → flancos redondeados/lentos con caída; sobre-compensada → pico de sobrepaso en el flanco seguido de asentamiento; bien compensada → tope plano. Cuantificación real encontrada en los 2 datasheets de sonda: el modo 10:1 reduce drásticamente la carga capacitiva sobre el circuito medido frente al modo 1:1 — P2220: 13–17 pF (10X) vs. 80–110 pF (1X); Keysight N2889A (sonda conmutable): 11 pF (10:1) vs. 60 pF (1:1) — y extiende el ancho de banda utilizable en el mismo orden de magnitud: P2220, 200 MHz (10X) vs. 6 MHz (1X); familia N28xx/N2889A, 150–500 MHz (10:1) vs. 10 MHz (1:1, cuando conmutable). Cifras citadas como rango de fabricante, no como constante universal (regla de honestidad de fichas). | Sin cambio — física ya correcta en la fila original; se usará como ejemplo cuantificado en la ficha. |

**Hallazgo relevante (informa el diseño de `mecanica-26`):** las convenciones de cursor son universales entre fabricantes y no están gobernadas por una norma — se confirmaron sin discrepancias contra 4 fuentes técnicas independientes (Teledyne LeCroy, Rohde & Schwarz/DesignSpark, EDN, guía de laboratorio universitaria): cursores de voltaje/verticales (líneas horizontales discontinuas, ΔY/ΔV = diferencia de voltaje entre cursores — típicamente colocados en pico y valle para leer Vpp directo), cursores de tiempo/horizontales (líneas verticales discontinuas, ΔX = diferencia de tiempo — típicamente abarcando un periodo completo para leer T y f=1/T calculado), y cursores de seguimiento (cruz que sigue la traza, lee el voltaje instantáneo en el instante de tiempo elegido). No requieren corrección de norma ni de física — es una técnica de medición manual que complementa, no sustituye, las medidas automáticas del instrumento.

**Cierre del enrutamiento normativo (continúa §8):** con las 2 fuentes primarias de producto de esta sección, **IEC 61010-031 Ed. 3.0:2022** queda confirmada al mismo nivel de evidencia que IEC 61010-2-030 en §8 (datasheet/manual real de producto, no solo catálogo IEC) — la norma sí gobierna sondas atenuadas 10:1 reales y disponibles comercialmente, no es una entrada de catálogo sin aplicación práctica.

**Hallazgo metodológico (extiende §8):** en 2 de 2 intentos esta sesión, el resumen generado por WebFetch falló al parsear el PDF binario/comprimido de un manual de fabricante (Tektronix P2220 y Keysight N2889-97002), pero en ambos casos la herramienta guardó una copia local completa y reportó la ruta; usar el Read tool directamente sobre esa ruta local extrajo el texto completo y fiel de las 16 y 14 páginas respectivamente (capacidad nativa de lectura de PDF, no el sumarizador de IA de WebFetch). Esta técnica (WebFetch → si el resumen falla o es dudoso, usar la ruta guardada con Read) es más confiable que reintentar WebFetch con otro prompt y se adopta como método preferido para toda cita normativa futura de este proyecto que dependa de un PDF de fabricante o de un organismo de normalización.

**Fuentes primarias clave:** Tektronix (manual de sonda P2220, 071-1464-00 — tabla de certificaciones pág. 8, procedimiento y figura de compensación pág. 11, specs eléctricas pág. 12, leído en texto completo); Keysight (guía de usuario N2862B/N2863B/N2889A/N2890A, N2889-97002, 5.ª edición 2023 — tabla de características pág. 8, leída en texto completo); IEC webstore (61010-031 Ed. 3.0:2022); Rohde & Schwarz (explicación técnica de compensación de sonda); Teledyne LeCroy, R&S/DesignSpark, EDN, guía de laboratorio universitaria (convenciones de cursor).

**Acción aplicada:** fila d10-04 de `LISTA-MAESTRA-200-PRACTICAS.md` corregida (columna "Norma ancla"; "Física de gobierno" confirmada sin cambio).

**Veredicto:** ✅ norma ancla y física de gobierno de d10-04 verificadas; siguiente lab del molde P (`mecanica-26`, tentativo) autorizado para construcción con esta base.

---

## 10. Verificación de norma ancla y física de gobierno d10-05 (generador de funciones, respuesta en frecuencia) — previa a la siguiente implementación del molde P

> **Fecha:** 2026-07-13 · **Método:** extracción directa de texto completo (no resumen de buscador) de 2 datasheets de fabricante — Rigol DG1000Z (DSB09103-1110-202511) y Keysight 33500B/33600A Trueform (5992-2572EN, ed. 2024-10-17) —, obtenidos con la técnica establecida en §9 (WebFetch guarda el binario aunque falle su propio resumen → Read directo sobre esa ruta local); corroboración de Tektronix AFG31000 (documento de cumplimiento dedicado, hallazgo de sesión previa) y de Siglent SDG1000X (resumen de búsqueda de sesión previa, no re-verificado en fuente primaria); IEC webstore para confirmar el alcance de 61010-2-030 frente a equipo que solo genera (no mide) señal.

d10-05 ("caracteriza sistemas con el generador de funciones") tenía "—" en la columna Norma ancla de la lista maestra, igual que d10-03 antes de §8. A diferencia de los tres labs anteriores del molde P en D10 (d10-02 → 61010-2-032; d10-03 → 61010-2-030; d10-04 → 61010-031), el generador de funciones no mide ni se conecta a un circuito externo con fines de medición — genera y entrega una señal. Esa diferencia física tiene una consecuencia normativa directa que esta sección confirma con 4 fuentes de fabricante.

| Hallazgo | Verificación | Corrección aplicada |
|---|---|---|
| Norma ancla | El generador de funciones **NO** tiene una norma particular Parte 2 propia — a diferencia de la pinza (§7), el osciloscopio (§8) y la sonda (§9). Confirmado en 2 datasheets completos leídos en fuente primaria: Rigol DG1000Z, tabla "Certification Information" (pág. 8): *"Electrical Safety in line with USA:UL 61010-1:2012, Canada: CAN/CSA-C22.2 No. 61010-1-2012, EN 61010-1:2010"* — solo Parte 1, sin ninguna mención de Parte 2 en las 9 páginas del documento. Keysight 33500B/33600A, sección "Regulatory" (pág. 23): *"Operating environment: EN61010, pollution degree 2, indoor locations"* — mención general sin sufijo de parte (grado de contaminación y categoría de instalación son conceptos definidos en la Parte 1), remite a la página de Declaración de Conformidad en línea (bloqueada con HTTP 403 al intento de acceso directo), sin ninguna mención de Parte 2 en las 24 páginas del documento. Corrobora hallazgo previo de Tektronix AFG31000 (documento de cumplimiento dedicado, solo EN/UL/CSA/IEC 61010-1; esa investigación también corrigió un resumen de búsqueda previo que sugería erróneamente 61010-2-030 para este modelo, mismo patrón metodológico de §8: no aceptar un resumen de búsqueda como cita normativa final) y resumen de búsqueda de Siglent SDG1000X (solo IEC/UL/CSA 61010-1, no re-verificado en fuente primaria esta sesión). Razón física: IEC 61010-2-030 limita su alcance a equipo que se conecta a circuitos externos "con fines de prueba o medición" (§8); un generador de funciones hace lo opuesto — inyecta la señal, no la mide — y por eso queda fuera del alcance de esa norma particular y solo necesita cumplir la Parte 1 general. Hallazgo negativo confirmado en paralelo, igual que en §7/§8/§9: no existe norma de EXACTITUD externa y armonizada para amplitud/frecuencia de un generador de funciones. | `—` → `IEC 61010-1 (seguridad, generador de funciones — sin norma particular Parte 2 aplicable) · sin norma de exactitud` |
| Física de gobierno (impedancia de salida) | Confirmada y cuantificada en 2 fuentes primarias: impedancia de salida nominal **50 Ω** en ambos fabricantes (Rigol: "Output Impedance: 50 Ω (typical)"; Keysight: "Output impedance (nom): 50 Ω", con nota de que todas las especificaciones de amplitud aplican con carga resistiva de 50 Ω, pág. 14). Confirmación cuantitativa exacta del error de doblado de amplitud en alta impedancia: Keysight especifica el rango de amplitud como *"1 mVpp to 10 Vpp into 50 Ω... / 2 mVpp to 20 Vpp into open circuit"* (pág. 17) — el mismo ajuste del generador produce el doble de voltaje pico a pico en un circuito abierto/alta impedancia que en una carga de 50 Ω, relación exactamente 2× documentada por el propio fabricante, no una regla empírica de taller. | Sin cambio — no hay fila previa que corregir; física nueva que informa el diseño del caso guiado. |
| Física de gobierno (exactitud) | Confirmado con datos concretos de 2 fabricantes que **no coinciden entre sí** en si la exactitud de amplitud está garantizada — lo cual refuerza, en vez de debilitar, el hallazgo de "sin norma externa": Rigol marca la exactitud de amplitud explícitamente como *"Typical"* (no garantizada) mientras que su exactitud de frecuencia (±1 ppm, 18–28 °C) no lleva esa etiqueta (implícitamente garantizada) — asimetría dentro del mismo datasheet. Keysight marca tanto amplitud como frecuencia como *"(spec)"*; su propia sección de definiciones (pág. 24) aclara que "spec" significa desempeño garantizado de un instrumento calibrado "conforme a métodos ISO-17025" — es decir, sí garantiza su cifra, a diferencia de Rigol. ISO/IEC 17025 rige la competencia y trazabilidad del PROCESO de calibración, no fija el valor de tolerancia — cada fabricante sigue declarando, y opcionalmente garantizando, su propia cifra. | Sin cambio — confirma como hallazgo positivo que "sin norma de exactitud" significa "sin cifra armonizada externa", no "nunca garantizada por el fabricante". |

**Hallazgo relevante (informa el diseño de `mecanica-27`, tentativo):** la física de impedancia de salida (50 Ω nominal, doblado de amplitud en circuito abierto) es candidato directo para uno de los casos guiados: un generador ajustado a X Vpp asumiendo carga de 50 Ω, conectado a la entrada de alta impedancia de un osciloscopio o multímetro, mostrará ~2X Vpp en el instrumento — error real y medible, no una advertencia cualitativa, cuantificable en vivo igual que el efecto de carga del shunt en §7. Para la caracterización de sistemas por barrido de frecuencia (el tema central del lab), se reutiliza el criterio de punto de −3 dB ≈ 70.7 % ya confirmado en §8 para el ancho de banda del osciloscopio — el mismo criterio aplica para definir el punto de corte de un sistema (p. ej. un filtro RC) caracterizado con el generador barriendo frecuencia y el osciloscopio midiendo la ganancia de salida/entrada en cada punto.

**Nota de rigor (transparencia metodológica):** a diferencia de d10-02/d10-03/d10-04, donde los 3–4 fabricantes citados alcanzaron el mismo nivel de evidencia (fuente primaria con cita textual explícita de norma y parte), en d10-05 Keysight solo ofrece una mención general de "EN61010" sin sufijo de parte (el portal de Declaración de Conformidad que tendría la cita completa devolvió HTTP 403 a la petición automatizada) y Siglent sigue sin re-verificar en fuente primaria. Se documenta así, sin suavizar la diferencia, porque la ausencia total de cualquier mención a una norma Parte 2 en 33 páginas combinadas de datasheet (9 Rigol + 24 Keysight), sumada a la razón física de alcance (el generador no mide circuitos externos) y a la cita explícita de Tektronix, se considera triangulación suficiente para proceder — no tan fuerte como la de §8/§9, pero consistente en las 4 fuentes sin un solo dato contradictorio.

**Fuentes primarias clave:** Rigol (datasheet DG1000Z, DSB09103-1110-202511, 9 páginas, leído en texto completo — tabla de certificación pág. 8, impedancia y exactitud pág. 5); Keysight (datasheet 33500B/33600A Trueform, 5992-2572EN, ed. 2024-10-17, 24 páginas, leído en texto completo — regulatorio pág. 23, impedancia y amplitud pág. 17, definiciones pág. 24); Tektronix (AFG31000, documento de cumplimiento dedicado, hallazgo de sesión previa); Siglent (SDG1000X, resumen de búsqueda de sesión previa — nivel de evidencia más débil que los otros 3 fabricantes, señalado aquí explícitamente por la regla de honestidad del proyecto); IEC webstore (alcance de 61010-2-030, §8).

**Acción aplicada:** fila d10-05 de `LISTA-MAESTRA-200-PRACTICAS.md` corregida (columna "Norma ancla"; "Física de gobierno" confirmada sin cambio, ampliada con impedancia de salida y exactitud como hallazgos que informan el diseño del lab).

**Veredicto:** ✅ norma ancla y física de gobierno de d10-05 verificadas; siguiente lab del molde P (`mecanica-27`, tentativo) autorizado para construcción con esta base.
