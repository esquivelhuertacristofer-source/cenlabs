<!-- Ficha técnica de revisión experta. NO la importa el codegen — es un documento de trabajo para el revisor curricular/experto en autotrónica. -->

```yaml
id: mecanica-31
sector: autotronica
programa_oficial: "Autotrónica (CONALEP 2023 TT3 — tablero, accesorios, CAN-BUS; CECyTE-2017 módulo OBD I-II/ECU)" # ⚑ reutilizado sin verificar, ver banderas_incertidumbre
modulo: "Diagnóstico electrónico del automóvil" # ⚑
submodulo: "Diagnóstico de alimentaciones, tierras y referencias de la ECU (capa eléctrica del módulo)" # ⚑
ocupacion_SINCO: "7541 — Mecánicos y reparadores de vehículos de motor" # ⚑ verificar clave exacta

resultado_de_aprendizaje: >
  El estudiante verifica, con un multímetro, la salud eléctrica del entorno de una ECU
  (alimentación constante, alimentación conmutada, tierra de potencia, tierra de señal y
  referencia de 5 V compartida) y distingue una falla real (tierra en alta resistencia
  revelada solo bajo carga; corto interno de un sensor que arrastra un riel compartido) de
  un comportamiento esperado que parece falla (alimentación conmutada en 0 V con la llave
  apagada), antes de sospechar del módulo de la ECU en sí.

actividad_clave: >
  Diagnosticar 4 casos guiados (ECU sana, tierra en alta resistencia, corto en la referencia
  de 5 V, alimentación conmutada) con un multímetro virtual cuya punta negra permanece fija
  en un punto de tierra ya verificado durante todo el recorrido.

desarrollo: # 🔒 pasos técnicos de la práctica guiada
  - "Fijar la punta negra (COM) del multímetro en un punto de tierra ya verificado — nunca se mueve, nunca se compara un pin sospechoso contra sí mismo."
  - "Tocar con la punta roja el pin de alimentación de batería y confirmar que se mantiene presente (≈12.6–14.2 V) en cualquier estado de la llave."
  - "Tocar el pin de alimentación conmutada y entender que 0 V con la llave apagada es el comportamiento esperado; solo es falla si permanece en 0 V con la llave en contacto."
  - "Distinguir la tierra de potencia de la tierra de señal por su función, no solo por su ubicación física."
  - "Ejecutar la prueba de caída de tensión sobre la tierra de señal, primero sin carga y luego con una carga real activa, y comparar contra el umbral (≤0.1 V sano / >0.3 V falla)."
  - "Medir la referencia de 5 V en cada uno de los sensores que la comparten y, si aparece colapsada, aislar el sensor con el corto interno desconectándolos uno a la vez."
  - "Concluir sobre el estado del entorno eléctrico de la ECU antes de declarar al módulo mismo como sospechoso."

normatividad: # 🔒
  - "SAE J1962 — pinout del conector de diagnóstico OBD-II (norma ancla PARCIAL: cubre la alimentación de batería siempre viva —pin 16— y las tierras de chasis/señal —pines 4 y 5—, pero NO la referencia de 5 V, que no está asignada a ningún pin estándar y vive en el conector propio de la ECU, específico de fabricante)."
  - "Nota de rigor: a diferencia de otras filas del dominio D10, esta práctica nunca tuvo una norma ancla formal única que cubriera sus dos pilares completos (pinout + tensiones de referencia). El pinout de comunicación/tierra/alimentación se verificó contra SAE J1962 por triangulación de fuentes secundarias técnicas (texto primario de SAE de pago, no accedido directamente). La convención de referencia de 5 V compartida, los umbrales de la prueba de caída de tensión (≤0.1 V / >0.3 V) y la separación tierra de potencia/tierra de señal se verificaron por convergencia de múltiples fuentes técnicas de diagnóstico automotriz independientes y mutuamente consistentes, no por un documento normativo único citable — ver banderas_incertidumbre y fuentes para el detalle completo (docs/VERIFICACION-LISTA-MAESTRA.md §14)."

simulador_modela: # 🔒
  - "La distinción entre alimentación constante (siempre viva, con o sin contacto) y alimentación conmutada (solo con la llave en contacto o marcha), incluyendo que leer 0 V en la conmutada con la llave apagada es el comportamiento esperado, no una falla."
  - "La separación funcional entre tierra de potencia y tierra de señal, y el mecanismo por el cual una tierra de señal en alta resistencia desplaza silenciosamente cada lectura de sensor referida a ella, en vez de apagarla."
  - "La prueba de caída de tensión bajo carga como único método confiable para revelar una tierra en alta resistencia — en reposo, sin corriente circulando, la misma tierra dañada puede parecer sana (≤0.1 V bien / >0.3 V falla, valores típicos de la práctica de diagnóstico)."
  - "El efecto de un corto interno en un sensor que arrastra un riel de referencia de 5 V compartido por varios sensores, produciendo códigos simultáneos en sensores que en realidad están sanos, y el procedimiento de aislarlo desconectando sensores uno a uno."
  - "Un conector de ECU genérico y representativo (no un clon de ningún conector estandarizado), con la punta negra del multímetro fija en un punto de tierra ya verificado durante todo el recorrido — nunca comparando un pin sospechoso contra sí mismo."

simulador_NO_modela: # 🔒 evita el error "motor con solo pistones y rotores"
  - "Un clon literal de ningún conector estandarizado — en particular, no reproduce el pinout completo de SAE J1962 pin por pin; el conector de este panel es genérico y agrupa categorías de pines representativas con fines didácticos."
  - "La asignación real de pines de discreción de fabricante del conector J1962 (pines 1, 3, 8, 9, 11, 12, 13), que en un vehículo real pueden o no llevar la referencia de 5 V u otras señales específicas de marca."
  - "La decodificación de tramas CAN reales — el indicador de actividad de bus se mantiene sano en los 4 casos de este laboratorio a propósito, como recordatorio de que no todo lo que se inspecciona resulta estar fallando (ver mecanica-30 para el detalle de la codificación diferencial)."
  - "Fallas mecánicas o de conector (pines doblados, corrosión visible, falso contacto intermitente por vibración) — el panel modela únicamente el comportamiento eléctrico en los pines, no su condición física."
  - "El diagrama de pines oficial de ningún vehículo o ECU específica — sustituye la referencia genérica de este panel por el manual del fabricante (FSM) antes de diagnosticar un vehículo real."

evidencia_producto: >
  Reporte de diagnóstico: identificación correcta de cada uno de los 4 casos (ECU sana,
  tierra en alta resistencia, corto en la referencia de 5 V, alimentación conmutada) con la
  causa eléctrica correspondiente y, en los Casos 2 y 4, la razón por la que la prueba
  ingenua (sin carga / sin revisar la llave) no la revela.

evidencia_desempeno: >
  Guía de observación del recorrido por los 4 casos guiados, en particular si el estudiante
  repite la prueba de tierra bajo carga antes de concluir, y si aísla el sensor con el corto
  real desconectando uno a la vez en vez de sustituir los tres sensores del riel.

instrumento: rubrica

apertura: >
  Briefing: continuidad directa con el escáner OBD-II (mecanica-11), los monitores de
  disponibilidad (mecanica-29) y el bus CAN (mecanica-30) — de leer la red y sus datos a
  revisar el entorno eléctrico de la ECU misma antes de sospechar del módulo (briefing.ts).

desarrollo: >
  Práctica en el simulador: 4 casos guiados (sano, tierra en alta resistencia, corto en la
  referencia de 5 V, alimentación conmutada) sobre un panel de multímetro virtual con punta
  negra fija en un punto de tierra verificado y punta roja móvil sobre los 9 pines del
  conector de ECU.

cierre: >
  Ficha técnica (capa 2) con el contrato de fidelidad y la tabla de los 4 casos con sus
  lecturas representativas por pin.

fuentes: # 🔒
  - "SAE J1962 (pinout del conector de diagnóstico OBD-II) — verificado por triangulación de fuentes secundarias técnicas (texto primario de SAE de pago, no accedido directamente): WebSearch cruzado (sae.org, dashlogic.com, researchgate.net, copperhilltech.com, avrglobaltech.com) y WebFetch íntegro de dashlogic.com (tabla de pines 1–16), coincidentes pin a pin en pin 4 (tierra de chasis), pin 5 (tierra de señal), pin 6/14 (CAN High/Low), pin 16 (batería, siempre viva)."
  - "autodtcs.com ('How to Test a 5V Reference Circuit'; 'How to Perform Voltage Drop Testing') y Clore Automotive ('Troubleshooting 5V Reference Circuits') — convención de referencia de 5 V compartida entre sensores y su rango de tolerancia (≈4.9–5.1 V)."
  - "freeasestudyguides.com, engine-light-help.com, Fluke ('Diagnosing Voltage Drops') — umbrales de la prueba de caída de tensión en circuitos de tierra (≤0.1 V preferido/aceptable, >0.3 V indica corrosión o cableado defectuoso)."
  - "HP Academy (foro de tuning), ShopECU, Haltech ('ECU Grounding — the DOs and DONTs'), iWire ('Signal vs Power Grounds') — mecanismo y razón de la separación entre tierra de señal y tierra de potencia."
  - "docs/VERIFICACION-LISTA-MAESTRA.md §14 — verificación completa de la norma ancla parcial y la física de gobierno de esta fila, incluye tabla hallazgo/verificación/corrección y la 'Nota de rigor' metodológica."
  - "docs/LISTA-MAESTRA-200-PRACTICAS.md, fila d10-10 — trazabilidad curricular oficial (AUT-Y ECU S2) y molde P+S, cuarta y última implementación de ese molde en el dominio D10 (tras d10-07/mecanica-28, d10-08/mecanica-29, d10-09/mecanica-30)."

banderas_incertidumbre:
  - "⚑ Anclaje curricular (programa_oficial / modulo / submodulo / ocupacion_SINCO): reutiliza sin verificar el mismo anclaje de mecanica-11/28/29/30; faltan las claves exactas del plan vigente — verificar contra el documento oficial antes de publicar la trazabilidad. La columna 'Trazabilidad' de la lista maestra marca esta práctica como 'AUT-Y ECU S2'."
  - "⚑ Esta fila no tiene, y nunca tuvo, una norma ancla formal única (a diferencia de d10-07/08/09): se agregó una norma ancla PARCIAL (SAE J1962, solo pinout) tras la verificación de §14. Los valores de referencia de 5 V y los umbrales de caída de tensión NO provienen de un estándar único citable con número de edición, sino de convergencia de fuentes técnicas de diagnóstico automotriz independientes — ver 'Nota de rigor' arriba."
  - "⚑ El texto primario de SAE J1962 es de pago y no se accedió directamente; el pinout se verificó por dos fuentes secundarias independientes y mutuamente consistentes (WebSearch cruzado + WebFetch de dashlogic.com), no por el documento SAE oficial — verificar contra el texto SAE si un revisor tiene acceso."
  - "⚑ El conector de ECU de este panel es genérico y representativo, no un clon de J1962 ni de ningún conector de fabricante específico — la ficha y el simulador lo señalan explícitamente (regla de honestidad), pero un revisor experto en autotrónica debería confirmar que la agrupación de categorías de pines (alimentación constante/conmutada, tierra de potencia/señal, referencia de 5 V, CAN H/L, dos sensores) es representativa de una ECU real típica."
  - "⚑ Los valores de voltaje citados (batería ≈12.6–14.2 V, referencia 5 V ≈4.9–5.1 V, caída de tierra ≤0.1 V/>0.3 V) son típicos de la práctica de diagnóstico ampliamente enseñada, no cifras universales — el simulador y esta ficha los presentan como rangos representativos, nunca como cifra exacta de norma (regla de honestidad de CEN Labs)."
  - "⚑ Este es el cuarto y último molde P+S del dominio D10 (tras d10-07/mecanica-28, d10-08/mecanica-29, d10-09/mecanica-30); valorar con el experto si cerrar el dominio en un caso de 'revisión del entorno de la ECU' es el punto de cierre curricular correcto, o si el dominio debería continuar hacia el diagnóstico de la ECU misma (reprogramación, fallas internas) en una fase posterior fuera de esta lista maestra."
```

## Notas para el revisor experto

1. **Lugar en la secuencia curricular.** d10-10 cierra el hilo de instrumentación de D10 iniciado en d10-01 (multímetro) y recorrido por d10-06 (escáner OBD-II, mecanica-11), d10-07 (mecanica-28, código de falla), d10-08 (mecanica-29, veredicto de disponibilidad) y d10-09 (mecanica-30, bus CAN). Es el cuarto molde P+S de D10, con el mismo patrón de panel + capa de reglas de decisión que mecanica-28/29/30, aplicado ahora a la salud eléctrica de la ECU misma en vez de a un dato que ya salió de ella.

2. **Dónde vive el contrato de fidelidad en la app.** El simulador (`public/labs/diagnostico-ecu.html`) muestra el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela), igual que mecanica-11, mecanica-12 y mecanica-24–mecanica-30.

3. **Petición concreta al experto:**
   - Confirmar o corregir las claves curriculares marcadas con ⚑.
   - Confirmar si la agrupación de categorías de pines del conector genérico es representativa de una ECU real típica, o si falta/sobra alguna categoría.
   - Opinar si los 4 casos (sano, tierra, corto en referencia de 5 V, conmutada) cubren el conjunto mínimo de fallas de "entorno de ECU" que un técnico de nivel bachillerato debe reconocer antes de continuar a diagnósticos internos de la ECU.
   - Confirmar si el dominio D10 debe considerarse cerrado en este punto, o si existe una práctica adicional de nivel superior que debería añadirse fuera de esta lista maestra de 200.

4. **Diferencia respecto a mecanica-28/29/30.** mecanica-28 clasifica un código de falla ya leído; mecanica-29 decide el veredicto global de disponibilidad; mecanica-30 diagnostica la red que transporta los datos entre ECUs. mecanica-31 (este laboratorio) da un paso más atrás en la cadena causal: en vez de leer un dato, un código o una red, revisa si la ECU misma tiene lo que necesita para funcionar — alimentación, tierra y referencia — antes de que cualquiera de esos otros diagnósticos tenga sentido.
