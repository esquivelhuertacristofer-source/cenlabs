# mecanica-161 · Faros matriciales adaptativos

## Estado al cierre
Implementado y registrado como destacado. Código en `main`, commit `d59087d`.
Publicado en Cloudflare, versión `f2d4cb06-fb32-4030-99e5-9fa920268d0e`. Login real confirmado: iframe del slug correcto. Hub con 46 destacadas y consola sin errores. Código publicado: `d59087d`; los commits posteriores sólo documentan continuidad.

## Qué se hizo
Integrado el laboratorio heredado. Corregida una carrera al ajustar/validar: se recalcula inmediatamente el estado y se actualiza la máscara de luz para que el dato oculto no reaparezca. El verificador normaliza CRLF.

## Archivos para retomar
- Simulador: `public/labs/faros-matriciales-adaptativos.html`.
- Ficha: `public/labs/_ficha-faros-matriciales-adaptativos.js`.
- Registro y contenido: `src/labs/mecanica-161/index.ts`, `catalogo.ts`, `briefing.ts`.
- Briefing generado: `public/labs-data/briefing/mecanica-161.json`.
- Auditoría: `node scripts/auditoria/verifica-faros-matriciales-adaptativos.mjs`.


## Verificación realizada
1163 comprobaciones numéricas; 30/30 acciones del flujo de navegador después de corregir la carrera.

## Decisiones y límites que deben conservarse
No reintroducir el estado óptico anterior durante reiniciaCalculo: SIM.e, pintaDock, pintaOjoLx y opacidad de HALO se actualizan de forma síncrona.

## Pendiente y siguiente acción
Despliegue y login real cerrados. Sin narración nueva ni portada generada en este sprint. No considerar pendientes esas funciones como implementadas. Actualización24-10:165 y166 están ocupados;167–176 es la nueva tanda. Consultar README.md antes de asignar otro ID.
