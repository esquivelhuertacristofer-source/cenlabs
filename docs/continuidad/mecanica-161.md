# mecanica-161 · Faros matriciales adaptativos

## Estado al cierre
Implementado y registrado como destacado. Código en `main`, commit `d59087d`.
Despliegue de este lote en curso; consultar `README.md` para el resultado confirmado.

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
Confirmar la versión de Cloudflare y el login real del lote. Sin narración nueva ni portada generada en este sprint. No considerar pendientes esas funciones como implementadas. Después, continuar con temas nuevos desde mecanica-165, buscando duplicados primero.
