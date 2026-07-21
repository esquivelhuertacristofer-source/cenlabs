# Ficha de práctica — Equivalentes de Thévenin y Norton: Caracterización Experimental de Caja Negra (`mecanica-62`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** reutiliza el **molde S de referencia** (`mecanica-13`, Kirchhoff;
> `mecanica-61`, divisores) — mismo motor de análisis nodal modificado (MNA), extendido
> aquí con un nuevo elemento de amperímetro ideal (`type:'AMM'`, fuente de 0 V) que
> permite leer la corriente de cortocircuito directamente del solver, sin fórmulas
> ad-hoc. Primera práctica del sector centrada en teoremas de red (no solo análisis
> directo) y en caracterización experimental de una caja negra.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-62
sector: mecanica-electronica
practica_maestra: "d1-04 — Obtiene experimentalmente los equivalentes de Thévenin y Norton (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ETR-I.1 / UAX Circuitos"   # ⚑ confirmar clave exacta del plan vigente (LISTA-MAESTRA-200-PRACTICAS.md, fila d1-04)
modulo: "Circuitos eléctricos CD y CA (D1)"
submodulo: "Teoremas de redes y caracterización experimental"          # ⚑ confirmar clave exacta
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de obtener experimentalmente el equivalente
  de Thévenin (Vth, Rth) de una red resistiva de dos terminales midiendo únicamente el
  voltaje de circuito abierto (Voc) y la corriente de cortocircuito (Isc), verificar ese
  resultado contra el método teórico de desactivar fuentes y combinar resistencias,
  confirmar que el equivalente predice exactamente el comportamiento de la red ante
  cualquier carga externa, convertirlo a su equivalente Norton, y caracterizar una caja
  negra real sin conocer su topología interna — el mismo procedimiento que un técnico
  aplica sobre un circuito o transductor desconocido en un banco de pruebas.
actividad_clave: >
  Explora una red visible de tres resistores y una fuente sobre el mismo esquema y motor
  MNA de Kirchhoff (mecanica-13) y divisores (mecanica-61), midiendo Voc e Isc en las
  terminales con dos botones de instrumento virtual; conecta una carga cualquiera y
  verifica que el equivalente de Thévenin predice exacto el voltaje y la corriente de la
  red completa; convierte el mismo equivalente a Norton (In=Isc, Rn=Rth) y confirma
  idéntica predicción; y en el reto, caracteriza una caja negra real —sellada, sin
  inspección visual de los componentes internos— usando solo "Medir Voc" y "Medir Isc"
  para reportar Vth y Rth dentro de tolerancia.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modo Explora: sobre una red visible de V1, R1, R2, R3 (esquema IEC 60617), mide el voltaje de circuito abierto Voc entre las terminales A y B (sin nada conectado) — esa lectura ES Vth, sin cálculo adicional."
  - "Mide la corriente de cortocircuito Isc uniendo las terminales con un amperímetro ideal (nuevo elemento del motor MNA, `type:'AMM'`, modelado como fuente de 0 V que permite leer la corriente de rama que atraviesa el cortocircuito sin fórmulas ad-hoc); calcula Rth = Voc/Isc."
  - "Verifica Rth por un segundo camino, independiente del experimental: desactiva la fuente V1 (córtocircuítala) y combina las resistencias vistas desde las terminales, Rth_teórica = R3+(R1‖R2) — debe coincidir con la Rth medida dentro de la precisión numérica del solver."
  - "Modo Carga: conecta una resistencia externa RL cualquiera a las terminales y compara V(RL) calculado con el equivalente de Thévenin (Vth·RL/(RL+Rth)) contra V(RL) de la red completa resuelta por el mismo motor MNA — deben coincidir exactamente, para cualquier RL, no solo para un valor particular."
  - "Modo Norton: convierte el mismo equivalente a su versión de fuente de corriente (In=Isc en paralelo con Rn=Rth) y confirma que predice idéntico V(RL) que el equivalente de Thévenin y que la red completa — evidencia de que ambos son la misma información con distinta topología."
  - "Modo Reto: sobre una caja negra sellada (topología oculta, un nuevo escenario numérico por intento), usa únicamente los botones 'Medir Voc' y 'Medir Isc' —sin inspección visual de los componentes internos— para calcular y reportar Vth y Rth; el sistema valida dentro de una tolerancia relativa (±3–5 %) sin revelar los valores reales si la respuesta es incorrecta, para no permitir adivinar por prueba y error."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60617 — símbolos gráficos para esquemas eléctricos (mismo estándar de representación que mecanica-13/mecanica-61)."
  - "IEC 60063 — series de valores normalizados E12 y código de colores para los resistores del banco 3D."
  - "NOM-001-SEDE-2012 — instalaciones eléctricas: la caracterización de fuentes y cargas equivalentes es aplicación directa del análisis de redes en el diseño de instalaciones."
simulador_modela:      # 🔒
  - "Red resistiva de dos terminales con fuente ideal de CD, declarada como datos y resuelta en vivo por el mismo motor MNA de mecanica-13/mecanica-61 (matriz de conductancias + eliminación gaussiana con pivoteo parcial)."
  - "Nuevo elemento de amperímetro ideal (`type:'AMM'`, fuente de 0 V) que permite leer Isc directamente del solver, sin una fórmula de cortocircuito ad-hoc — generaliza el mismo mecanismo que ya usan las fuentes de voltaje."
  - "Verificación cruzada por dos métodos independientes: experimental (Voc/Isc) y teórico (fuente desactivada + combinación de resistencias) — ambos deben coincidir, evidenciando que el equivalente no es un ajuste arbitrario."
  - "Predicción exacta del equivalente de Thévenin/Norton contra la red completa bajo cualquier carga externa seleccionable, no solo un caso particular."
  - "Equivalencia Thévenin↔Norton (Rn=Rth, In=Isc) verificada con la misma red y la misma carga."
  - "Caracterización experimental de una caja negra real: el estudiante nunca ve R1/R2/R3 en el modo Reto, solo interactúa con las terminales — el estado de medición (`measuredVoc`/`measuredIsc`) se reinicia en cada cambio de modo o de escenario para que no queden datos de una red anterior filtrados a la siguiente."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Tolerancias reales de fabricación de los resistores: el motor usa el valor nominal exacto de cada elemento, no una banda de tolerancia física."
  - "Resistencia interna de la fuente V1 (ideal, impedancia cero) ni resistencia de conductores y contactos de las terminales."
  - "Comportamiento no ideal de un amperímetro real (resistencia de inserción, carga de la medición, ruido) — el amperímetro del modelo es ideal por definición matemática."
  - "Redes con múltiples fuentes independientes o elementos no lineales; ni componentes reactivos (capacitores, inductores) ni corriente alterna — es un circuito resistivo de CD de parámetros concentrados."
  - "Las tolerancias del modo Reto (±3–5 % relativas) son un margen pedagógico definido por el ejercicio, no una especificación de fabricante ni de instrumento real — se comunican así explícitamente en el HUD."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte de caracterización del reto: valores medidos de Voc e Isc, el cálculo de Vth y Rth derivado de ellos, y la verificación cruzada contra el método teórico (cuando aplica) que el estudiante hizo antes de enviar su respuesta."
evidencia_desempeno: "Guía de observación de la secuencia de medición (Voc antes que Isc, sin inspeccionar componentes internos en el reto) y de la interpretación de por qué el equivalente predice exacto el comportamiento ante cualquier carga."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: la analogía de la caja sellada con dos terminales — por qué un ingeniero casi nunca reanaliza el circuito completo cada vez que cambia la carga (briefing.ts)."
desarrollo: "Práctica en el simulador: explora (mide Voc/Isc) → carga (verifica predicción) → Norton (convierte y reverifica) → reto (caracteriza una caja negra real)."
cierre: "Ficha técnica (capa 2) con el procedimiento real de caracterización de circuito abierto/cortocircuito y sus limitaciones frente a un instrumento físico."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Hayt, W. H., Kemmerly, J. E. y Durbin, S. M. — Análisis de circuitos en ingeniería (McGraw-Hill): teoremas de Thévenin y Norton, capítulo de teoremas de red."
  - "IEC 60617 — Graphical symbols for diagrams (símbolos normalizados, mismo estándar que mecanica-13/mecanica-61)."
  - "IEC 60063 — Preferred number series for resistors and capacitors (series E12) y código de colores."
  - "C.-W. Ho, A. E. Ruehli, P. A. Brennan (1975), 'The Modified Nodal Approach to Network Analysis', IEEE Transactions on Circuits and Systems — el algoritmo MNA del motor, extendido aquí con el elemento de amperímetro ideal."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (ETR-I.1 / UAX Circuitos / submodulo / SINCO): claves tomadas del mapeo interno (LISTA-MAESTRA); verificar contra el plan de estudios vigente antes de publicar la trazabilidad."
  - "⚑ Las tolerancias del reto (±3–5 % relativas, con piso absoluto de 0.15 V y 15 Ω) son restricciones pedagógicas definidas por el ejercicio, no cifras de instrumento real — se comunican explícitamente como margen del ejercicio en el HUD, no como un hecho del mundo real. Confirmar que el nivel es adecuado para el semestre destino."
  - "⚑ El voltaje de fuente V se deja fijo (12 V) en todos los modos para que el estudiante concentre la variable de caracterización en Voc/Isc/Rth; verificar si el revisor prefiere que también sea seleccionable."
  - "⚑ El modo Reto no revela Voc/Isc/Vth/Rth reales al fallar (solo indica cuál de los dos, Vth o Rth, está fuera de tolerancia) para evitar que el estudiante adivine por prueba y error; confirmar que este nivel de retroalimentación es pedagógicamente adecuado y no frustrante en exceso."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (tercera cosecha del molde S):** d1-04 reutiliza el mismo
   motor de análisis nodal modificado (MNA) de d1-02 (`mecanica-13`) y d1-03
   (`mecanica-61`), extendiéndolo con un nuevo tipo de elemento —el amperímetro
   ideal— para medir la corriente de cortocircuito directamente del solver. Es la
   primera práctica del sector centrada en un **teorema de red** (Thévenin/Norton)
   en lugar de análisis directo, y la primera con un modo de **caracterización de
   caja negra** genuina (topología oculta, no solo valores ocultos); si el patrón de
   caja negra es pedagógicamente sólido, se replica en d1-05 (transferencia máxima
   de potencia) y en futuras prácticas de caracterización de dispositivos.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/equivalente-thevenin-norton.html](../../../public/labs/equivalente-thevenin-norton.html))
   muestra el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) igual que
   mecanica-13/mecanica-61, y el modo Reto rotula explícitamente las tolerancias de
   verificación como un margen pedagógico del ejercicio, no como una especificación
   de fabricante ni de instrumento real, para cumplir la regla de honestidad del
   proyecto (`ESTANDAR-MOLDE-LAB-3D.md`).
3. **Petición concreta al experto:** (a) confirmar o corregir las claves
   curriculares ⚑; (b) validar que el procedimiento de dos mediciones (Voc, Isc) y
   las tolerancias del reto son representativas de cómo se caracteriza un
   dispositivo real en un banco de pruebas de nivel técnico; (c) señalar si la
   retroalimentación parcial del reto (indicar solo cuál parámetro falló, sin
   revelar los valores reales) es el nivel correcto de andamiaje pedagógico o si
   el revisor prefiere una pista adicional.
