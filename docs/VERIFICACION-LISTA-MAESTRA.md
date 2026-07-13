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
