# Sentry — Instrucciones de Activación

> El código de Sentry ya está integrado en CEN Labs. Solo falta conectarlo a una cuenta.
> Esta guía son los pasos manuales que el usuario debe ejecutar UNA sola vez.

---

## Estado actual

- `sentry.client.config.ts` — captura errores de navegador con filtros (extensiones, CSP, ad blockers)
- `sentry.server.config.ts` — captura errores de servidor; detecta el patrón del incidente del 2026-05-11
- `sentry.edge.config.ts` — captura errores en Edge Runtime (middleware)
- `src/instrumentation.ts` — hook de Next.js que carga los configs en el runtime correcto
- `next.config.ts` — envuelto con `withSentryConfig`

**Sin `NEXT_PUBLIC_SENTRY_DSN`, todo el código es no-op. La plataforma funciona igual sin Sentry.**

---

## Paso 1 — Crear cuenta en sentry.io

1. Ir a [https://sentry.io/signup/](https://sentry.io/signup/)
2. Registrarse con el email de Antigravity
3. Crear una organización (ej: `antigravity-mx`)

---

## Paso 2 — Crear proyecto

1. En el dashboard → **Projects → Create Project**
2. Elegir plataforma: **Next.js**
3. Nombre del proyecto: `cen-labs`
4. Alert frequency: **On every new issue**
5. Confirmar creación

---

## Paso 3 — Copiar el DSN

1. Ir a **Settings → Projects → cen-labs → Client Keys (DSN)**
2. Copiar el valor de **DSN** (formato: `https://XXXXXXX@oXXXXXX.ingest.sentry.io/XXXXXXX`)

---

## Paso 4 — Configurar variables de entorno

### En local (`.env.local`)

```bash
NEXT_PUBLIC_SENTRY_DSN=https://tu-dsn@sentry.io/proyecto
SENTRY_ORG=antigravity-mx
SENTRY_PROJECT=cen-labs
SENTRY_AUTH_TOKEN=tu-auth-token   # opcional — habilita subida de source maps
```

### En Vercel

1. Ir a [https://vercel.com/](https://vercel.com/) → proyecto `cen-labs` → **Settings → Environment Variables**
2. Agregar:

| Variable | Valor | Entorno |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | El DSN copiado | Production, Preview |
| `SENTRY_ORG` | `antigravity-mx` | Production, Preview |
| `SENTRY_PROJECT` | `cen-labs` | Production, Preview |
| `SENTRY_AUTH_TOKEN` | Auth token (ver abajo) | Production, Preview |

---

## Paso 5 — Obtener Auth Token (para source maps)

El Auth Token permite subir source maps a Sentry para ver stack traces legibles.

1. En Sentry → **Settings → Auth Tokens → Create New Token**
2. Permisos necesarios: `project:releases`, `org:read`
3. Copiar el token y agregarlo como `SENTRY_AUTH_TOKEN` en Vercel

**Sin este token, Sentry igual captura errores pero los stack traces mostrarán código minificado.**

---

## Paso 6 — Deploy

```bash
git push origin main
```

Vercel reconstruye con las nuevas variables y Sentry queda activo.

---

## Verificar que funciona

1. En producción, abrir DevTools → Console
2. No debe aparecer ningún error de inicialización de Sentry
3. En el panel de Sentry → **Issues** — debe mostrar 0 errores (si la plataforma está limpia)

Para forzar un error de prueba (solo en local):
```typescript
// En cualquier componente, temporalmente:
throw new Error('Test Sentry integration')
```

---

## Alertas configuradas

Sentry está configurado para detectar específicamente:

- **`simulador-route-unexpected-404`** — Se dispara si una ruta `/alumno/simulador/*` devuelve 404. Este es el patrón del incidente del 2026-05-11 donde 30 de 40 simuladores cayeron en producción.

Para configurar alertas por email/Slack de este evento:
1. Sentry → **Alerts → Create Alert Rule**
2. Conditions: `Event tag simulador-route-404 exists`
3. Action: enviar email o webhook a Slack

---

*Documento generado: 11 de mayo de 2026 · CEN Labs*
