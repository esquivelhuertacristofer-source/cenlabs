# Ficha de práctica — Escáner OBD-II y Diagnóstico (`mecanica-11`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-11
sector: autotronica
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "Autotrónica (CONALEP 2023 mapa+perfil / CECyTE-2017 respaldo)"
modulo: "Diagnóstico electrónico del automóvil"                 # ⚑ confirmar clave y nombre exactos con el plan vigente
submodulo: "Diagnóstico con equipo de escaneo OBD-II"          # ⚑ confirmar clave exacta
ocupacion_SINCO: "7541 — Mecánicos y reparadores de vehículos de motor"  # ⚑ verificar clave SINCO 2011
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de conectar un escáner al conector de
  diagnóstico DLC J1962, leer datos en vivo, cuadro congelado y códigos DTC, e
  interpretar el ajuste de combustible y la señal de la sonda O2 para deducir la
  causa raíz de una falla del motor.
actividad_clave: >
  Diagnostica la causa raíz de una falla del motor usando datos OBD-II (DTC, cuadro
  congelado y datos en vivo), aplicando la prueba de rpm para discriminar entre causas
  con síntoma común de mezcla pobre.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Conecta el escáner al DLC J1962 (16 pines): identifica pin 16 (+12 V permanente), pines 6/14 (CAN High/Low, ISO 15765-4), pin 7 (línea K, ISO 9141-2) y pines 4/5 (tierras)."
  - "En Modo $01 verifica que el motor esté en lazo cerrado (motor caliente, ECT > ~70 °C) y observa los PIDs base: RPM ($0C), carga calculada ($04), MAP ($0B), MAF ($10), TPS ($11), sonda O2 ($14), STFT ($06) y LTFT ($07)."
  - "En Modo $03 lee el/los DTC (formato SAE J2012: P0xxx = tren motriz) y en Modo $02 el cuadro congelado capturado al fijar el código."
  - "Interpreta el ajuste de combustible total (STFT + LTFT): positivo = la ECU añade combustible ⇒ mezcla pobre; |total| > ~25 % es la condición típica de P0171."
  - "Aplica la prueba discriminante de rpm: compara el ajuste a ralentí vs 2500 rpm. Si la mezcla pobre MEJORA con rpm ⇒ aire no medido (fuga de vacío); si el ajuste sigue alto y el MAF lee bajo para ese TPS/RPM ⇒ sensor MAF."
  - "Para la sonda O2, evalúa la FRECUENCIA de conmutación alrededor de 0.45 V, no sólo el voltaje: conmutación lenta ⇒ sonda perezosa (P0133)."
  - "Relaciona la falla con el monitor de disponibilidad (readiness) que queda incompleto, según la lógica de verificación de la NOM-047-SEMARNAT-2014."
normatividad:          # 🔒 verificar clave y vigencia
  - "SAE J1979 / ISO 15031-5 — modos de diagnóstico y PIDs"
  - "SAE J2012 / ISO 15031-6 — formato de los códigos DTC"
  - "ISO 15765-4 — diagnóstico sobre CAN (transporte)"
  - "ISO 9141-2 / SAE J1850 (PWM/VPW) — protocolos físicos heredados"
  - "SAE J1962 — conector de diagnóstico DLC de 16 pines"
  - "NOM-047-SEMARNAT-2014 — sistemas de diagnóstico a bordo y monitores de disponibilidad (verificación vehicular MX)"
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "Pinout real y a escala del conector DLC J1962 (16 pines, 2 filas), clicable pin por pin."
  - "Ajuste de combustible de lazo cerrado (STFT + LTFT) como respuesta a mezcla pobre, con signo y umbrales realistas."
  - "Conmutación de la sonda O2 de banda estrecha (0.1–0.9 V, umbral 0.45 V) con frecuencia variable (sana vs perezosa)."
  - "Dependencia de la mezcla con el régimen (ralentí vs 2500 rpm) como prueba diagnóstica discriminante."
  - "Los tres modos de servicio: $01 datos en vivo, $02 cuadro congelado, $03 lectura de DTC (con MIL encendida)."
  - "Cuatro escenarios de falla con su DTC correcto: fuga de vacío (P0171), MAF sucio (P0101), fallo de encendido cil. 3 (P0303/P0300), sonda O2 lenta (P0133)."
  - "Lógica cualitativa del monitor de disponibilidad incompleto asociado a cada falla."
simulador_NO_modela:   # 🔒 evita el error 'motor con solo pistones y rotores'
  - "Tramas, arbitraje ni tiempos reales del bus CAN a nivel de bit (la capa de transporte ISO-TP se abstrae: se muestra el modo/PID, no la segmentación)."
  - "Dinámica de la celda de Nernst de la sonda con retardo por difusión; la conmutación es un modelo sinusoidal-umbral simplificado, no un transitorio real."
  - "El controlador PI real de lazo cerrado con celdas adaptativas por todo el mapa RPM/carga; el ajuste es una aproximación didáctica de primer orden."
  - "Eficiencia del catalizador ni la sonda O2 trasera (P0420) más allá de la bandera de disponibilidad."
  - "Sondas de banda ancha (UEGO/wideband) ni PIDs específicos de fabricante (Modo $22)."
  - "Los valores absolutos son típicos de un motor 4 cilindros gasolina PFI genérico, NO de la calibración de una ECU específica."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte de diagnóstico: DTC leído, datos clave del cuadro congelado, prueba de rpm y causa raíz justificada."
evidencia_desempeno: "Guía de observación del proceso de escaneo y razonamiento en el simulador."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: el rol del OBD-II en el diagnóstico y la verificación de emisiones (briefing.ts)."
desarrollo: "Práctica en el simulador: conectar → leer modos → aplicar prueba de rpm → diagnosticar."
cierre: "Selección de causa raíz con retroalimentación que explica la prueba discriminante."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "SAE J1979 / ISO 15031-5:2015 — Road vehicles — Communication between vehicle and external equipment for emissions-related diagnostics — Part 5: Emissions-related diagnostic services."
  - "SAE J2012 / ISO 15031-6:2015 — Part 6: Diagnostic trouble code definitions."
  - "ISO 15765-4:2021 — Diagnostic communication over CAN (DoCAN) — Part 4: Requirements for emissions-related systems."
  - "SAE J1962:2016 — Diagnostic Connector Equivalent to ISO/DIS 15031-3 (pinout del DLC)."
  - "DOF — NOM-047-SEMARNAT-2014 (características del equipo y procedimiento de medición para verificación de emisiones; requisitos OBD)."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (programa_oficial / modulo / submodulo / ocupacion_SINCO): faltan las CLAVES exactas del plan vigente de autotrónica; verificar contra el documento oficial antes de publicar la trazabilidad."
  - "⚑ Los valores numéricos de los escenarios (LTFT +22 % a ralentí para la fuga de vacío, MAF 2.1 g/s para el MAF sucio, etc.) son representativos y coherentes con la literatura de diagnóstico, pero NO están tomados de una medición de banco específica; un experto debería validar los rangos por motor típico del programa."
  - "⚑ La frecuencia de conmutación 'sana' de la sonda O2 (~1.5–2.4 Hz) es orientativa; el umbral real de P0133 depende del fabricante/tiempo de respuesta específico."
  - "⚑ La lógica 'un monitor incompleto por falla activa' es una simplificación pedagógica de la matriz real de monitores de disponibilidad de la NOM-047."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (piloto):** calibrar cuánto detalle de ingeniería es
   sostenible por lab antes de escalar a las ≥150 prácticas del sector. Si este nivel de
   contrato de fidelidad es correcto y verificable, se replica; si sobra o falta, se ajusta
   la plantilla `scripts/new-lab.mjs`.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/escaner-obd.html](../../../public/labs/escaner-obd.html)) muestra el
   panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) y la línea `Ref:` con la
   normatividad, de modo que el alumno y el evaluador ven las fronteras del modelo dentro
   de la práctica, no sólo en este documento.
3. **Petición concreta al experto:** (a) confirmar o corregir las claves curriculares ⚑;
   (b) validar los rangos numéricos de los 4 escenarios; (c) señalar cualquier afirmación
   que un mecánico del sector consideraría imprecisa o sobre-afirmada.
