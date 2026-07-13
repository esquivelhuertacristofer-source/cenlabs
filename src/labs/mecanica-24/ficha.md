# Ficha de práctica — Pinza y shunt: mide corriente con y sin alterar el circuito (`mecanica-24`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** segunda implementación del **molde P (panel de instrumento)** en D10
> (`docs/LISTA-MAESTRA-200-PRACTICAS.md`, d10-02), replicando el patrón validado en d10-01
> (`mecanica-12`) — esta vez con 3 casos guiados en vez de 4, más un modo de falla explícito
> (TC no mide CD). Si la profundidad y el contrato de fidelidad son sostenibles, el patrón
> continúa en d10-03…d10-05 (osciloscopio, FFT, generador de funciones); si sobra o falta,
> se ajusta antes de seguir la tanda.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-24
sector: mecanica-electronica
practica_maestra: "d10-02 — Mide corriente con gancho y shunt sin alterar el circuito (molde P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ETR-I.1 (Electrónica/Tecnología, resultado I.1) · AUT-Y eléctrico"   # ⚑ heredado del mismo anclaje que d10-01; confirmar claves exactas del plan vigente
modulo: "Instrumentación, diagnóstico y metrología (D10)"
submodulo: "Medición de corriente: pinza amperimétrica y shunt"          # ⚑ confirmar clave exacta
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de seleccionar entre pinza amperimétrica (Hall o TC)
  y shunt de 4 terminales según el nivel de perturbación admisible en el circuito, cuantificar
  el efecto de carga (error de inserción) que introduce un shunt, explicar la cancelación de
  Ampère al abrazar conductores con corrientes opuestas, y reconocer el offset de cero de un
  sensor Hall y la necesidad de tararlo antes de medir corrientes pequeñas.
actividad_clave: >
  Resuelve 3 casos reales (arranque con inserción de shunt, calefactor con cancelación de
  Ampère al abrazar vivo + neutro, y testigo con offset de cero) cuantificando en cada uno el
  fenómeno correspondiente, y explora el modo transformador de corriente (TC) sobre una fuente
  de CD para identificar su falla característica.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Identifica los dos métodos de medición de corriente sin abrir el circuito de potencia: pinza por efecto Hall (mide CD + CA) y pinza por transformador de corriente / TC (mide solo CA); y el método invasivo: shunt de 4 terminales (Kelvin) en serie."
  - "Caso 1 (arranque, ≈200 A CD): tara la pinza, energiza y lee la corriente real; inserta el shunt en serie y observa cómo I_real cae — calcula el %error de inserción = (I_sin_shunt − I_con_shunt)/I_sin_shunt y contrástalo contra la U de shunt reportada."
  - "Caso 2 (calefactor, CA): abraza solo el conductor vivo y lee la corriente de la carga; luego abraza vivo + neutro juntos y observa la lectura caer a ≈0 A aunque la corriente real de la carga no cambió — cancelación de Ampère (campos opuestos se cancelan dentro de la mordaza)."
  - "Caso 3 (testigo, corriente pequeña CD): mide sin tarar y observa el offset de cero sumado a la lectura; tara la pinza y remide — el offset (campo terrestre + deriva electrónica del sensor Hall) desaparece de la lectura."
  - "Modo TC sobre el Caso 3 (CD): cambia la pinza a modo transformador de corriente sobre la fuente de CD del testigo y verifica que el instrumento reporta falla — un TC no puede medir CD porque no hay flujo cambiante que inducir (ley de Faraday, E = −N·dΦ/dt)."
  - "Abre la ficha técnica (capa 2) y contrasta qué modela el simulador (efecto de carga real, cancelación de Ampère, offset y tara, falla de TC en CD) contra lo que NO modela (deriva térmica, ruido estadístico, modelos comerciales específicos)."
  - "Reporta cada caso con su lectura, el fenómeno identificado (carga / Ampère / offset) y, en el Caso 1, el %error de inserción calculado."
normatividad:          # 🔒 verificado por contraste de fuentes (2 investigaciones independientes, docs/VERIFICACION-LISTA-MAESTRA.md §7)
  - "IEC 61010-2-032 Ed. 5.0:2023-09-20 — Safety requirements for hand-held and hand-manipulated current clamps for electrical test and measurement (requisitos particulares de seguridad de pinzas amperimétricas). Es la norma ancla de seguridad para el instrumento de pinza; NO especifica exactitud."
  - "Sin norma IEC/IEEE de exactitud para pinzas o shunts de uso general de taller (hallazgo negativo confirmado por contraste): IEEE C57.13 e IEC 61869 cubren transformadores de corriente de instalación fija, no pinzas portátiles; IEC 60051 cubre accesorios analógicos de bobina móvil, no pinzas digitales ni shunts electrónicos. La exactitud de estos instrumentos es enteramente de hoja de datos del fabricante."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "Pinza Hall con tara de offset (campo terrestre + deriva electrónica) — la lectura antes de tarar suma el offset, después de tarar no."
  - "Pinza en modo transformador de corriente (TC): solo mide CA; sobre una fuente de CD reporta falla explícita 'TC no mide CD' (ley de Faraday, requiere flujo cambiante)."
  - "Cancelación de Ampère real: abrazar vivo + neutro de la misma carga hace caer la lectura de la pinza a ≈0 A sin que la corriente real de la carga cambie — la I real del circuito permanece constante, solo cae la LECTURA de la pinza."
  - "Efecto de carga real del shunt: insertarlo en serie hace caer la corriente real del circuito (no solo la lectura) — %error de inserción calculado en vivo, marcado como 'malo' cuando supera el 1 %."
  - "Shunt de 4 terminales: lectura de corriente y de caída de tensión (U) del shunt visibles por separado."
  - "Ficha técnica (capa 2) con el contrato de fidelidad (modela / NO modela) y componentes reales presentes/omitidos."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Deriva térmica del shunt (coeficiente de temperatura de la resistencia) ni calentamiento por efecto Joule a corrientes altas sostenidas."
  - "Ruido de medición ni ancho de banda del sensor Hall — la lectura es estable; el offset mostrado es sistemático (se corrige con tara), no dispersión estadística tipo A."
  - "Modelos comerciales específicos de pinza o shunt — los valores de offset, %error de inserción y clase de exactitud son representativos de instrumentos típicos de taller, no la hoja de datos certificada de un fabricante particular."
  - "Posicionamiento del conductor dentro de la mordaza (error de posición ≈0.5 % documentado por fabricantes) ni pinzas flexibles tipo Rogowski."
  - "Aislamiento galvánico ni las corrientes de fuga que la categoría CAT de la pinza está diseñada para soportar (ver mecanica-12 para ese contrato)."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte de los 3 casos: fenómeno identificado (carga / Ampère / offset), lectura de la pinza en cada paso, y el %error de inserción calculado en el Caso 1."
evidencia_desempeno: "Guía de observación de la secuencia de tarado antes de medir y de la elección correcta entre modo Hall/TC según el tipo de corriente (CD/CA)."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué la pinza y el shunt no son intercambiables — una perturba el circuito, la otra no (briefing.ts)."
desarrollo: "Práctica en el simulador: 3 casos guiados (arranque+shunt, calefactor+Ampère, testigo+offset) + exploración del modo TC sobre CD."
cierre: "Ficha técnica (capa 2) con el contrato de fidelidad y la comparación pinza vs. shunt."
# --- Veracidad ---
fuentes:               # 🔒 verificadas mediante 2 investigaciones independientes con fuentes primarias (docs/VERIFICACION-LISTA-MAESTRA.md §7)
  - "Fluke — 'What is burden voltage and why is it important?' (artículo técnico, efecto de carga en instrumentos de corriente)."
  - "Tektronix — nota técnica sobre burden voltage / carga de instrumentos de medición de corriente."
  - "CENAM — terminología metrológica en español: 'efecto de carga' (término primario confirmado)."
  - "TESOEM / UNADM / UNLP — material académico en español que documenta 'error de inserción' como sinónimo aceptado de efecto de carga."
  - "IEC Webstore — IEC 61010-2-032 Ed. 5.0:2023-09-20 (confirmado también en espejos SIS, NEN, Genorma, ANSI, CSA, GlobalSpec)."
  - "IEEE C57.13 / IEC 61869 — transformadores de corriente de instalación fija (confirmado que NO cubren pinzas portátiles)."
  - "IEC 60051 — instrumentos analógicos de bobina móvil e indicación directa (confirmado que NO cubre pinzas digitales ni shunts electrónicos)."
  - "Riedon, Ohmite, Vishay, Isabellenhütte — hojas de datos de shunts de 4 terminales (Kelvin) de uso industrial."
  - "OpenStax College Physics 2e — física del amperímetro y su efecto de carga sobre el circuito medido."
  - "AEMC — manual de pinza amperimétrica; error de posición del conductor en la mordaza (≈0.5 %)."
  - "Fluke / AEMC — documentación de la cancelación de Ampère como principio compartido con interruptores diferenciales (RCD/GFCI)."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (ETR-I.1 / AUT-Y / submodulo / SINCO): claves tomadas del mapeo interno (LISTA-MAESTRA), heredadas del mismo anclaje que d10-01; verificar contra el plan de estudios vigente antes de publicar la trazabilidad."
  - "⚑ El %error de inserción (≈5.1 % en el Caso 1) y el offset de cero (≈1.20 A en el Caso 3) son valores de enseñanza elegidos para que el fenómeno sea observable con claridad, no la hoja de datos de un shunt o pinza comercial específica."
  - "⚑ La terminología 'efecto de carga (error de inserción)' fue corregida en la investigación previa (docs/VERIFICACION-LISTA-MAESTRA.md §7) — el simulador y esta ficha ya usan la forma verificada; confirmar que ningún otro material del curso siga usando el término no atestiguado 'efecto de inserción' de forma aislada."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (segunda implementación del molde P en D10):** d10-02 replica
   el molde P validado en d10-01 (`mecanica-12`), esta vez con 3 casos en lugar de 4 y un
   modo de falla explícito (TC no mide CD). Si la profundidad y el contrato de fidelidad
   son sostenibles, se replica en d10-03…d10-05 (osciloscopio, FFT, generador de
   funciones); si sobra o falta, se ajusta antes de continuar la tanda.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/pinza-shunt.html](../../../public/labs/pinza-shunt.html)) muestra el panel
   "🔒 Contrato de fidelidad" (Sí modela / NO modela), igual que `mecanica-12`.
3. **Petición concreta al experto:** (a) confirmar o corregir las claves curriculares ⚑;
   (b) validar que el %error de inserción y el offset de cero usados sean razonables como
   valores de enseñanza; (c) confirmar que "efecto de carga (error de inserción)" es la
   terminología que se debe enseñar en este taller, dado que la investigación previa (§7)
   encontró ambos términos en uso pero ninguna norma IEC/IEEE que fije uno como oficial.
