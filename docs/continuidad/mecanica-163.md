# mecanica-163 · Supercapacitores de potencia y frenado

## Estado al cierre
Implementado y registrado como destacado. Código en `main`, commit `d59087d`.
Publicado en Cloudflare, versión `f2d4cb06-fb32-4030-99e5-9fa920268d0e`. Login real confirmado: iframe del slug correcto. Hub con 46 destacadas y consola sin errores. Código publicado: `d59087d`; los commits posteriores sólo documentan continuidad.

## Qué se hizo
Laboratorio nuevo: banco de ramas en paralelo, carga/descarga a corriente constante y pérdidas ESR. Rediseñado tras rechazo visual del usuario: carcasa automotriz, barras, contactores, conectores HV, placa de control y celda bobinada en corte; 360 celdas en el caso de tres ramas.

## Archivos para retomar
- Simulador: `public/labs/supercapacitores-potencia-frenado.html`.
- Ficha: `public/labs/_ficha-supercapacitores-potencia-frenado.js`.
- Registro y contenido: `src/labs/mecanica-163/index.ts`, `catalogo.ts`, `briefing.ts`.
- Briefing generado: `public/labs-data/briefing/mecanica-163.json`.
- Auditoría: `node scripts/auditoria/verifica-supercapacitores-potencia-frenado.mjs`.


## Verificación realizada
6681 comprobaciones de carga/descarga y balance energético. Flujos completos en cuatro tamaños. Banco aproximadamente 36 llamadas de dibujo, celda 12; actor ~65 %, sin errores ni desbordamiento.

## Decisiones y límites que deben conservarse
Datos de referencia de celda Eaton 3000 F / 2,7 V / ESR 0,23 mΩ. Caso de control de auditoría: tres ramas y 250 V. No revelar esa solución en la interfaz antes de validar.

## Pendiente y siguiente acción
Despliegue y login real cerrados. Sin narración nueva ni portada generada en este sprint. No considerar pendientes esas funciones como implementadas. Actualización24-10:165 y166 están ocupados;167–176 es la nueva tanda. Consultar README.md antes de asignar otro ID.
