# mecanica-162 · Sensor óptico de lluvia

## Estado al cierre
Implementado y registrado como destacado. Código en `main`, commit `d59087d`.
Publicado en Cloudflare, versión `f2d4cb06-fb32-4030-99e5-9fa920268d0e`. Login real confirmado: iframe del slug correcto. Hub con 46 destacadas y consola sin errores. Código publicado: `d59087d`; los commits posteriores sólo documentan continuidad.

## Qué se hizo
Laboratorio nuevo: reflexión interna, Snell/Fresnel, cobertura de gotas y acumulación para controlar el barrido. Escena detallada de parabrisas y sensor en corte. Reto, diagnóstico, quiz y ficha.

## Archivos para retomar
- Simulador: `public/labs/sensor-lluvia-optico.html`.
- Ficha: `public/labs/_ficha-sensor-lluvia-optico.js`.
- Registro y contenido: `src/labs/mecanica-162/index.ts`, `catalogo.ts`, `briefing.ts`.
- Briefing generado: `public/labs-data/briefing/mecanica-162.json`.
- Auditoría: `node scripts/auditoria/verifica-sensor-lluvia-optico.mjs`.


## Verificación realizada
2462 comprobaciones físicas. Flujo con clics en 1366×768, 1600×900, 2020×1055 DPR 1,25 y 390×844. Sin errores propios, normales nulas ni desbordamiento; actor aproximadamente 65 % del lienzo.

## Decisiones y límites que deben conservarse
Fuente del principio: Hella Techworld. Conservar el balance óptico y la acumulación exacta; no sustituirlos por números decorativos.

## Pendiente y siguiente acción
Despliegue y login real cerrados. Sin narración nueva ni portada generada en este sprint. No considerar pendientes esas funciones como implementadas. Actualización24-10:165 y166 están ocupados;167–176 es la nueva tanda. Consultar README.md antes de asignar otro ID.
