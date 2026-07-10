# Ficha de práctica — Leyes de Kirchhoff: redes multimalla en vivo (`mecanica-13`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** este lab es la **implementación de referencia del molde S (esquemático
> con motor de cálculo)** para las prácticas de D1/D2 (`docs/LISTA-MAESTRA-200-PRACTICAS.md`, d1-02).

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-13
sector: mecanica-electronica
practica_maestra: "d1-02 — Resuelve redes multimalla y verifica las leyes de Kirchhoff (molde S)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ETR-I.1 (Electrónica/Tecnología, resultado I.1) · ELE-I"   # ⚑ confirmar claves exactas del plan vigente
modulo: "Circuitos eléctricos CD y CA (D1)"
submodulo: "Análisis de redes resistivas en corriente directa"          # ⚑ confirmar clave exacta
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de plantear las ecuaciones de nodo (LCK) de una
  red resistiva multimalla con dos fuentes, resolver el sistema lineal resultante para
  obtener los voltajes de nodo, verificar numéricamente que ΣI = 0 en cada nodo y
  ΣV = 0 en cada malla, y predecir los voltajes de una red nueva antes de simularla.
actividad_clave: >
  Analiza una red de 3 mallas (2 fuentes ideales, 5 resistores) sobre un esquema
  normalizado IEC 60617: verifica el balance de corrientes en cada nodo y el balance de
  voltajes en cada malla con la solución en vivo, y en el reto resuelve el sistema 2×2
  de análisis nodal en papel para predecir V_A y V_B con tolerancia de ±1 %.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Reconoce la topología en el esquema IEC 60617: nodos P, A, B, Q y ref (0 V), las 3 mallas M1–M3, las 2 fuentes (V1 = 12 V, V2 = 5 V) y los 5 resistores E12 con su código de colores."
  - "Modo Nodos: selecciona A, B y ref y verifica la LCK — la suma algebraica de corrientes de rama (entra positivo, sale negativo) da 0.000000 mA en cada nodo."
  - "Escribe la ecuación de nodo A: (V_P − V_A)/R1 = V_A/R2 + (V_A − V_B)/R3, y la análoga para B; identifica que sólo hay 2 incógnitas porque P y Q los fijan las fuentes y ref es la referencia."
  - "Modo Mallas: recorre M1, M2 y M3 sumando subidas (fuente de − a +) y caídas (resistor a favor de la corriente) y verifica que ΣV = 0 — incluida M2, que no contiene fuentes."
  - "Interpreta el signo de cada corriente de rama: el motor resuelve I = ΔV/R con dirección real; una corriente negativa significa sentido contrario al dibujado."
  - "Modo Reto: genera una red nueva (valores E12 y fuentes comerciales), plantea el sistema 2×2, resuélvelo en papel (sustitución, Cramer o matriz inversa) y escribe tu predicción de V_A y V_B antes de que el esquema los revele (tolerancia ±1 % o ±0.02 V)."
  - "Responde la pregunta de diseño: duplicar R4 'descarga' menos el nodo B — verifica cuantitativamente el nuevo V_B contra el recalculado por el motor."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60617 — símbolos gráficos para esquemas eléctricos (representación normalizada del circuito)"
  - "IEC 60063 — series de valores normalizados E6/E12/E24 para resistores"
  - "NOM-001-SEDE-2012 — instalaciones eléctricas: el análisis de circuitos es la base del dimensionamiento de ramas"
simulador_modela:      # 🔒
  - "Red resistiva lineal en CD con fuentes de voltaje ideales, declarada como datos y resuelta en vivo por análisis nodal modificado (MNA: matriz de conductancias + eliminación gaussiana con pivoteo parcial)."
  - "Verificación numérica de LCK nodo por nodo (suma de corrientes de rama con signo) y de LVK malla por malla (suma de subidas y caídas recorriendo el lazo)."
  - "Corrientes de rama exactas I = ΔV/R con su dirección real según el signo de la solución."
  - "Generador de redes aleatorias con valores comerciales: resistores de la serie E12 (×1000) y fuentes de menú (9/12/15/18/24 V y 3.3/5/9 V)."
  - "Código de colores real de 4 bandas de cada resistor del banco 3D, sincronizado con los valores de la red."
  - "Flujo predice-antes-de-ver: en el reto, voltajes y corrientes permanecen ocultos ('¿?') hasta que la predicción del alumno cae dentro de la tolerancia."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Tolerancias reales de los componentes: la banda oro declara ±5 %, pero el motor usa el valor nominal exacto."
  - "Resistencia interna de las fuentes (V1 y V2 son ideales, impedancia cero) ni resistencia de conductores y contactos."
  - "Efectos térmicos: coeficiente de temperatura ni autocalentamiento por I²R."
  - "Elementos parásitos (L, C) ni transitorios — la red está en CD estacionaria; RC/RL/RLC son materia de otras prácticas."
  - "La medición física: los voltajes mostrados son la solución exacta del modelo ideal, no lecturas de instrumento con incertidumbre (eso lo ejercita la práctica del multímetro, mecanica-12)."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Hoja de análisis de la red del reto: sistema 2×2 planteado, solución en papel y predicción de V_A/V_B aceptada por el simulador (±1 %)."
evidencia_desempeno: "Guía de observación de la verificación LCK/LVK en los modos Nodos y Mallas y de la interpretación de signos de corriente."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué LCK/LVK son la base de todo el análisis de circuitos y de SPICE (briefing.ts)."
desarrollo: "Práctica en el simulador: explora → nodos → mallas → reto con predicción obligatoria."
cierre: "Ficha técnica (capa 2) con la red canónica, el motor MNA y el procedimiento de verificación física en protoboard."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "G. Kirchhoff (1845), Annalen der Physik — enunciado original de las leyes de corrientes y voltajes."
  - "C.-W. Ho, A. E. Ruehli, P. A. Brennan (1975), 'The Modified Nodal Approach to Network Analysis', IEEE Transactions on Circuits and Systems — el algoritmo MNA del motor."
  - "IEC 60617 — Graphical symbols for diagrams (base de datos de símbolos normalizados)."
  - "IEC 60063 — Preferred number series for resistors and capacitors (series E)."
  - "Hayt, Kemmerly y Durbin — Análisis de circuitos en ingeniería (McGraw-Hill), análisis nodal y de mallas."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (ETR-I.1 / ELE-I / submodulo / SINCO): claves tomadas del mapeo interno (LISTA-MAESTRA); verificar contra el plan de estudios vigente antes de publicar la trazabilidad."
  - "⚑ La tolerancia pedagógica del reto (±1 % o ±0.02 V) es una decisión didáctica, no normativa; un docente puede preferir otra banda."
  - "⚑ La red canónica (12 V/5 V, 1–4.7 kΩ) es de diseño propio con valores E12; verificar que el nivel del sistema 2×2 corresponde al semestre donde se ubique la práctica."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (molde S de referencia):** d1-02 es la primera implementación
   del molde S (esquemático-simulación numérica: diagrama normalizado + motor de cálculo)
   que se replica en el resto de D1 y en buena parte de D2. Si el nivel matemático
   (sistema 2×2 con predicción obligatoria) y el contrato de fidelidad son correctos y
   sostenibles, se replica; si sobra o falta, se ajusta antes de la tanda T1.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/kirchhoff.html](../../../public/labs/kirchhoff.html)) muestra el panel
   "🔒 Contrato de fidelidad" (Sí modela / NO modela) y la línea `Ref:` con Kirchhoff (1845),
   IEC 60617 y MNA (1975), de modo que el alumno y el evaluador ven las fronteras del
   modelo dentro de la práctica.
3. **Petición concreta al experto:** (a) confirmar o corregir las claves curriculares ⚑;
   (b) validar que el sistema 2×2 con tolerancia ±1 % es el nivel adecuado para el
   semestre destino; (c) señalar cualquier convención de signos (subidas/caídas, dirección
   de corriente dibujada vs. real) que un docente de circuitos consideraría ambigua.
