# mecanica-166 · Robot de seis ejes

## Estado comprobado al retomar, 24-10-2026
Trabajo añadido por otra IA tras el lote 160–164: commit 64920ba, después 0ec9588, 58bcf7a, cccc71a y 860b2e5. Repo main y origin/main coinciden en 860b2e5 después de fetch. No atribuir este trabajo a la nueva tanda.

## Archivos
`public/labs/robot-6-ejes-cinematica-alcance.html`, `_ficha-robot-6-ejes-cinematica-alcance.js`, `src/labs/mecanica-166/` y `scripts/auditoria/verifica-robot-6-ejes-cinematica-alcance.mjs`.

## Cambios que deben conservarse
Robot industrial de GLB real agrupado en articulaciones. Mazo de cables que se deforma con el hombro, topes articulares y rechazo de choques con columna/suelo. Los mandos de posición se detienen en la última postura alcanzable. No sustituir por la cinemática simplificada de otra práctica ni eliminar los controles de colisión.

## Verificación
Reejecutada la auditoría numérica el 24-10-2026: 128/128 comprobaciones correctas. Los flujos anteriores reportados en git fueron 40/40 para165 y16/16 para166; esos flujos NO se han reejecutado al escribir esta ficha. Actualización: login del nuevo lote confirmado el24-10; iframe propio y normales cero=0. Ambos están incluidos sin modificar sus fuentes en la versión actual `9ed4dadb-f6c5-4322-9c42-e058b45641cb` (código375bca2). No atribuir esta versión al despliegue histórico original de165/166.

## Punto de continuidad
Ambos IDs están ocupados. El nuevo encargo de diez laboratorios usa167–176. Revisar índices de docs/continuidad, sin sobrescribir el robot ni scripts/_col.mjs (archivo heredado sin seguimiento).
