# Ficha de práctica — Métodos de Arranque de Motores de Inducción: Corriente de Irrupción (`mecanica-50`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** séptima práctica del dominio D5 (Transformadores/Máquinas eléctricas) —
> d5-07 de 16. Es una práctica de **molde S+P** (esquemático interactivo + panel de
> instrumentos virtual, sin fase de ensamble): el elemento central es el pizarrón que
> compara, para un mismo motor, tres esquemáticos de arrancador distintos (directo,
> estrella-delta, autotransformador) contra la misma gráfica de corriente de línea y
> par de arranque en función de la derivación. Es la continuación directa de d5-06 (curva
> par-velocidad): esa práctica dejó explícitamente fuera de alcance el transitorio de
> arranque y los métodos de arranque reducido — esta práctica los retoma como su tema
> central, aún sin modelar el circuito eléctrico equivalente del motor (que queda para
> d5-08).

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-50
sector: mecanica-electronica
practica_maestra: "d5-07 — Compara métodos de arranque y sus corrientes de irrupción (molde S+P) — tomado literalmente de la fila d5-07 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ELE-III; EM-IV.1 — tomado literalmente de la columna 'Trazabilidad' de la fila d5-07 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
norma_ancla_lista_maestra: "IEC 60947-4-1; NEMA ICS — tomado literalmente de la columna 'Norma ancla' de la fila d5-07. ⚑ IEC 60947-4-1 (contactores y arrancadores de motor) es una cita específica y verificable en su alcance general; 'NEMA ICS' es una cita de familia normativa sin número de parte — ninguna cláusula concreta de ninguna de las dos se verificó contra el texto primario en esta sesión."
modulo: "Transformadores (D5)"
submodulo: "Motores de inducción trifásicos: métodos de arranque y corriente de irrupción (molde S+P — continuación directa de d5-06)"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ código reutilizado de d5-01..06/D2/D10 (mismo perfil ocupacional general de electricidad/electrónica); confirmar si existe una clave SINCO más específica de especificación/mantenimiento de arrancadores de motor antes de publicar la trazabilidad
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de explicar por qué un motor de inducción con el
  rotor detenido toma una corriente de irrupción varias veces mayor que su corriente
  nominal; calcular, para los tres métodos de arranque más usados en la industria (directo
  DOL, estrella-delta Y-Δ, autotransformador con derivación a), la corriente de línea
  Ilínea y el par de arranque Tarranque resultantes, a partir de los múltiplos de placa
  ILR y TLR y del factor de reducción k propio de cada método (k=1 para DOL, k=1/3 fijo
  para Y-Δ, k=a² ajustable para autotransformador); identificar la asimetría exclusiva del
  autotransformador entre la corriente de línea (reducida por a²) y la corriente del lado
  del motor (reducida solo por a); encontrar la derivación de equivalencia exacta
  a=1/√3≈0.577 en la que un autotransformador reproduce la misma reducción que
  estrella-delta; y resolver escenarios numéricos de predicción (modo Reto) sobre Ilínea,
  Tarranque o la derivación necesaria, a partir de datos parciales del motor y del método.
actividad_clave: >
  Sobre un banco con un motor de inducción y un gabinete de arranque intercambiable, el
  estudiante selecciona uno de los tres métodos de arranque (directo, estrella-delta,
  autotransformador) y observa cómo cambia el esquemático del gabinete (contactores KL/KY/
  KΔ para Y-Δ; KL/AUTOTRAFO/KB para autotransformador) junto con la corriente de línea y el
  par de arranque, leídos en vivo sobre un tablero-pizarrón que grafica ambas cantidades
  contra la derivación a. En modo Comparar, ajusta la derivación del autotransformador y
  ubica el punto exacto de equivalencia con estrella-delta. En modo Reto, dado un escenario
  con el método y algunos datos fijados por el simulador, calcula la cantidad faltante
  (corriente de línea, par de arranque o derivación) antes de verificar la respuesta con
  tolerancia.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modo Explora: con el motor ya montado en el banco, selecciona cada uno de los tres métodos de arranque (botones DOL / Y-Δ / Autotransformador) y observa cómo cambia el esquemático del gabinete de arranque —un solo contactor de línea para DOL; contactor de línea + contactor de estrella cerrado + contactor de delta abierto para Y-Δ; contactor de línea + autotransformador con su derivación marcada + contactor de bypass abierto para autotransformador— junto con las lecturas de corriente de línea Ilínea y par de arranque Tarranque en las cajas de despliegue digital."
  - "Con el método Autotransformador seleccionado, mueve el control deslizante de derivación a (0.35 ≤ a ≤ 1.0) y verifica que Ilínea y Tarranque escalan con a² (confirmado por recómputo exacto con `node -e`: en a=1.0, Ilínea=ILR y Tarranque=TLR, idéntico a DOL; en a=0.65, Ilínea=ILR·0.4225 y Tarranque=TLR·0.4225)."
  - "Modo Comparar: superpone los tres métodos sobre la misma gráfica de corriente de línea y par de arranque contra la derivación a, con las derivaciones típicas de un autotransformador comercial (50/65/80 %) marcadas como referencia, y localiza el punto donde la curva del autotransformador cruza exactamente el nivel fijo de estrella-delta — ese cruce ocurre en a=1/√3≈0.5774 (verificado: k=a²=1/3 exactamente en ese punto, idéntico al k=1/3 fijo de Y-Δ)."
  - "Verifica la asimetría del autotransformador leyendo, en el mismo punto de operación, tanto la corriente de línea (reducida por a²) como la corriente del lado del motor (reducida solo por a) — por ejemplo en a=0.65: Ilínea=ILR·0.4225≈2.74× la nominal, mientras que Imotor=ILR·0.65≈4.23× la nominal, ambas mayores que la corriente de línea porque el autotransformador reduce la corriente vista desde la línea más de lo que reduce la corriente que realmente circula por el devanado del motor."
  - "Modo Reto: con un método y algunos datos fijados por el simulador (visibles en el tablero, ocultando la gráfica y la telemetría hasta resolver), calcula según el tipo de pregunta la corriente de línea, el par de arranque o la derivación necesaria para cumplir un límite dado, y verifica tu respuesta con la tolerancia indicada."
normatividad:          # 🔒 normas ancla citadas de forma general, sin cláusula específica verificada
  - "IEC 60947-4-1 'Low-voltage switchgear and controlgear — Part 4-1: Contactors and motor-starters' — norma ancla listada en la fila d5-07 de la lista maestra; ⚑ no se verificó una cláusula específica de esta norma contra el texto primario en esta sesión — citada como referencia general del alcance de un gabinete de arranque real, no como fuente literal de los valores numéricos del simulador."
  - "NEMA ICS (International Symbol/Industrial Control and Systems), familia de normas de equipo de control industrial en Norteamérica — norma ancla listada en la fila d5-07 de la lista maestra; ⚑ no se identificó ni verificó el número de parte específico aplicable — pendiente de confirmación experta antes de citar una cláusula concreta."
  - "Teoría estándar de arranque de motores de inducción (reducción de corriente y par de arranque por el cuadrado de la razón de tensión aplicada; equivalencia estrella-delta ↔ autotransformador) — consistente con textos de referencia ampliamente usados en el sector (p. ej. Fitzgerald/Kingsley/Umans, 'Electric Machinery'; Chapman, 'Máquinas Eléctricas')."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "La reducción multiplicativa de corriente de línea y par de arranque respecto al arranque directo (DOL) para los tres métodos: k=1 (DOL), k=1/3 fijo (Y-Δ), k=a² ajustable (autotransformador, 0.35≤a≤1.0) — verificado por recomputación exacta con `node -e` de `calc()` contra el código fuente de arranque-motor-induccion.body.js: DOL→{Ilínea:6.5, Tarranque:1.5}; Y-Δ→{Ilínea:2.1667, Tarranque:0.5}; Autotransformador en a=0.65→{Ilínea:2.7463, Tarranque:0.6338}."
  - "La asimetría exclusiva del autotransformador entre la corriente de línea (Ilínea=ILR·a²) y la corriente del lado del motor (Imotor=ILR·a) — verificada numéricamente: en a=0.65, Ilínea≈2.746× la nominal frente a Imotor≈4.225× la nominal; en a=1.0 (equivalente a DOL) ambas coinciden exactamente en ILR, como debe ser."
  - "El punto de equivalencia exacto a=1/√3≈0.57735 entre autotransformador y estrella-delta — verificado algebraicamente (a²=1/3 ⟺ a=1/√3) y numéricamente con `node -e` (k=0.333333... en ese punto exacto, idéntico al k=1/3 de Y-Δ, con diferencia menor a 1×10⁻¹⁵ atribuible a redondeo de punto flotante)."
  - "Un tablero esquemático (canvas 2D sobre panel 3D) con tres disposiciones de gabinete de arranque distintas según el método (DOL: un contactor; Y-Δ: tres contactores con dos estados fijos; autotransformador: tres contactores con la derivación variable etiquetada), más una gráfica en vivo de Ilínea y Tarranque contra a con las derivaciones típicas (50/65/80 %) marcadas como referencia — toda telemetría se deriva siempre de `calc()`, nunca de una tabla precalculada."
  - "Modo Reto con tres tipos de pregunta (Ilínea, Tarranque, derivación a necesaria) que enmascaran la gráfica, el marcador y la telemetría numérica hasta que el estudiante responde — y, adicionalmente, enmascaran la etiqueta de derivación del esquemático solo cuando el dato buscado es la propia derivación (no cuando el método y la derivación son datos dados y lo que se pide es Ilínea o Tarranque)."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "El circuito eléctrico equivalente del motor de inducción, ni la relación V/f, ni la curva par-velocidad completa durante la aceleración — el simulador evalúa cada método únicamente en el instante de rotor bloqueado (arranque, s=1), reutilizando los múltiplos de placa ILR/TLR como datos de entrada, sin recalcularlos desde un circuito; el circuito equivalente es el objeto de la práctica siguiente del programa (d5-08)."
  - "La dinámica transitoria de la conmutación entre etapas de arranque (pico de corriente al abrir/cerrar contactores durante la transición Y→Δ o autotransformador→línea, especialmente en transición abierta) — el simulador solo muestra el estado ya establecido de cada etapa, nunca el instante de conmutación entre ellas."
  - "La caída de tensión que la propia corriente de irrupción provoca en la fuente de alimentación — el simulador asume una fuente ideal que nunca se abate, sin importar la corriente de irrupción calculada para ningún método."
  - "El calentamiento del devanado, el ciclo de trabajo permitido del equipo de arranque, ni la lógica de control real (temporizador de transición, enclavamiento entre contactores) — se asumen correctos y no se modelan como circuito de control aparte."
  - "Arrancadores suaves de estado sólido (soft-starters) ni variadores de frecuencia (VFD) — un cuarto método de arranque común en la industria, explícitamente fuera del alcance de esta práctica, que se limita a los tres métodos electromecánicos clásicos (directo, estrella-delta, autotransformador)."
  - "Las derivaciones físicas discretas de un autotransformador real (típicamente 3-4 posiciones fijas, cambiadas con el equipo desenergizado) — el control deslizante continuo de a en el simulador es una simplificación pedagógica para explorar la fórmula k=a², no una operación realizable en vivo sobre un autotransformador comercial."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Tabla de los tres métodos de arranque con su corriente de línea y par de arranque resultantes para el mismo motor (incluyendo al menos una derivación de autotransformador distinta de a=1 y de a=1/√3), el registro del punto de equivalencia autotransformador↔estrella-delta encontrado en modo Comparar, y la predicción resuelta del modo Reto con su fórmula de respaldo."
evidencia_desempeno: "Guía de observación de la identificación correcta de cada disposición de gabinete de arranque, de la explicación verbal de por qué el autotransformador reduce distinto la corriente de línea que la del motor, del hallazgo razonado (no por ensayo y error) de la derivación de equivalencia a=1/√3, y de la justificación numérica de la respuesta del modo Reto con la fórmula correspondiente."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué un motor de inducción con el rotor detenido se comporta como un transformador en corto, y por qué reducir esa corriente de irrupción siempre cuesta par de arranque disponible (briefing.ts)."
desarrollo: "Práctica en el simulador: Explora (compara los tres esquemáticos de arrancador y sus lecturas para el mismo motor) → Comparar (superpone los tres métodos sobre la gráfica de Ilínea/Tarranque contra la derivación y ubica el punto de equivalencia autotransformador↔estrella-delta) → Reto (calcula Ilínea, Tarranque o la derivación necesaria de un escenario dado) → recorrido guiado automático como referencia."
cierre: "Ficha técnica (capa 2) con la tabla de ecuaciones de los tres métodos, el contrato de fidelidad completo (SÍ/NO modela) y la aclaración de que ILR, TLR y las derivaciones típicas son valores ilustrativos del simulador, no de un datasheet real, y que el circuito eléctrico equivalente del motor se deja para d5-08."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Teoría estándar de arranque de motores de inducción (reducción de corriente/par de arranque por el cuadrado de la razón de tensión aplicada, k=1/3 fijo de estrella-delta, equivalencia algebraica con autotransformador) — consistente con textos de referencia ampliamente usados en el sector (Fitzgerald/Kingsley/Umans; Chapman)."
  - "⚑ IEC 60947-4-1 (contactores y arrancadores de motor) — norma ancla listada en la lista maestra; no se verificó una cláusula específica contra el texto primario en esta sesión."
  - "⚑ NEMA ICS (equipo de control industrial) — norma ancla listada en la lista maestra; no se identificó el número de parte específico ni se verificó una cláusula contra el texto primario en esta sesión."
banderas_incertidumbre:
  - "⚑ La clave SINCO 2641/7541 se reutiliza de d5-01..06/D2/D10 — confirmar si existe una clave SINCO más específica de especificación/mantenimiento de arrancadores de motor antes de publicar la trazabilidad."
  - "⚑ Las dos normas ancla (IEC 60947-4-1, NEMA ICS) se citan sin cláusula ni número de parte específico porque la lista maestra no los detalla — confirmar con el experto la cláusula/parte exacta aplicable antes de publicar la práctica a escala."
  - "⚑ Los múltiplos de arranque directo ILR=6.5 y TLR=1.5, y las derivaciones típicas de autotransformador [50%, 65%, 80%], son valores ilustrativos del simulador —consistentes con el orden de magnitud típico de un motor NEMA Diseño B— pero NO corresponden a la placa de un motor comercial real; confirmar con el experto si conviene sustituirlos por los de un motor de catálogo real en una futura iteración."
  - "⚑ El simulador no modela la lógica de control real del gabinete (temporizador de transición, enclavamiento KY/KΔ) ni el transitorio de conmutación entre etapas — confirmar con el experto si esta omisión debe señalarse más explícitamente en el HUD in-app, más allá de la ficha técnica y esta ficha de revisión."
  - "✅ Verificación de implementación: física verificada por recomputación ejecutada con `node -e` (no a mano) de `calc()`/`kOf()` contra los tres métodos y varias derivaciones, incluyendo el punto de equivalencia exacto a=1/√3 y la asimetría Ilínea≠Imotor del autotransformador. Pendiente al momento de escribir esta ficha: corrida completa de Jest tras `npm run gen:labs` (snapshots dorados actualizados a mano en los puntos de inserción exactos, nunca con `jest -u`), `tsc --noEmit`, y verificación funcional con Playwright contra el HTML construido y servido localmente (los 3 modos, los 3 métodos de arranque, el barrido de derivación, el punto de equivalencia, el modo Reto con sus tres tipos de pregunta y su enmascaramiento, y el recorrido guiado automático, 0 errores de consola/página esperados) — completar antes del commit final y actualizar esta nota con el resultado exacto.
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (séptima práctica de D5, continuación directa de d5-06):**
   d5-06 dejó explícitamente fuera de alcance el transitorio de arranque y los métodos de
   arranque reducido, declarándolos como el objeto de esta práctica siguiente. d5-07 los
   retoma como tema central: compara, para el mismo motor, arranque directo, estrella-delta
   y autotransformador, usando únicamente los múltiplos de placa de corriente y par de
   arranque (ILR, TLR) como datos de entrada — sin derivar el circuito eléctrico equivalente
   del motor, que sigue reservado para d5-08 ("Deriva el circuito equivalente del motor de
   inducción por ensayos").
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/arranque-motor-induccion.html](../../../public/labs/arranque-motor-induccion.html))
   muestra el HUD con las fórmulas de los tres métodos y el estado del modo actual —
   documentado en la sección 5 de la ficha técnica in-app
   ([_ficha-arranque-motor-induccion.js](../../../public/labs/_ficha-arranque-motor-induccion.js))
   y en el encabezado de fidelidad del propio archivo fuente
   (`arranque-motor-induccion.body.js`).
3. **Verificación de implementación:** ✅ Física verificada por recomputación ejecutada con
   `node -e` (no a mano) de `calc()`/`kOf()` para los tres métodos y varias derivaciones,
   incluyendo el punto de equivalencia exacto a=1/√3≈0.57735 y la asimetría Ilínea≠Imotor
   exclusiva del autotransformador. Pendiente al momento de escribir esta ficha: corrida
   completa de Jest tras `npm run gen:labs`, `tsc --noEmit`, y verificación funcional con
   Playwright contra el HTML construido y servido localmente — completar antes del commit
   final y actualizar esta nota con el resultado exacto.
4. **Petición concreta al experto:** (a) confirmar el número de parte específico de NEMA ICS
   aplicable a arrancadores de motor, ya que la lista maestra la cita solo como familia
   general; (b) confirmar si los múltiplos de arranque ilustrativos (ILR=6.5, TLR=1.5) y las
   derivaciones típicas de autotransformador (50/65/80 %) deberían sustituirse por los de un
   motor y un fabricante de catálogo real en una futura iteración; (c) confirmar si el
   alcance decidido —excluir la dinámica transitoria de conmutación y el circuito eléctrico
   equivalente del motor, dejando este último para d5-08— es pedagógicamente correcto; (d)
   confirmar si existe una clave SINCO más específica que la reutilizada de la familia
   D2/D10/d5-01..06 para especificación o mantenimiento de arrancadores de motor.
