# Ficha de práctica — Curva V–I de Resistores y Validación de Tolerancias (`mecanica-60`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** primera práctica construida del dominio **D1 (Circuitos Eléctricos)**
> tras d1-02 (Kirchhoff, `mecanica-13`), que ya estaba cerrado de una tanda anterior — con
> este lab **D1 avanza a 2/18**. Es molde **S+P** (3D didáctico + Ficha técnica), con norma
> ancla real (`IEC 60062`) a diferencia de d5-16, la práctica anterior cerrada del backlog.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-60
sector: mecanica-electronica
practica_maestra: "d1-01 — Caracteriza la curva V–I de resistores y valida tolerancias (molde S+P) — tomado literalmente de la fila d1-01 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ETR-I.1; MEC-I.1 — tomado literalmente de la columna 'Trazabilidad' de la fila d1-01 en docs/LISTA-MAESTRA-200-PRACTICAS.md."
norma_ancla_lista_maestra: "IEC 60062 (marcado) — tomado literalmente de la columna 'Norma ancla' de la fila d1-01 en docs/LISTA-MAESTRA-200-PRACTICAS.md. IEC 60062 define el código de marcado (bandas de color y código alfanumérico) de resistores y capacitores de valor fijo; la tolerancia que codifica cada banca de color (±1 %, ±2 %, ±5 %, ±10 %) es el dato que el modo Reto de este simulador pide validar. Complementariamente se usa IEC 60063 (series de valores preferidos E6/E12/E24/E96), que fija qué combinaciones de nominal+tolerancia existen realmente como componente comercial — no citada en la lista maestra para esta fila, pero necesaria para justificar los 4 nominales usados (220, 1000, 4700, 10000 Ω, todos valores E12)."
modulo: "Circuitos Eléctricos (D1)"
submodulo: "Caracterización de resistores por ajuste de la curva V–I: control de calidad de tolerancia contra el código de colores IEC 60062 (molde S+P — segunda práctica construida del dominio D1, tras d1-02/Kirchhoff)"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ código reutilizado de D2/D5/D10/d1-02 (mismo perfil ocupacional general de electricidad/electrónica); confirmar si existe una clave SINCO más específica de control de calidad de componentes antes de publicar la trazabilidad
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de tomar mediciones de voltaje y corriente sobre un
  resistor con un multímetro de exactitud conocida, reconociendo que cada lectura trae su
  propia incertidumbre ±(% de lectura + dígitos); ajustar, a partir de varios puntos (V, I), una
  recta por mínimos cuadrados forzada por el origen para obtener una estimación R̂ del valor real
  del resistor; decodificar el código de colores IEC 60062 de un resistor para conocer su
  nominal y tolerancia declarados; y decidir, comparando R̂ contra nominal ± tolerancia, si un
  resistor dado cumple o no su especificación — incluido el caso de caracterizar un componente
  con bandas ocultas usando únicamente sus propias mediciones.
actividad_clave: >
  Modo Explora: elige uno de 4 resistores conocidos (RX1–RX4, uno de ellos deliberadamente fuera
  de tolerancia) y toma sus 8 puntos V–I con el multímetro simulado; el pizarrón dibuja cada
  punto (coloreado según su propia relación V/I individual), la recta de ajuste, y las líneas de
  banda de tolerancia, mientras el veredicto PASA/FALLA se actualiza en vivo. Modo Reto: un
  resistor con bandas ocultas ("misterioso") — el estudiante toma sus propios 8 puntos, decide
  PASA o FALLA, y el simulador califica esa decisión contra el ajuste calculado con los propios
  puntos del estudiante (calificación autoconsistente, no contra el valor oculto directamente).
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modelo del multímetro: 6000 cuentas, autorrango, exactitud ±(0.5 % + 2 dígitos) en V y ±(1.0 % + 3 dígitos) en I — misma especificación que la práctica dedicada del multímetro (d10-01/mecanica-2x), para que la incertidumbre sea consistente entre prácticas. 8 puntos de tensión fijos al 15 %, 30 %, 45 %, 60 %, 75 %, 85 %, 95 % y 105 % de 12 V (1.8 V a 12.6 V) — verificado por recomputación independiente ejecutada con `node -e` a partir de las fórmulas `noisyReading()`/`takeMeasurement()`."
  - "Ajuste por mínimos cuadrados forzado por el origen: R̂ = Σ(V·I)/Σ(I²) — verificado por recomputación con `node -e` que la fórmula minimiza el error cuadrático de V−I·R̂ sujeto a pasar por (0,0), consistente con V=I·R de la Ley de Ohm."
  - "Exactitud del veredicto PASA/FALLA en modo Explora (Monte Carlo, 8 puntos, 2000 corridas por resistor, ejecutado con `node -e`): RX1 (220 Ω, tol 5 %, valor real 224 Ω, dentro) 100.0 % de acierto; RX2 (1000 Ω, tol 1 %, valor real 1000 Ω, dentro) 99.6 % de acierto; RX3 (10000 Ω, tol 2 %, valor real 9950 Ω, dentro) 100.0 % de acierto; RX4 (4700 Ω, tol 10 %, valor real 3800 Ω — 19.1 % fuera de tolerancia, trampa deliberada) 100.0 % de acierto."
  - "Generador de resistor misterioso (modo Reto): `makeMystery()` sortea, para cada uno de los 4 nominales E12 reutilizados de EXPLORA_R (220/1000/4700/10000 Ω), un valor real dentro de tolerancia (deriva aleatoria hasta 0.5× el margen de tolerancia) o fuera de tolerancia (deriva aleatoria de 1.5×–2.5× el margen) con probabilidad ~50/50 — verificado por Monte Carlo (500 corridas por caso, `node -e`): tol=1 % (caso más exigente) 97.0 % de acierto en casos dentro de tolerancia y 98.9 % en casos fuera; tol=2 %, 5 % y 10 % con 100.0 % de acierto en ambos casos. Una versión anterior más débil del generador (márgenes 0.85×/1.15×) fue descartada por dar demasiados casos ambiguos cerca de la frontera de tolerancia; la versión final (0.5×/1.5–2.5×) es la que se implementó."
  - "Calificación autoconsistente del modo Reto: `checkReto(decision)` no compara la decisión del estudiante contra el valor oculto del resistor misterioso directamente, sino contra `verdict(fitR(<puntos propios del estudiante>), mystery.nominal, mystery.tol)` — es decir, el estudiante es calificado por la consistencia entre su propia decisión y su propio ajuste, igual que en un laboratorio real donde el instructor no conoce de antemano qué tan bien mide cada estudiante. Si la decisión es incorrecta, el simulador muestra el R̂ del propio estudiante contra el rango nominal±tolerancia, sin revelar el valor real — solo lo revela cuando la decisión es correcta."
  - "Escalado del eje X (corriente) del pizarrón V–I: se calcula a partir del nominal visible (no del valor oculto `mystery.true`, para no filtrar información) y se ajusta con el máximo de los puntos ya graficados — diseño tipo autorrango de osciloscopio real que evita tanto la fuga de información como el recorte de puntos en casos de tolerancia 10 % con resistencia real más baja que el nominal."
normatividad:          # 🔒 revisión experta obligatoria antes de publicar
  - "✅ IEC 60062 — código de marcado (bandas de color) de resistores y capacitores de valor fijo. Es la norma ancla real de esta fila en la lista maestra; el simulador la usa directamente para pintar las 4 bandas del resistor 3D (`bandsFor()`) y para decodificar la tolerancia (banda de color de tolerancia: café=1 %, rojo=2 %, oro=5 %, plata=10 %)."
  - "⚑ IEC 60063 (series de valores preferidos E6/E12/E24/E96) — no citada en la columna 'Norma ancla' de la fila d1-01, pero usada implícitamente: los 4 nominales de EXPLORA_R (220, 1000, 4700, 10000 Ω) son todos valores de la serie E12. Confirmar con el experto si conviene citarla explícitamente como norma secundaria."
  - "✅ El formato de incertidumbre del multímetro ±(% de lectura + dígitos) es el mismo que documenta la ficha técnica de la práctica dedicada al multímetro — reutilizado aquí para mantener consistencia entre prácticas que comparten el mismo instrumento simulado."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "La Ley de Ohm V = I·R (Ohm, 1827) como modelo lineal del resistor ideal — verificado por recomputación con `node -e`."
  - "El presupuesto de incertidumbre ±(% de lectura + dígitos) de un multímetro de 6000 cuentas con autorrango, aplicado de forma independiente a cada lectura de V y de I — verificado por recomputación con `node -e` (`noisyReading()`)."
  - "El ajuste por mínimos cuadrados forzado por el origen (R̂ = Σ(V·I)/Σ(I²)) a partir de hasta 8 puntos medidos, incluida su exactitud estadística verificada por Monte Carlo (2000 corridas por caso en modo Explora, 500 por caso en modo Reto) — verificado por recomputación con `node -e`."
  - "El veredicto de tolerancia PASA/FALLA comparando R̂ contra nominal ± tolerancia, con la tolerancia tomada del código de colores IEC 60062 de cada resistor — verificado por recomputación con `node -e`."
  - "La calificación autoconsistente del modo Reto (la decisión del estudiante se califica contra su propio ajuste con sus propios puntos, no contra el valor oculto) — verificado por lectura directa del código de `checkReto()`."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "El coeficiente de temperatura ni el autocalentamiento por I²R del resistor — se modela una R constante en todo el rango de corriente medido, sin variación térmica."
  - "La carga de los instrumentos sobre el circuito — el amperímetro se modela con resistencia cero y el voltímetro con impedancia infinita; en la vida real, la elección entre conexión 'corta' o 'larga' introduce un error sistemático adicional que este modelo no reproduce."
  - "El límite de potencia (rating) del componente — no se calcula P=V·I contra un máximo, ni se modela degradación o falla térmica por excederlo."
  - "La resistencia de cables y contactos ni el envejecimiento/deriva del material resistivo — mismas simplificaciones que la práctica de Kirchhoff (d1-02/mecanica-13): conexiones equipotenciales perfectas y componente con valor fijo durante toda la sesión."
  - "Un catálogo completo de la serie E12/E24 — el modelo usa solo 4 nominales fijos (reutilizados también como base del generador del modo Reto), no un barrido de todos los valores normalizados."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Registro de las 8 mediciones V–I, el ajuste R̂ y el veredicto PASA/FALLA obtenidos en modo Explora para al menos dos de los cuatro resistores conocidos (incluido RX4, deliberadamente fuera de tolerancia), y el resistor misterioso resuelto correctamente en modo Reto."
evidencia_desempeno: "Guía de observación de la explicación correcta de por qué un ajuste con varios puntos es más confiable que una sola lectura, de la lectura correcta de las bandas de color de un resistor contra IEC 60062, y de la justificación del veredicto PASA/FALLA del modo Reto usando el propio R̂ calculado por el estudiante (no una lectura directa del valor oculto)."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué V=I·R (Ohm, 1827) parece trivial pero medirla con instrumentos y componentes reales exige lidiar con incertidumbre, y por qué varios puntos ajustados por mínimos cuadrados dan una estimación mejor que una sola lectura (briefing.ts)."
desarrollo: "Práctica en el simulador: Explora (elige uno de 4 resistores conocidos, toma sus 8 puntos, observa el ajuste y el veredicto de tolerancia en el pizarrón) → Reto (resistor con bandas ocultas: toma tus propios puntos y decide PASA/FALLA, calificado contra tu propio ajuste) → recorrido guiado automático que mide dos resistores en Explora (incluido el caso fuera de tolerancia), responde el quiz, y termina resolviendo un caso del modo Reto."
cierre: "Ficha técnica (capa 2) con la tabla de especificaciones del multímetro y el muestreo, el contrato de fidelidad completo (SÍ/NO modela) y la aclaración de que el veredicto del modo Reto se califica contra el propio ajuste del estudiante, no contra el valor oculto del resistor."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "✅ G. S. Ohm (1827), Die galvanische Kette, mathematisch bearbeitet — fuente primaria de V=I·R."
  - "✅ IEC 60062 — norma ancla real de esta fila en la lista maestra; código de marcado (bandas de color) de resistores."
  - "⚑ IEC 60063 — series de valores preferidos (E12 usada por los 4 nominales del simulador); no citada como norma ancla de esta fila específica, usada solo para justificar que los nominales elegidos son valores comerciales reales."
  - "✅ C. F. Gauss (1809) / A.-M. Legendre (1805) — método de mínimos cuadrados, base del ajuste R̂ = Σ(V·I)/Σ(I²)."
  - "✅ JCGM 100:2008 (GUM) — marco de incertidumbre ±(% de lectura + dígitos), reutilizado de la práctica del multímetro para consistencia entre prácticas del mismo sector."
banderas_incertidumbre:
  - "⚑ La clave SINCO 2641/7541 se reutiliza de D2/D5/D10/d1-02 — confirmar si existe una clave SINCO más específica de control de calidad/caracterización de componentes antes de publicar la trazabilidad."
  - "⚑ Los 4 valores 'reales' de EXPLORA_R (224, 1000, 9950, 3800 Ω) y los márgenes de deriva del generador del modo Reto (0.5× dentro, 1.5–2.5× fuera del margen de tolerancia) son valores de diseño del laboratorio elegidos para dar un caso claramente PASA, dos casos límite y un caso claramente FALLA — confirmar con el experto si estos márgenes reflejan una distribución realista de defectos de manufactura o si conviene ajustarlos."
  - "✅ Verificación de implementación: `noisyReading`, `takeMeasurement`, `fitR`, `verdict`, `makeMystery` y `checkReto` verificados por recomputación ejecutada con `node -e` (no a mano), incluido Monte Carlo de exactitud del veredicto en ambos modos. Pendiente al momento de escribir esta ficha: `npm run gen:labs`, actualización manual de golden snapshots, corrida completa de Jest, `tsc --noEmit`, y verificación funcional con Playwright contra el HTML construido y servido localmente — completar antes del commit final y actualizar esta nota con el resultado exacto."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (segunda práctica construida del dominio D1):** d1-01 caracteriza
   un resistor por su curva V–I medida con un multímetro simulado de incertidumbre realista, y
   valida su tolerancia contra el código de colores IEC 60062 — a diferencia de d5-16 (la
   práctica anterior cerrada del backlog), **esta fila sí tiene norma ancla real** en la lista
   maestra. El diseño más importante de esta práctica es la **calificación autoconsistente** del
   modo Reto: el estudiante nunca es calificado contra un valor oculto directamente, sino contra
   la consistencia entre su propia decisión y su propio ajuste de mínimos cuadrados — el mismo
   criterio que usaría un instructor real, que tampoco conoce de antemano la calidad de la toma
   de datos de cada estudiante.
2. **Relación con d1-02 (Kirchhoff, `mecanica-13`):** ambas son prácticas de D1 (Circuitos
   Eléctricos) y comparten convenciones visuales (paleta `--accent:#2A9D8F`, estructura de
   telemetría `.g>.gl>span+b`) y de código de colores E12/IEC 60062-60063 para resistores, pero
   son independientes: esta práctica no importa ni depende de ningún estado de `mecanica-13`.
3. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/curva-vi-resistores.html](../../../public/labs/curva-vi-resistores.html))
   muestra el HUD con el contrato de fidelidad — documentado en la sección 5 de la ficha técnica
   in-app
   ([_ficha-curva-vi-resistores.js](../../../public/labs/_ficha-curva-vi-resistores.js))
   y en el encabezado de fidelidad del propio archivo fuente
   (`curva-vi-resistores.body.js`).
4. **Verificación de implementación:** ✅ Datos verificados por recomputación ejecutada con
   `node -e` (no a mano): `noisyReading`, `takeMeasurement`, `fitR`, `verdict` para los 4
   resistores de EXPLORA_R (Monte Carlo de 2000 corridas por caso), y `makeMystery`/`checkReto`
   para el modo Reto (Monte Carlo de 500 corridas por caso, los 4 valores de tolerancia). Pendiente
   al momento de escribir esta ficha: `npm run gen:labs`, actualización manual de golden
   snapshots, corrida completa de Jest, `tsc --noEmit`, y verificación funcional con Playwright
   contra el HTML construido y servido localmente — completar antes del commit final y actualizar
   esta nota con el resultado exacto.
5. **Petición concreta al experto:** (a) confirmar si conviene citar IEC 60063 explícitamente
   como norma secundaria de esta fila (los 4 nominales usados son valores E12); (b) confirmar si
   existe una clave SINCO más específica que la reutilizada de D2/D5/D10/d1-02 para control de
   calidad/caracterización de componentes; (c) confirmar si los márgenes de deriva del generador
   del modo Reto (0.5× dentro, 1.5–2.5× fuera del margen de tolerancia) reflejan razonablemente
   un caso real de manufactura o si convendría ajustarlos con datos de tasa de defectos real.
