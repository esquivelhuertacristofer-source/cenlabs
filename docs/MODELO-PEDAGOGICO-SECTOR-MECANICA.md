# Modelo pedagógico oficial del sector mecánica (SEP/MCCEMS) — base para proponer las ≥150 prácticas

> **Propósito.** Este documento destila *cómo* plantean los ejercicios, actividades y
> evaluaciones los programas oficiales de la SEP para las carreras del sector, para que
> las prácticas nuevas de CEN Labs hablen el mismo lenguaje pedagógico y sean
> **defendibles ante expertos y directivos** ("este lab cubre el Submódulo X del programa
> oficial clave Y"). No es teoría: sale de leer los PDF oficiales línea por línea.
>
> Fecha de síntesis: 2026-07-08. Reforma vigente: **MCCEMS** (Acuerdo 09/08/23).

---

## 1. Fuentes oficiales analizadas

Los PDF completos están en `docs/curriculas-mecanica/oficiales-sep/` (gitignored — son
públicos pero pesados; no ensucian el repo). Texto extraído con `pdftotext -enc UTF-8`.

| Carrera | Documento | Clave / año | Emisor |
|---|---|---|---|
| **Mecatrónica** | Programa de Estudios | 3071300008-23, 2ª ed. jul-2024 | SEMS/COSFAC (común DGETI/CECyTE/CONALEP/DGETAyCM) |
| **Electricidad** | Programa de Estudios | ED-2022 | CECyTE / COSAC |
| **Electromecánica** | Programa de Estudios | Presencial-2024 | SEMS / COSAC |
| **Autotrónica** | Guía de Equipamiento + Mapa Curricular 2023 | Plan 2023 | CONALEP |

Las tres primeras comparten **formato SEMS por competencias** (idéntico esqueleto
pedagógico). Autotrónica es CONALEP (mismo enfoque por competencias, se estructura en
"Guías Pedagógicas y de Evaluación" por módulo con Resultados de Aprendizaje y
Actividades de Evaluación).

---

## 2. El esqueleto oficial de una carrera (cómo se organiza el "qué")

Todas siguen la misma jerarquía:

```
CARRERA
 └─ MÓDULO  (verbo + objeto, p.ej. "CONSTRUYE CIRCUITOS ELECTRÓNICOS", 272 h)
     ├─ RESULTADO DE APRENDIZAJE del módulo ("Al finalizar, el estudiante será capaz de…")
     ├─ OCUPACIONES reales (código SINCO 2019) + SITIOS DE INSERCIÓN (SCIAN 2018)
     └─ SUBMÓDULO (verbo + objeto, con horas propias, p.ej. 64 h)
         ├─ ACTIVIDAD CLAVE DE LA COMPETENCIA LABORAL
         ├─ DESARROLLO DE LA COMPETENCIA (la lista de lo que el alumno hace)
         ├─ Transversalidad (áreas de conocimiento, HVyT, CoCEDS)
         └─ ESTRATEGIA DE EVALUACIÓN (evidencia + instrumento)
```

- **1 módulo = 272 h** (los 3 primeros) o **192 h** (los 2 últimos). 1200 h con docente
  + 300 h de estudio independiente. La formación va del **2º al 6º semestre**.
- Cada módulo se ancla a **ocupaciones reales** (SINCO) y **sitios de inserción** (SCIAN):
  esto es oro para justificar relevancia laboral.

---

## 3. El "cómo": anatomía de cómo redactan las actividades

Este es el corazón de lo que pediste. La unidad de trabajo NO es "tema", es **una acción
observable y evaluable**. Se redacta como:

> **verbo de desempeño + objeto técnico (con especificidad) + condiciones + normatividad + contexto laboral**

Ejemplo textual del programa de Mecatrónica (Módulo I, Submódulo 1), *verbatim*:

> «**Identifica** los componentes físicos y las funciones (fuentes de voltaje, resistores,
> capacitores, inductores, transformadores, transistores, líneas de conexión, entre otros)
> del circuito electrónico **desarmando** diversos dispositivos electrónicos; siguiendo
> instrucciones del jefe inmediato, utilizando herramientas y equipos y **atendiendo las
> normas de seguridad e higiene**.»

Qué observar de la redacción (y que copiaremos):
1. **Verbo activo y medible** (Identifica, Distingue, Ensambla, Diseña, Interpreta, Elabora,
   Mantiene, Automatiza) — nunca "conoce" ni "entiende".
2. **Especificidad técnica entre paréntesis** — enumera los componentes/parámetros reales.
   Aquí es donde la veracidad se juega y donde el experto revisa.
3. **Condiciones del oficio** — "siguiendo instrucciones del jefe inmediato", "en equipo",
   "utilizando herramientas y equipos".
4. **Normatividad** citada por clave (p.ej. **NOM-018-STPS-2000** en el módulo eléctrico).
5. **Actitud/valor** integrado en la misma frase (no por separado): "colaborando en
   equipos de trabajo, asumiendo una actitud de respeto".

---

## 4. El "cómo" de la EVALUACIÓN (evidencias e instrumentos)

Cada submódulo trae una tabla de **Estrategia de evaluación**:

| Columna | Contenido |
|---|---|
| SUBMÓDULO | id (S1, S2, S3) |
| ACTIVIDAD CLAVE DE LA COMPETENCIA | la acción |
| DESARROLLO DE LA COMPETENCIA | pasos |
| **PRODUCTO** | evidencia tangible (diagrama, reporte, circuito ensamblado, plano 2D/3D) |
| **DESEMPEÑO** | evidencia de proceso (cómo lo hizo) |

**Instrumentos oficiales** (los tres que se repiten en todos los programas):
- **Lista de cotejo** (checklist de producto)
- **Guía de observación** (para el desempeño en proceso)
- **Rúbrica**

Tipos de práctica, en progresión (*verbatim*): «una serie de **prácticas demostrativas,
guiadas, supervisadas y autónomas**, que permitan arrojar evidencias del logro de las
competencias laborales». → Es una escalera: **demuestro → te guío → te superviso → lo haces solo.**

Tipos de evaluación por agente: **autoevaluación, coevaluación, heteroevaluación**.
Todo bajo **evaluación formativa + retroalimentación continua**.

---

## 5. El "cómo" de la SECUENCIA didáctica (momentos)

Cada estrategia didáctica se estructura en tres momentos, y **cada momento se liga a un
tipo de evaluación + una evidencia + un instrumento**:

| Momento | Qué ocurre |
|---|---|
| **Apertura** | Recuperar saberes previos, diagnóstico, integración grupal, plantear el problema/contexto |
| **Desarrollo** | Construcción de la competencia: práctica guiada → supervisada, con la teoría al servicio de la tarea |
| **Cierre** | Producto final + evidencia + evaluación (auto/co/hetero) + retroalimentación |

Esta estructura **ya calza casi 1:1 con nuestro modelo actual de lab**
(briefing → simulador/tutor → quiz), lo cual es una gran noticia: no reinventamos, alineamos.

---

## 6. Inventario de submódulos oficiales por sector (el mapa de dónde saldrán las ≥150)

### 6.1 MECATRÓNICA (5 módulos · 13 submódulos)
- **I. Construye circuitos electrónicos** — S1 comprueba funcionamiento de circuitos · S2 ensambla circuitos analógicos · S3 diseña circuitos digitales
- **II. Construye sistemas mecatrónicos** — S1 dibuja planos de elementos mecánicos · S2 construye mecanismos · S3 instala sistemas neumáticos, electroneumáticos, hidráulicos y electrohidráulicos
- **III. Programa dispositivos de control** — S1 instala elementos de potencia y control · S2 programa PLC · S3 programa sistemas embebidos
- **IV. Opera manufactura flexible** — S1 configura equipos de manufactura · S2 programa sistemas robóticos
- **V. Opera sistemas mecatrónicos** — S1 automatiza sistemas · S2 mantiene sistemas en funcionamiento

### 6.2 ELECTRICIDAD (5 módulos)
- **I. Instalaciones residenciales/comerciales** — diseña · realiza
- **II. Motores y generadores CA/CC** — mantiene motores CA-CC · mantiene generadores CA-CC
- **III. Control electromagnético/electrónico** — control electromagnético · control electrónico · programa y conecta PLC
- **IV. Iluminación y energía renovable** — diseña iluminación · mantenimiento residencial/comercial/industrial · energía renovable
- **V. Media y baja tensión** — distribución de energía · subestaciones eléctricas

### 6.3 ELECTROMECÁNICA (5 módulos · 15 submódulos)
- **I. Instala sistemas electromecánicos** — planos eléctricos/electrónicos · instalaciones eléctricas · circuitos electrónicos
- **II. Máquinas eléctricas rotativas** — instalación · mantenimiento · mecanismos de transmisión de potencia
- **III. Manufactura de piezas** — torno/fresadora convencional · torno/fresadora CNC · estructuras metálicas
- **IV. Control electromecánico** — motores con dispositivos electromagnéticos · PLC · PIC's
- **V. Mantenimiento** — neumáticos e hidráulicos · refrigeración · fotovoltaicos

### 6.4 AUTOTRÓNICA (CONALEP) — sistemas confirmados por la Guía de Equipamiento
Motor de combustión interna · sistemas de inyección (consola de inyección) · sistema de
ignición (prototipo en 3 fases) · sistemas eléctricos del automóvil (conjunto modular) ·
carga y arranque · análisis de gases de escape · frenos de disco/tambor · **ABS** ·
dirección (estándar / asistida hidráulicamente) · transmisión automática · **motor diésel**
(banco didáctico) · pre/post-calentamiento diésel · aire acondicionado automotriz ·
cierre centralizado · diagnóstico con **scanner** OBD.

> Con 13+10+15 submódulos SEMS + ~14 sistemas de autotrónica, y ~3–4 prácticas por
> submódulo, el techo natural supera holgadamente las 150. La cobertura será *parcial y
> priorizada* según lo que pida el cliente (ver LEEME de la carpeta de intake).

---

## 7. Plantilla propuesta para NUESTRAS prácticas (grounded en el formato oficial)

Cada lab nuevo se especificaría con esta ficha. Mapea 1:1 al formato SEP **y** a nuestra
estructura de carpeta (`src/labs/{id}/`). Los campos marcados 🔒 son los que **exige
revisión de experto** por ser donde vive la veracidad de ingeniería.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-NN
sector: mecatronica | electricidad | electromecanica | autotronica
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "Mecatrónica SEMS 3071300008-23"
modulo: "II — Construye sistemas mecatrónicos"
submodulo: "S3 — Instala sistemas neumáticos, electroneumáticos, hidráulicos y electrohidráulicos"
ocupacion_SINCO: "2634 — Mecánicos en mantenimiento de maquinaria industrial"
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: "Al finalizar, el estudiante será capaz de…"
actividad_clave: "verbo observable + objeto + condiciones"
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Identifica … (con la especificidad técnica real: presiones, caudales, símbolos ISO 1219)"
  - "Interpreta el diagrama neumático aplicando la simbología …"
normatividad: ["NOM-…", "ISO 1219", …]   # 🔒 verificar clave y vigencia
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela: "qué física SÍ modela el 3D"      # 🔒
simulador_NO_modela: "simplificaciones explícitas"  # 🔒 evita el error 'motor con solo pistones y rotores'
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "diagrama / reporte / configuración"
evidencia_desempeno: "guía de observación del proceso en el simulador"
instrumento: lista_de_cotejo | guia_de_observacion | rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "diagnóstico + contexto laboral (briefing)"
desarrollo: "práctica guiada→autónoma en el simulador (tutorSteps)"
cierre: "producto + quiz + retroalimentación"
# --- Veracidad ---
fuentes: ["libro/датasheet/norma con página"]   # 🔒 sin fuente = marcar 'verificar'
banderas_incertidumbre: ["afirmaciones de baja confianza para revisión prioritaria"]
```

---

## 8. Qué habilita esto para el proyecto

1. **Trazabilidad curricular**: cada lab podrá declarar a qué submódulo oficial responde →
   argumento sólido ante bachilleratos/universidades y expertos.
2. **Lenguaje pedagógico correcto**: actividades escritas como el sector las espera
   (verbo observable + evidencia + instrumento), no como "temario" genérico.
3. **Priorización defendible de las ≥150**: el inventario de la §6 es la cantera; el cliente
   marca qué submódulos cubrir y en qué orden.
4. **Gate de veracidad integrado**: los campos 🔒 concentran la revisión del experto donde
   importa (contenido de ingeniería, normas, fidelidad del simulador), no en la redacción.

## 9. Siguientes pasos sugeridos
- **(A)** Cuando el cliente suelte sus currículas en `docs/curriculas-mecanica/`, cruzarlas
  contra este inventario oficial para fijar el **subconjunto a cubrir** y el orden.
- **(B)** Ejecutar **1 lab piloto** con esta ficha + una fuente técnica (libro/datasheet) para
  calibrar la profundidad de ingeniería antes de escalar.
- **(C)** Convertir esta ficha en plantilla del scaffolder (`scripts/new-lab.mjs`) para que
  cada nueva práctica nazca ya con su anclaje curricular y sus campos de veracidad.
