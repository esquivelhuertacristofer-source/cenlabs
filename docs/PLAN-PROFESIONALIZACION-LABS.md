# PLAN DE PROFESIONALIZACIÓN — CEN LABS
**De MVP funcional a producto vendible a instituciones educativas mexicanas**

> Elaborado: 2026-05-10  
> Base técnica: INFORME-MAESTRO-LABORATORIOS.md (commit `4439c92`)  
> Autor del análisis: Claude Sonnet 4.6 (Anthropic)  
> Contexto: creador solo, asistencia de IA, mercado objetivo México

---

## 1. ANÁLISIS HONESTO DEL ESTADO ACTUAL

### ¿Qué es CEN Labs hoy?

CEN Labs está en **transición entre MVP y producto**. No es un prototipo — tiene 40 simuladores con física real, validación automática, dashboard completo para el profesor, auth funcional con rate limiting, 199 tests pasando y deploy en producción. Eso es mucho más que la mayoría de proyectos educativos de un equipo pequeño.

Lo que le falta para ser "producto serio" no es funcionalidad — es **infraestructura de comercialización**. Alguien puede usarlo hoy. Nadie puede *comprarlo* de forma autónoma hoy.

### Qué está bien resuelto

- **Capa de dominio** — la lógica científica es testeable, separada del UI, calibrada. Un simulador no va a aprobar una respuesta incorrecta. Esto es difícil de hacer bien y lo tienen hecho.
- **Seguridad básica** — JWT server-side, rate limiting dual, headers de seguridad, CSP, RLS activo. Para una plataforma con datos de menores, esto no es trivial.
- **Coherencia visual** — 40 simuladores construidos en momentos distintos con el mismo estándar visual. Profesional.
- **Dashboard del profesor** — auditoría, radar charts por competencia, planeamiento, exportación PDF. Cubre lo que un maestro real necesita ver.
- **Stack moderno** — Next.js 15 + React 19 + Supabase es exactamente lo que un CTO progresista elegiría hoy para una EdTech.

### Las 3 brechas más importantes

**Brecha 1 — No se puede vender sin intervención manual.**  
No hay forma de que una institución se registre sola, pague, y empiece a usar. Todo el onboarding requiere que el creador intervenga. Esto no escala ni permite precio bajo.

**Brecha 2 — Riesgo legal activo con datos de menores.**  
La plataforma captura nombres, emails, historial de actividad e IPs de estudiantes que probablemente son menores de edad. No hay aviso de privacidad, no hay términos de servicio, no hay mecanismo de consentimiento. En México esto viola la LFPDPPP. Un director de escuela con departamento legal no va a firmar sin esto.

**Brecha 3 — El schema de la base de datos no existe en ningún lugar recuperable.**  
Las RLS policies, el trigger de auto-creación de perfiles, y el esquema completo viven solo en el dashboard de Supabase. Si ese proyecto se corrompe, se elimina accidentalmente o Supabase tiene un fallo, no hay forma de reconstruir la base de datos. Para un producto con datos académicos reales, esto es inaceptable.

### Comparación con expectativas de un CTO edtech mexicano

Un CTO de una empresa edtech mediana (50-500 usuarios) haciendo due diligence vería:

| Criterio | Estado | Comentario |
|---|---|---|
| Funcionalidad core | ✅ Completa | 40 simuladores es mucho contenido |
| Calidad de código | ✅ Buena para su origen | Domain extraction, TypeScript strict, tests |
| Seguridad básica | ✅ Presente | JWT, rate limiting, CSP |
| Monitoreo de producción | ❌ Inexistente | Sin Sentry, sin alertas, sin métricas |
| Backup/recuperación del DB | ❌ Riesgo alto | Schema no versionado, RLS no en repo |
| Documentación técnica | ✅ Sólida | El informe maestro cubre mucho |
| Cumplimiento legal | ❌ Bloqueante | Sin política de privacidad, sin ToS |
| Modelo de comercialización | ❌ Inexistente | Sin billing, sin self-service |
| Tests de integración | ⚠️ Parcial | 199 unit tests, 0 tests de API/UI |

Veredicto: **pasa la prueba técnica, reprueba la prueba operativa**. El código convence; la madurez empresarial no.

---

## 2. TOP 5 PRIORIDADES TÉCNICAS

### P-T1. Versionar el schema de Supabase con migraciones SQL

**Qué es:** Exportar desde el dashboard de Supabase el esquema actual (tablas, relaciones, RLS policies, triggers, índices) y guardarlo en `supabase/migrations/` con Supabase CLI. Desde ese momento, cualquier cambio al schema se hace como migración, no a mano en el dashboard.

**Por qué importa para CEN Labs específicamente:** Las RLS policies son la única barrera que separa los datos de una institución de ser vistos por otra. El trigger de auto-creación de perfiles es crítico para que el onboarding masivo funcione. Si Supabase pierde el proyecto o lo eliminas accidentalmente, actualmente no hay forma de reconstruir nada de eso. En una plataforma con datos académicos de menores, este es el riesgo más grande que existe ahora mismo.

**Esfuerzo:** 4-6 horas de trabajo manual  
**Quién lo puede hacer:** Vos con IA — es comandos Supabase CLI, SQL estático y un directorio nuevo  
**Costo externo:** $0  
**Qué desbloquea:** Recuperabilidad del sistema. Capacidad de hacer staging. Due diligence técnico limpio.

---

### P-T2. Monitoreo de errores con Sentry

**Qué es:** Integrar Sentry (o similar) para capturar automáticamente errores de producción con stack trace, contexto de usuario, frecuencia, y notificación por email.

**Por qué importa para CEN Labs específicamente:** Actualmente, si un simulador falla para un alumno real, no lo sabés. El alumno pierde su progreso, el maestro no entiende qué pasó, y vos no tenés evidencia para depurar. Cuando haya una institución pagando, necesitás saber que algo se rompió *antes* de que te llamen. Además, Sentry captura los errores de React (`error.tsx` ya los maneja en UI, pero Sentry los registra en el servidor con contexto).

**Esfuerzo:** 1 día  
**Quién lo puede hacer:** Vos con IA — instalación de `@sentry/nextjs`, un comando de setup, y configurar el DSN  
**Costo externo:** $0 (Sentry free tier: 5,000 errores/mes, suficiente para empezar)  
**Qué desbloquea:** Soportar clientes reales. Debugging remoto. SLA creíble.

---

### P-T3. Flujo de recuperación de contraseña

**Qué es:** Implementar el flow "Olvidé mi contraseña" usando Supabase Auth (`supabase.auth.resetPasswordForEmail()`). Página de solicitud, email de reset, página de nueva contraseña.

**Por qué importa para CEN Labs específicamente:** El onboarding masivo actual genera contraseñas institucionales genéricas. El primer día de uso, varios alumnos van a cambiar su contraseña y algunos la van a olvidar. Sin este flujo, el único camino es que el admin cree una cuenta nueva — que tiene historial vacío, perdiendo todos los intentos anteriores. Esto hace imposible dar soporte a escuelas reales.

**Esfuerzo:** 4-8 horas  
**Quién lo puede hacer:** Vos con IA — Supabase lo maneja casi completamente, es principalmente UI  
**Costo externo:** $0  
**Qué desbloquea:** Soporte real a usuarios. Flujo de uso continuo sin dependencia del admin.

---

### P-T4. Tests de integración para `/api/resultados`

**Qué es:** 8-12 tests con fetch real (o supertest) que cubran: token inválido → 401, sin token → 401, rate limit IP → 429, rate limit usuario → 429, body inválido → 400, resultado correcto → 200 y guardado en DB, error de Supabase → 500.

**Por qué importa para CEN Labs específicamente:** Esta es la única API route con lógica crítica — guarda los resultados académicos de los alumnos. Si algo se rompe en un deploy y nadie lo detecta, el historial de desempeño de alumnos reales se pierde silenciosamente. Los unit tests del dominio no cubren esto. Es también la API que más riesgo tiene de ser atacada.

**Esfuerzo:** 2-3 días  
**Quién lo puede hacer:** Vos con IA — el contexto del informe maestro es suficiente para escribirlos  
**Costo externo:** $0  
**Qué desbloquea:** Confianza en deploys. Regresiones detectadas antes de producción.

---

### P-T5. Onboarding self-service para instituciones

**Qué es:** Flujo donde un coordinador de escuela puede registrar su institución, crear su grupo de alumnos, y generar cuentas — sin que vos tengas que intervenir. Implica: página de registro institucional, lógica de creación de tenant (mínimo: un campo `institucion_id` en profiles), y que el admin vea solo sus alumnos.

**Por qué importa para CEN Labs específicamente:** El modelo actual requiere que vos seas el admin de cada cliente. Eso funciona para 2-3 clientes. No funciona para 20. Además, cuando una institución quiere hacer una demo o probar la plataforma, actualmente no pueden hacerlo solos — dependen de vos para cada cuenta. Eso frena el ciclo de ventas.

**Esfuerzo:** 1 semana  
**Quién lo puede hacer:** Vos con IA para el flujo básico; un freelance puede acelerar la parte de multi-tenant real  
**Costo externo:** $0 si lo hacés solo; ~$3,000-6,000 MXN si contratas a alguien para acelerar  
**Qué desbloquea:** Escalar más allá de 5 clientes. Demos autónomas. El paso previo a billing.

---

## 3. TOP 5 PRIORIDADES DE PRODUCTO/NEGOCIO

### P-N1. Política de privacidad + Aviso de privacidad para menores (LFPDPPP)

**Qué hacer:** Contratar a un abogado especializado en privacidad de datos en México para redactar: (1) política de privacidad pública, (2) aviso de privacidad simplificado para alumnos menores, (3) cláusula de consentimiento parental (o consentimiento de la institución como responsable de los menores). Publicar en la plataforma con checkbox obligatorio en login la primera vez.

**Por qué es bloqueante:** No es negociable para instituciones educativas formales. El departamento legal o administrativo de cualquier preparatoria o universidad va a pedir este documento antes de firmar. Sin él, no hay contrato posible. La LFPDPPP aplica aunque la plataforma sea pequeña.

**Tiempo:** 2-3 semanas (incluye revisión y publicación)  
**Costo:** $3,000–$8,000 MXN (abogado freelance especializado en privacidad digital en México). Hay abogados universitarios o de startup que cobran en ese rango. Evitá las plantillas genéricas de internet — una institución educativa las rechaza.

---

### P-N2. Primer cliente piloto con contrato mínimo

**Qué hacer:** Identificar una preparatoria, CBTIS, CONALEP, universidad tecnológica, o centro de apoyo académico que conozca. No una venta fría — alguien con quien haya contacto previo o referido. Ofrecerles un piloto de 30 días gratuito a cambio de feedback formal (3 reuniones + encuesta de alumnos). Formalizar con un convenio de uso firmado (no contrato de pago, pero sí un documento).

**Por qué es la prioridad más alta de negocio:** Sin un usuario real en contexto de clase, no sabés si el producto resuelve un problema real o si creaste algo que a vos te parece valioso. El piloto también genera: testimonios, evidencia de impacto, y la primera señal de qué está roto en contexto real (que nunca es lo que esperás).

**Tiempo:** 1-2 semanas para conseguirlo, 30 días el piloto  
**Costo:** $0 — el costo es de tiempo y requiere que P-N1 esté hecho primero

---

### P-N3. Definir y documentar el modelo de negocio concreto

**Qué hacer:** Decidir — con números reales — cómo se cobra. Las opciones principales para el mercado mexicano son:
- **Licencia anual por institución** (ej. $8,000-15,000 MXN/año por plantel, ilimitado de alumnos) — más fácil de presupuestar para una escuela
- **Por alumno activo/mes** (ej. $50-80 MXN/alumno/mes) — más justo en teoría, más difícil de facturar
- **Freemium** (acceso básico gratis, premium con pago) — más difícil de implementar técnicamente

Documentar la decisión incluyendo: precio, ciclo de facturación, qué incluye el precio, cómo se diferencia un plan de otro, política de descuentos para zonas rurales o escuelas públicas.

**Por qué ahora:** La arquitectura técnica que construyas depende directamente del modelo. Si cobrás por institución necesitás multi-tenant. Si hacés freemium necesitás feature flags. No podés construir bien si no sabés cómo vas a cobrar.

**Tiempo:** 1-2 días de reflexión + investigación de competidores  
**Costo:** $0, aunque una sesión con alguien que haya vendido SaaS educativo en México vale mucho

---

### P-N4. Identidad de marca y posicionamiento CEN

**Qué hacer:** Resolver si "CEN" es el paraguas de Labs + Financiera + futuras plataformas, o si cada producto tiene marca independiente. Si es un paraguas, definir: qué significa CEN, logo, paleta oficial, tono de voz. Si son independientes, definir qué los une y por qué deberían verse relacionados. También: dominio propio para la plataforma (no es la URL de Vercel), y un email profesional de contacto (no Gmail).

**Por qué importa ahora:** Cuando llames a una escuela para el piloto, van a buscar "CEN" en internet. Si no encuentran nada creíble, la conversación es cuesta arriba. Un dominio y una página de landing con logo profesional cuestan $500-1,000 MXN y cambian la percepción completamente.

**Tiempo:** 1 semana (logo, landing mínima, dominio, email corporativo)  
**Costo:** $500-$2,000 MXN (dominio ~$200 MXN/año, Resend para email $0-10/mes, logo con IA o diseñador $0-1,500 MXN)

---

### P-N5. Validación del contenido educativo por un par académico

**Qué hacer:** Conseguir que un maestro de química, física, biología o matemáticas de nivel preparatoria revise 3-5 simuladores y firme una carta de validación. No es certificación formal — es una revisión de pares que permite decir "validado por docentes de [institución]" en el pitch.

**Por qué importa:** Los tomadores de decisión en escuelas mexicanas son directivos educativos que no confían en software que "dice" ser preciso científicamente sin respaldo. Una firma de un docente crea credibilidad que ninguna demo puede reemplazar. También: la revisión va a encontrar errores o mejoras que vos nunca vas a ver porque no enseñás la materia.

**Tiempo:** 2-4 semanas (conseguir al maestro, darle acceso, esperar feedback, documentarlo)  
**Costo:** $0-$1,500 MXN (algunos lo hacen gratis si les interesa el proyecto; otros esperan compensación)

---

## 4. ROADMAP DE 90 DÍAS

### DÍAS 1–30: "Tapar agujeros críticos"

**Objetivo del mes:** Tener un producto que no te explote en la cara cuando lo use alguien real.

| Tarea | Esfuerzo | Resultado |
|---|---|---|
| Exportar schema Supabase a `supabase/migrations/` (P-T1) | 4-6h | Schema versionado, recuperable |
| Implementar recuperación de contraseña (P-T3) | 4-8h | Usuarios pueden recuperar acceso |
| Integrar Sentry para errores de producción (P-T2) | 4-6h | Visibilidad de fallos |
| Contratar abogado y arrancar política de privacidad (P-N1) | 1 semana | Proceso legal activo |
| Decidir modelo de negocio (P-N3) | 2 días | Claridad para construir lo correcto |
| Conseguir dominio y email corporativo CEN (P-N4) | 1 día | Presencia profesional mínima |
| Escribir tests de integración `/api/resultados` (P-T4) | 2-3 días | API cubierta ante regresiones |

**Hito verificable al día 30:**  
- Schema en el repo ✓  
- Usuario puede recuperar contraseña ✓  
- Sentry recibe errores de prueba ✓  
- Política de privacidad en revisión legal ✓  
- Dominio activo con email corporativo ✓

---

### DÍAS 31–60: "Validar producto-mercado"

**Objetivo del mes:** Tener un maestro real usando la plataforma con alumnos reales, y haberlo escuchado.

| Tarea | Esfuerzo | Resultado |
|---|---|---|
| Publicar política de privacidad en la plataforma (checkbox en login) | 1-2 días | Compliance mínimo activo |
| Contactar y cerrar piloto con 1-2 instituciones (P-N2) | Variable | Usuario real en contexto |
| Buscar docente que valide contenido científico (P-N5) | Variable | Credibilidad académica |
| Ajustar onboarding masivo basado en feedback del piloto | 1-2 días | Fricción reducida |
| Implementar onboarding self-service básico (P-T5) | 1 semana | Menos dependencia del admin |
| Construir landing page de ventas (no la app — una página de marketing) | 3-4 días | Canal de contacto profesional |

**Hito verificable al día 60:**  
- Al menos 10 alumnos reales han completado al menos 1 simulador ✓  
- Maestro piloto ha dado feedback en al menos 2 reuniones ✓  
- 1 validación académica de contenido por un docente ✓  
- Una institución puede crear sus propias cuentas sin tu ayuda ✓

---

### DÍAS 61–90: "Preparar para escala"

**Objetivo del mes:** Tener los sistemas que permiten tener 5+ clientes sin que tu tiempo sea el cuello de botella.

| Tarea | Esfuerzo | Resultado |
|---|---|---|
| Implementar multi-tenant real (tenant_id en todas las tablas) | 1-2 semanas | Datos aislados por institución |
| Integrar Stripe Checkout para licencias anuales | 1 semana | Primer cliente puede pagar |
| Configurar ambiente de staging (Vercel preview + Supabase branch) | 2-3 días | Deploys con red de seguridad |
| Analytics de uso con PostHog (tiempo en tarea, abandono por simulador) | 2-3 días | Datos para argumentar valor |
| Resolver los hallazgos del piloto (top 3 problemas más reportados) | Variable | Producto que resuelve lo real |
| Integrar Resend para emails transaccionales (bienvenida, reset, notificaciones) | 1-2 días | Comunicación profesional con usuarios |

**Hito verificable al día 90:**  
- Al menos 1 cliente paga (aunque sea precio de lanzamiento) ✓  
- Multi-tenant activo (datos aislados) ✓  
- Ambiente de staging funcional ✓  
- Analytics mostrando datos de uso reales ✓

---

## 5. DECISIÓN CLAVE PARA LOS PRÓXIMOS 7 DÍAS

### Exportar y versionar el schema de Supabase

**La única cosa que deberías hacer esta semana, antes que cualquier otra.**

No es la más emocionante. No genera ninguna funcionalidad visible. Nadie va a aplaudirla. Pero es la que más daño puede evitar.

**Por qué esta y no otra:**

El schema de Supabase — incluyendo las RLS policies que protegen los datos de cada institución — vive únicamente en un dashboard web. Un error, un límite de plan, un proyecto eliminado por accidente, o simplemente un corte de Supabase borra años de trabajo y datos académicos reales. No hay backup que vos controles.

Recuperación de contraseña también urge y también cuesta horas, pero si falta hoy no pierde datos — solo incomoda usuarios. El schema perdido es irrecuperable.

**Cómo hacerlo con IA:**
1. Instalar Supabase CLI: `npm install -g supabase`
2. `supabase login` (te pide access token del dashboard)
3. `supabase db dump --linked -f supabase/schema.sql` — exporta todo el schema
4. Revisar el dump, crear `supabase/migrations/001_initial_schema.sql`
5. Commit al repo

Una vez hecho, el repo tiene la fuente de verdad del database. Todo lo que viene después es más seguro.

---

## 6. RIESGOS ESPECÍFICOS QUE VEO

### Riesgos técnicos

**R-T1 — Schema Supabase unrecoverable (CRÍTICO)**  
Ya documentado, pero merece repetirse: si Supabase pierde el proyecto actual, no hay forma de reconstruir el schema, las RLS policies, el trigger de creación de perfiles, ni los datos históricos. Esto es riesgo existencial para un producto con usuarios reales.

**R-T2 — localStorage inconsistente entre versiones del store**  
El storage key ya se bumpeó a `cen-sim-v10` manualmente. Si en el futuro se agrega un campo nuevo al store sin bumpear el key, los alumnos con datos viejos en localStorage pueden tener estados corruptos silenciosamente. Necesitás un proceso formal: cada cambio breaking en el schema del store → bump del key → comunicar a los usuarios.

**R-T3 — Rate limiting in-memory no compartido entre instancias Vercel**  
Sin Upstash configurado, cada función serverless de Vercel tiene su propio contador de rate limiting. Con 10 instancias concurrentes, un usuario puede hacer 300 requests/minuto y el límite no se detecta. Si no vas a configurar Upstash pronto, al menos documentar que el rate limiting en desarrollo/staging es solo informativo.

**R-T4 — Zustand persist + React 19 hydration**  
`useEffect` y `localStorage` en React 19 con el App Router de Next.js tienen un comportamiento de hydration que puede generar mismatches silenciosos. El `deepMergeState` custom fue necesario antes — si se actualiza Next.js o React, puede necesitar revisión. Agregar tests específicos de hydration.

**R-T5 — Dependencia de next-themes con React 19**  
El README de React 19 / Next.js 15 documenta que varias librerías tienen problemas de compatibilidad. `next-themes`, `shadcn`, y algunas de `Framer Motion` están en esa zona de riesgo. Si aparece un bug visual raro después de actualizar dependencias, buscar aquí primero.

### Riesgos de producto

**R-P1 — El flujo pedagógico obligatorio puede ser un bloqueante de adopción**  
Misión → Briefing → Práctica → Validación no se puede saltar. Para un docente que quiere mostrar rápidamente un simulador en clase sin pasar por todo el flujo, esto puede ser frustrante. Considera un "modo demo" que salte al simulador directamente, solo para el rol profesor.

**R-P2 — 40 simuladores de la misma complejidad pueden saturar al maestro**  
La biblioteca de labs muestra 40 opciones. Para un maestro que quiere "empezar simple", no hay una ruta recomendada. Considera un "starter pack" de 5-8 simuladores destacados que sean los mejores de cada materia, y presentarlos primero.

**R-P3 — Sin sincronización cross-dispositivo, el progreso del alumno se pierde**  
Un alumno que usa la computadora de la casa el lunes y la del laboratorio de cómputo el miércoles tiene dos estados de Zustand diferentes. Cuando guarda en Supabase, sobrescribe. Los simuladores que no completó en casa tienen que empezar de cero en la escuela. Esto es invisibles hasta que pasa en producción.

### Riesgos legales/operativos

**R-L1 — LFPDPPP + datos de menores es el mayor riesgo jurídico**  
México tiene legislación específica que requiere consentimiento parental o institucional para tratar datos de menores. Si un padre se queja a la institución sobre privacidad de datos, la institución puede pedirte que borres todo — y si no tenés políticas documentadas, no tenés defensa.

**R-L2 — Dominio del email institucional hardcodeado**  
`@cenlaboratorios.com` está hardcodeado en `adminActions.ts`. Cuando el primer cliente tenga su propio dominio (ej. `@prepatoriamorelos.edu.mx`), el onboarding masivo va a generar emails incorrectos. Necesita ser un parámetro configurable antes de cualquier venta real.

**R-L3 — Propiedad intelectual del código**  
El código fue construido con Gemini y Claude como asistentes. Los términos de uso de Anthropic y Google sobre propiedad intelectual del código generado con IA son relativamente claros (el usuario retiene la propiedad), pero si algún día hay una disputa con un inversor o cliente, conviene tener documentado que el creador es el titular. Un abogado puede hacer una declaración simple de titularidad por ~$500 MXN.

**R-L4 — Sin contrato de prestación de servicios para el piloto**  
Cuando des acceso gratuito a una institución para el piloto, sin un convenio firmado, la institución podría:
- Compartir las credenciales fuera del piloto acordado
- Reclamar que los datos académicos del piloto les pertenecen
- No dar el feedback prometido sin obligación contractual

Un convenio de uso de 1 página (que puede redactar el mismo abogado de privacidad) protege a ambas partes.

---

## 7. COMPARACIÓN HONESTA CON CEN EDUCACIÓN FINANCIERA

### Estado actual de CEN Financiera (evaluado el 2026-05-10)

CEN Financiera es significativamente más temprana. Stack: Next.js 16 + TypeScript + Tailwind + Supabase. Rutas: `academia/` (4 módulos: primeros-pasos, planificación, construyendo-independencia, hora-de-emprender), `dashboard/`, `log-in/`. Componentes principales: 4 archivos (Navbar, BotonProgreso, FooterBiblioteca, SecureGame). No hay evidencia de tests, rate limiting, ni arquitectura de dominio.

### ¿Cuál priorizar primero? CEN Labs, sin duda.

CEN Labs tiene contenido real (40 simuladores), arquitectura sólida, 199 tests, usuarios potenciales identificados, y está mucho más cerca de una primera venta. Terminar un producto es siempre mejor que empezar dos.

CEN Financiera no está lista para profesionalizar todavía — primero necesita más contenido y una validación de problema. ¿Hay alumnos que necesitan educación financiera en el mismo formato de simuladores de laboratorio? Esa pregunta no está respondida.

**Regla práctica:** Hasta que CEN Labs tenga su primer cliente pagando, CEN Financiera está en pausa de desarrollo activo.

### Decisiones que benefician a ambas plataformas

Estas decisiones se hacen una vez y aplican a los dos productos — vale la pena tomarlas bien desde el inicio:

| Decisión | Impacto en Labs | Impacto en Financiera |
|---|---|---|
| **Entidad legal / RFC** — si vas a facturar, necesitás estar dado de alta en el SAT, idealmente como persona física con actividad empresarial o persona moral | Necesario para primer contrato | Necesario cuando se venda |
| **Organización Supabase** — tener una organización de Supabase que contenga proyectos separados (uno por producto) en lugar de usar el mismo proyecto para todo | Labs ya tiene el suyo; crear el de Financiera separado | Evita mezcla de datos entre productos |
| **Marca paraguas CEN** — si tenés Labs + Financiera + futuras plataformas, "CEN" debería ser la marca institucional, y cada producto sería "CEN Labs", "CEN Finanzas", "CEN [algo]" | Naming ya coherente | Se beneficia del equity de Labs |
| **Abogado de privacidad** — una vez que redacta la política de Labs, adaptarla para Financiera cuesta mucho menos | Prioritario ahora | Reutiliza el trabajo |
| **Stripe / facturación** — una sola cuenta de Stripe puede manejar productos distintos con precios distintos | Cuando llegue el momento | Reutiliza la integración |

### ¿Unificar o mantener separadas?

**Mantenerlas separadas** a nivel de producto, código y base de datos. Los usuarios de Labs (maestros de ciencias) y los de Financiera (¿educadores financieros?, ¿tutores?) son audiencias distintas, los simuladores son distintos, y mezclar los codebases crea complejidad sin ganancia.

**Unificar a nivel de marca y empresa.** "CEN" como marca paraguas es una decisión correcta. Cuando tengas dos productos, da señal de que estás construyendo algo más grande que una app.

---

## APÉNDICE: RESUMEN EJECUTIVO DE ACCIONES

| Semana | Acción | Tipo | Urgencia |
|---|---|---|---|
| Esta semana | Exportar schema Supabase a repo | Técnica | Existencial |
| Semana 1-2 | Recuperación de contraseña | Técnica | Alta |
| Semana 1-2 | Contratar abogado para política privacidad | Legal | Alta |
| Semana 1-2 | Conseguir dominio y email CEN | Marca | Alta |
| Semana 2-3 | Integrar Sentry | Técnica | Alta |
| Semana 2-3 | Decidir modelo de negocio | Estratégica | Alta |
| Semana 3-4 | Tests integración API | Técnica | Media |
| Mes 2 | Publicar política de privacidad en app | Legal | Media |
| Mes 2 | Cerrar primer piloto | Negocio | Alta |
| Mes 2 | Onboarding self-service | Técnica | Media |
| Mes 3 | Multi-tenant real | Técnica | Media |
| Mes 3 | Stripe billing | Negocio | Alta |

---

*Generado: 2026-05-10 — Claude Sonnet 4.6 (Anthropic)*  
*Para actualizaciones, revisar estado del backlog en `project_cen_labs.md`*
