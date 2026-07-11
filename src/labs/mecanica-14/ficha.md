# Ficha de práctica — Curva I–V del diodo: trazador y ajuste exponencial (`mecanica-14`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** primera práctica de la **Tanda 1 (D2 — Electrónica analógica y de
> potencia)**, dominio con hueco total 🔴 en la matriz de cobertura
> (`docs/LISTA-MAESTRA-200-PRACTICAS.md`). Reutiliza el molde S (esquemático + motor de
> cálculo en vivo) de referencia establecido en `mecanica-13` (d1-02).

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-14
sector: mecanica-electronica
practica_maestra: "d2-01 — Caracteriza la curva I-V del diodo y ajusta el modelo exponencial (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "MEC-I.2 (Mecatrónica, Módulo I, Submódulo 2) · ETR-I.2 (Electrónica/Tecnología, resultado I.2)"   # ⚑ confirmar claves exactas del plan vigente
modulo: "Electrónica analógica y de potencia (D2)"
submodulo: "Caracterización de dispositivos semiconductores discretos"          # ⚑ confirmar clave exacta
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de explicar la ecuación de Shockley y el papel
  de Is, n y VT; calcular el punto de operación Q de un circuito fuente-resistor-diodo
  sobre la recta de carga; levantar la curva I-V de un dispositivo por corrientes
  impuestas y extraer n e Is por el método de 2 puntos en escala semilogarítmica; y
  predecir Vd e Id de un dispositivo desconocido con tolerancia definida.
actividad_clave: >
  Caracteriza tres dispositivos (silicio 1N4148, Schottky 1N5819, LED) sobre un circuito
  fuente-resistor-diodo con esquema IEC 60617: verifica el punto Q resuelto en vivo por
  bisección, levanta la curva por un barrido de corrientes fijas, extrae n e Is de dos
  puntos capturados, y en el reto predice Vd/Id de un diodo desconocido antes de que la
  curva se revele.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Reconoce la topología: fuente Vs ideal, resistor limitador R y diodo, con el punto Q donde la recta de carga Id=(Vs-Vd)/R cruza la curva exponencial del dispositivo seleccionado."
  - "Modo Explora: cambia entre silicio (1N4148), Schottky (1N5819) y LED rojo, y entre Vs (0-12 V), R (100 Ω-4.7 kΩ) y T (-25 °C a 125 °C); observa cómo Vf, Id y la potencia disipada P=Vd·Id responden."
  - "Verifica que el coeficiente térmico (~-2 mV/K del silicio) emerge de la ley de temperatura de SPICE2 aplicada a Is(T), sin estar codificado como constante fija."
  - "Modo Curva: ejecuta un barrido de corrientes fijas (escalera de décadas) y compara la vista lineal contra la semilogarítmica, donde la exponencial se vuelve una recta de pendiente n*VT*ln(10)."
  - "Modo Ajuste: con dos puntos capturados (P1 de baja corriente, I>=30*Is; P2 de alta corriente) calcula n=(V2-V1)/(VT*ln(I2/I1)) y contrasta tu resultado contra el n del modelo, incluido el pequeño sesgo que introduce el '-1' de Shockley cerca de Is."
  - "Modo Reto: con un dispositivo desconocido (n, Is, Vs, R aleatorios dentro de rango), mide los dos puntos disponibles, resuelve el sistema y predice Vd e Id del punto Q antes de que el simulador los revele (tolerancia Vd ±2 % o ±15 mV, Id ±5 %)."
  - "Responde la pregunta de ingeniería sobre el modelo de caída constante (Vd~0.7 V): identifica por qué sirve como semilla de iteración pero no como resultado final de un diseño de precisión."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60617 — símbolos gráficos para esquemas eléctricos (representación normalizada del circuito)"
  - "SPICE2 (Nagel, 1975) — modelo de diodo (Is, n, Eg, XTI) y su ley de temperatura, estándar de facto en toda la industria (LTspice, ngspice, PSpice heredan este modelo)"
simulador_modela:      # 🔒
  - "Ecuación de Shockley I=Is*(e^(V/(n*VT))-1) con parámetros tipo SPICE (Is, n, Eg, XTI) de tres dispositivos (Si, Schottky, LED)."
  - "Ley de temperatura de SPICE2 para Is(T); el coeficiente térmico del silicio emerge de la física, no está programado como constante."
  - "Punto de operación Q exacto por bisección (80 iteraciones) sobre la recta de carga Id=(Vs-Vd)/R."
  - "Trazador de corriente impuesta (escalera de 6 décadas) con vista lineal y semilogarítmica, y extracción de n e Is por el método de 2 puntos con la regla I>=30*Is."
  - "Flujo predice-antes-de-ver: en el reto, Vd/Id/P/mV-por-década/Vf permanecen ocultos ('¿?') hasta que la predicción del alumno cae dentro de la tolerancia."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Resistencia serie Rs: a corrientes altas la Vf real es mayor que la del modelo puro (decenas de mV extra a 100 mA en un 1N4148 real)."
  - "Alta inyección: por encima de cierta corriente la pendiente semilog real se dobla hacia n~2; el modelo mantiene un solo n en todo el rango."
  - "Ruptura inversa y fuga real (región Zener/avalancha); la zona V<0 no es objeto de esta práctica."
  - "Capacidades de juntura ni tiempo de recuperación inversa (t_rr) — materia de la práctica de rectificación y conmutación (d2-02, d2-07)."
  - "Autocalentamiento: T es un parámetro que fija el usuario; en un diodo real P=Vd*Id sube la temperatura de la juntura y desplaza la curva mientras se mide."
  - "Dispersión entre unidades: Is puede variar órdenes de magnitud entre diodos del mismo lote; los parámetros son valores 'tipo' de modelos SPICE publicados, no los de una pieza medida."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Hoja de caracterización del reto: dos puntos medidos, cálculo de n e Is, sistema resuelto en papel y predicción de Vd/Id aceptada por el simulador (±2 %/±5 %)."
evidencia_desempeno: "Guía de observación del modo Ajuste (extracción de n e Is de 2 puntos) y de la interpretación semilog de la curva."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué un diodo real es una exponencial y no un interruptor, y qué mide realmente un trazador de curvas (briefing.ts)."
desarrollo: "Práctica en el simulador: explora → curva → ajuste → reto con predicción obligatoria."
cierre: "Ficha técnica (capa 2) con los tres dispositivos, el motor Shockley+SPICE2 y el procedimiento de caracterización física con trazador/multímetro."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "W. Shockley (1949), 'The Theory of p-n Junctions in Semiconductors and p-n Junction Transistors', Bell System Technical Journal — la ecuación del diodo de este lab."
  - "L. Nagel (1975), 'SPICE2: A Computer Program to Simulate Semiconductor Circuits', UC Berkeley ERL-M520 — el modelo de diodo (Is, n, Eg, XTI) y la ley de temperatura implementados aquí."
  - "Sedra y Smith, Microelectronic Circuits (Oxford) — recta de carga, modelo de caída constante y método de extracción de parámetros."
  - "IEC 60617 — Graphical symbols for diagrams (base de datos de símbolos normalizados)."
  - "Hojas de datos 1N4148 y 1N5819 (Vishay/onsemi) — límites reales (If máx, Vf @ If) para contrastar los parámetros tipo del modelo."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (MEC-I.2 / ETR-I.2 / submodulo / SINCO): claves tomadas del mapeo interno (LISTA-MAESTRA); verificar contra el plan de estudios vigente antes de publicar la trazabilidad."
  - "⚑ Las tolerancias pedagógicas del reto (Vd ±2 %/±15 mV, Id ±5 %) son una decisión didáctica, no normativa; un docente puede preferir otra banda."
  - "⚑ Los parámetros SPICE de los tres dispositivos (Si, Schottky, LED) son valores 'tipo' de modelos publicados de uso común; contrastar contra la hoja de datos de la pieza física real antes de usar en diseño."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (primera práctica de Tanda 1 / D2):** d2-01 abre la serie de
   semiconductores (diodo → BJT → MOSFET) que cubre el hueco total 🔴 identificado en D2.
   Reutiliza el molde S de `mecanica-13` (esquemático + motor de cálculo en vivo) con un
   componente no lineal en vez de una red resistiva lineal — si el nivel (bisección numérica
   en vez de álgebra lineal, extracción de parámetros de 2 puntos) es adecuado y sostenible,
   se replica en el resto de D2; si sobra o falta, se ajusta antes de continuar la tanda.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/diodo.html](../../../public/labs/diodo.html)) muestra el panel
   "🔒 Contrato de fidelidad" (Sí modela / NO modela) con Shockley (1949), Nagel (1975) e
   IEC 60617, de modo que el alumno y el evaluador ven las fronteras del modelo dentro de
   la práctica.
3. **Petición concreta al experto:** (a) confirmar o corregir las claves curriculares ⚑;
   (b) validar que el método de extracción de n e Is por 2 puntos (con la regla I≥30·Is)
   es el nivel adecuado para el semestre destino, y que el sesgo del "−1" de Shockley cerca
   de Is (visible en el ajuste Schottky) no confunde al alumno sin explicación adicional;
   (c) confirmar que los tres dispositivos (Si 1N4148, Schottky 1N5819, LED rojo) y sus
   parámetros tipo son representativos de lo que un técnico encuentra en campo.
