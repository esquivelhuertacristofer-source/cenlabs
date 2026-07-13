# Ficha de práctica — Fallo de Encendido: Árbol de Decisión P0300 (`mecanica-28`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-28
sector: autotronica
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "Autotrónica (CONALEP 2023 mapa+perfil / CECyTE-2017 respaldo)"
modulo: "Diagnóstico electrónico del automóvil"                 # ⚑ mismo módulo que mecanica-11 (d10-06); confirmar clave exacta con el plan vigente
submodulo: "Árbol de decisión para fallos de encendido (misfire) con escáner OBD-II"  # ⚑ confirmar clave exacta
ocupacion_SINCO: "7541 — Mecánicos y reparadores de vehículos de motor"  # ⚑ verificar clave SINCO 2011 (misma familia que d10-06)
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de recorrer el árbol de decisión que sigue una
  ECU para clasificar un fallo de encendido (misfire) — de código PENDIENTE (Modo $07) a
  CONFIRMADO (Modo $03) — aplicando la regla de atribución de cilindro por mayoría de
  eventos y distinguiendo el comportamiento del testigo MIL (fijo/continuo vs.
  parpadeante) para determinar el nivel de urgencia de la intervención.
actividad_clave: >
  Diagnostica un fallo de encendido P0300 recorriendo el árbol de decisión
  pendiente→confirmado, interpretando la atribución por cilindro (P0300 genérico vs.
  P030X específico) y el comportamiento del testigo MIL para clasificar la urgencia
  (Tipo A: riesgo inmediato para el catalizador vs. Tipo B: umbral de emisiones).
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Verifica en Modo $01 el estado del monitor de fallo de encendido (incompleto/completo) y la tasa de fallos instantánea, antes de mirar cualquier código."
  - "En Modo $07 identifica un código PENDIENTE: nace de una sola detección que cumple el criterio de prueba y todavía NO enciende el MIL — hace falta repetir el fallo en un ciclo de manejo posterior bajo condiciones similares para que Modo $03 lo confirme."
  - "El fallo de encendido es un monitor CONTINUO (no uno de los monitores no-continuos que se consultan por Modo $06): el código pendiente vive en Modo $07, el confirmado en Modo $03, y el estado 'completo/incompleto' del monitor en Modo $01."
  - "Distingue las dos ventanas de evaluación de la ECU: Tipo B evalúa en incrementos de 1000 revoluciones contra el umbral de emisiones (criterio mínimo regulatorio ≈1 %); Tipo A evalúa en incrementos de 200 revoluciones contra el umbral de riesgo para el catalizador (criterio mínimo regulatorio ≈5 %)."
  - "Lee el cuadro congelado (Modo $02) ligado al momento exacto en que el código se confirmó — no al estado actual del motor — y compáralo con los datos en vivo."
  - "Aplica la regla de atribución por cilindro: si la gran mayoría de los eventos de fallo detectados proviene de un mismo cilindro, el código pasa de P0300 (genérico, aleatorio/múltiple) a P030X (ese cilindro específico)."
  - "Clasifica la urgencia por el comportamiento del MIL, no por el número del código: MIL fijo/continuo = Tipo B (sin riesgo inmediato, agendar servicio); MIL parpadeante = Tipo A (riesgo inmediato para el catalizador)."
  - "Recuerda que el parpadeo del MIL es una señal en tiempo real ligada al evento de fallo activo, mientras que el DTC confirmado permanece grabado en memoria de la ECU independientemente del estado presente del motor."
normatividad:          # 🔒 verificar clave y vigencia
  - "SAE J1979 / ISO 15031-5 — modos de servicio $01 (datos en vivo), $02 (cuadro congelado), $03 (DTC confirmados), $07 (DTC pendientes)"
  - "SAE J2012 / ISO 15031-6 — formato del DTC (P0300 genérico, P0301–P0304 por cilindro)"
  - "13 CCR §1968.2 (CARB, California Air Resources Board) — Final Regulation Order: monitor de fallo de encendido, umbrales Tipo A/Tipo B, comportamiento del MIL, regla de atribución por cilindro"
  - "NOM-047-SEMARNAT-2014 — sistemas de diagnóstico a bordo y monitores de disponibilidad (verificación vehicular MX)"
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "La lógica de dos ciclos: un código nace PENDIENTE (Modo $07) con una sola detección y solo se CONFIRMA (Modo $03) si se repite en un ciclo de manejo posterior."
  - "La regla de atribución de cilindro por mayoría de eventos (P0300 genérico → P030X específico)."
  - "El cuadro congelado ligado al momento exacto del evento que confirmó el código, no al estado actual del motor."
  - "La distinción MIL fija/continua (Tipo B, umbral de emisiones) vs. parpadeante (Tipo A, riesgo para el catalizador), incluyendo que el parpadeo sigue el evento de fallo en tiempo real, no es un estado grabado."
  - "Los cuatro modos de servicio relevantes: $01 (datos en vivo, incluido el estado del monitor), $02 (cuadro congelado), $03 (confirmados), $07 (pendientes)."
simulador_NO_modela:   # 🔒 evita el error 'motor con solo pistones y rotores'
  - "El algoritmo real de detección por variación angular del cigüeñal (CKP) entre eventos de combustión, con compensación por irregularidades de manufactura del volante."
  - "El sensor de posición del árbol de levas (CMP) y su papel para sincronizar la ventana de cada cilindro dentro del ciclo de 720°."
  - "La calibración específica de un fabricante: los umbrales exactos de tasa de fallos, el tamaño de las ventanas de evaluación (aquí 200/1000 revoluciones, tomadas de 13 CCR §1968.2 como pisos regulatorios) y las condiciones habilitantes reales varían por modelo y año."
  - "Los monitores de disponibilidad (readiness) más allá del de fallo de encendido, ni el ciclo de manejo real necesario para completarlos tras borrar códigos (ver d10-08)."
  - "El daño físico real al catalizador: el parpadeo del MIL señala el riesgo regulatorio, no mide el daño acumulado."
  - "Otras causas de fallo de encendido no representadas aquí (mezcla pobre, fuga de vacío, baja compresión, bujía/bobina defectuosa): el modelo asume que el fallo ya ocurrió y se enfoca en cómo el sistema OBD-II lo reporta y clasifica."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte de diagnóstico: clasificación del código (pendiente/confirmado), atribución de cilindro justificada, y nivel de urgencia (Tipo A/Tipo B) determinado por el comportamiento del MIL."
evidencia_desempeno: "Guía de observación del recorrido por los 4 modos de servicio ($01/$02/$03/$07) y del razonamiento de atribución en el simulador."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: continuidad con el escáner OBD-II — de leer un código a clasificar su urgencia (briefing.ts)."
desarrollo: "Práctica en el simulador: 4 casos guiados (pendiente, confirmado Tipo B, confirmado Tipo A con atribución de cilindro, síntesis) sobre un árbol de decisión de misfire con escáner y tablero MIL."
cierre: "Ficha técnica (capa 2) con el contrato de fidelidad y la tabla de comportamiento pendiente/confirmado/MIL."
# --- Veracidad ---
fuentes:               # 🔒 verificadas mediante fuentes primarias (docs/VERIFICACION-LISTA-MAESTRA.md §11)
  - "California Air Resources Board (CARB) — Final Regulation Order, 13 CCR §1968.2 (fro1968-2.pdf, ~86 pp.), fuente primaria directa, texto completo extraído (pdftotext -layout) y leído; citas textuales de (e)(3.1.3), (e)(3.2.1)(A) pág. 22, (e)(3.2.2)(A) pág. 23, (e)(3.3.1) pág. 23, (e)(3.4.1)(A)(ii)/(D) pág. 26, (e)(3.4.2) pág. 27, (f)(4.1) pág. 57, (f)(4.4.1)/(f)(4.4.5)(A) pág. 59, (j)(1.4.2)(C)/(E) pág. 75."
  - "SAE J1979 / ISO 15031-5:2015 — modos de servicio (reutilizada de la verificación de mecanica-11/d10-06)."
  - "SAE J2012_202509 / ISO 15031-6:2015 — formato y definición de los DTC (P0300 genérico, P0301–P0304 por cilindro)."
  - "DOF — NOM-047-SEMARNAT-2014 (sistemas de diagnóstico a bordo y monitores de disponibilidad, verificación vehicular MX)."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (programa_oficial / modulo / submodulo / ocupacion_SINCO): reutiliza sin verificar el mismo anclaje de mecanica-11 (d10-06); faltan las CLAVES exactas del plan vigente — verificar contra el documento oficial antes de publicar la trazabilidad. La columna 'Trazabilidad' de la lista maestra marca esta práctica como 'AUT-Y OBD' (subconjunto de d10-06, sin competencia nueva registrada)."
  - "⚑ Corrección respecto a la lista maestra original: la lectura inicial ('modo $06') era incorrecta. El fallo de encendido es un monitor CONTINUO (13 CCR §1968.2 (e)(3.3.1) pág. 23; (f)(4.1) pág. 57), por lo que su información NO se consulta por Modo $06 (reservado a monitores no continuos): el pendiente vive en Modo $07 (§(f)(4.4.5)(A) pág. 59) y el confirmado en Modo $03 (§(f)(4.4.1) pág. 59), con el estado del monitor visible en Modo $01 (§(j)(1.4.2)(C)/(E) pág. 75). Corrección ya aplicada en docs/VERIFICACION-LISTA-MAESTRA.md §11 y en esta ficha."
  - "⚑ Las ventanas de 200/1000 revoluciones y los umbrales mínimos de 5 %/1 % son los PISOS regulatorios que CARB permite como criterio mínimo de mal funcionamiento (13 CCR §1968.2 (e)(3.2.1)(A)/(e)(3.2.2)(A)); un fabricante puede calibrar un umbral más estricto para su propia flota — el simulador usa los valores regulatorios como referencia didáctica, no como calibración de un vehículo específico."
  - "⚑ La proporción de atribución de cilindro (90 %/10 %) citada en la investigación proviene directamente de 13 CCR §1968.2 (e)(3.1.3) — es una cifra regulatoria verificada, no inventada — pero el simulador la presenta de forma cualitativa ('la gran mayoría de los eventos') en vez del porcentaje exacto; considerar si mostrar el porcentaje explícito en la ficha técnica in-app mejora o satura la lectura."
  - "⚑ ISO 15031-5:2015 e ISO 15031-6:2015 permanecen en revisión periódica ISO (stage 90.20 desde 2026-04-15, ver ficha de mecanica-11/d10-06); siguen vigentes hoy pero conviene reverificar en 6–12 meses."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (primera implementación del molde P+S en D10):** d10-07 es
   la primera práctica del bloque D10 que usa el molde P+S (panel + sistema) en vez del
   molde P puro de d10-01…d10-06. Continúa el hilo diagnóstico abierto por d10-06
   (`mecanica-11`, escáner OBD-II): mientras d10-06 enseña a LEER los modos de servicio,
   d10-07 enseña a CLASIFICAR lo que se lee — pendiente vs. confirmado, genérico vs.
   cilindro específico, urgente vs. no urgente — usando el mismo escáner como panel de
   entrada hacia un sistema de reglas de decisión regulatorio.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/fallo-encendido.html](../../../public/labs/fallo-encendido.html))
   muestra el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela), igual que
   `mecanica-11`, `mecanica-12`, `mecanica-24`, `mecanica-25`, `mecanica-26` y
   `mecanica-27`.
3. **Petición concreta al experto:** (a) confirmar o corregir las claves curriculares ⚑
   (compartidas sin verificar con d10-06); (b) validar que la corrección "no modo $06"
   (monitor continuo, no discontinuo) sea la lectura correcta del estándar SAE J1979 para
   este tipo de monitor; (c) confirmar que citar el 90 %/10 % de atribución de cilindro
   como "la gran mayoría" en vez del porcentaje exacto es una simplificación pedagógica
   razonable para este nivel.
4. **Diferencia respecto a d10-06:** mientras d10-06 (escáner OBD-II) enseña el USO del
   instrumento (conectar, leer modos, aplicar la prueba de rpm), d10-07 (este lab) asume
   ese instrumento ya dominado y enseña el ÁRBOL DE DECISIÓN regulatorio detrás de un
   único código (P0300): por qué tarda en confirmarse, por qué se especializa por
   cilindro, y por qué el mismo código puede ser urgente en un vehículo y rutinario en
   otro.
