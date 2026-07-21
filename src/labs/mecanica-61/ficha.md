# Ficha de práctica — Divisores de Tensión y Corriente: Diseño con Efecto de Carga (`mecanica-61`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** reutiliza el **molde S de referencia** (`mecanica-13`, Kirchhoff) —
> mismo motor de análisis nodal modificado (MNA), extendido con un nuevo elemento de
> fuente de corriente ideal (`type:'I'`) para modelar el divisor de corriente, y un nuevo
> patrón de reto de **diseño** (el alumno propone valores, no solo predice).

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-61
sector: mecanica-electronica
practica_maestra: "d1-03 — Diseña divisores de tensión y corriente considerando el efecto de carga (molde S)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "MEC-I.1"   # ⚑ confirmar clave exacta del plan vigente (LISTA-MAESTRA-200-PRACTICAS.md, fila d1-03)
modulo: "Circuitos eléctricos CD y CA (D1)"
submodulo: "Análisis de redes resistivas en corriente directa"          # ⚑ confirmar clave exacta
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de calcular el voltaje de salida de un divisor
  de tensión con y sin carga, cuantificar el error que introduce una carga RL finita
  frente al divisor ideal, calcular el reparto de corriente de un divisor de corriente,
  y diseñar los valores de R1/R2 de un divisor de tensión que cumplan simultáneamente
  un voltaje de salida objetivo, un presupuesto de error de carga y un presupuesto de
  corriente de reposo — el mismo tipo de decisión que un ingeniero toma al dimensionar
  un divisor para polarizar una entrada o generar una referencia.
actividad_clave: >
  Explora un divisor de tensión ideal (sin carga) sobre el mismo esquema y motor MNA de
  Kirchhoff (mecanica-13), luego conecta una carga RL y observa cómo Vo cae por debajo
  del valor ideal (efecto de carga); analiza un divisor de corriente separado con una
  fuente de corriente ideal; y en el reto, dado un voltaje objetivo y dos presupuestos
  (error de carga ≤5 %, corriente ≤25 mA), propone valores de R1 y R2 que los satisfagan
  simultáneamente — un problema de diseño, no de predicción.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modo Explora: selecciona R1 y R2 de una lista de valores E12 y observa Vo = V·R2/(R1+R2) sobre el esquema IEC 60617 del divisor, sin carga conectada (RL → circuito abierto)."
  - "Modo Carga: conecta una resistencia de carga RL en paralelo con R2 y observa que Vo_cargado = V·(R2‖RL)/(R1+(R2‖RL)) < Vo_ideal — cuantifica el error porcentual de carga y explica por qué crece cuando RL se acerca al orden de magnitud de R2."
  - "Deriva la equivalencia de Thévenin: el divisor visto desde la salida es una fuente Vth = V·R2/(R1+R2) con resistencia interna Rth = R1‖R2; verifica que Vo_cargado = Vth·RL/(RL+Rth) da el mismo resultado que la fórmula directa."
  - "Modo Corriente: sobre un segundo esquema (fuente de corriente ideal I0 con dos resistores en paralelo, mismo motor MNA con un nuevo elemento de fuente de corriente), verifica el reparto I1 = I0·R2/(R1+R2), I2 = I0·R1/(R1+R2) — el resistor menor se lleva la mayor corriente."
  - "Modo Reto (diseño, no predicción): dado un voltaje objetivo Vo_obj, una carga RL fija y una fuente V fija, propone valores de R1 y R2 (en Ω, tecleados libremente) que simultáneamente: (a) den Vo_cargado dentro de tolerancia de Vo_obj, (b) mantengan el error de carga ≤5 %, y (c) mantengan la corriente de reposo del divisor ≤25 mA — un problema con más de una solución válida, como el diseño real."
  - "Interpreta la tensión de diseño: R1/R2 pequeños bajan el error de carga (divisor 'rígido') pero suben la corriente de reposo; R1/R2 grandes bajan la corriente pero suben el error de carga — el estudiante debe navegar esa disyuntiva, no solo calcular un valor."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60617 — símbolos gráficos para esquemas eléctricos (mismo estándar de representación que mecanica-13)."
  - "IEC 60063 — series de valores normalizados E6/E12/E24 para resistores (candidatos de R1/R2/RL del banco)."
  - "NOM-001-SEDE-2012 — instalaciones eléctricas: el dimensionamiento de divisores/derivaciones resistivas es aplicación directa del análisis de redes."
simulador_modela:      # 🔒
  - "Divisor de tensión resistivo en CD con fuente ideal, declarado como datos y resuelto en vivo por el mismo motor MNA de mecanica-13 (matriz de conductancias + eliminación gaussiana con pivoteo parcial)."
  - "Efecto de carga: Vo cae de forma predecible al conectar RL en paralelo con R2 — verificado contra la equivalencia de Thévenin del propio divisor."
  - "Divisor de corriente con una fuente de corriente ideal (nuevo tipo de elemento en el motor MNA, además de R y V): I1/I2 con signo y magnitud correctos según el reparto inverso a la resistencia."
  - "Reto de diseño con más de una solución válida: tres restricciones numéricas simultáneas (voltaje objetivo, error de carga, corriente de reposo) verificadas en vivo contra los valores que el estudiante propone."
  - "Código de colores real de 4 bandas de cada resistor del banco 3D del divisor de tensión, sincronizado con los valores de R1/R2/RL activos."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Tolerancias reales de los componentes: el motor usa el valor nominal exacto que el estudiante teclea o selecciona, no una banda de tolerancia física del componente."
  - "Resistencia interna de la fuente V (ideal, impedancia cero) ni resistencia de conductores y contactos."
  - "Efectos térmicos (coeficiente de temperatura, autocalentamiento por I²R) ni el consumo real de la etapa que 'carga' el divisor (aquí RL es un resistor puro, no la impedancia de entrada de un circuito real, que puede ser no lineal o variar con la frecuencia)."
  - "El divisor de corriente del modo Corriente no tiene contraparte 3D dedicada — se representa solo en el esquema y la telemetría, reutilizando el banco físico del divisor de tensión."
  - "La medición física con instrumento real y su incertidumbre — eso lo ejercita la práctica del multímetro (mecanica-12/mecanica-60)."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Hoja de diseño del reto: valores de R1 y R2 propuestos, con el cálculo de Vo_cargado, error de carga % y corriente de reposo que el estudiante hizo para verificar que cumplen las tres restricciones antes de enviarlos."
evidencia_desempeno: "Guía de observación de la exploración del efecto de carga (modo Carga) y de la interpretación de la disyuntiva rigidez-vs-consumo en el reto de diseño."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué el 'divisor de tensión ideal' de los libros de texto casi nunca existe solo — siempre hay una carga real conectada (briefing.ts)."
desarrollo: "Práctica en el simulador: explora → carga → corriente → reto de diseño con tres restricciones simultáneas."
cierre: "Ficha técnica (capa 2) con la equivalencia de Thévenin del divisor y el procedimiento real de diseño/verificación en protoboard."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "IEC 60617 — Graphical symbols for diagrams (símbolos normalizados, mismo estándar que mecanica-13)."
  - "IEC 60063 — Preferred number series for resistors and capacitors (series E)."
  - "C.-W. Ho, A. E. Ruehli, P. A. Brennan (1975), 'The Modified Nodal Approach to Network Analysis', IEEE Transactions on Circuits and Systems — el algoritmo MNA del motor, extendido aquí con el elemento de fuente de corriente ideal."
  - "Hayt, Kemmerly y Durbin — Análisis de circuitos en ingeniería (McGraw-Hill): divisores de tensión y corriente, equivalencia de Thévenin, capítulos introductorios."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (MEC-I.1 / submodulo / SINCO): claves tomadas del mapeo interno (LISTA-MAESTRA); verificar contra el plan de estudios vigente antes de publicar la trazabilidad."
  - "⚑ Los presupuestos de diseño del reto (error de carga ≤5 %, corriente de reposo ≤25 mA) son restricciones pedagógicas definidas por el ejercicio, no cifras normativas ni de fabricante — se comunican explícitamente como 'especificación del ejercicio' en el HUD, no como un hecho del mundo real. Confirmar que el nivel es adecuado para el semestre destino y que un valor distinto no sería más representativo de la práctica industrial real."
  - "⚑ El voltaje de fuente V se deja fijo (12 V) en los modos Explora/Carga para que el estudiante concentre la variable de diseño en R1/R2/RL; verificar si el revisor prefiere que también sea seleccionable."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (segunda cosecha del molde S):** d1-03 reutiliza el mismo
   motor de análisis nodal (MNA) de d1-02 (`mecanica-13`), extendiéndolo con un elemento
   de fuente de corriente ideal para el divisor de corriente. Es la primera práctica de
   **diseño** del sector (el estudiante propone valores para cumplir restricciones, no
   solo predice un valor oculto); si el patrón de reto de diseño es pedagógicamente sólido,
   se replica en futuras prácticas de dimensionamiento (D1, D2).
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/divisor-tension-corriente.html](../../../public/labs/divisor-tension-corriente.html))
   muestra el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) igual que mecanica-13,
   y el modo Reto rotula explícitamente los presupuestos de error y corriente como
   "especificación del ejercicio", no como un dato de fabricante, para cumplir la regla de
   honestidad del proyecto (`ESTANDAR-MOLDE-LAB-3D.md`).
3. **Petición concreta al experto:** (a) confirmar o corregir las claves curriculares ⚑;
   (b) validar que los presupuestos de diseño del reto (≤5 % de error de carga, ≤25 mA de
   corriente de reposo) son razonables como ejercicio didáctico y no inducen a una mala
   práctica de diseño real; (c) señalar si el alcance 3D limitado (solo el divisor de
   tensión tiene banco físico; el divisor de corriente es solo esquemático) es aceptable
   o si el revisor considera indispensable un mockup físico también para ese modo.
