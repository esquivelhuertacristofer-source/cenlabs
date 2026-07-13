# Ficha de práctica — Monitores de Disponibilidad (Readiness) y Tabla 1 (`mecanica-29`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-29
sector: autotronica
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "Autotrónica (CONALEP 2023 mapa+perfil / CECyTE-2017 respaldo)"
modulo: "Diagnóstico electrónico del automóvil"                 # ⚑ mismo módulo que mecanica-11/mecanica-28; confirmar clave exacta con el plan vigente
submodulo: "Verificación de monitores de disponibilidad (readiness) y aprobación por Tabla 1"  # ⚑ confirmar clave exacta
ocupacion_SINCO: "7541 — Mecánicos y reparadores de vehículos de motor"  # ⚑ verificar clave SINCO 2011 (misma familia que d10-06/d10-07)
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de aplicar los tres criterios independientes de
  la Tabla 1 (conexión exitosa con el SDB, ausencia de códigos de falla confirmados en
  los monitores del num. 4.1.1, y esos monitores obligatorios "completados") para
  determinar si un vehículo aprueba, se rechaza, o resulta no evaluable en la
  verificación vehicular, distinguiendo correctamente un monitor "no soportado" por
  diseño de uno "no completado" que sí bloquea el resultado.
actividad_clave: >
  Verifica el readiness de un vehículo en 4 casos guiados (conexión no exitosa,
  aprobado, rechazado por DTC confirmado, no evaluable) aplicando los tres criterios de
  la Tabla 1 en el orden correcto y distinguiendo monitores obligatorios de los que no
  lo son.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Conecta el escáner al SDB; si la conexión no es exitosa, el sistema reintenta hasta en tres ocasiones (Anexo normativo I, num. 2.6) antes de registrar las características del vehículo y notificar al propietario — sin ruta automática a un veredicto."
  - "Lee el estado de los 11 monitores de disponibilidad (num. 3.17–3.19): 3 continuos (Ignición en cilindros, Combustible, Componentes integrales) y 8 no continuos (Eficiencia del convertidor catalítico, Sensores de oxígeno, Calentamiento del convertidor catalítico, Evaporativo, Secundario de aire, Fugas de aire acondicionado, Calentamiento del sensor de oxígeno, EGR)."
  - "Identifica cuáles de esos 11 son obligatorios para este tipo de SDB: para OBD-II/EOBD Euro 5+ (num. 4.1.1.1) son exactamente 5 — Ignición en cilindros, Eficiencia del convertidor catalítico, Combustible, Sensores de oxígeno, Componentes integrales."
  - "Distingue 'no soportado' (num. 3.20 — el monitor no viene de fábrica en ese vehículo por diseño, p. ej. EGR sustituido por VVT) de 'no completado' (num. 3.21 — el monitor existe pero aún no terminó su ciclo de evaluación); solo lo segundo puede bloquear un monitor obligatorio."
  - "Aplica los tres criterios de la Tabla 1 en orden: (1) conexión exitosa con el SDB, (2) sin códigos de falla confirmados asociados a los monitores del num. 4.1.1, (3) todos esos monitores obligatorios 'completados' — cero tolerancia: uno solo 'no completado' ya impide la aprobación."
  - "Reconoce que un readiness perfecto (11/11 completados) NO garantiza aprobación si existe un código de falla confirmado en un monitor del num. 4.1.1: el criterio 2 pesa aparte del criterio 3."
  - "Ubica el alcance del método: el SDB aplica a vehículos año-modelo 2006 en adelante con OBD-II/EOBD (peso bruto 400–3857 kg, combustible de origen gas natural o gasolina); antes de 2006 aplica el método Dinámica (Tabla 9) — un corte por año-modelo, no por versión de protocolo OBD-I/OBD-II."
normatividad:          # 🔒 verificar clave y vigencia
  - "NOM-167-SEMARNAT-2017 — §3 definiciones (3.17–3.21 monitor continuo/no continuo/soportado/no soportado; 3.28–3.32 SDB/EOBD/SDB Similar/OBD-II), §4.1/§4.1.1/§4.1.2 y Tabla 1 (criterios de aprobación), §5.1 y Tabla 9 (aplicabilidad SDB/Dinámica/Estática por año-modelo y peso), Anexo normativo I (procedimiento e intentos de conexión, num. 2.3/2.6)"
  - "NOM-047-SEMARNAT-2014 — método Dinámica/Estática para los vehículos que NOM-167 excluye del método SDB (no reverificada en fuente primaria en esta sesión: ver banderas_incertidumbre)"
  - "SAE J1979 / ISO 15031-5 — bibliografía citada por la propia NOM-167 (num. 11.14/11.17/11.21) para el concepto de ciclo de manejo que completa un monitor no continuo"
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "Los 11 monitores exactos de los num. 3.17–3.19 (3 continuos + 8 no continuos), con marca visual de cuáles 5 son obligatorios para SDB tipo OBD-II/EOBD Euro 5+ (num. 4.1.1.1)."
  - "Los tres criterios independientes de la Tabla 1 aplicados en el orden correcto, incluyendo que un código de falla confirmado rechaza el vehículo aun con readiness perfecto (11/11 completados)."
  - "La distinción 'no soportado' (num. 3.20) vs. 'no completado' (num. 3.21), con un caso EGR sustituido por VVT como distractor honesto, apoyado textualmente en el propio num. 3.18.7 de la norma."
  - "El reintento de conexión con el SDB hasta en tres ocasiones (Anexo normativo I, num. 2.6), y que agotar los tres intentos no produce ni un rechazo ni una aprobación automática, ni una ruta automática al método Dinámica."
simulador_NO_modela:   # 🔒 evita el error 'motor con solo pistones y rotores'
  - "El método Dinámica/Estática (Tabla 9) para vehículos año-modelo anterior a 2006, mayores a 3857 kg, convertidos a gas LP/natural, o diésel — todos fuera del método SDB. Este lab modela exclusivamente el método SDB para SDB tipo OBD-II/EOBD Euro 5+ (num. 4.1.1.1)."
  - "El Catálogo Vehicular del num. 4.1.1.3 (SDB fuera de los dos tipos con monitores obligatorios explícitos), aún no publicado por el Transitorio Tercero de la propia norma."
  - "El Artículo Transitorio Décimo Segundo (la luz MIL encendida como criterio de aptitud para intentar el método SDB): deliberadamente NO se usa en ningún caso guiado por ser ambiguo sin leer NOM-047-SEMARNAT-2014 directamente — ver banderas_incertidumbre."
  - "Los tipos de conector alterno del Anexo normativo I (num. 4, conector de 14 pines) ni el protocolo eléctrico real del bus (CAN/K-line) detrás del DLC."
  - "El procedimiento completo de 8 pasos del Anexo normativo I más allá de la lógica de conexión y reintento ya modelada."
  - "El ciclo de manejo real (secuencia de condiciones de manejo) necesario para que un monitor pase de 'no completado' a 'completado' tras borrar códigos: el simulador presenta el estado ya resuelto de cada caso, no el proceso de completarlo (ver mecanica-28/d10-07, que señala el mismo límite)."
  - "El monitor obligatorio condicional del num. 4.1.1.2 (EOBD Euro 3-4: Combustible obligatorio solo 'para aquellos vehículos que lo tengan incorporado') ni el conjunto de 4 monitores obligatorios de ese tipo distinto de SDB — el lab modela un solo tipo de SDB, el más exigente (5 obligatorios)."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte de verificación: veredicto (aprobado/rechazado/no evaluable) justificado con los tres criterios de la Tabla 1 aplicados en orden, y la lista de monitores obligatorios evaluados."
evidencia_desempeno: "Guía de observación del recorrido por los 4 casos guiados y del razonamiento al distinguir 'no soportado' de 'no completado' en el simulador."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: continuidad directa con el escáner OBD-II (d10-06) — de leer datos y códigos a decidir el veredicto final de la verificación (briefing.ts)."
desarrollo: "Práctica en el simulador: 4 casos guiados (conexión no exitosa, aprobado, rechazado por DTC, no evaluable) sobre un panel único de escáner, DLC y tablero con testigo MIL."
cierre: "Ficha técnica (capa 2) con el contrato de fidelidad y la tabla de los tres criterios de la Tabla 1."
# --- Veracidad ---
fuentes:               # 🔒 verificadas mediante fuentes primarias (docs/VERIFICACION-LISTA-MAESTRA.md §12)
  - "SEMARNAT/DOF — NOM-167-SEMARNAT-2017 (nom-167-semarnat-2017.pdf, 22 páginas, DOF 05/09/2017), fuente primaria directa, texto completo extraído (pdftotext) y leído íntegro dos veces (segunda pasada para re-verificar la lista de 11 monitores); citas textuales de §3 (3.7, 3.11, 3.14, 3.16–3.21, 3.28–3.32), §4.1/§4.1.1/§4.1.2 y Tabla 1 (pág. 7–8), §5.1 y Tabla 9 (pág. 10), §9, §11 Bibliografía, Transitorios (Tercero, Décimo Segundo), Anexo normativo I §1–§4."
  - "DOF — NOM-047-SEMARNAT-2014, citada por su nombre y año (confirmado por ser la norma que la propia NOM-167 referencia en su §2) pero NO reverificada línea por línea en fuente primaria esta sesión — reservada para si un lab futuro trata el método Dinámica/Estática como objeto explícito."
  - "SAE J1979 / ISO 15031-5:2015 — modos de servicio y bibliografía del ciclo de manejo (reutilizada de la verificación de mecanica-11/d10-06 y mecanica-28/d10-07)."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (programa_oficial / modulo / submodulo / ocupacion_SINCO): reutiliza sin verificar el mismo anclaje de mecanica-11/mecanica-28; faltan las CLAVES exactas del plan vigente — verificar contra el documento oficial antes de publicar la trazabilidad. La columna 'Trazabilidad' de la lista maestra marca esta práctica como 'AUT-Y OBD S1'."
  - "⚑ Corrección respecto a la lista maestra original: la física de gobierno original citaba 'OBD I vs II' como distinción clave. Verificación primaria (docs/VERIFICACION-LISTA-MAESTRA.md §12) confirmó que la cadena 'OBD-I' NO aparece ni una sola vez en las 22 páginas de NOM-167 — el corte real es el año-modelo 2006 (Tabla 9), no una distinción de protocolo. Ya corregido en `LISTA-MAESTRA-200-PRACTICAS.md` y en esta ficha."
  - "⚑ NOM-047-SEMARNAT-2014 no se reverificó en fuente primaria esta sesión (decisión de alcance documentada en §12): NOM-167 delega a ella el método Dinámica/Estática, pero el método SDB —objeto exclusivo de este lab— está autocontenido en NOM-167. Si un lab futuro trata Dinámica/Estática como objeto explícito, verificar NOM-047 directamente entonces."
  - "⚑ El Artículo Transitorio Décimo Segundo de NOM-167 (luz MIL como criterio de aptitud para intentar el SDB, mientras NOM-047 no se actualice) es ambiguo sin leer NOM-047 directamente y NO se usa en el diseño de ningún caso guiado — documentado en el simulador ('NO modela') y aquí, no como base de ninguna afirmación del lab."
  - "⚑ El lab modela un solo tipo de SDB (OBD-II/EOBD Euro 5+, num. 4.1.1.1, 5 obligatorios). Existe un segundo tipo con reglas distintas (EOBD Euro 3-4, num. 4.1.1.2, monitor de Combustible condicional) que el lab no representa — valorar con el experto si un caso o variante adicional aporta valor pedagógico o si añade complejidad innecesaria a una práctica ya densa en criterios."
  - "⚑ El corte año-modelo 2006 solo vive hoy en la ficha técnica y en el briefing; valorar con el experto si conviene hacerlo explícito también en el panel in-app (p. ej. un dato del vehículo simulado) para reforzar visualmente el alcance del método SDB."
```

## Notas para el revisor experto

1. **Lugar en la secuencia curricular:** d10-08 continúa el hilo abierto por `mecanica-11`
   (d10-06, escáner OBD-II) directamente — es, como d10-06, molde P puro (panel único),
   a diferencia de `mecanica-28` (d10-07, molde P+S). Mientras d10-06 enseña a USAR el
   escáner y d10-07 enseña a CLASIFICAR un código ya leído, d10-08 (este lab) enseña el
   VEREDICTO final de aprobación/rechazo — el propósito regulatorio completo con el que
   se diseñó todo el sistema OBD-II en el contexto de verificación vehicular. Ver el
   veredicto de diseño en
   [docs/VERIFICACION-LISTA-MAESTRA.md §12](../../../docs/VERIFICACION-LISTA-MAESTRA.md).
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/readiness-obd.html](../../../public/labs/readiness-obd.html)) muestra
   el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela), igual que `mecanica-11`,
   `mecanica-12`, `mecanica-24`–`mecanica-28`.
3. **Petición concreta al experto:** (a) confirmar o corregir las claves curriculares ⚑
   (compartidas sin verificar con d10-06/d10-07); (b) validar que limitar el modelo al
   tipo de SDB OBD-II/EOBD Euro 5+ (sin el condicional de Euro 3-4 ni el Catálogo
   Vehicular aún no publicado) es una simplificación razonable para este nivel; (c)
   opinar si el corte año-modelo 2006 merece un indicador visible dentro del panel
   in-app, más allá de la ficha técnica y el briefing.
4. **Diferencia respecto a d10-06/d10-07:** d10-06 enseña a conectar el escáner y leer
   Modo $01/$02/$03; d10-07 asume ese instrumento dominado y enseña el árbol de decisión
   detrás de UN código (P0300); d10-08 (este lab) da un paso atrás y enseña el criterio
   de aprobación/rechazo GLOBAL de la Tabla 1 — de qué sirve todo lo leído en d10-06/d10-07
   para decidir, con method y sin adivinar, si un vehículo pasa la verificación.
