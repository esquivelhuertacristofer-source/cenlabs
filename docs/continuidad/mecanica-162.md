# mecanica-162 · Sensor óptico de lluvia

## Estado al cierre
Implementado y registrado como destacado. Código en `main`, commit `d59087d`.
Despliegue de este lote en curso; consultar `README.md` para el resultado confirmado.

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
Confirmar la versión de Cloudflare y el login real del lote. Sin narración nueva ni portada generada en este sprint. No considerar pendientes esas funciones como implementadas. Después, continuar con temas nuevos desde mecanica-165, buscando duplicados primero.
