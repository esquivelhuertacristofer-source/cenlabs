# Ficha de práctica — Transitorio RL y Sobretensión Inductiva: el Diodo de Rueda Libre (`mecanica-65`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** segunda práctica del sector con **osciloscopio simulado como
> instrumento de medición manual** (base de tiempo seleccionable + cursor deslizante),
> directamente hermana de `mecanica-64` (d1-06) pero con el circuito dual RL en vez de
> RC. Introduce un **tercer estado de traza no medible** (interrupción sin diodo de
> rueda libre) que `mecanica-64` no tenía: un escenario donde el instrumento
> deliberadamente NO ofrece una medición, para modelar honestamente un colapso de
> corriente que no tiene una τ físicamente significativa que leer.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-65
sector: mecanica-electronica
practica_maestra: "d1-07 — Analiza el transitorio RL y la sobretensión inductiva (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "MEC-I.1"   # ⚑ confirmar clave exacta del plan vigente (LISTA-MAESTRA-200-PRACTICAS.md, fila d1-07)
modulo: "Circuitos eléctricos CD y CA (D1)"
submodulo: "Régimen transitorio de circuitos de primer orden — caso inductivo"          # ⚑ confirmar clave exacta
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de predecir la constante de tiempo τ=L/R de un
  circuito RL serie de primer orden (identificando su relación INVERSA con R, opuesta a
  la relación directa de τ=R·C), seleccionar una base de tiempo de osciloscopio adecuada
  y medir τ manualmente con un cursor sobre la traza de energización o de interrupción
  protegida, explicar por qué interrumpir la corriente de un inductor sin una ruta
  alterna (diodo de rueda libre) produce una sobretensión destructiva no medible con
  este instrumento, y aplicar la medición de τ para caracterizar experimentalmente una
  bobina de inductancia desconocida a partir de una resistencia conocida (L=τ_medido·R).
actividad_clave: >
  Explora un circuito RL serie visible (R, L, fuente de 12 V, diodo de rueda libre
  conmutable) alternando entre energizar e interrumpir, y con el diodo presente o
  ausente durante la interrupción, observando cómo τ=L/R responde de forma inversa a R
  (a diferencia de τ=R·C en mecanica-64); en el modo Sobretensión, elige entre tres
  bases de tiempo ofrecidas —una demasiado rápida, una demasiado lenta y una correcta—
  y mide τ arrastrando un cursor hasta el cruce del 63.2 %/36.8 %, solo disponible
  cuando el diodo de rueda libre está presente (sin él, el sistema explica por qué no
  hay τ que medir en vez de aceptar una lectura inválida); y en el reto, caracteriza
  una bobina sellada —solo R es visible, el diodo queda fijo y presente por
  seguridad— midiendo τ con el cursor y calculando L=τ·R, validado contra una
  tolerancia pedagógica sin revelar el valor real de L si la respuesta es incorrecta.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modo Explora: sobre un circuito RL serie visible (fuente V=12 V fija, resistor R seleccionable de un banco de 4 valores E12, bobina L seleccionable de 4 valores comerciales típicos en mH), alterna entre fase de energización (v_R(t)=V(1−e^(−t/τ))) e interrupción, y dentro de interrupción alterna el diodo de rueda libre presente/ausente, observando la traza resultante en el osciloscopio simulado con la base de tiempo ajustada automáticamente a un valor razonable para la τ actual."
  - "Confirma que duplicar L duplica τ pero duplicar R reduce τ a la mitad (relación τ=L/R inversamente proporcional a R), a diferencia de la relación directamente proporcional τ=R·C ya explorada en mecanica-64 — un contraste conceptual deliberado entre ambas prácticas hermanas."
  - "Modo Sobretensión: con el diodo de rueda libre presente, selecciona entre tres bases de tiempo (µs/div o ms/div, secuencia realista 1-2-5 como el dial de mecanica-64) —una deliberadamente demasiado rápida, una demasiado lenta y una calibrada para que la ventana completa cubra aproximadamente 5τ— y con la base correcta, arrastra el cursor hasta el cruce del 36.8 % de V (curva de interrupción) o el 63.2 % (curva de energización) y presiona 'Medir τ'; el sistema compara la lectura contra τ=L/R calculado con retroalimentación de ±6 %."
  - "Con el diodo de rueda libre ausente durante la interrupción, el osciloscopio muestra un colapso de voltaje forzado y casi instantáneo en vez de una curva exponencial medible, y el botón 'Medir τ' responde con una advertencia explícita explicando que no existe una τ físicamente significativa en ese escenario —en vez de aceptar una medición inválida sobre un colapso arbitrariamente rápido— reforzando por qué la protección de rueda libre es indispensable, no opcional."
  - "Modo Reto: sobre una caja negra donde solo la bobina está sellada (❓, R permanece visible y con su código de colores real, el diodo de rueda libre queda fijo y presente por seguridad, la fase queda fija en interrupción protegida), mide τ con el cursor y calcula L=τ_medido·R usando la R conocida, reportando el resultado en milihenrios; el sistema valida contra una tolerancia relativa (±8 %) sin revelar el valor real de L si la respuesta es incorrecta."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60617 — símbolos gráficos para esquemas eléctricos (fuente, resistor, inductor, diodo y tierra, mismo estándar usado en el esquema del pizarrón de mecanica-64)."
  - "IEC 60063 — series de valores normalizados E12 y código de colores para el resistor del banco 3D (la bobina usa etiqueta impresa, no bandas de color, siguiendo la convención real de inductores de núcleo bobinado)."
  - "MEC-I.1 — transitorio inductivo y sobretensión como resultado de aprendizaje del módulo de circuitos eléctricos CD, con énfasis en la protección de flyback como práctica de seguridad de mantenimiento electromecánico."
simulador_modela:      # 🔒
  - "Respuesta exponencial exacta de un circuito RL serie de primer orden ante un escalón de CD: energización v_R(t)=V(1−e^(−t/τ)) e interrupción protegida v_R(t)=V·e^(−t/τ), con τ=L/R, verificada numéricamente (v_R(τ)=63.2 %V al energizar, v_R(τ)=36.8 %V al interrumpir con diodo)."
  - "Relación inversa τ=L/R frente a R, contrastada explícitamente contra la relación directa τ=R·C de mecanica-64 (misma familia de prácticas, dependencia opuesta)."
  - "Invariante cualitativo del salto de voltaje inductivo en t=0⁺ al interrumpir con diodo de silicio: v_L(0⁺)=−(V+V_f)≈−12.7 V, independiente de R y de L, mostrado como dato de telemetría, no como una curva medible adicional."
  - "Selección realista de base de tiempo de osciloscopio con secuencia de dial 1-2-5, reutilizando exactamente el mismo instrumento simulado de mecanica-64, incluyendo las dos formas típicas de fallar la medición antes de llegar a la elección correcta."
  - "Caracterización experimental de un componente desconocido (L) a partir de un componente conocido (R) y una medición temporal (τ), con verificación cruzada del redondeo de la base de tiempo del dial."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "El valor real de la sobretensión ni la forma de onda de un arco eléctrico al interrumpir sin diodo de rueda libre — el modelo representa ese escenario únicamente como un colapso de voltaje idealizado y casi instantáneo, sin cuantificar un pico de voltaje ni una duración de arco, precisamente porque esa cifra depende de variables no modeladas (separación de contactos, ionización del aire, capacitancias parásitas) y el proyecto no reporta cifras inventadas."
  - "Resistencia de fuente, resistencia interna del interruptor, capacitancia parásita entre espiras de la bobina, ni efecto de carga de la impedancia de entrada del propio osciloscopio sobre el circuito medido — modelo de parámetros concentrados ideal."
  - "Ruido de instrumento, jitter de disparo (trigger) o cuantización propia de un osciloscopio digital real; la traza mostrada es la solución analítica exacta, sin artefactos de muestreo."
  - "Circuitos RL de segundo orden, acoplamiento magnético entre bobinas, ni saturación del núcleo — el laboratorio cubre únicamente el caso de primer orden con un único R y una única L en serie."
  - "Tolerancias reales de fabricación de resistores e inductores (el simulador usa valores nominales exactos, salvo el valor de L en el reto, que es intencionalmente desconocido para el estudiante pero exacto internamente). Las tolerancias de retroalimentación (±6 % en τ para el modo Sobretensión, ±8 % en L para el modo Reto) son un margen pedagógico definido por el ejercicio, no una especificación de fabricante ni de instrumento real."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte del reto: la medición de τ hecha con el cursor del osciloscopio sobre la interrupción protegida, el cálculo de L=τ·R derivado de ella, y el valor de L en milihenrios que el estudiante envía como respuesta."
evidencia_desempeno: "Guía de observación de la selección correcta de base de tiempo antes de medir, de la colocación precisa del cursor sobre el cruce del 63.2 %/36.8 % en la traza, y de la identificación correcta de que la interrupción sin diodo no ofrece una τ medible."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué un inductor se opone a cambios de corriente (v=L·di/dt), y cómo esa oposición se vuelve una sobretensión destructiva al interrumpir la corriente de una bobina sin darle una ruta alterna (briefing.ts)."
desarrollo: "Práctica en el simulador: explora (varía R, L, fase y diodo, observa que τ=L/R responde inverso a R) → sobretensión (elige la base de tiempo correcta y mide τ solo cuando el diodo está presente; observa el colapso no medible sin él) → reto (bobina sellada: mide τ en la interrupción protegida y despeja L=τ·R conociendo solo R)."
cierre: "Ficha técnica (capa 2) con la relación τ=L/R completa, el rol del diodo de rueda libre, sus límites frente al arco eléctrico real, y el procedimiento real de caracterización de una bobina desconocida en campo."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Hayt, W. H., Kemmerly, J. E. y Durbin, S. M. — Análisis de circuitos en ingeniería (McGraw-Hill): capítulo de circuitos de primer orden (RC y RL), respuesta natural y forzada, incluyendo el caso RL con fuente escalón."
  - "Sadiku, M. N. O. — Fundamentos de circuitos eléctricos (McGraw-Hill): sección de respuesta natural y forzada de circuitos RL, constante de tiempo τ=L/R."
  - "Rashid, M. H. — Electrónica de potencia (Pearson): sección de diodos de rueda libre (flyback) en cargas inductivas conmutadas, base del razonamiento de protección de esta práctica."
  - "IEC 60617 — Graphical symbols for diagrams (símbolos normalizados, mismo estándar que mecanica-13/mecanica-61/mecanica-62/mecanica-63/mecanica-64)."
  - "IEC 60063 — Preferred number series for resistors (serie E12) y código de colores para el resistor del banco."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (MEC-I.1 / submodulo / SINCO): claves tomadas del mapeo interno (LISTA-MAESTRA); verificar contra el plan de estudios vigente antes de publicar la trazabilidad."
  - "⚑ Las tolerancias de retroalimentación (±6 % en τ medido, ±8 % en L calculado) son restricciones pedagógicas definidas por el ejercicio, no cifras de instrumento real. Confirmar que el nivel es adecuado para el semestre destino, igual que se preguntó en mecanica-64."
  - "⚑ El voltaje de fuente V (12 V) y la caída directa de diodo asumida (V_f=0.7 V, silicio genérico) se dejan fijos en todos los modos; verificar si el revisor prefiere que sean seleccionables o que se declare explícitamente el tipo de diodo modelado."
  - "⚑ La decisión de NO cuantificar la sobretensión del escenario sin diodo (solo un colapso idealizado casi instantáneo, sin pico de voltaje ni duración de arco) es deliberada para no inventar una cifra sin sustento físico; confirmar que esta honestidad no debilita el impacto pedagógico del riesgo que se busca enseñar, o si el revisor prefiere anclar el mensaje a un rango cualitativo distinto (p. ej. 'cientos a miles de volts' con referencia a literatura de electrónica de potencia)."
  - "⚑ El modo Reto no da retroalimentación de exactitud sobre τ (para no filtrar L indirectamente) — solo evalúa la L final calculada por el estudiante; confirmar que este nivel de opacidad intermedia es pedagógicamente adecuado, igual que se preguntó en las fichas de mecanica-62/mecanica-63/mecanica-64."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (práctica hermana de mecanica-64, con un tercer estado deliberadamente "no medible"):**
   d1-07 reutiliza el osciloscopio simulado introducido en d1-06 (`mecanica-64`), pero
   sobre el circuito dual RL en vez de RC, para reforzar por contraste que τ=L/R es
   inversamente proporcional a R (no directamente, como τ=R·C). La novedad estructural
   es el escenario de interrupción **sin** diodo de rueda libre: a diferencia de toda
   práctica previa de este molde, aquí el instrumento se niega deliberadamente a ofrecer
   una medición de τ, porque no existe una τ físicamente significativa en un colapso de
   corriente forzado por un arco. Es una decisión de honestidad de ingeniería, no una
   limitación técnica del simulador.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/transitorio-rl.html](../../../public/labs/transitorio-rl.html))
   muestra el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) igual que
   `mecanica-64`, y rotula explícitamente que la sobretensión sin diodo NO se cuantifica
   con una cifra de voltaje, para cumplir la regla de honestidad del proyecto
   (`ESTANDAR-MOLDE-LAB-3D.md`: rangos, no cifras inventadas).
3. **Petición concreta al experto:** (a) confirmar o corregir las claves curriculares
   ⚑; (b) validar que representar la sobretensión sin diodo como un colapso idealizado
   sin cifra de voltaje —en vez de una cifra aproximada de literatura— es la decisión
   correcta para este nivel, o si un rango cualitativo ("cientos a miles de volts")
   comunicaría mejor el riesgo sin comprometer la honestidad del modelo; (c) señalar si
   el nivel de opacidad del reto (sin retroalimentación de exactitud sobre τ, solo sobre
   L final) es adecuado, consistente con el criterio ya aplicado en mecanica-62/63/64.
