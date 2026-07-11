# Ficha de práctica — Rectificadores: media onda, center-tap y puente (`mecanica-15`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** segunda práctica de la **Tanda 1 (D2 — Electrónica analógica y de
> potencia)**, dominio con hueco total 🔴 en la matriz de cobertura
> (`docs/LISTA-MAESTRA-200-PRACTICAS.md`). Reutiliza el motor Shockley/SPICE2 de
> `mecanica-14` (d2-01), ahora con el transitorio exacto del capacitor de filtro resuelto
> por integración numérica (Runge-Kutta 4) en vez de una fórmula lineal.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-15
sector: mecanica-electronica
practica_maestra: "d2-02 — Compara media onda, center-tap y puente; calcula PIV, Vdc y rizo (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "MEC-I.2 (Mecatrónica, Módulo I, Submódulo 2) · ETR-I.2 (Electrónica/Tecnología, resultado I.2)"   # ⚑ confirmar claves exactas del plan vigente
modulo: "Electrónica analógica y de potencia (D2)"
submodulo: "Circuitos de conversión CA-CD con diodos"          # ⚑ confirmar clave exacta
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de explicar la diferencia estructural y de
  desempeño entre las topologías de rectificación de media onda, center-tap y puente;
  calcular Vm, PIV requerido, Vdc y Vr(pp) para cada topología; predecir el múltiplo de
  frecuencia de rizo y decidir si un diodo propuesto es seguro dado su VRRM; y diseñar
  un rectificador con filtro capacitivo que cumpla un objetivo de Vdc y rizo máximo.
actividad_clave: >
  Compara las tres topologías (media onda, center-tap, puente) sobre un esquema IEC
  60617 y un motor de integración numérica del capacitor de filtro: en el modo Explora
  observa cómo cambian Vdc, Vr(pp), la frecuencia de rizo y el PIV requerido; en
  Predicción calcula esos valores y la seguridad del diodo antes de ver el osciloscopio;
  en Barrido confirma cómo escala el rizo con la capacitancia; y en el Reto diseña un
  rectificador completo (topología + dispositivo + Vrms + C) para un objetivo dado.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Reconoce la topología: transformador (con o sin derivación central según el caso), 1, 2 o 4 diodos según media onda/center-tap/puente, capacitor de filtro C y resistor de carga R_L, con esquema IEC 60617."
  - "Modo Explora: cambia entre las tres topologías y entre silicio (1N4007), Schottky (1N5819) y puente integrado (DB107, solo compatible con la topología puente); varía Vrms, frecuencia de línea, R_L y C, y observa cómo responden Vdc, Vr(pp), la frecuencia de rizo y el PIV requerido en el esquema y el osciloscopio."
  - "Verifica que el capacitor de filtro NO se resuelve con la fórmula lineal de rizo: el simulador integra en vivo la EDO exacta C·dVc/dt = I_diodo(t) − Vc/R_L por Runge-Kutta 4 hasta que el error entre periodos sucesivos converge por debajo del umbral, capturando el pico real de corriente de carga."
  - "Modo Predicción: dado un circuito completo, predice el múltiplo de frecuencia de rizo (1× en media onda, 2× en center-tap/puente), Vdc, Vr(pp), el PIV requerido y si el diodo elegido es seguro frente a su VRRM — antes de que el osciloscopio se revele (tolerancias definidas por campo)."
  - "Modo Barrido: recorre la capacitancia de filtro con todo lo demás fijo y confirma en una gráfica log-log que Vr(pp) decrece aproximadamente como 1/C, contrastando la solución exacta contra la aproximación lineal Vr(pp)≈Idc/(k·f·C)."
  - "Modo Reto: con R_L y frecuencia de línea fijas, elige topología, dispositivo, Vrms y C para cumplir un objetivo de Vdc y rizo máximo dados, dejando margen de seguridad del PIV calculado sobre el VRRM del diodo (regla práctica: al menos 1.4×)."
  - "Responde la pregunta de ingeniería sobre por qué el puente domina en la práctica pese a usar el doble de diodos que el center-tap: PIV requerido la mitad, y no necesita transformador con derivación central."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60617 — símbolos gráficos para esquemas eléctricos (representación normalizada del circuito)"
  - "SPICE2 (Nagel, 1975) — modelo de diodo (Is, n) heredado de la práctica d2-01, aplicado aquí a escala de corriente de rectificador"
simulador_modela:      # 🔒
  - "Ecuación de Shockley por unión con parámetros tipo SPICE anclados al Vf de hoja de datos a la corriente nominal, para tres dispositivos (Si 1N4007, Schottky 1N5819, puente integrado DB107)."
  - "Transitorio exacto del capacitor de filtro por integración numérica (Runge-Kutta 4) de C·dVc/dt = I_diodo(t) − Vc/R_L, con criterio de convergencia entre periodos sucesivos."
  - "PIV específico de cada topología por fórmula (2Vm−VF con filtro en media onda y center-tap; Vm−VF en puente) y, donde el modelo agrupado lo permite observar por unión, medido directamente de la forma de onda simulada."
  - "Duplicación real de la frecuencia de rizo en las topologías de onda completa (center-tap, puente), emergente de la física del circuito y no forzada por código."
  - "Verificación de márgenes de seguridad: PIV con 1.4× de margen sobre VRRM, y corriente promedio/pico por diodo contra IF(AV)/IFSM del dispositivo."
  - "Flujo predice-antes-de-ver (modo Predicción) y modo Reto de diseño con objetivo de Vdc/rizo dado."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Recuperación inversa del diodo (t_rr): la conmutación entre conducción y bloqueo es instantánea en el modelo; un diodo real tarda ns-µs, generando pérdidas y picos de conmutación no representados."
  - "Transformador ideal: sin resistencia ni inductancia de fugas del devanado, sin saturación de núcleo ni caída de Vrms bajo carga (regulación de carga real no modelada)."
  - "Derrateo térmico: IF(AV)/IFSM se comparan contra los valores de hoja de datos a la temperatura de referencia del fabricante, no a la temperatura ambiente/de unión real."
  - "ESR y envejecimiento del capacitor de filtro: el capacitor es ideal, sin resistencia serie equivalente ni pérdida de capacitancia con el tiempo o la temperatura."
  - "Ruptura por avalancha inversa: si el PIV supera el VRRM, el modelo solo emite una alerta de diseño, no simula la física de la ruptura ni el posible daño al dispositivo."
  - "Corriente de pico de carga por fórmula cerrada: existen varias fórmulas aproximadas publicadas con resultados que no siempre coinciden; se omiten deliberadamente y el pico se obtiene de la integración numérica de la EDO. La variación de Vf con la temperatura tampoco se modela (T fija en 300.15 K) porque ya se cubre en d2-01."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Hoja de diseño del reto: topología, dispositivo, Vrms y C elegidos, cálculo de Vdc/Vr(pp)/PIV en papel, y diseño aceptado por el simulador dentro de la tolerancia dada."
evidencia_desempeno: "Guía de observación del modo Predicción (frecuencia de rizo, Vdc, Vr(pp), PIV y seguridad del diodo) y del modo Barrido (relación Vr(pp) vs. C)."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué la topología elegida decide el PIV requerido y el rizo, y qué resuelve realmente el capacitor de filtro (briefing.ts)."
desarrollo: "Práctica en el simulador: explora → predice → barrido → reto de diseño con predicción obligatoria."
cierre: "Ficha técnica (capa 2) con los tres dispositivos, las tres topologías, el motor Shockley+RK4 y el procedimiento de medición física con transformador, osciloscopio y multímetro."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "W. Shockley (1949), 'The Theory of p-n Junctions in Semiconductors and p-n Junction Transistors', Bell System Technical Journal — la ecuación del diodo de cada unión de este lab."
  - "L. Nagel (1975), 'SPICE2: A Computer Program to Simulate Semiconductor Circuits', UC Berkeley ERL-M520 — convención de parámetros tipo SPICE (Is, n) heredada de d2-01."
  - "Boylestad y Nashelsky, Electronic Devices and Circuit Theory (Pearson) — fórmulas de PIV, Vdc y rizo por topología de rectificación."
  - "Sedra y Smith, Microelectronic Circuits (Oxford) — análisis del rectificador con filtro capacitivo y la aproximación lineal de rizo usada aquí solo como referencia de diseño."
  - "IEC 60617 — Graphical symbols for diagrams (base de datos de símbolos normalizados)."
  - "Hoja de datos Vishay 1N4001–1N4007; hoja de datos STMicroelectronics 1N5817–1N5819; hoja de datos Diodes Inc. DB101–DB107 ⚑ (otros fabricantes listan hasta 1.5 A bajo el mismo número de parte) — contrastar siempre con la pieza física real."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (MEC-I.2 / ETR-I.2 / submodulo / SINCO): claves tomadas del mapeo interno (LISTA-MAESTRA); verificar contra el plan de estudios vigente antes de publicar la trazabilidad."
  - "⚑ El Vf del Schottky (≈0.56 V @ 1 A) se ancla a la banda superior del rango publicado del 1N5819 (0.45–0.60 V) para no confundirlo con el 1N5817 de menor VRRM; contrastar contra la hoja de datos de la pieza física exacta."
  - "⚑ El IF(AV) del puente DB107 (1.0 A @ 40 °C, hoja Diodes Inc.) varía entre fabricantes — algunos listan hasta 1.5 A bajo el mismo número de parte; fijar un único fabricante de referencia antes de publicar el rating en un contexto de diseño."
  - "⚑ La fórmula cerrada de corriente de pico de carga del capacitor tiene variantes inconsistentes entre libros de texto; se omite deliberadamente del modelo y de esta ficha, usando en su lugar la integración numérica de la EDO."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (segunda práctica de Tanda 1 / D2):** d2-02 continúa la serie
   de semiconductores (diodo → rectificadores → Zener/regulación → BJT → MOSFET) que
   cubre el hueco total 🔴 identificado en D2. Reutiliza el motor Shockley/SPICE2 de
   `mecanica-14` (d2-01) y añade el transitorio exacto del capacitor de filtro por
   integración numérica (Runge-Kutta 4) — si este nivel (EDO resuelta en vivo en vez de
   fórmula lineal de rizo) es adecuado y sostenible, se replica en el resto de D2; si
   sobra o falta, se ajusta antes de continuar la tanda.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/rectificador.html](../../../public/labs/rectificador.html)) muestra el
   panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) con Shockley (1949), Nagel
   (1975) e IEC 60617, de modo que el alumno y el evaluador ven las fronteras del modelo
   dentro de la práctica.
3. **Petición concreta al experto:** (a) confirmar o corregir las claves curriculares ⚑;
   (b) validar que fijar el Vf del Schottky en la banda superior del rango del 1N5819 (en
   vez de usar 0.45 V, más propio del 1N5817) es la decisión correcta y no confunde al
   alumno; (c) confirmar contra una hoja de datos única del DB107 si 1.0 A o 1.5 A es el
   IF(AV) representativo a usar en el rating de seguridad mostrado; (d) confirmar que
   las tres topologías y sus tres dispositivos son representativos de lo que un técnico
   encuentra en campo.
