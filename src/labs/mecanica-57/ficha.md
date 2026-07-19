# Ficha de práctica — Conmutación de un Motor BLDC/PMSM (`mecanica-57`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** decimocuarta práctica del dominio D5 (Transformadores/Máquinas
> eléctricas) — d5-14 de 16. Es una práctica de **molde S+P** (esquemático interactivo +
> panel de instrumentos virtual, sin fase de ensamble), como d5-07 (mecanica-50), d5-11
> (mecanica-54), d5-12 (mecanica-55) y d5-13 (mecanica-56): el elemento central es el
> pizarrón que dibuja las tres FEM/corrientes de fase trapezoidales y la curva de par
> instantáneo contra el ángulo eléctrico del rotor. Es la primera práctica de la colección
> centrada en la **conmutación electrónica de seis pasos de un motor BLDC/PMSM**, y la
> única que declara explícitamente extender otro laboratorio (mecanica-1, el motor de
> tracción PMSM) en vez de anclarse a un programa curricular EM/MEC/ELE independiente.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-57
sector: mecanica-electronica
practica_maestra: "d5-14 — Analiza la conmutación de un PMSM/BLDC (molde S+P) — tomado literalmente de la fila d5-14 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "Extiende mecanica-1 — tomado literalmente de la columna 'Trazabilidad' de la fila d5-14 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
norma_ancla_lista_maestra: "— (sin norma ancla asignada) — la fila d5-14 de la lista maestra deja la columna 'Norma ancla' vacía ('—'), igual que d5-12/d5-13. No hay, por tanto, ninguna cláusula normativa que reconciliar en esta práctica; se cita en su lugar el mismo cuerpo de teoría estándar de máquinas síncronas de imanes permanentes y conmutación electrónica usado en d5-09..13 (ver `fuentes`)."
modulo: "Transformadores (D5)"
submodulo: "Máquinas síncronas de imanes permanentes: conmutación electrónica de seis pasos, error de temporización y detección sensorless (FEM trapezoidal) — molde S+P, mismo patrón estructural que d5-07/d5-11/d5-12/d5-13"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ código reutilizado de d5-01..13/D2/D10 (mismo perfil ocupacional general de electricidad/electrónica); confirmar si existe una clave SINCO más específica de accionamientos/electrónica de potencia antes de publicar la trazabilidad
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de explicar por qué un motor BLDC/PMSM necesita
  conocer la posición eléctrica del rotor para conmutar correctamente la corriente de cada
  fase; reconocer que un error de temporización en la conmutación (δ) reduce el par
  promedio disponible de forma cuadrática (no lineal) y genera rizo de par creciente;
  explicar por qué una conmutación sensorless con retardo de tiempo fijo introduce un error
  angular efectivo que crece con la velocidad del rotor, aunque el circuito de detección no
  cambie; y calcular —a mano o por tanteo— la corriente comandada o el error de conmutación
  que producen un par objetivo dado, usando las mismas ecuaciones que trazan la curva de par
  del pizarrón.
actividad_clave: >
  Sobre un banco con un inversor trifásico de seis pasos, un motor BLDC/PMSM y un bloque de
  sensores Hall, el estudiante mueve el deslizador de error de conmutación δ (−60° a 60°) y
  el de corriente comandada I_cmd (0–8 A), y observa cómo cambian el par promedio y el rizo
  de par en el pizarrón. En modo Comparar, corre dos demostraciones guiadas que contrastan
  una conmutación con sensores Hall (δ=0 exacto) contra una conmutación sensorless con
  retardo de tiempo fijo, cuyo error angular efectivo crece con la velocidad del rotor
  (barrida de 500 a 15000 rpm). En modo Reto, resuelve uno de dos tipos de problema:
  calcular a mano la corriente comandada que produce un par objetivo dado un error de
  conmutación conocido (el pizarrón se oculta, forzando el cálculo) o encontrar por tanteo
  el error de conmutación que produce un porcentaje de par objetivo con la corriente
  comandada fija (el pizarrón permanece visible; el deslizador de corriente queda bloqueado
  al escenario propuesto por el simulador).
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modo Explora: con la corriente comandada fija en 4 A, mueve el error de conmutación δ de 0° a 60° y observa cómo el par promedio cae de 1.8000 N·m (δ=0°, 100% del ideal) a 1.5750 N·m (δ=30°, 87.5%) y finalmente a 0.9000 N·m (δ=60°, 50%) — confirmado por recómputo exacto con `node -e` de `tAvgNm()`/`avgFrac()`: la caída es cuadrática en δ, no lineal."
  - "Modo Explora: verifica en la telemetría que el rizo de par pico-pico crece linealmente con |δ| — 25% a δ=15°, 50% a δ=30°, 75% a δ=45°, 100% a δ=60° (el par mínimo instantáneo llega a 0% del ideal exactamente en δ=60°) — confirmado con `node -e` de `ripplePct()`/`minFrac()`."
  - "Demostración 'Conmutación con sensores Hall': corre la animación y verifica en la telemetría que el error de conmutación efectivo se mantiene en δ_ef=0° en todo el barrido de velocidad (500 a 15000 rpm) — confirmado leyendo `state().delta` tras `runHallDemo()`."
  - "Demostración 'Conmutación sensorless': corre la animación con retardo fijo t_d=100 μs y verifica que el error angular efectivo crece con la velocidad: δ_ef≈9.6° a 4000 rpm, δ_ef≈12.0° a 5000 rpm, δ_ef≈36.0° a 15000 rpm — confirmado con `node -e` de `deltaFromDelayRpm(100, rpm)`; con t_d=200 μs el error ya satura en el límite de 60° del modelo a partir de 12500 rpm."
  - "Modo Reto (variante 'calcularICmd', analítica): el pizarrón se oculta por completo; dado el error de conmutación del escenario (un entero en [10,55]°, signo aleatorio) y un par objetivo T_obj (redondeado a 2 decimales), calcula a mano I_cmd=T_obj/(K_T·avgFrac(δ)) y verifica tu resultado con tolerancia ±0.05 A — ejemplo verificado con `node -e`: δ=30°, T_obj=1.97 N·m ⇒ I_cmd≈5.0032 A."
  - "Modo Reto (variante 'buscarDelta', empírica): el pizarrón permanece visible pero la corriente comandada queda bloqueada al escenario; ajusta solo el deslizador de error de conmutación (siempre positivo, 15° a 60°) hasta acercarte al porcentaje de par objetivo mostrado, con tolerancia ±1.0°."
normatividad:          # 🔒 sin norma ancla asignada en la lista maestra para esta fila
  - "La fila d5-14 de la lista maestra no asigna norma ancla ('—' en la columna correspondiente); no hay, por tanto, ninguna cláusula normativa específica que esta práctica deba reconciliar."
  - "Teoría estándar de máquinas síncronas de imanes permanentes (FEM trapezoidal, conmutación de seis pasos, detección de posición del rotor) — consistente con textos de referencia ampliamente usados en el sector (p. ej. Fitzgerald/Kingsley/Umans, 'Electric Machinery'; Krishnan, 'Permanent Magnet Synchronous and Brushless DC Motor Drives'), el mismo cuerpo citado en d5-08/d5-09/d5-12/d5-13."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "La forma cerrada exacta del par instantáneo T(θ,δ) de un inversor de seis pasos alimentando una FEM trapezoidal ideal, derivada analíticamente y verificada evaluando la función lineal a trozos en sus puntos de quiebre con `node -e` — no por muestreo aproximado — contra el código fuente de conmutacion-bldc-pmsm.body.js."
  - "Las tres funciones cerradas resultantes: par promedio T_avg(δ)=(1−δ²/7200)·T_ideal, par mínimo T_min(δ)=(1−|δ|/60)·T_ideal y rizo pico-pico pp(δ)=(|δ|/60)·T_ideal, válidas para |δ|≤60° — verificadas contra la tabla de la ficha técnica in-app: 100/96.875/87.5/71.875/50.000% de par promedio en δ=0/15/30/45/60°."
  - "El efecto de una conmutación sensorless con retardo de tiempo fijo, modelado como un error angular equivalente δ_ef=6·PP·rpm·t_d(s), creciente con la velocidad del rotor y saturado en ±60° (el límite de validez del modelo de par) — verificado con `node -e` de `deltaFromDelayRpm()` para los tres niveles de retardo del panel (50/100/200 μs)."
  - "Dos variantes de reto invertidas en forma cerrada a partir de las mismas ecuaciones de par: 'calcularICmd' (I_cmd=T_obj/(K_T·avgFrac(δ)), pizarrón oculto) y 'buscarDelta' (búsqueda empírica del δ positivo que produce un porcentaje de par objetivo, pizarrón visible, corriente bloqueada al escenario) — ambas verificadas por recomputación exacta contra el código fuente."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "La inductancia de fase del motor ni la rampa de subida/bajada real de la corriente conmutada — el modelo conmuta instantáneamente entre +1, 0 y −1 en los ángulos de conmutación exactos, sin constante de tiempo L/R."
  - "La saturación magnética del núcleo a alta corriente o velocidad — la FEM trapezoidal ideal se mantiene proporcional a la velocidad del rotor sin límite en todo el modelo."
  - "El contenido armónico de la modulación PWM real del inversor — el modelo asume que cada escalón de corriente es un valor constante durante su ventana de conducción de 120°, sin PWM de alta frecuencia."
  - "La inercia ni la dinámica temporal del rotor — el par se evalúa como función instantánea del ángulo eléctrico y del error de conmutación en régimen cuasi-estacionario, sin integrar la ecuación mecánica del rotor."
  - "El algoritmo real de detección de cruce por cero de la FEM que usa un controlador sensorless comercial — el modo Comparar solo modela su efecto neto como un retardo de tiempo fijo aplicado tras el cruce por cero, no el circuito de filtrado/comparación real."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Registro del par promedio y el rizo de par observados en al menos tres valores de error de conmutación δ, los dos valores de error angular efectivo comparados entre las demostraciones Hall y sensorless a distinta velocidad, y el diagnóstico correcto resuelto en ambas variantes del modo Reto con su cifra numérica de respaldo."
evidencia_desempeno: "Guía de observación de la lectura correcta del pizarrón de FEM/corriente y par instantáneo, de la explicación verbal de por qué el error de conmutación reduce el par promedio de forma cuadrática y genera rizo, y de la justificación razonada (no por ensayo y error) de la corriente o el error de conmutación calculados en el modo Reto."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué un motor BLDC/PMSM necesita conocer la posición del rotor para conmutar correctamente, y qué le cuesta en par un error de temporización (briefing.ts)."
desarrollo: "Práctica en el simulador: Explora (mueve el error de conmutación y la corriente comandada y observa el par promedio y el rizo) → Comparar (conmutación con sensores Hall vs. sensorless, con demostraciones guiadas de barrido de velocidad) → Reto (dos variantes: cálculo directo de la corriente comandada o búsqueda empírica del error de conmutación) → recorrido guiado automático como referencia."
cierre: "Ficha técnica (capa 2) con la tabla de par promedio/mínimo/rizo por error de conmutación, el contrato de fidelidad completo (SÍ/NO modela) y el ejemplo numérico de inversión de la ecuación de par para el modo Reto."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Teoría estándar de máquinas síncronas de imanes permanentes (FEM trapezoidal, conmutación de seis pasos, detección de posición del rotor con y sin sensores) — consistente con textos de referencia ampliamente usados en el sector (Fitzgerald/Kingsley/Umans; Krishnan), el mismo cuerpo citado en d5-08/d5-09/d5-12/d5-13."
  - "Todos los valores numéricos citados en esta ficha (tabla de par promedio/mínimo/rizo por error de conmutación, ejemplos de error angular efectivo sensorless a distinta velocidad y retardo, ejemplo de inversión de la ecuación de par para el reto) fueron recomputados exactamente con `node -e` contra el código fuente de conmutacion-bldc-pmsm.body.js, no calculados a mano ni estimados."
banderas_incertidumbre:
  - "⚑ La clave SINCO 2641/7541 se reutiliza de d5-01..13/D2/D10 — confirmar si existe una clave SINCO más específica de electrónica de potencia/accionamientos antes de publicar la trazabilidad."
  - "⚑ PP=4 pares de polos, K_T=0.45 N·m/A, el rango de corriente comandada (0–8 A) y el rango de velocidad del modo Comparar (500–15000 rpm) son valores ilustrativos de catálogo típico, no de una máquina ni inversor real verificado — confirmar con el experto si conviene anclarlos a una hoja de datos real de motor BLDC/PMSM de tracción, coherente con mecanica-1 (la práctica que esta extiende)."
  - "⚑ El modelo no incluye inductancia de fase ni PWM del inversor; confirmar con el experto si conviene introducir al menos la rampa de corriente por inductancia en una futura iteración, dado que es el efecto NO modelado más visible en un osciloscopio real conectado a un motor BLDC comercial."
  - "✅ Verificación de implementación: física verificada por recomputación ejecutada con `node -e` (no a mano) de `mod360()`/`trapStep()`/`trapEmf()`/`tNorm()`/`avgFrac()`/`minFrac()`/`ripplePct()`/`tAvgNm()`/`deltaFromDelayRpm()` contra el código fuente, incluyendo la tabla de par promedio/mínimo/rizo por error de conmutación y los ejemplos de error angular efectivo sensorless. Pendiente al momento de escribir esta ficha: corrida completa de Jest tras `npm run gen:labs` (snapshots dorados actualizados a mano en los puntos de inserción exactos, nunca con `jest -u`), `tsc --noEmit`, y verificación funcional con Playwright contra el HTML construido y servido localmente (los 3 modos, las dos demostraciones guiadas, ambas variantes del modo Reto, y el recorrido guiado automático, 0 errores de consola/página esperados) — completar antes del commit final y actualizar esta nota con el resultado exacto.
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (decimocuarta práctica de D5, quinta de molde S+P):**
   d5-14 reutiliza el patrón estructural de d5-07 (mecanica-50), d5-11 (mecanica-54),
   d5-12 (mecanica-55) y d5-13 (mecanica-56): esquemático interactivo + panel de
   instrumentos, sin fase de ensamble. Es la primera práctica de la colección centrada en
   la **conmutación electrónica de seis pasos** de un motor BLDC/PMSM —no en el par
   par-deslizamiento de un motor de inducción (d5-08/d5-09/d5-13) ni en el motor síncrono
   como compensador de FP (d5-12)— y la única cuya trazabilidad declara extender otro
   laboratorio de la colección (mecanica-1) en vez de anclarse a un programa curricular
   EM/MEC/ELE independiente.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/conmutacion-bldc-pmsm.html](../../../public/labs/conmutacion-bldc-pmsm.html))
   muestra el HUD con el modelo físico y el contrato de fidelidad —
   documentado en la sección 5 de la ficha técnica in-app
   ([_ficha-conmutacion-bldc-pmsm.js](../../../public/labs/_ficha-conmutacion-bldc-pmsm.js))
   y en el encabezado de fidelidad del propio archivo fuente
   (`conmutacion-bldc-pmsm.body.js`).
3. **Verificación de implementación:** ✅ Física verificada por recomputación ejecutada con
   `node -e` (no a mano) de las nueve funciones del modelo, incluyendo la tabla de par
   promedio/mínimo/rizo por error de conmutación y los ejemplos de error angular efectivo
   sensorless. Pendiente al momento de escribir esta ficha: corrida completa de Jest tras
   `npm run gen:labs`, `tsc --noEmit`, y verificación funcional con Playwright contra el
   HTML construido y servido localmente — completar antes del commit final y actualizar
   esta nota con el resultado exacto.
4. **Petición concreta al experto:** (a) confirmar si PP=4, K_T=0.45 N·m/A y el rango de
   corriente comandada (0–8 A) son razonables como valores ilustrativos de catálogo típico
   o si convendría anclarlos a la misma hoja de datos que en algún momento se use para
   mecanica-1 (la práctica que esta extiende); (b) confirmar si la ausencia de inductancia
   de fase y de modulación PWM del inversor es aceptable pedagógicamente para este nivel, o
   si distorsiona de forma importante lo que un estudiante vería en un osciloscopio real;
   (c) confirmar si existe una clave SINCO más específica de electrónica de
   potencia/accionamientos que la reutilizada de la familia D2/D10/d5-01..13; (d) confirmar
   si, en ausencia de norma ancla asignada por la lista maestra, conviene proponer una
   (p. ej. IEC 60034-1, ya citada en d5-09) o dejarla intencionalmente sin anclar como lo
   indica la fila d5-14.
