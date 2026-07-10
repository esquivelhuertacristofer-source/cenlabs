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
