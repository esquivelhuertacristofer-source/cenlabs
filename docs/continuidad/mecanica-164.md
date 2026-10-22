# mecanica-164 · Celda robotizada: garra, bloques y pulido

## Estado al cierre
Implementado y registrado como destacado. Código en `main`, commit `d59087d`.
Despliegue de este lote en curso; consultar `README.md` para el resultado confirmado.

## Qué se hizo
Laboratorio nuevo y ampliado por petición expresa del usuario: garra paralela que recoge/coloca una pieza, entrada, soporte, salida, cambiador de herramienta y pulido. Editor por bloques con mover, garra, herramienta, pulir, esperar, repetir, condición si tiene pieza y fin de grupo. Arrastre, flechas, borrado y persistencia local. Ejecución real sobre el brazo con cinemática inversa.

## Archivos para retomar
- Simulador: `public/labs/brazo-colaborativo-control-fuerza.html`.
- Ficha: `public/labs/_ficha-brazo-colaborativo-control-fuerza.js`.
- Registro y contenido: `src/labs/mecanica-164/index.ts`, `catalogo.ts`, `briefing.ts`.
- Briefing generado: `public/labs-data/briefing/mecanica-164.json`.
- Auditoría: `node scripts/auditoria/verifica-brazo-colaborativo-control-fuerza.mjs`.

- Módulo del editor: `public/labs/_programa-celda.js`.
- Auditoría adicional: `node scripts/auditoria/verifica-programa-celda.mjs`.

## Verificación realizada
45304 comprobaciones del contacto e IK/FK. Auditoría del compilador: cierres, anidamiento, límite de 40 bloques, agarre y trayectoria quíntica. Ciclo íntegro programado mediante UI en escritorio y móvil, condición y repetición, error por agarre insuficiente, error de sintaxis, validación y quiz. Cero errores propios y normales nulas. Revisión visual en cuatro tamaños; actor ~65–66 %.

## Decisiones y límites que deben conservarse
El módulo _programa-celda.js amplía _insignia-auto.js. El reloj S.t gobierna tanto contacto como secuencia; tiempo de movimiento = S.t × 5 por la cámara lenta del contacto. Pieza de 2,5 kg, μ=0,45, capacidad 2 μ N (N por mordaza); se compara con m|a+g| en traslados quínticos. Una sujeción insuficiente detiene la simulación: no simula caída. Tool change idealizado en un punto de acoplamiento. No es un controlador de seis ejes ni certificación. Reto: programa completo hasta salida y los tres criterios de contacto. Mantener manual la validación final. Ventana interior usada sólo en QA: K=1100, B=80; no regalarla al alumno.

## Pendiente y siguiente acción
Confirmar la versión de Cloudflare y el login real del lote. Sin narración nueva ni portada generada en este sprint. No considerar pendientes esas funciones como implementadas. Después, continuar con temas nuevos desde mecanica-165, buscando duplicados primero.
