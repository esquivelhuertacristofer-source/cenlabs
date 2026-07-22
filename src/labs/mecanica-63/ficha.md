# Ficha de práctica — Máxima Transferencia de Potencia: Curva P(RL) y Eficiencia (`mecanica-63`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** reutiliza el **molde S de referencia** (`mecanica-13`, Kirchhoff;
> `mecanica-61`, divisores) y el motor de análisis nodal modificado (MNA) con el
> elemento de amperímetro ideal introducido en `mecanica-62` (Thévenin/Norton). Es la
> **cuarta cosecha** de ese motor y la **segunda práctica con modo de caracterización
> de caja negra**, tal como anticipó la ficha de `mecanica-62`: "si el patrón de caja
> negra es pedagógicamente sólido, se replica en d1-05 (transferencia máxima de
> potencia)".

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-63
sector: mecanica-electronica
practica_maestra: "d1-05 — Optimiza la transferencia de potencia a una carga (molde S)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "UAX Circuitos"   # ⚑ confirmar clave exacta del plan vigente (LISTA-MAESTRA-200-PRACTICAS.md, fila d1-05)
modulo: "Circuitos eléctricos CD y CA (D1)"
submodulo: "Teoremas de redes y optimización de transferencia de potencia"          # ⚑ confirmar clave exacta
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de determinar el valor de resistencia de carga
  RL que maximiza la potencia entregada por una red resistiva de dos terminales
  (RL = Rth, con Pmáx = Vth²/(4·Rth)), verificar esa predicción barriendo RL sobre la red
  completa resuelta por análisis nodal modificado, distinguir el punto de máxima potencia
  del punto de máxima eficiencia (que NO coinciden: en RL=Rth la eficiencia es exactamente
  50 %), y aplicar el mismo procedimiento de caracterización de caja negra de mecanica-62
  (medir Voc e Isc) para predecir RLopt y Pmáx de un circuito de topología desconocida.
actividad_clave: >
  Explora una red visible de tres resistores y una fuente (misma topología base de
  mecanica-62) barriendo el valor de RL y observando cómo el pizarrón construye en vivo
  la curva P(RL) — con el pico marcado exactamente en RL=Rth; compara esa curva contra el
  circuito equivalente reducido de Thévenin (Vth, Rth, RL) para confirmar que ambos
  caminos de cálculo coinciden en cualquier punto seleccionado; en el modo Eficiencia,
  superpone la curva de potencia normalizada con la curva de eficiencia η=RL/(RL+Rth) y
  constata el compromiso potencia-máxima-vs-eficiencia-máxima; y en el reto, caracteriza
  una caja negra real —sellada, sin inspección visual de los componentes internos—
  usando solo "Medir Voc" y "Medir Isc" para predecir RLopt y Pmáx dentro de tolerancia.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modo Explora: sobre una red visible de V1, R1, R2, R3 con una carga RL siempre conectada, selecciona distintos valores de RL de un banco de resistores y observa cómo el pizarrón construye la curva P(RL) punto por punto, resolviendo la red completa (los 4 resistores) por MNA en cada valor de RL — no aplicando la fórmula P=Vth²·RL/(RL+Rth)² ciegamente sobre un modelo reducido."
  - "Confirma que el pico de la curva P(RL) cae exactamente en RL=Rth (calculada para la combinación actual de R1, R2, R3) y que el valor de pico coincide con Pmáx=Vth²/(4·Rth)."
  - "Verifica por un segundo camino: el mismo barrido resuelto sobre el circuito equivalente reducido de dos elementos (Vth, Rth, RL) debe coincidir con el resultado de la red completa de 4 resistores en el punto de RL seleccionado — evidencia de que el equivalente de Thévenin predice exacto el comportamiento de potencia, no solo el de voltaje/corriente ya verificado en mecanica-62."
  - "Modo Eficiencia: superpone la curva de potencia normalizada con la curva de eficiencia η=RL/(RL+Rth) sobre el mismo eje de RL; constata que en RL=Rth la eficiencia es exactamente 50 %, NO el máximo de η (que tiende a 100% cuando RL≫Rth) — el punto de máxima potencia y el punto de máxima eficiencia son distintos y ese es el compromiso central del teorema."
  - "Modo Reto: sobre una caja negra sellada (topología oculta, un nuevo escenario numérico por intento, mismo mecanismo de mecanica-62), usa únicamente los botones 'Medir Voc' y 'Medir Isc' —sin inspección visual de los componentes internos— para calcular Rth=Voc/Isc y reportar RLopt (=Rth) y Pmáx (=Voc²/(4·Rth)); el sistema valida dentro de una tolerancia relativa (±5 %) sin revelar los valores reales si la respuesta es incorrecta."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60617 — símbolos gráficos para esquemas eléctricos (mismo estándar de representación que mecanica-13/mecanica-61/mecanica-62; en este laboratorio el pizarrón muestra curvas en vez de esquema, pero el banco 3D conserva los resistores reales con su código de colores)."
  - "IEC 60063 — series de valores normalizados E12 y código de colores para los resistores del banco 3D."
  - "UAX Circuitos — el teorema de máxima transferencia de potencia como criterio de diseño de acoplamiento de carga, distinto del criterio de eficiencia usado en sistemas de distribución de potencia."
simulador_modela:      # 🔒
  - "Barrido de RL sobre la red resistiva completa (4 resistores) resuelto en vivo por el mismo motor MNA de mecanica-13/mecanica-61/mecanica-62 (matriz de conductancias + eliminación gaussiana con pivoteo parcial) — la curva P(RL) del pizarrón es el resultado punto por punto de ese solver, no una fórmula pre-calculada."
  - "Verificación cruzada por dos caminos: la red completa de 4 resistores y el circuito equivalente reducido de Thévenin (Vth, Rth, RL) deben coincidir exactamente en el punto de RL seleccionado."
  - "Relación explícita potencia-eficiencia: la curva de eficiencia η=RL/(RL+Rth) se muestra superpuesta a la de potencia, evidenciando que maximizar potencia y maximizar eficiencia son objetivos distintos y mutuamente excluyentes en RL=Rth."
  - "Caracterización de caja negra: predicción de RLopt y Pmáx desde solo dos mediciones externas (Voc, Isc), reutilizando el mismo elemento de amperímetro ideal (`type:'AMM'`) introducido en mecanica-62 — el estudiante nunca ve R1/R2/R3 en el modo Reto."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Cargas reactivas ni el teorema general de máxima transferencia de potencia con conjugado complejo de impedancia (ZL = Zth*) — este laboratorio cubre únicamente el caso resistivo puro de CD."
  - "Límites térmicos o de corriente máxima de un resistor de carga real: en la práctica, operar en RL=Rth con Rth muy bajo puede exceder la disipación nominal de un componente físico, y el simulador no impone ese límite."
  - "El criterio real de diseño de sistemas de potencia eléctrica (distribución, no electrónica de señal), donde casi nunca se busca RL=Rth porque ahí la eficiencia es de solo 50 % — se prefiere deliberadamente Rth≪RL para no desperdiciar la mitad de la energía en la fuente; el simulador no contrasta explícitamente este caso de uso alterno, solo lo menciona en la ficha técnica (capa 2)."
  - "Tolerancias reales de fabricación de resistores, resistencia interna de la fuente V1, ni resistencia de conductores/contactos (se asumen cero, igual que en mecanica-62)."
  - "Las tolerancias del modo Reto (±5 % relativas) son un margen pedagógico definido por el ejercicio, no una especificación de fabricante ni de instrumento real — se comunican así explícitamente en el HUD."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte de caracterización del reto: valores medidos de Voc e Isc, el cálculo de Rth derivado de ellos, y la predicción de RLopt y Pmáx que el estudiante envía como respuesta."
evidencia_desempeno: "Guía de observación de la secuencia de medición (Voc antes que Isc, sin inspeccionar componentes internos en el reto) y de la interpretación correcta del compromiso potencia-máxima-vs-eficiencia-máxima en el modo Eficiencia."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué un ingeniero de audio ajusta la impedancia de un altavoz a la del amplificador, pero un ingeniero de distribución eléctrica hace exactamente lo contrario (briefing.ts)."
desarrollo: "Práctica en el simulador: explora (construye la curva P(RL) y ubica el pico) → eficiencia (compara potencia vs. η) → reto (caracteriza una caja negra real prediciendo RLopt y Pmáx)."
cierre: "Ficha técnica (capa 2) con el teorema completo, sus límites frente a cargas reactivas y componentes reales, y el contraste con el criterio de diseño de sistemas de potencia."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Hayt, W. H., Kemmerly, J. E. y Durbin, S. M. — Análisis de circuitos en ingeniería (McGraw-Hill): teorema de máxima transferencia de potencia, capítulo de teoremas de red."
  - "Sadiku, M. N. O. — Fundamentos de circuitos eléctricos (McGraw-Hill): sección de transferencia máxima de potencia y eficiencia."
  - "IEC 60617 — Graphical symbols for diagrams (símbolos normalizados, mismo estándar que mecanica-13/mecanica-61/mecanica-62)."
  - "IEC 60063 — Preferred number series for resistors and capacitors (series E12) y código de colores."
  - "C.-W. Ho, A. E. Ruehli, P. A. Brennan (1975), 'The Modified Nodal Approach to Network Analysis', IEEE Transactions on Circuits and Systems — el algoritmo MNA del motor, reutilizado sin cambios de mecanica-62."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (UAX Circuitos / submodulo / SINCO): claves tomadas del mapeo interno (LISTA-MAESTRA); verificar contra el plan de estudios vigente antes de publicar la trazabilidad."
  - "⚑ Las tolerancias del reto (±5 % relativas, con piso absoluto de 15 Ω en RLopt y 0.05 mW en Pmáx) son restricciones pedagógicas definidas por el ejercicio, no cifras de instrumento real. Confirmar que el nivel es adecuado para el semestre destino."
  - "⚑ El voltaje de fuente V se deja fijo (12 V) en todos los modos, igual que en mecanica-62, para que el estudiante concentre la variable de caracterización en RL/Rth/Pmáx; verificar si el revisor prefiere que también sea seleccionable."
  - "⚑ El modo Reto no revela RLopt/Pmáx reales al fallar (solo indica cuál de los dos parámetros está fuera de tolerancia) para evitar que el estudiante adivine por prueba y error; confirmar que este nivel de retroalimentación es pedagógicamente adecuado."
  - "⚑ El contraste con el criterio real de diseño de sistemas de potencia (donde se evita RL=Rth por su eficiencia del 50 %) se menciona solo en la ficha técnica (capa 2), no dentro del simulador interactivo; confirmar si el revisor considera necesario reforzarlo también en el HUD o el quiz."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (cuarta cosecha del motor MNA, segunda caja negra):**
   d1-05 reutiliza el mismo motor de análisis nodal modificado (MNA) de d1-02
   (`mecanica-13`), d1-03 (`mecanica-61`) y d1-04 (`mecanica-62`), y el elemento de
   amperímetro ideal introducido en d1-04 para el modo Reto. Es la segunda práctica
   del sector con un modo de **caracterización de caja negra** genuina (topología
   oculta), tal como anticipó explícitamente la ficha de mecanica-62. La novedad
   estructural es que el pizarrón 2D ya no dibuja un esquema IEC 60617, sino que
   grafica curvas de datos en vivo (P(RL) y η(RL)) — es la primera práctica del
   sector con un pizarrón basado en gráficas en lugar de diagramas de circuito.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/maxima-transferencia-potencia.html](../../../public/labs/maxima-transferencia-potencia.html))
   muestra el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) igual que
   mecanica-62, y el modo Reto rotula explícitamente las tolerancias de verificación
   como un margen pedagógico del ejercicio, no como una especificación de fabricante
   ni de instrumento real, para cumplir la regla de honestidad del proyecto
   (`ESTANDAR-MOLDE-LAB-3D.md`).
3. **Petición concreta al experto:** (a) confirmar o corregir las claves
   curriculares ⚑; (b) validar que distinguir explícitamente el punto de máxima
   potencia (RL=Rth, η=50%) del punto de máxima eficiencia (RL≫Rth, η→100%) es el
   énfasis pedagógico correcto para este resultado de aprendizaje, o si el revisor
   prefiere que el simulador insista más en el caso de uso de sistemas de potencia
   (donde se evita deliberadamente RL=Rth); (c) señalar si el nivel de
   retroalimentación parcial del reto (indicar solo cuál parámetro falló) es
   adecuado, igual que se preguntó en la ficha de mecanica-62.
