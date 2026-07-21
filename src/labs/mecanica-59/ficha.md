# Ficha de práctica — Frenado Dinámico, Regenerativo y a Contracorriente (`mecanica-59`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** decimosexta y **última** práctica del dominio D5 (Transformadores/
> Máquinas eléctricas) — d5-16 de 16. Con este lab **el dominio D5 cierra 16/16**. Es la
> tercera práctica de molde S+P consecutiva del tramo final de D5 (tras d5-13 variador V/f,
> d5-14 conmutación BLDC/PMSM), pero a diferencia de casi todas las prácticas anteriores del
> dominio, **esta fila NO tiene norma ancla asignada** en la lista maestra (columna "Norma
> ancla" = "—"), así que las constantes del motor son ilustrativas y el contrato de fidelidad
> lo deja explícito en cada capa (HUD, ficha in-app, esta ficha).

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-59
sector: mecanica-electronica
practica_maestra: "d5-16 — Compara frenados dinámico, regenerativo y a contracorriente (molde S+P) — tomado literalmente de la fila d5-16 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ELE-II (liga mecanica-8) — tomado literalmente de la columna 'Trazabilidad' de la fila d5-16 en docs/LISTA-MAESTRA-200-PRACTICAS.md. El '(liga mecanica-8)' es una referencia conceptual: la energía recuperada en frenado regenerativo podría almacenarse en un banco de baterías como el de mecanica-8, pero este simulador no modela esa batería ni una conexión mecánica/eléctrica directa entre ambos laboratorios — el vínculo se declara así, explícitamente, en el HUD del simulador y en esta ficha."
norma_ancla_lista_maestra: "— (sin norma ancla asignada) — tomado literalmente de la columna 'Norma ancla' de la fila d5-16 en docs/LISTA-MAESTRA-200-PRACTICAS.md. A diferencia de d5-15 (con norma ancla real IEC 60947-4-1), esta fila no tiene una norma ancla asignada; las constantes físicas del motor (J=0.6 kg·m², Ra=0.3 Ω, kφ=1.2 V·s/rad) y los multiplicadores ilustrativos de contracorriente (energía 3×, corriente pico ≈6×) son valores de diseño del laboratorio para un orden de magnitud pedagógicamente razonable, contrastados con literatura general de máquinas eléctricas y con el rango de NEMA MG-1 para corriente durante arranque/frenado a contracorriente, pero no citan una cláusula numerada específica."
modulo: "Transformadores (D5)"
submodulo: "Frenado eléctrico de motores: comparación energética y de corriente pico entre frenado dinámico, regenerativo y a contracorriente (molde S+P — decimosexta y última práctica del dominio D5, cierra el dominio 16/16)"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ código reutilizado de d5-01..15/D2/D10 (mismo perfil ocupacional general de electricidad/electrónica); confirmar si existe una clave SINCO más específica de control de frenado de motores antes de publicar la trazabilidad
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de calcular la energía cinética Ek=½Jω² almacenada
  en un motor y su carga a una velocidad dada; explicar y calcular, para frenado dinámico, la
  constante de tiempo τ, el tiempo de frenado al 95% (t95) y el reparto exacto de la energía
  disipada entre la resistencia externa y la interna del motor; explicar y calcular, para
  frenado regenerativo, la energía recuperada y la perdida según una eficiencia de conversión
  η; explicar y calcular, para frenado a contracorriente, la energía total disipada bajo el
  supuesto idealizado sin carga (3×Ek) y reconocer por qué el valor real bajo carga cae en un
  rango de 2×–3×; y comparar los tres métodos en términos de velocidad de paro, eficiencia
  energética y corriente pico para decidir cuál conviene en una aplicación dada.
actividad_clave: >
  Explora cada uno de los tres métodos de frenado por separado (modo Explora), ajustando la
  velocidad inicial del motor y el parámetro propio de cada método (resistencia externa para
  dinámico, eficiencia de conversión para regenerativo — el frenado a contracorriente no tiene
  parámetro ajustable adicional, solo la velocidad inicial) mientras el pizarrón dibuja la
  gráfica de energía correspondiente; compara los tres métodos lado a lado para la misma
  velocidad inicial (modo Comparar), incluida una gráfica de corriente pico ilustrativa; y
  resuelve un modo Reto con tres tipos de escenario —uno por método— que piden calcular la
  energía disipada externamente, la energía recuperada, o la energía total disipada.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modo Explora — frenado dinámico: con velocidad inicial rpm0=1800 y resistencia externa Rext=2Ω (valores por defecto), el simulador calcula Ek=10659.17 J, τ=0.9583 s, t95=2.8709 s, y reparte la energía en Eext=9268.85 J (86.96%) hacia la resistencia externa y Eint=1390.33 J (13.04%) hacia la resistencia interna del motor — verificado por recomputación independiente ejecutada con `node -e` a partir de las fórmulas Ek=½Jω², τ=J(Rext+Ra)/kφ², t95=τ·ln(20), fracExt=Rext/(Rext+Ra)."
  - "Modo Explora — frenado dinámico, curva de velocidad: la curva ω(t)=ω₀e^(−t/τ) se evalúa en t=t95 y produce ω(t95)/ω₀=0.0500, confirmando por recomputación independiente con `node -e` que la definición de t95 (tiempo al 95% de la caída, es decir 5% de la velocidad remanente) es consistente con τ·ln(20)."
  - "Modo Explora — frenado regenerativo: con velocidad inicial rpm0=1800 y eficiencia η=0.75 (valor por defecto del deslizador, rango 60%–90%), el simulador calcula Erec=7994.38 J recuperados y Eperd=2664.79 J perdidos sobre la misma Ek=10659.17 J — verificado por recomputación con `node -e` (Erec=η·Ek, Eperd=(1−η)·Ek)."
  - "Modo Explora — frenado a contracorriente: con velocidad inicial rpm0=1800, el simulador calcula Edis=31977.52 J disipados, es decir 3×Ek bajo el supuesto idealizado sin carga — verificado por recomputación con `node -e` (Edis=3·Ek); el HUD y la ficha in-app declaran explícitamente que este 3× es un caso sin carga y que el rango real bajo carga es 2×–3×, no un valor único."
  - "Modo Comparar: el pizarrón dibuja, para la misma velocidad inicial elegida por el usuario, las tres gráficas de energía lado a lado (dinámico con su reparto externo/interno, regenerativo con su reparto recuperado/perdido, a contracorriente con su energía total disipada) y una gráfica de corriente pico ilustrativa con multiplicadores relativos 1.5× (dinámico), 1.2× (regenerativo) y 6× (a contracorriente) — estos multiplicadores de corriente son valores ilustrativos, declarados como tales en el HUD y la ficha in-app, con el 6× de a contracorriente contrastado en orden de magnitud contra el rango 500%–800% de FLA que reporta NEMA MG-1 §14.46/§18.224."
  - "Modo Reto: el simulador elige al azar uno de tres tipos de escenario (energía externa en frenado dinámico, energía recuperada en frenado regenerativo, energía total disipada a contracorriente) con parámetros aleatorios dentro de los rangos de los deslizadores (único uso de aleatoriedad en la práctica), y el estudiante introduce la respuesta numérica dentro de una tolerancia — verificado por recomputación independiente con `node -e` que la respuesta objetivo de cada tipo de escenario coincide exactamente con la salida de las funciones `dinamico()`, `regen()` y `contra()` para los mismos parámetros."
normatividad:          # 🔒 sin norma ancla real — revisión experta obligatoria antes de publicar
  - "⚑ Esta práctica (fila d5-16 de la lista maestra) NO tiene una norma ancla asignada — la columna 'Norma ancla' de esa fila está vacía ('—'). No existe una cláusula normativa específica que este simulador implemente de forma literal; es la primera práctica del tramo final de D5 sin norma ancla desde d5-10 (motor monofásico)."
  - "⚑ El multiplicador de energía disipada a contracorriente (3×Ek) es un caso idealizado sin carga, consistente cualitativamente con el tratamiento de frenado a contracorriente en Fitzgerald/Kingsley/Umans 'Electric Machinery' y Chapman 'Electric Machinery Fundamentals', que reportan un rango real de 2×–3× según la carga mecánica — el simulador declara esto explícitamente, tanto en el HUD como en la ficha técnica in-app."
  - "⚑ El multiplicador de corriente pico ilustrativo a contracorriente (≈6×) está en el orden de magnitud del rango 500%–800% de FLA que reporta NEMA MG-1 §14.46/§18.224 para protección durante arranque/frenado a contracorriente; no se cita aquí una cláusula numerada específica de esa norma, solo el orden de magnitud general."
  - "⚑ La eficiencia de recuperación regenerativa (η) es un parámetro instantáneo ilustrativo, en orden de magnitud consistente con informes técnicos de fabricantes de variadores (Rockwell Automation, DRIVES-WP007A-EN-P); la recuperación neta real de un ciclo completo de frenado suele ser menor (10%–40%) por pérdidas de conversión no modeladas — el simulador declara esta diferencia explícitamente."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "La energía cinética Ek=½Jω² a partir de la velocidad inicial elegida por el usuario, para los tres métodos de frenado — verificado por recomputación con `node -e`."
  - "La solución exacta de primer orden del frenado dinámico: constante de tiempo τ=J(Rext+Ra)/kφ², tiempo de frenado al 95% t95=τ·ln(20), la curva exacta ω(t)=ω₀e^(−t/τ), y el reparto exacto de la energía disipada entre la resistencia externa (fracExt=Rext/(Rext+Ra)) y la interna del motor (fracInt=Ra/(Rext+Ra)) — verificado por recomputación con `node -e`, incluida la consistencia entre t95 y ω(t95)/ω₀=0.05."
  - "El reparto de energía recuperada/perdida en frenado regenerativo según la eficiencia η ajustada por el usuario (Erec=η·Ek, Eperd=(1−η)·Ek) — verificado por recomputación con `node -e`."
  - "El multiplicador idealizado de energía disipada a contracorriente (Edis=3·Ek, caso sin carga) — verificado por recomputación con `node -e`, con la caveat explícita en HUD/ficha de que el rango real bajo carga es 2×–3×."
  - "Los tres tipos de escenario del modo Reto, cuya respuesta objetivo se calcula con las mismas funciones `dinamico()`, `regen()` y `contra()` que usa el resto del simulador (ninguna fórmula duplicada o divergente) — verificado por recomputación independiente con `node -e`."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "La electrónica real de un inversor regenerativo (front-end activo, armónicos, dinámica del bus de CD, factor de potencia hacia la red) — el simulador resume toda la conversión en una sola eficiencia η ajustable."
  - "El dimensionamiento térmico sostenido de un banco de resistencias de frenado dinámico real (potencia promedio, ciclo de trabajo, curva de derateo por temperatura) — el simulador calcula solo la energía total de un único evento de frenado."
  - "La dinámica mecánica y eléctrica real del frenado a contracorriente bajo carga — el 3× que usa el simulador es el caso idealizado sin carga; con carga real el rango reportado en la literatura es de 2× a 3×, no un valor único."
  - "La coordinación de protecciones (fusibles, capacidad de interrupción de contactores, ajuste de relevadores de sobrecorriente) durante el pico de corriente a contracorriente — el simulador solo ilustra el orden de magnitud del pico."
  - "Una conexión mecánica o eléctrica literal con el banco de baterías de mecanica-8 — el vínculo 'ELE-II (liga mecanica-8)' de la trazabilidad es conceptual (a dónde podría ir la energía recuperada), no una extensión directa de ese laboratorio; el simulador no modela ninguna batería."
  - "Las constantes del motor (J, Ra, kφ) no son datos de placa de un motor real — son valores de diseño ilustrativos del laboratorio, declarados como tales porque esta práctica no tiene norma ancla asignada."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Registro de la energía cinética y el reparto de energía calculados en modo Explora para cada uno de los tres métodos de frenado a una velocidad inicial dada, captura de la comparación lado a lado del modo Comparar (energía y corriente pico de los tres métodos), y el escenario resuelto correctamente en modo Reto."
evidencia_desempeno: "Guía de observación de la explicación correcta de a dónde va la energía cinética en cada uno de los tres métodos de frenado, de la lectura correcta de la curva de decaimiento exponencial y su tiempo al 95%, de la comparación razonada de los tres métodos en términos de velocidad de paro/eficiencia/corriente pico, y de la justificación numérica usada para resolver el escenario del modo Reto."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué la energía cinética de un motor que se detiene tiene que ir a algún lado, y cómo esa pregunta define tres estrategias distintas de frenado eléctrico —dinámico, regenerativo y a contracorriente— con compromisos distintos entre velocidad de paro, eficiencia energética y agresividad sobre el equipo (briefing.ts)."
desarrollo: "Práctica en el simulador: Explora (elige un método, ajusta velocidad inicial y su parámetro propio, observa el reparto de energía en el pizarrón) → Comparar (observa los tres métodos lado a lado para la misma velocidad inicial, incluida la corriente pico ilustrativa) → Reto (resuelve un escenario curado por método) → recorrido guiado automático que recorre los tres métodos en Explora, pasa por Comparar y termina resolviendo un Reto de referencia."
cierre: "Ficha técnica (capa 2) con la tabla de constantes y multiplicadores ilustrativos, el contrato de fidelidad completo (SÍ/NO modela) y la aclaración explícita de que esta práctica no tiene norma ancla asignada y de que el vínculo con mecanica-8 es conceptual, no una extensión directa del mismo motor."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "⚑ Esta práctica (fila d5-16) no tiene norma ancla asignada en la lista maestra ('—'). No hay una cláusula normativa específica que citar como fuente primaria del contrato de fidelidad."
  - "✅ Fitzgerald/Kingsley/Umans, 'Electric Machinery' — tratamiento estándar de frenado dinámico, regenerativo y a contracorriente en máquinas eléctricas; consistente cualitativamente con el rango 2×–3× de energía disipada a contracorriente bajo carga."
  - "✅ Chapman, 'Electric Machinery Fundamentals' — mismo tratamiento estándar de los tres métodos de frenado eléctrico, usado para contrastar el orden de magnitud del multiplicador de energía a contracorriente."
  - "⚑ NEMA MG-1 §14.46/§18.224 — usado únicamente para contrastar el orden de magnitud del multiplicador de corriente pico ilustrativo a contracorriente (rango 500%–800% de FLA); no se cita una cláusula numerada exacta como fuente del valor 6× usado en el simulador."
  - "⚑ Rockwell Automation, DRIVES-WP007A-EN-P (whitepaper técnico sobre frenado regenerativo en variadores) — usado únicamente para contrastar el orden de magnitud de la eficiencia de conversión η; no se cita como fuente de un valor exacto."
banderas_incertidumbre:
  - "⚑ La clave SINCO 2641/7541 se reutiliza de d5-01..15/D2/D10 — confirmar si existe una clave SINCO más específica de frenado/control de motores antes de publicar la trazabilidad."
  - "⚑ Esta práctica no tiene norma ancla asignada — confirmar con el experto si existe una norma aplicable más específica (p. ej. una sección de NEMA MG-1 o IEC 60034 dedicada explícitamente a frenado) que debiera adoptarse como ancla en una futura iteración de la lista maestra, o si la ausencia de norma ancla es la decisión correcta a mantener para esta fila."
  - "⚑ El multiplicador de energía a contracorriente (3×, idealizado sin carga) y el multiplicador de corriente pico (≈6×, ilustrativo) son valores de diseño del laboratorio — confirmar con el experto si convendría anclar alguno de los dos a una fuente numérica específica y citable en vez de un orden de magnitud general."
  - "⚑ El vínculo 'ELE-II (liga mecanica-8)' de la trazabilidad se implementó como una mención conceptual en el HUD, no como una integración funcional con el laboratorio mecanica-8 — confirmar con el experto si esa es la interpretación correcta de la columna 'Trazabilidad' de la lista maestra o si se esperaba algún tipo de integración más directa."
  - "✅ Verificación de implementación: `Ek`, `dinamico`, `regen`, `contra`, `omegaT` y los tres tipos de escenario del modo Reto verificados por recomputación ejecutada con `node -e` (no a mano) — incluida la consistencia entre t95 y ω(t95)/ω₀=0.05. Pendiente al momento de escribir esta ficha: corrida completa de Jest tras `npm run gen:labs` (snapshots dorados actualizados a mano en los puntos de inserción exactos, nunca con `jest -u`), `tsc --noEmit`, y verificación funcional con Playwright contra el HTML construido y servido localmente (los tres modos, la comparación, el modo Reto con sus tres tipos de escenario, y el recorrido guiado automático, 0 errores de consola/página esperados) — completar antes del commit final y actualizar esta nota con el resultado exacto."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (decimosexta y última práctica de D5 — cierra el dominio
   16/16):** d5-16 compara los tres métodos clásicos de frenado eléctrico de un motor —
   dinámico, regenerativo y a contracorriente— usando un modelo físico de forma cerrada
   (energía cinética, solución exacta de primer orden para frenado dinámico, reparto por
   eficiencia para regenerativo, multiplicador idealizado para a contracorriente) en vez de
   una simulación numérica paso a paso. La decisión de diseño más importante de esta práctica
   es que, a diferencia de la mayoría de las prácticas del tramo final de D5, **no tiene una
   norma ancla asignada** en la lista maestra — por eso todas las constantes del motor y los
   multiplicadores de contracorriente están marcados explícitamente como ilustrativos, tanto
   en el HUD del simulador como en la ficha técnica in-app y en esta ficha, contrastados solo
   en orden de magnitud contra literatura general de máquinas eléctricas (Fitzgerald/Kingsley,
   Chapman) y contra NEMA MG-1 para la corriente pico.
2. **El vínculo "ELE-II (liga mecanica-8)":** la columna Trazabilidad de la fila d5-16 en la
   lista maestra menciona explícitamente una liga con mecanica-8 (el laboratorio de
   almacenamiento en batería). Esta práctica interpreta esa liga como **conceptual**: el HUD
   del simulador menciona que la energía recuperada en frenado regenerativo podría
   almacenarse en un banco de baterías como el de mecanica-8, pero no hay ninguna integración
   funcional, mecánica ni eléctrica entre ambos laboratorios — mecanica-59 no importa ni
   depende de ningún estado de mecanica-8. Esta interpretación debe confirmarse con el
   experto (ver bandera de incertidumbre correspondiente).
3. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/frenado-dinamico-regenerativo-contracorriente.html](../../../public/labs/frenado-dinamico-regenerativo-contracorriente.html))
   muestra el HUD con el contrato de fidelidad y la aclaración de ausencia de norma ancla —
   documentado en la sección 5 de la ficha técnica in-app
   ([_ficha-frenado-dinamico-regenerativo-contracorriente.js](../../../public/labs/_ficha-frenado-dinamico-regenerativo-contracorriente.js))
   y en el encabezado de fidelidad del propio archivo fuente
   (`frenado-dinamico-regenerativo-contracorriente.body.js`).
4. **Verificación de implementación:** ✅ Datos verificados por recomputación ejecutada con
   `node -e` (no a mano): Ek, la solución exacta de frenado dinámico (incluida la consistencia
   t95↔ω(t95)/ω₀=0.05), el reparto regenerativo por η, el multiplicador de contracorriente, y
   los tres tipos de escenario del modo Reto contra las mismas funciones del simulador.
   Pendiente al momento de escribir esta ficha: corrida completa de Jest tras
   `npm run gen:labs`, `tsc --noEmit`, y verificación funcional con Playwright contra el HTML
   construido y servido localmente — completar antes del commit final y actualizar esta nota
   con el resultado exacto.
5. **Petición concreta al experto:** (a) confirmar si existe una norma más específica sobre
   frenado eléctrico de motores (p. ej. una sección de IEC 60034 o una edición más reciente de
   NEMA MG-1) que debiera adoptarse como ancla de esta fila en una futura revisión de la lista
   maestra; (b) confirmar si el multiplicador idealizado de energía a contracorriente (3×) y el
   de corriente pico (≈6×) deberían citarse con una fuente numérica más específica; (c)
   confirmar si la interpretación conceptual (no funcional) del vínculo con mecanica-8 es la
   correcta; (d) confirmar si existe una clave SINCO más específica que la reutilizada de la
   familia D2/D10/d5-01..15 para frenado/control de motores. **Con la resolución de esta
   práctica, el dominio D5 (Transformadores y máquinas eléctricas) queda completo en 16/16.**
