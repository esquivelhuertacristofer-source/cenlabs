# Pausa solicitada por el usuario ·24-10-2026

**TRABAJO DETENIDO por petición expresa. No continuar automáticamente.**
El encargo de llegar a200 sigue vigente para cuando el usuario lo retome. Responder siempre en español, trabajar sin agentes. Priorizar escenas visuales y competencias profesionales para autotrónica, mecatrónica y automovilidad. Documentar cada cierre antes del siguiente.

## Publicado y confirmado
-177–186 terminados y publicados. Código cbf27e8 en main/origin.
-Cloudflare461e43b5-cf37-4bd5-82a6-8a436cde3779, deploy exit0.
-Login real:68 destacadas; iframes165/166 y177–186 correctos; portadas200; normales cero=0 y consola limpia.
-6003 comprobaciones numéricas;40 flujos completos en cuatro tamaños;44 suites,3048 pruebas,12 snapshots correctos. TypeScript/ESLint y10/10 sin red.

## Implementado pero NO terminado ni publicado
-187–200 existen en código local:14 temas nuevos. Faltan cierre visual, QA restante, portadas, barrido sin red, cierre global y publicación.
-Módulos: public/labs/_taller-modelos.js, _taller-definiciones.js, _taller-escenas.js, _taller-runtime.js, _taller-instrumentos.js. EntradasHTML/fichas; src/labs/mecanica-187..200; descriptores y briefings.
-7730 comprobaciones numéricas correctas (incluye retención de lectura del aislamiento).
-QA:14 recorridos completos guardados, todos1366×768. Faltan1600×900,2020×1055 DPR1,25 y390×844:42 recorridos. El script actualiza cada ficha al terminar cada recorrido.
-Las últimas mejoras visuales y de instrumento entraron durante la QA: reabrir también187/188/190 a1366 y la inspección centrada del200. No afirmar que todos los cambios finales se probaron en todos los tamaños.
-TypeScript y ESLint de las14 altas pasaron. Goldens pasaron tras añadir las14 entradas; luego se amplió el límite de la ficha193: regenerar y revisar sus snapshots pertinentes antes del cierre. Diff previsto:168 líneas de catálogo y588 de data-stores, sólo14 entradas.
-Jest global de este lote se INTERRUMPIÓ por la pausa del usuario antes del resumen final; hay suites PASS en work/jest-hasta-200.log, pero NO declarar suite global aprobada. La suite completa confirmada es la anterior de3048 pruebas.
-El flujo reanudable corregía un decimal de Playwright: redondear previous+step a6 decimales; no era fallo del simulador.

## Punto exacto para retomar
1. Leer AGENTS.md y docs/continuidad/README.md, revisar git status y este informe. No ejecutar generadores históricos a ciegas.
2. Auditoría: node scripts/auditoria/verifica-taller-187-200.mjs.
3. QA: node scripts/auditoria/flujo-taller-187-200.mjs --inspeccion --reanudar. Lee .salida/taller-187-200/informe.json y omite combinaciones ya guardadas. Un solo navegador; cerrar en finally.
4. Repetir el escritorio de las mejoras finales mediante --solo N, guardando el informe acumulado ANTES: una ejecución sin --reanudar sobrescribe informe.json. También se puede retirar sólo la fila a repetir del JSON y reanudar.
5. Revisar capturas, móvil sin scroll, reto, diagnóstico, pregunta, informe descargado y caducidad del ensayo. El instrumento debe usar record.result.metrics, no la hora actual; la inspección del200 centra el mismo robot móvil.
6. node scripts/portadas/capturar-taller.mjs; revisar14 portadas de escenas propias. Todavía NO existen.
7. Barrido sin red por los14 slugs. Generados,tsc,ESLint, goldens revisados y Jest completo. No repetir una suite aprobada sin nuevos cambios relevantes.
8. Actualizar CADA ficha, índice y memoria. Commit de archivos propios; push/deploy autorizados previamente. Sólo llamar publicado después de deploy exit0+versión+login real, con82 destacadas e iframes187–200 exactos.

## Estado de herramientas al pausar
-Se interrumpieron con Ctrl+C los procesos propios de QA28839 y Jest33343. No dejar tests avanzando tras la pausa. Preview local anterior puede seguir abierto, es sólo lectura.
-No hay agentes ni automaciones activos creados para este encargo.
-Preservar docs/RELEVO-SPRINT-INSIGNIA.md y scripts/_col.mjs heredados. scripts/auditoria/.qa-inspeccion.mjs es auxiliar local del lote177, no forma parte del entregable.
-No imprimir contraseñas. docs/CREDENCIALES-PILOTO-001.md sólo puede leerlo el script privado de login. No tocar ENTREGA_CREDENTIALS.md.

## Límites científicos relevantes
-187 TCP planar, no calibración industrial de6 parámetros;188 óptica paraxial;189 PD ideal sin saturación aplicada;190 RC virtual con lectura retenida y tiempo×5.
-191 precargaRC con contactor lógico, sin arco ni transitorio principal;192 canales de resolver demodulados;193 ultrasonido normal con sección ampliada;194 respuesta sintética de grieta, no FEM/NDT certificado.
-195 unión elástica equivalente;196 triangulación paraxial con descentrado equivalente;197 fuga constante y deriva térmica sintética, partículas ilustrativas;198 alineación vertical con desviación ampliada×100.
-199 balance gris de radiación total, no cámara espectral real;200 odometría ideal sin deslizamiento,SLAM ni navegación de seguridad. Las fichas explicitan estas limitaciones.

## Inventario nuevo187–200

- 187 · Calibración del TCP de un robot — calibracion-tcp-robot
- 188 · Selección óptica de visión industrial — banco-optica-vision-industrial
- 189 · Sintonía de un servoeje PD — sintonia-servoeje-pd
- 190 · Ensayo virtual de aislamiento de motor — ensayo-aislamiento-motor
- 191 · Puesta en servicio de precarga HV — puesta-servicio-precarga-hv
- 192 · Calibración de resolver de tracción — calibracion-resolver-traccion
- 193 · Ultrasonido para espesor y corrosión — ultrasonido-espesor-corrosion
- 194 · Inspección por corrientes inducidas — corrientes-inducidas-inspeccion
- 195 · Apriete controlado por par y ángulo — apriete-control-par-angulo
- 196 · Ajuste de un sensor láser de triangulación — sensor-laser-triangulacion
- 197 · Ensayo de estanqueidad por caída de presión — estanqueidad-caida-presion
- 198 · Alineación láser de maquinaria — alineacion-laser-maquinaria
- 199 · Termografía de un cuadro eléctrico — termografia-cuadro-electrico
- 200 · Robot AMR: calibración y regreso al muelle — robot-amr-calibracion-odometria
