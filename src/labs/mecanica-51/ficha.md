# Ficha de práctica — Circuito Equivalente del Motor de Inducción por Ensayos (`mecanica-51`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** octava práctica del dominio D5 (Transformadores/Máquinas eléctricas) —
> d5-08 de 16. Es una práctica de **molde S+P** (esquemático interactivo + panel de
> instrumentos virtual, sin fase de ensamble 3D): el elemento central es un banco de ensayo
> con un motor de inducción y una fuente de laboratorio, con un tablero-pizarrón que dibuja
> el esquemático de cada ensayo (CD, vacío, rotor bloqueado) y, en el cuarto caso, el
> circuito equivalente en T ya ensamblado junto con la curva par-deslizamiento. Es la
> continuación directa de d5-06 (curva par-velocidad, molde E+S) y d5-07 (métodos de
> arranque, molde S+P): ambas prácticas reutilizaron múltiplos de placa (ILR, TLR, Tmáx)
> como datos de entrada sin derivarlos; esta práctica cierra ese hueco derivando el circuito
> eléctrico equivalente completo —y con él, la curva par-deslizamiento— a partir únicamente
> de tres ensayos medibles en taller.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-51
sector: mecanica-electronica
practica_maestra: "d5-08 — Deriva el circuito equivalente del motor de inducción por ensayos (molde S+P) — tomado literalmente de la fila d5-08 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "UAX Máquinas — tomado literalmente de la columna 'Trazabilidad' de la fila d5-08 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
norma_ancla_lista_maestra: "IEEE 112 — tomado literalmente de la columna 'Norma ancla' de la fila d5-08. ⚑ Se citan cláusulas específicas de IEEE Std 112 (§5.4 ensayo de CD, §5.9.1 rotor bloqueado a frecuencia reducida, §5.9.2.2 reparto NEMA Diseño B de reactancias) con base en la estructura estándar publicada de esta norma, pero el texto exacto de cada cláusula no se cotejó palabra por palabra contra la edición vigente en esta sesión — requiere verificación experta antes de publicar la trazabilidad como definitiva."
modulo: "Transformadores (D5)"
submodulo: "Motores de inducción trifásicos: circuito equivalente en T por ensayos IEEE 112 (molde S+P — cierra el hueco dejado por d5-06/d5-07)"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ código reutilizado de d5-01..07/D2/D10 (mismo perfil ocupacional general de electricidad/electrónica); confirmar si existe una clave SINCO más específica de ensayo/caracterización de máquinas eléctricas antes de publicar la trazabilidad
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de explicar por qué el circuito equivalente de un
  motor de inducción (R1, X1, Xm, R2', X2') no se obtiene de la placa sino que se deriva de
  tres ensayos medibles; calcular R1 a partir del ensayo de CD (R1=Rll/2); calcular Xnl y las
  pérdidas rotacionales Prot a partir del ensayo de vacío, separando la impedancia medida
  Znl en su parte resistiva y reactiva; calcular Rbl y Xbl a partir del ensayo de rotor
  bloqueado hecho deliberadamente a frecuencia reducida (para no distorsionar R2' por efecto
  piel) y corregir Xbl linealmente a la frecuencia nominal; repartir la reactancia serie
  entre X1 y X2' según la convención NEMA Diseño B (40/60) y despejar Xm; y usar el
  equivalente de Thévenin del circuito resultante para calcular el par de arranque, el par
  máximo y el deslizamiento de par máximo, sin necesidad de ensayar jamás el motor a plena
  carga.
actividad_clave: >
  Sobre un banco con un motor de inducción y una fuente de laboratorio, el estudiante
  recorre los cuatro casos del simulador en orden: ensayo de CD (motor detenido,
  desenergizado, óhmetro entre terminales de línea), ensayo de vacío (motor girando libre,
  sin carga en el eje, wattmetro/voltmetro/amperímetro trifásicos), ensayo de rotor
  bloqueado (motor trabado mecánicamente —candado visible en el eje— a frecuencia de ensayo
  reducida) y, finalmente, circuito equivalente (el tablero dibuja el circuito en T completo
  ya ensamblado junto con la curva par-deslizamiento). En cada uno de los tres ensayos, el
  estudiante lee las mediciones en el tablero y resuelve un cuestionario de opción múltiple
  que verifica que entendió qué cantidad aísla cada ensayo y por qué; en el cuarto caso,
  identifica sobre el esquemático la posición correcta de la rama de magnetización Xm
  (después de R1+jX1, no en las terminales de la fuente) y lee sobre la curva el par de
  arranque, el par máximo y la velocidad síncrona.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Caso Ensayo de CD: con el motor detenido y desenergizado, mide la resistencia entre dos terminales de línea del estátor (conexión estrella) y calcula R1=Rll/2. Verificado con `node -e`: Rll=0.612Ω (dato ilustrativo del simulador) → R1=0.306Ω."
  - "Caso Ensayo de vacío: con el motor girando libre sin carga en el eje, mide Vf, I y P3φ y calcula Znl=Vf/I, Rnl_eff=(P3φ/3)/I², Xnl=√(Znl²−Rnl_eff²), y las pérdidas rotacionales Prot=P3φ−3·I²·R1 (restando primero las pérdidas en el cobre del estátor). Verificado con `node -e`: Vline=230V, I=8.2A, P3φ=640W → Znl=16.194Ω, Rnl_eff=3.173Ω, Xnl=15.880Ω, Prot=578.27W."
  - "Caso Rotor bloqueado: con el rotor mecánicamente trabado (s=1) y la fuente ajustada a frecuencia reducida (≤25% de la nominal, IEEE 112 §5.9.1, para no distorsionar R2' por efecto piel), mide Vf, I y P3φ y calcula Zbl=Vf/I, Rbl=(P3φ/3)/I² (sin corrección de frecuencia), Xbl a la frecuencia de ensayo, y luego Xbl referido a la frecuencia nominal escalando linealmente: Xbl(fn)=(fn/ftest)·Xbl(ftest). Verificado con `node -e`: fTest=15Hz, fRated=60Hz, Vline=44.5V, I=27.6A, P3φ=1650W → Zbl=0.9309Ω, Rbl=0.7220Ω, Xbl(15Hz)=0.5876Ω, Xbl(60Hz)=2.3502Ω."
  - "Caso Circuito equivalente: combina los tres resultados anteriores repartiendo Xbl(fn) según NEMA Diseño B (X1=0.4·Xbl, X2'=0.6·Xbl), despeja Xm=Xnl−X1 y R2'=Rbl−R1, arma el equivalente de Thévenin visto desde el entrehierro (Zth, Vth) y traza la curva par-deslizamiento completa T(s), leyendo sobre ella el par de arranque (s=1), el par máximo (de vuelco) y el deslizamiento donde ocurre. Verificado con `node -e`: X1=0.940Ω, X2'=1.410Ω, Xm=14.940Ω, R2'=0.416Ω, Zth=0.271+j0.890Ω, |Vth|=124.906V, Tarranque=17.93N·m, sMaxT=0.1797, Tmáx=48.00N·m, ns=1800rpm (motor de 4 polos a 60Hz)."
normatividad:          # 🔒 normas ancla citadas con cláusula específica, pendientes de verificación experta palabra por palabra
  - "IEEE Std 112 'IEEE Standard Test Procedure for Polyphase Induction Motors and Generators' — norma ancla listada en la fila d5-08 de la lista maestra. Cláusulas citadas por su función estándar: §5.4 (ensayo de resistencia de CD del devanado del estátor), §5.9.1 (ensayo de rotor bloqueado a frecuencia reducida, ≤25% de la nominal, para minimizar el efecto piel en R2'), §5.9.2.2 (reparto convencional de la reactancia de fuga total entre estátor y rotor según la clase de diseño NEMA — 0.4/0.6 para Diseño B). ⚑ El número de cláusula se basa en la estructura estándar conocida de la norma; no se cotejó el texto literal de la edición vigente contra estas citas en esta sesión — requiere verificación experta."
  - "Teoría estándar del circuito equivalente en T del motor de inducción y del equivalente de Thévenin para el cálculo de par-deslizamiento — consistente con textos de referencia ampliamente usados en el sector (Fitzgerald/Kingsley/Umans, 'Electric Machinery'; Chapman, 'Máquinas Eléctricas')."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "Los tres ensayos de IEEE 112 (CD, vacío, rotor bloqueado a frecuencia reducida) como mediciones independientes de un mismo motor ilustrativo, cada uno aislando una parte distinta del circuito equivalente — verificado por recomputación exacta con `node -e` de `dcStats()`/`vacioStats()`/`rotorBloqueadoStats()` contra el código fuente: R1=0.306Ω, Xnl=15.880Ω, Prot=578.27W, Rbl=0.7220Ω, Xbl(60Hz)=2.3502Ω."
  - "La corrección de frecuencia de Xbl (lineal, fRated/fTest) y la NO corrección de Rbl por frecuencia — modelado explícitamente como dos pasos distintos en `rotorBloqueadoStats()`, y reforzado en el cuestionario del caso rotor bloqueado, que ofrece como distractor la corrección incorrecta de ambas cantidades."
  - "El reparto NEMA Diseño B de la reactancia serie (X1=0.4·Xbl, X2'=0.6·Xbl) y la topología correcta del circuito en T, con la rama de magnetización Xm colocada DESPUÉS de R1+jX1 (en paralelo con la rama del rotor) — explícitamente distinta de la aproximación de transformador con Xm en las terminales de la fuente, usada en el lab de transformadores (mecanica-45/d5-02) donde Xm≫X1 lo justifica; aquí Xm y X1 son de magnitud comparable y esa simplificación no aplica. Verificado con `node -e`: X1=0.940Ω, Xm=14.940Ω (razón ≈15.9, no lo bastante grande para despreciar la posición de la rama)."
  - "El equivalente de Thévenin visto desde el entrehierro (Zth, Vth) y la curva par-deslizamiento completa T(s), incluyendo el par de arranque (s=1) y el par máximo/de vuelco con su deslizamiento sMaxT=R2'/√(Rth²+(Xth+X2')²) — verificado con `node -e`: Zth=0.271+j0.890Ω, Vth=124.906V, Tarranque=17.93N·m, Tmáx=48.00N·m en sMaxT=0.1797."
  - "Un tablero esquemático (canvas 2D sobre banco 3D) con tres disposiciones de circuito de ensayo distintas según el caso (CD: batería+amperímetro+dos terminales; vacío: fuente CA+ammetro+wattmetro+voltmetro con eje libre; rotor bloqueado: mismo esquemático de ensayo CA con candado en el eje y anotación de la frecuencia reducida; circuito equivalente: el circuito en T completo más la curva par-deslizamiento con marcadores en Tarranque y Tmáx) y un candado 3D visible en el eje del motor solo durante el caso de rotor bloqueado."
  - "Un cuestionario de opción múltiple por cada uno de los cuatro casos, con las cuatro opciones generadas dinámicamente a partir de los valores reales calculados (nunca precableadas) y mezcladas con un hash determinista (`rotateArr`, sin `Math.random()`), cada una con su explicación de por qué es correcta o incorrecta."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "La corrección por temperatura de la resistencia de CD (IEEE 112 §5.2.1, referir la resistencia medida a la temperatura de referencia de la clase de aislamiento) — el simulador usa Rll tal como se mide, sin corrección térmica; el R1 resultante es válido solo a la temperatura de ensayo asumida."
  - "La dependencia de R2' con la frecuencia de deslizamiento (efecto piel en las barras del rotor durante el arranque, más pronunciado en motores de barra profunda o doble jaula) — el modelo usa un R2' constante derivado del ensayo de rotor bloqueado a frecuencia reducida, válido como aproximación de baja frecuencia de deslizamiento, no como el valor real que tendría el rotor exactamente en el instante de arranque a frecuencia nominal."
  - "La saturación de Xm con la tensión aplicada — el modelo usa un Xm constante (derivado del ensayo de vacío a tensión nominal), cuando en un motor real la rama de magnetización es no lineal y Xm cae si el motor opera con sobretensión."
  - "Los transitorios de arranque (corriente y par en función del tiempo durante la aceleración) — el simulador calcula la curva par-deslizamiento en régimen permanente para cada valor de deslizamiento, no la trayectoria temporal real del motor acelerando bajo una carga mecánica específica; ese transitorio y los métodos de arranque reducido son el tema de la práctica anterior, d5-07."
  - "Un motor real de catálogo — el modelo `MEAS` (Rll=0.612Ω; ensayo de vacío 230V/8.2A/640W; ensayo de rotor bloqueado 44.5V/27.6A/1650W a 15Hz sobre 60Hz nominal, motor de 4 polos) es un conjunto de datos ilustrativos consistente en orden de magnitud con un motor de inducción trifásico de baja tensión típico, pero NO corresponde a la hoja de datos de un motor comercial específico."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Tabla de los tres ensayos con sus mediciones crudas (Vf, I, P3φ) y sus cantidades derivadas (R1, Znl/Rnl_eff/Xnl/Prot, Zbl/Rbl/Xbl a ambas frecuencias), la tabla del circuito equivalente resultante (R1, X1, Xm, R2', X2') y el reporte del par de arranque, par máximo y deslizamiento de par máximo leídos de la curva."
evidencia_desempeno: "Guía de observación de la identificación correcta de cada esquemático de ensayo, de la explicación verbal de por qué el ensayo de rotor bloqueado se hace a frecuencia reducida y de por qué solo la reactancia (no la resistencia) se corrige después, de la ubicación correcta de la rama de magnetización en el circuito en T, y de la resolución razonada (no por adivinanza) de las cuatro preguntas de opción múltiple con su justificación numérica."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué el circuito equivalente de un motor de inducción no viene en la placa y debe derivarse de tres ensayos medibles, y por qué la topología en T difiere de la aproximación simplificada de un transformador (briefing.ts)."
desarrollo: "Práctica en el simulador: Ensayo de CD (R1) → Ensayo de vacío (Xnl, Prot) → Rotor bloqueado a frecuencia reducida (Rbl, Xbl con y sin corrección de frecuencia) → Circuito equivalente (reparto NEMA B, Thévenin, curva par-deslizamiento) — cada caso con su cuestionario de verificación, más un recorrido guiado automático como referencia."
cierre: "Ficha técnica (capa 2) con la tabla de fórmulas de los tres ensayos y del circuito equivalente, el contrato de fidelidad completo (SÍ/NO modela) y la aclaración de que las mediciones de los tres ensayos son valores ilustrativos del simulador, no de un datasheet real."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Teoría estándar del circuito equivalente en T del motor de inducción y de los tres ensayos que lo derivan — consistente con textos de referencia ampliamente usados en el sector (Fitzgerald/Kingsley/Umans; Chapman)."
  - "⚑ IEEE Std 112 §5.4/§5.9.1/§5.9.2.2 — cláusulas citadas por su función estándar conocida; el texto literal de la edición vigente no se cotejó palabra por palabra en esta sesión."
banderas_incertidumbre:
  - "⚑ La clave SINCO 2641/7541 se reutiliza de d5-01..07/D2/D10 — confirmar si existe una clave SINCO más específica de ensayo/caracterización de máquinas eléctricas antes de publicar la trazabilidad."
  - "⚑ Las cláusulas específicas de IEEE Std 112 (§5.4, §5.9.1, §5.9.2.2) se citan por su función estándar conocida de la norma, sin cotejo palabra por palabra contra el texto de la edición vigente — confirmar con el experto antes de publicar la práctica a escala."
  - "⚑ Las mediciones de los tres ensayos (Rll=0.612Ω; vacío 230V/8.2A/640W; rotor bloqueado 44.5V/27.6A/1650W a 15Hz) son valores ilustrativos del simulador —consistentes en orden de magnitud con un motor de inducción trifásico de baja tensión típico— pero NO corresponden a la placa ni al reporte de ensayo de un motor comercial real; confirmar con el experto si conviene sustituirlos por los de un motor de catálogo real en una futura iteración."
  - "⚑ El simulador no modela la corrección por temperatura de R1 (IEEE 112 §5.2.1) ni la dependencia de R2' con la frecuencia de deslizamiento (efecto piel) — confirmar con el experto si esta omisión debe señalarse más explícitamente en el HUD in-app, más allá de la ficha técnica y esta ficha de revisión."
  - "✅ Verificación de implementación: física verificada por recomputación ejecutada con `node -e` (no a mano) de `dcStats()`/`vacioStats()`/`rotorBloqueadoStats()`/`circuitoStats()`/`torqueAt()` contra el código fuente de circuito-equivalente-motor-induccion.body.js, incluyendo el equivalente de Thévenin y los puntos de par de arranque y par máximo de la curva par-deslizamiento. Pendiente al momento de escribir esta ficha: corrida completa de Jest tras `npm run gen:labs` (snapshots dorados actualizados a mano en los puntos de inserción exactos, nunca con `jest -u`), `tsc --noEmit`, y verificación funcional con Playwright contra el HTML construido y servido localmente (los cuatro casos, sus cuestionarios respectivos vía `#dxbtns`, y el recorrido guiado automático, 0 errores de consola/página esperados) — completar antes del commit final y actualizar esta nota con el resultado exacto."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (octava práctica de D5, cierra el hueco dejado por d5-06/d5-07):**
   d5-06 y d5-07 usaron los múltiplos de placa del motor (ILR, TLR, Tmáx) como datos de
   entrada sin derivarlos de ningún ensayo. Esta práctica cierra ese hueco explícitamente:
   deriva el circuito eléctrico equivalente completo del motor —y con él, la curva
   par-deslizamiento— a partir únicamente de tres ensayos medibles en un taller (CD, vacío,
   rotor bloqueado a frecuencia reducida), sin asumir ningún dato de placa previo salvo la
   frecuencia y el número de polos (para la velocidad síncrona).
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/circuito-equivalente-motor-induccion.html](../../../public/labs/circuito-equivalente-motor-induccion.html))
   muestra el HUD con las fórmulas de los tres ensayos y del circuito equivalente, más el
   contrato de fidelidad (SÍ/NO modela) — documentado en el encabezado de fidelidad del
   propio archivo fuente (`circuito-equivalente-motor-induccion.body.js`); la ficha técnica
   in-app de segunda capa (`_ficha-circuito-equivalente-motor-induccion.js`) ya está
   redactada y publicada en `public/labs/`, siguiendo el mismo formato de 6 secciones que
   el resto de los labs del molde S+P.
3. **Verificación de implementación:** ✅ Física verificada por recomputación ejecutada con
   `node -e` (no a mano) de las cuatro funciones de estadísticas (`dcStats`, `vacioStats`,
   `rotorBloqueadoStats`, `circuitoStats`) y de `torqueAt()`, reproduciendo exactamente los
   valores que el simulador calcula en tiempo de ejecución: R1=0.306Ω, Xnl=15.880Ω,
   Prot=578.27W, Rbl=0.7220Ω, Xbl(15Hz)=0.5876Ω, Xbl(60Hz)=2.3502Ω, X1=0.940Ω, X2'=1.410Ω,
   Xm=14.940Ω, R2'=0.416Ω, Zth=0.271+j0.890Ω, Vth=124.906V, Tarranque=17.93N·m,
   sMaxT=0.1797, Tmáx=48.00N·m, ns=1800rpm. ✅ Verificación completa cerrada antes del commit
   final: suite Jest completa (834/834) incluidos los 4 puntos de inserción de snapshots
   dorados (`data-stores.golden.test.ts.snap` ×3, `catalogo.golden.test.ts.snap` ×1) verde,
   `tsc --noEmit` limpio, y un script Playwright temporal (creado, corrido y borrado tras su
   uso) contra el HTML construido confirmó: las 19 magnitudes derivadas arriba dentro de
   tolerancia vía `window.__labDebug`, cero `Math.random()` real en el código de la página,
   el mecanismo de quiz (`#dxbtns`) responde correctamente en los 4 casos
   (ensayoDC/ensayoVacio/rotorBloqueado/circuitoEquivalente), la curva par-deslizamiento es
   finita/no-negativa y su pico coincide con (sMaxT, Tmáx), y cero errores de consola —
   incluida la carga correcta de `_ficha-circuito-equivalente-motor-induccion.js` una vez
   redactada.
4. **Petición concreta al experto:** (a) cotejar palabra por palabra las cláusulas citadas
   de IEEE Std 112 (§5.4, §5.9.1, §5.9.2.2) contra el texto de la edición vigente; (b)
   confirmar si las mediciones ilustrativas de los tres ensayos deberían sustituirse por las
   de un motor y un reporte de ensayo de fábrica reales en una futura iteración; (c)
   confirmar si el alcance decidido —excluir la corrección por temperatura de R1 y la
   dependencia de R2' con la frecuencia de deslizamiento— es pedagógicamente aceptable para
   este nivel, o si conviene señalarlo de forma más visible en el HUD in-app; (d) confirmar
   si existe una clave SINCO más específica que la reutilizada de la familia D2/D10/d5-01..07
   para ensayo o caracterización de máquinas eléctricas.
