# Continuidad del proyecto CEN Labs

Este es el punto de entrada para otra IA. Leer este archivo antes de usar relevos antiguos.

## Mandato vigente del usuario
- Responder siempre en español.
- Prioridad: laboratorios NUEVOS, educativos, entendibles e impresionantes visualmente. El usuario rechazó una primera versión básica del 163. No basta con pulir la estética de temas repetidos.
- Al cliente le interesan robots, garras, brazos y motores. El 164 se amplió a celda con bloques por petición expresa.
- Después de CADA laboratorio terminado: actualizar su ficha en esta carpeta y este índice ANTES de empezar el siguiente. Registrar también correcciones posteriores; no limitarse a un resumen al final de la sesión.
- Documentar por separado: implementado, probado, commit/push y publicado. Nunca llamar «en producción» a un simple push.
- Se autorizó trabajar con el modelo actual de Codex sin agentes en esta sesión. No lanzar agentes por el mandato histórico de Sonnet; no hay agentes activos.
- Push a main y despliegue del sprint autorizados. Un solo navegador Playwright a la vez; cerrar en finally. No matar procesos de otros proyectos.
- Nunca imprimir contraseñas. `docs/CREDENCIALES-PILOTO-001.md` sólo puede leerlo el script de login; no tocar `ENTREGA_CREDENTIALS.md`.
- Presentación viernes 23-10-2026; congelación jueves 22 por la noche.

## Dónde está el proyecto
- Repo: `C:\Users\crist\.gemini\antigravity\scratch\Proyecto LABS\cen-dashboard`.
- Worktree de deploy: carpeta hermana `cen-deploy`.
- Producción: https://www.cenlaboratorios.com.mx .
- Regla de calidad: `docs/ESTANDAR-LABS-CLASE-MUNDIAL.md`.
- Scripts y capturas QA de esta sesión: `C:\Users\crist\Documents\Codex\2026-10-21\files-pasted-by-the-user-texto\work`.

## Estado confirmado y punto exacto de reanudación
- Base anterior: commit `270e7d4`; 127–159 desplegados, 41 destacadas.
- Lote actual: 160–164 terminado, registrado y empujado a main como `d59087d`.
- Cloudflare: despliegue en curso, aún sin confirmar versión ni login real. Si se interrumpe aquí, comprobar la versión ANTES de volver a desplegar.
- Después del lote debe haber 46 destacadas. No dar por comprobado el conteo hasta el login.
- Siguiente ID libre: **mecanica-165**. Quedan seis IDs de la reserva hasta 170; NO están construidos. La reserva no obliga a inventar seis completados.
- No hay PR pendiente. El relevo antiguo `docs/RELEVO-SPRINT-INSIGNIA.md` era un archivo local heredado; este índice lo actualiza y prevalece en estado actual.

## Laboratorios cerrados en este lote
| ID | Ficha de continuidad | Cambio principal |
|---|---|---|
| 160 | [Hidrógeno](mecanica-160.md) | Integración del trabajo heredado |
| 161 | [Faros](mecanica-161.md) | Integración y corrección de carrera de máscara |
| 162 | [Lluvia](mecanica-162.md) | Tema nuevo, óptica y sensor en corte |
| 163 | [Supercapacitores](mecanica-163.md) | Tema nuevo, banco automotriz y celda detallada |
| 164 | [Celda robotizada](mecanica-164.md) | Garra, bloques, cambiador, carga, pulido y entrega |

## Verificación global ya ejecutada
- TypeScript y ESLint sin errores.
- Suite completa previa a ampliar los bloques: 44 suites, 2887 pruebas, 12 snapshots correctos.
- Tras la ampliación: TypeScript y ESLint de los archivos afectados; 235 pruebas de integración/entrada/hub/puente/briefings; 15 pruebas golden, cambios revisados limitados al lote/título y briefing ampliado.
- Auditorías numéricas: 132 + 1163 + 2462 + 6681 + 45304 comprobaciones. Auditoría adicional del programa de celda.
- 160–163: barrido sin red sano; 164: barrido sin red anterior a ampliar bloques sano. Los bloques usan sólo imports locales y se comprobaron en navegador.
- 164: programa completo de 15 bloques construido mediante UI, con condición y repetición; ciclo y quiz correctos en 1366×768 y 390×844. También vistas en 1600×900 y 2020×1055 DPR 1,25. Sin errores de consola propios, desbordamientos ni normales cero. Garra visible en vista propia.
- Scripts locales: `qa-celda-final.mjs`, `qa-celda-vista.mjs`, `qa-celda-garra.mjs`, `qa-existentes.mjs`, `qa-lluvia*.mjs`, `qa-supercap*.mjs`. No confundir `qa-cobot.mjs` antiguo: su reto ya cambió y esperaba resolver sólo con sliders.

## Cómo terminar/verificar el despliegue
1. Ver `git log -3 --oneline` y diferencias en ambos worktrees. No borrar cambios ajenos. La suciedad antigua en cen-deploy era sólo CRLF: se comprobó diff vacío antes de limpiar.
2. En cen-deploy, `npm run deploy:cf`. Ya se lanzó para d59087d. Sólo éxito y Current Version ID confirman publicación. Cloudflare KV error 10000 puede ser transitorio.
3. Login real con `work/login-final/login-real.mjs`, argumentos: ruta del documento privado, URL de producción, carpeta de capturas y nombre de cuenta Sofía Martínez. El script lee la fila en privado; no mostrar el archivo de credenciales. Verifica 160–164 y muestra la lista completa de errores si hay.
4. Comprobar que cada iframe es el slug correcto, que hay 46 destacadas y que no hay errores. Luego actualizar este índice y las fichas con versión y resultado REAL.

## Lecciones de implementación
- `_insignia-auto.js/.css` es el shell común nuevo de 162–164; preserva ficha/puente al prepend de labRoot. Un único reloj, modos, tour, reto, diagnóstico y quiz barajado.
- No romper `window.__labDebug`, `window.__diag3d` ni `_puente.js`.
- `P3.tornilloHex` recibe diccionario `{acero:material}` y opciones `{d,largo}`. Pasar material suelto o `{r,l}` crea tornillos enormes.
- `mergeByMaterial` dispone geometrías: clonar geometrías al fusionar clones que compartían originales.
- El puente necesita validación final manual; no resolver el reto desde el intérprete.
- No volver a ejecutar `crea-supercap.py`: sobrescribe la escena mejorada. Algunos scripts generadores de work son históricos, no fuente actual.

## Plantilla obligatoria para el siguiente cierre
Crear `docs/continuidad/mecanica-N.md` con: estado real y fecha; objetivo y novedad; archivos exactos; modelo y límites; implementación; pruebas con resultado y tamaños; commit y versión publicada si aplica; pendientes y próxima acción. Actualizar este índice, registrar en git y actualizar memoria externa. Si aún no se publica, escribirlo explícitamente y volver a actualizar al publicar.
