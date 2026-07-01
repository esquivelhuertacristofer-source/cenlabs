# Pendientes — Acción Manual Requerida

Generado: 2026-05-18 | Sesión correctiva basada en SALUD-TECNICA-LABS-2026-05-16.md

Estos ítems NO pueden resolverse automáticamente porque requieren acceso externo,
credenciales o decisiones de negocio. Están ordenados por impacto.

---

## 🔴 CRIT-1 — Rotar credenciales expuestas en git history

**Problema:** El commit `057eb45` insertó Supabase ANON_KEY en texto plano en el
historial de git. Ese commit es inmutable. Las credenciales deben considerarse
comprometidas.

**Acción:**
1. Ir a [Supabase Dashboard → Settings → API](https://supabase.com/dashboard)
2. Generar nuevo **ANON_KEY** (botón "Regenerate")
3. Generar nuevo **SERVICE_ROLE_KEY** por precaución
4. Actualizar `.env.local` con las nuevas keys
5. Actualizar las variables en **Vercel Dashboard → Settings → Environment Variables**
6. Redeploy en Vercel para que las nuevas variables estén activas
7. Verificar que la aplicación sigue funcionando (login, guardado de resultados)

**Nota:** El commit `057eb45` permanecerá en el historial — no intentar hacer
`git rebase` para borrarlo a menos que el repo sea privado y estés seguro. Lo que
importa es que las keys rotadas ya no son válidas.

---

## 🔴 CRIT-2 — Credenciales en texto plano en archivos del filesystem

**Problema:** 4 archivos contienen passwords reales fuera del control de git:
- `.env.local` — Supabase URL, ANON_KEY, SERVICE_ROLE_KEY (válidas mientras no se roten)
- `ENTREGA_CREDENTIALS.md` — email/password del dashboard Supabase + Cloudflare
- `MASTER_CREDENTIALS.md` (directorio padre) — passwords de cuentas de plataforma
- `docs/CREDENCIALES-PILOTO-001.md` — cuentas de alumnos piloto

**Acción:**
1. Mover todas las credenciales a un gestor de contraseñas (1Password, Bitwarden, etc.)
2. Eliminar `ENTREGA_CREDENTIALS.md` y `docs/CREDENCIALES-PILOTO-001.md` del disco
3. Actualizar contraseñas del dashboard de Supabase y Cloudflare si fueron compartidas

---

## 🔴 CRIT-3 — Configurar Sentry DSN en Vercel

**Problema:** El código de Sentry ya está integrado y listo. Solo falta el DSN.
Sin él, todos los errores en producción van a ningún lado.

**Acción:**
1. Crear cuenta en [sentry.io](https://sentry.io) (tier gratuito alcanza para este proyecto)
2. Crear un proyecto nuevo → tipo: Next.js → nombre: "CEN Labs"
3. Copiar el DSN (formato: `https://xxx@xxx.ingest.sentry.io/xxx`)
4. En **Vercel Dashboard → Settings → Environment Variables**, agregar:
   - `NEXT_PUBLIC_SENTRY_DSN` = el DSN copiado (entornos: Production + Preview)
5. Redeploy para activar
6. Verificar en Sentry que llegan eventos de prueba

**Tiempo estimado:** 20–30 minutos.

---

## 🟠 ALTO-4 — Versionar schema de base de datos

**Problema:** `supabase/migrations/` no existe. Si se pierde el acceso a Supabase,
el schema, las RLS policies y los triggers son irrecuperables.

**Acción:**
```bash
# 1. Login con tu cuenta de Supabase
npx supabase login
# Abre https://supabase.com/dashboard/account/tokens y pega tu token

# 2. Vincular al proyecto (project-ref está en la URL de Supabase)
npx supabase link --project-ref wbvcclpxxwzkuddjxqig

# 3. Exportar el schema completo
npx supabase db dump --linked -f supabase/schema.sql

# 4. Commitear
git add supabase/schema.sql
git commit -m "feat(db): versionar schema inicial de produccion"
git push
```

**Tiempo estimado:** 10 minutos.

---

## 🟠 ALTO-6 — Configurar Upstash Redis para rate limiting distribuido

**Problema:** El rate limiter actual usa un `Map` en memoria por instancia serverless.
En Vercel con múltiples instancias, los límites no se comparten. Un atacante puede
hacer bypass enviando tráfico a distintas instancias.

**Acción:**
1. Crear cuenta en [upstash.com](https://upstash.com) (tier gratuito: 10,000 req/día)
2. Crear una **Redis database** (región: `us-east-1` o la más cercana a Vercel)
3. Copiar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`
4. En **Vercel Dashboard → Settings → Environment Variables**, agregar ambas variables
5. Redeploy para activar

El código de `rateLimiter.ts` ya detecta estas variables automáticamente y cambia a
Upstash. No se necesita ningún cambio de código.

**Tiempo estimado:** 15 minutos.

---

## 🟠 ALTO-7 — Actualizar Next.js (2 HIGH CVEs)

**Problema:** Next.js 15.5.15 tiene 2 vulnerabilidades HIGH. La 15.5.18 las resuelve.

**Acción:**
```bash
npm update next
npm audit
# Confirmar que las 2 HIGH desaparecen
npm run lint && npx tsc --noEmit && npm test && npm run build
git add package.json package-lock.json
git commit -m "fix(deps): actualizar Next.js para parchear 2 HIGH CVEs"
git push
```

**Nota:** Actualizar con cautela. Si el build falla, revisar changelog de Next.js 15.5.18.

---

## ⚪ OBSERVACIÓN — Activar health check automático post-deploy

El workflow `preview-tests.yml` verifica los 40 simuladores pero es solo
`workflow_dispatch` (manual). El `ci.yml` ya tiene un health check al final que
verifica `/`, `/laboratorios` y `/api/health` después de un push a main.

Para activar el check completo de 40 rutas automáticamente:
1. Configurar un **webhook de Vercel → GitHub Actions** con el evento `deployment.succeeded`
2. O convertir `preview-tests.yml` de `workflow_dispatch` a `deployment_status`

Esto requiere un token de Vercel y configuración del webhook en Vercel Dashboard.

---

*Generado por sesión correctiva automática — 2026-05-18*
