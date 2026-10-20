# CEN Labs · Laboratorios virtuales

Plataforma de simuladores educativos en 3D para Química, Física, Biología, Matemáticas y Mecánica/Autotrónica. Cada práctica tiene un simulador, una bitácora, un quiz, una ficha técnica y un reto que se valida sin regalar la respuesta.

> Este README se revisó el 2026-10-19. Si algo aquí contradice el código, manda el código; avisa y se corrige.

## Contenido actual

| Área | Prácticas | Tecnología del simulador |
|---|---:|---|
| Química, Física, Biología y Matemáticas | 40 (10 por área) | React + React Three Fiber, en `src/components/simuladores/` |
| Mecánica y autotrónica | 126 (`mecanica-1` a `mecanica-126`) | Casi todas HTML estático en `public/labs/`, generado desde `scripts/lab-src/` |

Treinta prácticas están marcadas como **destacadas** (`destacada: true` en su `catalogo.ts`). Son las que cumplen el estándar de «clase mundial»: ver [docs/ESTANDAR-LABS-CLASE-MUNDIAL.md](docs/ESTANDAR-LABS-CLASE-MUNDIAL.md).

## Stack

- Next.js 15 (App Router), React 19, TypeScript, Tailwind 4.
- three 0.184, React Three Fiber 9, drei 10.
- Zustand para el estado de las prácticas.
- Supabase (autenticación y resultados), con respaldo en `localStorage`.
- Sentry para errores. Jest para pruebas.
- Despliegue en Cloudflare Workers con OpenNext.

## Cómo está organizado

```
src/
  app/                      Rutas (login, alumno, admin, hubs por área, /api)
  components/
    Piloto*.tsx             Simulador de cada práctica de ciencias
    bitacoras/              Bitácora de cada práctica
    simuladores/<carpeta>/  Escena 3D, dock, reloj y física del lab
    simuladores/_kit/       Kit común de 3D (materiales, cristalería, instrumentos)
  labs/<id>/                Datos de cada lab: catálogo, briefing, contenido, quiz, tutor
  domain/                   Reglas y validadores de cada práctica
  data/                     Stores de datos heredados
  __tests__/                Pruebas (física, catálogo, contrato de labs, golden)
public/labs/                Labs estáticos de mecánica (HTML) y sus fichas
scripts/                    Generadores, auditoría, voz y portadas
docs/                       Estándares, planes y auditorías
supabase/                   Schema y migraciones (ver su README)
```

Un lab nuevo se crea con `npm run new:lab`. Los registros (`src/labs/_*.generated.ts`) se regeneran solos antes de `dev` y `build`.

## Puesta en marcha

Requisitos: Node 22 y npm.

```bash
npm ci
cp .env.example .env.local      # completar las variables que correspondan
npm run dev                      # http://localhost:3001
```

La app arranca sin Supabase y usa `localStorage`, pero sin él no hay inicio de sesión real. Las variables están comentadas en [.env.example](.env.example).

## Comandos útiles

| Comando | Para qué |
|---|---|
| `npm test` | Todas las pruebas (unas 2600) |
| `npx tsc --noEmit` | Comprobación de tipos |
| `npm run lint` | ESLint (el build también lo corre) |
| `npm run auditar:labs` | Barrido de consola de los labs estáticos |
| `node scripts/auditoria/sonda-labs-base.mjs <dir> <id> 1600x900 60000` | Sonda de un lab de ciencias |
| `npm run gen:portadas -- --solo N` | Portada de la ficha de un lab |
| `npm run deploy:cf` | Construye y despliega a Cloudflare (ver abajo) |

## Despliegue

`git push` **no** despliega. La producción se publica con `npm run deploy:cf`, desde una copia limpia del repositorio, y necesita archivos que no están en git: `.env.local`, `.env.production`, `.dev.vars` y la carpeta `public/assets/voz` (audios MP3 de la narración). Después de desplegar hay que comprobar con `npx wrangler deployments list` que existe una versión nueva y hacer una prueba de humo (login, `/api/health`, un lab). Para volver atrás: `npx wrangler rollback <versión>`.

## Estado conocido y riesgos

- **Base de datos fuera del repo.** El schema, las políticas RLS y los triggers de Supabase viven en el panel de Supabase; [supabase/README.md](supabase/README.md) explica cómo exportarlos. Mientras no estén versionados, no se pueden reconstruir.
- **Rendimiento real sin medir.** Las pruebas visuales se hicieron con renderizado por software; falta medir en GPU real.
- **Cobertura desigual.** Los labs de ciencias recientes tienen pruebas de física; la mayoría de los labs estáticos de mecánica sólo tienen un barrido de consola.
- **Dependencias.** Ver el último `npm audit`; las vulnerabilidades que quedan están sobre todo en herramientas de desarrollo y en cadenas de Sentry y PostCSS que requieren un salto de versión mayor.

## Documentación

- [docs/ESTANDAR-LABS-CLASE-MUNDIAL.md](docs/ESTANDAR-LABS-CLASE-MUNDIAL.md): qué debe cumplir un lab.
- [docs/ESTANDAR-MOLDE-LAB-3D-MECANICA.md](docs/ESTANDAR-MOLDE-LAB-3D-MECANICA.md): molde de los labs 3D de mecánica.
- [docs/PLAN-ESCALABILIDAD-200-LABS.md](docs/PLAN-ESCALABILIDAD-200-LABS.md) y [docs/PLAN-100-LABS-AUTOTRONICA.md](docs/PLAN-100-LABS-AUTOTRONICA.md): planes futuros, no ejecutados.
- [docs/LISTA-MAESTRA-200-PRACTICAS.md](docs/LISTA-MAESTRA-200-PRACTICAS.md): catálogo objetivo.
- [AGENTS.md](AGENTS.md) y [CLAUDE.md](CLAUDE.md): instrucciones para agentes de código.
