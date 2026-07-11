# Ficha de práctica — Diodo Zener: regulador shunt de voltaje (`mecanica-16`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** tercera práctica de la **Tanda 1 (D2 — Electrónica analógica y de
> potencia)**, dominio con hueco total 🔴 en la matriz de cobertura
> (`docs/LISTA-MAESTRA-200-PRACTICAS.md`). Introduce el modelo lineal por tramos del
> diodo zener (corte/codo/avalancha) resuelto por bisección numérica exacta, reutilizando
> el concepto de línea de carga ya enseñado en `mecanica-13` (d1-02, Kirchhoff).

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-16
sector: mecanica-electronica
practica_maestra: "d2-03 — Diodo zener como regulador de voltaje shunt: Iz mínimo (rodilla) y máximo (Pd max), diseño de Rs, regulación de línea/carga (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "MEC-I.2 (Mecatrónica, Módulo I, Submódulo 2) · ETR-I.2 (Electrónica/Tecnología, resultado I.2)"   # ⚑ código interno del mapeo (LISTA-MAESTRA); no verificado contra un catálogo externo — confirmar con el responsable curricular
modulo: "Electrónica analógica y de potencia (D2)"
submodulo: "Circuitos de regulación de voltaje con diodos"          # ⚑ confirmar clave exacta del plan vigente
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de explicar el principio de regulación shunt
  (Rs serie + zener en paralelo con la carga); identificar las tres regiones del modelo
  lineal por tramos del zener (corte, codo, avalancha) y su resistencia dinámica en cada
  una; calcular el punto de operación (Vout, Iz) de un circuito regulador dado; verificar
  si ese punto cae dentro de la ventana de corriente segura (Izk ≤ Iz ≤ Izm); predecir la
  regulación de línea de pequeña señal; y diseñar un resistor serie Rs que mantenga al
  zener dentro de su ventana segura en un rango declarado de Vin y de carga, incluyendo
  el peor caso de carga desconectada.
actividad_clave: >
  Compara tres dispositivos zener reales (1N4728A 3.3V, 1N4733A 5.1V/1W, 1N5231B
  5.1V/500mW) sobre un esquema IEC 60617 y un motor de bisección numérica sobre el
  modelo lineal por tramos: en el modo Explora observa cómo el punto de operación Q se
  mueve sobre la curva V-I real al cambiar dispositivo, Rs, RL y Vin; en Predicción
  calcula Vout e Iz antes de ver el medidor; en Barrido mide la regulación de línea
  (dVout/dVin) y la contrasta contra la fórmula teórica de pequeña señal Rp/(Rp+Rs); y
  en el Reto diseña Rs para cumplir la ventana de corriente segura en todo un rango
  declarado de Vin y RL.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Reconoce la topología del regulador shunt: fuente Vin, resistor serie Rs, diodo zener en paralelo (shunt) con la carga RL, con esquema IEC 60617."
  - "Modo Explora: cambia entre tres dispositivos (1N4728A, 1N4733A, 1N5231B) y entre valores de Rs y RL; observa cómo el punto de operación Q — intersección de la recta de carga (definida por Vin y Rs, mismo concepto que en d1-02/Kirchhoff) con la curva V-I del zener — se mueve entre las tres regiones del modelo: corte (Iz=0), codo (resistencia dinámica alta Zzk) y avalancha (resistencia dinámica baja Zzt)."
  - "Verifica que el punto de operación NO se resuelve con una fórmula cerrada de un solo tramo: el simulador resuelve la ecuación de nodo exacta (Vin−V)/Rs − Iz(V) − V/RL = 0 por bisección numérica monótona sobre las tres regiones del modelo lineal por tramos, anclado a los parámetros de hoja de datos (Vz, Izt, Zzt, Izk, Zzk, Izm, Pd) de cada dispositivo."
  - "Modo Predicción: dado un circuito completo (dispositivo + Rs + RL + Vin), predice Vout e Iz — antes de que el medidor se revele (tolerancias definidas por campo)."
  - "Modo Barrido: recorre Vin con todo lo demás fijo, mide la regulación de línea (dVout/dVin) por regresión sobre los puntos simulados, y la contrasta contra la fórmula teórica de pequeña señal Rp/(Rp+Rs), con Rp = Zzt ∥ RL."
  - "Modo Reto: con RL y Vin dados (incluyendo el rango de tolerancia de línea y la carga desconectada como peor caso), elige Rs para mantener al zener dentro de su ventana de corriente segura (Izk ≤ Iz ≤ Izm) en todo el rango declarado."
  - "Responde la pregunta de ingeniería sobre por qué la carga desconectada (RL→abierto) es el peor caso térmico del regulador shunt: toda la corriente que entrega Rs pasa entonces por el zener, no solo el excedente sobre la carga."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60617 — símbolos gráficos para esquemas eléctricos (representación normalizada del circuito)."
  - "⚑ No se confirmó un número de norma IEC específico y verificado para diodos zener individuales como componente (IEC 60747 cubre dispositivos semiconductores discretos de forma general, pero no se verificó qué parte -si alguna- aplica formalmente a zeners de referencia/regulación). Usar solo como referencia de contexto hasta que un experto lo confirme."
simulador_modela:      # 🔒
  - "Modelo lineal por tramos del zener con tres regiones físicas: corte (Iz=0 para V≤V0), codo (Iz=(V−V0)/Zzk para V0<V≤Vzk) y avalancha (Iz=Izk+(V−Vzk)/Zzt para V>Vzk), con V0 y Vzk derivados por fórmula de los parámetros de hoja de datos (Vz, Izt, Zzt, Izk) de cada dispositivo, no valores arbitrarios."
  - "Solución exacta del circuito Rs–zener–RL por bisección numérica monótona sobre la ecuación de nodo, válida para cualquier combinación de Rs, RL y Vin dentro del rango de la gráfica — reutiliza el concepto de línea de carga ya introducido en d1-02 (Kirchhoff) y d2-01 (diodo)."
  - "Verificación explícita de la ventana de corriente segura: Izk como mínimo de regulación (por debajo, el zener deja de regular) e Izm como máximo absoluto (derivado de Pd,max/Vz, por encima el dispositivo se sobrecalienta), y de potencia (Pz=Vz·Iz contra Pd del dispositivo)."
  - "Regulación de línea medida en el modo Barrido por regresión sobre puntos simulados (dVout/dVin), contrastada contra la fórmula teórica de pequeña señal Rp/(Rp+Rs), con Rp=Zzt∥RL."
  - "Flujo predice-antes-de-ver (modo Predicción) y modo Reto de diseño de Rs con verificación de peor caso (incluyendo carga desconectada)."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Coeficiente de temperatura αVZ: las hojas de datos de la familia consultada no reportan un valor único y confiable de αVZ por parte (varía con Vz e Iz de forma no trivial, negativo para Vz<~5V por efecto túnel dominante, positivo para Vz>~6V por avalancha dominante); el simulador muestra esto solo como nota cualitativa, sin desplazar ningún número con el deslizador de temperatura."
  - "Corriente de fuga sub-codo: para V≤V0 el modelo idealiza Iz=0 exacto; un zener real conduce una fuga inversa pequeña pero no nula incluso antes del codo."
  - "Capacitancia de unión y respuesta AC/transitoria: el zener del modelo es un elemento puramente resistivo por tramos en CD; no se modela su capacitancia de unión ni la velocidad de respuesta ante escalones rápidos de Vin, ni efectos de alta frecuencia/RF ni tiempos de recuperación por conmutación."
  - "Ruido de avalancha: la avalancha zener es una fuente conocida de ruido eléctrico de banda ancha (usada incluso deliberadamente en generadores de ruido); este modelo entrega un Iz determinista sin componente de ruido."
  - "Fuente y resistores ideales: Vin se trata como fuente de voltaje ideal sin resistencia interna, y Rs/RL como resistencias ideales sin tolerancia ni coeficiente térmico."
  - "Derrateo térmico de Izm y Pd: el límite de corriente/potencia se compara contra el rating de hoja de datos a la temperatura de referencia del fabricante; un zener real pierde capacidad de disipación al subir la temperatura ambiente o de encapsulado (curva de derrateo)."
  - "Variación pieza a pieza dentro de un mismo lote (distribución estadística de Vz, r_Z, etc.), envejecimiento o degradación a largo plazo, y el origen microscópico del efecto zener vs. avalancha a nivel de física de semiconductores — el simulador reporta los parámetros de hoja de datos sin pretender derivarlos desde primeros principios."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Hoja de diseño del reto: Rs elegido, cálculo de Vout/Iz en los dos extremos de peor caso (Vin mínimo con carga máxima, Vin máximo con carga desconectada), y diseño aceptado por el simulador dentro de la ventana de corriente segura."
evidencia_desempeno: "Guía de observación del modo Predicción (Vout, Iz) y del modo Barrido (regulación de línea medida vs. fórmula teórica Rp/(Rp+Rs))."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué el zener regula solo dentro de una ventana de corriente (rodilla-límite térmico), y qué resuelve realmente el resistor serie Rs (briefing.ts)."
desarrollo: "Práctica en el simulador: explora → predice → barrido → reto de diseño de Rs con predicción obligatoria."
cierre: "Ficha técnica (capa 2) con los tres dispositivos, el modelo lineal por tramos, el motor de bisección numérica y el procedimiento de medición física con fuente variable, resistores de precisión y multímetro."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Boylestad, R.L. y Nashelsky, L., Electronic Devices and Circuit Theory (Pearson) — modelo lineal del zener y diseño de Rs para reguladores shunt; edición/página local no verificada en esta sesión."
  - "Sedra, A.S. y Smith, K.C., Microelectronic Circuits (Oxford) — modelo lineal por tramos del diodo zener (Vz0, rz) y su aplicación como regulador de voltaje; edición/página local no verificada."
  - "Malvino, A.P. y Bates, D.J., Electronic Principles (McGraw-Hill) — diseño de reguladores zener con análisis de peor caso (Rs,min/Rs,max), regulación de línea y de carga; edición/página local no verificada."
  - "onsemi (antes Motorola Semiconductor), 'TVS/Zener Theory and Design Considerations', Handbook HBD854/D — documento técnico de referencia del fabricante sobre teoría, modelo y diseño de circuitos con diodos zener/TVS."
  - "IEC 60617 — Graphical symbols for diagrams (base de datos de símbolos normalizados)."
  - "Hoja de datos ON Semiconductor/Diodes Inc./Vishay 'Zener Voltage Regulators, 1N4728A thru 1N4764A, 1.0 Watt, 3.3 thru 100 Volt' — parámetros de 1N4728A y 1N4733A modelados aquí."
  - "Hoja de datos ON Semiconductor (ex-Motorola) '1N5221B Series / 1N5221B-1N5263B, 500 mW' — parámetros de 1N5231B modelado aquí."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (MEC-I.2 / ETR-I.2 / submódulo / SINCO): claves tomadas del mapeo interno (LISTA-MAESTRA); no se confirmaron contra ningún catálogo o estándar externo durante la investigación. Verificar contra el plan de estudios vigente antes de publicar la trazabilidad."
  - "⚑ CORREGIDO antes de codificar: la investigación inicial reportó Izm≈1380mA para el 1N4728A, cifra que la verificación adversarial detectó como físicamente inconsistente (implicaría P=Vz·Izm≈4.55W, 4.5× el propio Pd,max=1W declarado para el mismo dispositivo). El motor de cálculo de este simulador usa el valor corregido Izm=276mA (1N4728A) e Izm=178mA (1N4733A, valor de tabla real en vez de la estimación ingenua Pd/Vz≈196mA), ambos contrastados por fuentes secundarias cruzadas. Un experto con acceso al PDF primario debe re-confirmar estas cifras línea por línea antes de publicar el lab a escala."
  - "⚑ El factor de derateo térmico (6.67 mW/°C sobre TL=50°C) está verificado para la familia 1N4728A–1N4764A (incl. 1N4733A); NO se verificó si el 1N5231B (500 mW, DO-35) comparte el mismo punto de referencia de temperatura o el mismo factor — su hoja de datos específica debe consultarse antes de generalizar por analogía. Este simulador NO varía Izm con temperatura (deslizador de temperatura es solo nota cualitativa), por lo que el riesgo no se materializa en el motor de cálculo actual, pero debe declararse si se añade derateo térmico en una futura revisión."
  - "⚑ El coeficiente de temperatura αVZ no se verificó numéricamente parte por parte; solo se confirmó la tendencia física general y el límite máximo especificado para el 1N5231B (±0.03%/°C). El simulador NO usa ningún valor numérico de αVZ en el motor de cálculo — se trata únicamente como nota cualitativa en la ficha técnica, precisamente para evitar publicar una cifra no verificada."
  - "⚑ No se investigó ni verificó si existe una NOM mexicana aplicable específicamente al diseño de reguladores shunt con diodo zener a nivel de práctica de laboratorio educativa; no se forzó una cita NOM no verificada."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (tercera práctica de Tanda 1 / D2):** d2-03 continúa la serie
   de semiconductores (diodo → rectificadores → **zener/regulación** → BJT → MOSFET) que
   cubre el hueco total 🔴 identificado en D2. Introduce el modelo lineal por tramos del
   zener (corte/codo/avalancha) resuelto por bisección numérica exacta, reutilizando el
   concepto de línea de carga ya validado en `mecanica-13` (d1-02, Kirchhoff) — si este
   nivel es adecuado y sostenible, se replica en el resto de D2; si sobra o falta, se
   ajusta antes de continuar la tanda.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/zener.html](../../../public/labs/zener.html)) muestra el panel
   "🔒 Contrato de fidelidad" (Sí modela / NO modela) con los parámetros de hoja de datos
   de los tres dispositivos y las omisiones declaradas, de modo que el alumno y el
   evaluador ven las fronteras del modelo dentro de la práctica.
3. **Corrección aplicada antes de codificar (ver banderas ⚑):** la investigación curricular
   inicial para este tema reportó una cifra de Izm físicamente inconsistente para el
   1N4728A (1380 mA, que implicaría 4.5× su propio rating de potencia); la verificación
   adversarial la detectó por auto-consistencia interna y el motor de cálculo de este
   simulador ya usa el valor corregido (276 mA). Se documenta aquí como caso de estudio
   de por qué toda cifra de dispositivo — incluso las que una revisión previa marcó como
   "confirmada" — debe re-verificarse contra la hoja de datos primaria antes de escalar
   el patrón a más dispositivos.
4. **Petición concreta al experto:** (a) confirmar o corregir las claves curriculares ⚑;
   (b) re-verificar línea por línea contra el PDF primario los parámetros Izt/Zzt/Izk/Zzk/Izm
   de los tres dispositivos modelados (1N4728A, 1N4733A, 1N5231B); (c) confirmar si el
   factor de derateo térmico de la familia 1N4728A–1N4764A es aplicable por analogía al
   1N5231B o si debe verificarse por separado (aplica sólo si se añade derateo térmico en
   una futura revisión, ya que el motor actual no lo modela); (d) confirmar que los tres
   dispositivos y el patrón de regulador shunt son representativos de lo que un técnico
   encuentra en campo.
