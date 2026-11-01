# Encargo vigente: Mecánica 251–300

## Cierre local del bloque A · actualización prioritaria

251–260 completos y revisados localmente. Firma `951a7a6f10f71813d826a31da4450b98f7089e515f5ed39ddfda07f791feec86`: 40/40 recorridos completos en cuatro tamaños, 5.388 comprobaciones físicas nuevas, regresión física anterior 14.738, regresión del runtime 250, diez barridos oficiales sanos. TypeScript/ESLint correctos; Jest completo 50 suites/4.289 pruebas/12 snapshots, comprobación posterior de voz/briefing 2 suites/34 pruebas. Diez portadas revisadas, 150 clips verificados; 7.555 audios previos preservados. Cierre estricto correcto el 1 de noviembre UTC (31 de octubre local).

Las diez fichas individuales incluyen el estado vigente, límites, pruebas y autocrítica. Evidencia portable en `evidencia-solidos/`. Los procesos de QA anteriores ya terminaron; sus IDs son históricos. No reanudar esas colas por el texto antiguo más abajo.

**Sin push ni despliegue.** Primer permiso aún por solicitar con el lote concreto; construcción de los siguientes 40 autorizada. Siguiente: 261–270, módulo nuevo Elementos de Máquina. Plan interno del workspace: `work/PLAN-ELEMENTOS-261-270.md`. No se han creado todavía esos diez labs. No ejecutar limpieza global del worktree ni tocar las exclusiones previas. El historial posterior de esta ficha identifica el commit del lote.

Fecha: 31-10-2026. El usuario adjuntó un encargo nuevo de 50 prácticas. Sustituye la tarea de ampliar las ciencias: esa ampliación ya está en el historial del repositorio.

## Estado comprobado al iniciar

HEAD `d04db9f`, precedido por `bd61e63` (ampliación de ciencias). Catálogo de partida: 340 prácticas, 250 de Mecánica. Se conservaron 40 modificaciones locales de briefings 211–250 y los archivos ajenos identificados en el encargo. No se confirmó de nuevo la versión de Cloudflare ni se modificó producción.

## Orden de trabajo

1. 251–260: Mecánica de Sólidos.
2. 261–270: Elementos de Máquina, módulo nuevo para distinguir selección de componentes del análisis estructural.
3. 291–300: Mecatrónica.
4. 271–280: Vibraciones y Dinámica de Máquinas.
5. 281–290: Termofluidos y Energía.

Se respeta el temario del adjunto. Los IDs siguen siendo contiguos al cerrar cada lote; antes de entregar 291–300 se debe adaptar expresamente el test de continuidad para la reserva temporal 271–290, sin ocultar huecos accidentales. En el estado actual no existe el rango reservado 127–170 que mencionaba el adjunto: el test exige continuidad completa. No se introdujo una exención innecesaria.

## Primer bloque: implementación y revisión

Se crearon 10 carpetas de laboratorio, descriptores reconstruibles, fichas técnicas y modelos puros SI. Catálogo local: 350 entradas. Son **borradores en revisión**, todavía no una entrega terminada.

Módulos propios: `public/labs/_solidos-{definiciones,modelos,escenas,instrumentos,runtime}.js`. El runtime de órdenes anterior admite ahora inyección de estos módulos y mantiene sus valores por defecto para 241–250. Se añadieron arrastres reales de piezas mediante raycasting; los sliders siguen disponibles. Cada ficha individual registra modelo y limitaciones.

El 256 compara agujero y **filete real de hombro**: se eliminó la primera analogía con elipse. Usa los factores de Roark II-2a y III-1a. Longitudes remotas del filete recortadas en la vista, declarado expresamente. Verificar esa geometría y sus dos ramas de coeficientes antes de cerrar.

## Evidencia disponible y límites

- 5.257 comprobaciones numéricas del bloque: correctas al ejecutar `node scripts/auditoria/verifica-solidos-251-260.mjs`.
- 14.738 comprobaciones de regresión de los modelos 241–250: correctas.
- Goldens: 2 suites, 15 pruebas, 12 snapshots; cinco actualizaciones intencionales. Diff: 110 líneas nuevas de catálogo y 400 de datos, ninguna eliminación; una nueva entrada de módulo en el test.
- Primera apertura 1366 de los diez: sin errores, sin normales nulas, menos de 40 llamadas y 120 palabras. Es una prueba **anterior a los últimos ajustes de geometría y arrastre**, no cierre final.
- Un recorrido 251 completo anterior pasó orden, ensayo, validación, quiz, diagnóstico e informe; hay que repetirlo con el hash vigente.
- Voz natural: lista de 150 clips; 49 textos distintos para clonar con el molde aprobado. Generación en curso al escribir esta ficha; no declarar voz terminada sin comprobar archivos, duración y manifiesto.

El auditor `flujo-solidos-251-260.mjs` conserva hash de los seis módulos del producto, tamaño y si fue recorrido completo. Admite `QA_START`, `QA_END`, `QA_SIZE='1366,768,1'`, `--solo`, `--inspeccion` y `--reanudar`. Ejecutar **hasta cinco IDs y un tamaño por proceso**, un navegador a la vez. No ejecutar Jest simultáneamente. Salida: `scripts/auditoria/.salida/solidos-251-260/`.

## Pendientes reales

Terminar revisión visual e interacción de 251–260, probar extremos de mandos y sincronía, cuatro tamaños y calidad media, generar y revisar diez portadas. Terminar voces naturales y actualizar manifiesto. Ejecutar TypeScript, ESLint y Jest completo de forma aislada. Registrar por laboratorio la autocrítica y evidencia vigente antes de darlo por terminado.

261–300: no implementados. No contarlos en el catálogo ni como avances terminados.

## Publicación

Sin commit, push ni despliegue de esta tanda. El usuario exige **confirmación antes del primer push y despliegue**. Preparar antes un lote concreto, verificable y documentado. No solicitar esa confirmación mientras falte QA. Después, un despliegue por lote completo, con voces preservadas, login real, iframes y portadas sin 404.

La instrucción del adjunto de no marcar nuevas destacadas prevalece sobre el documento antiguo: las nuevas entradas no llevan `destacada: true`; se mantienen las cuatro tarjetas seleccionadas por pilar.

## Seguridad del trabajo existente

No `git add .`, `reset --hard`, `clean` ni limpieza del worktree de despliegue sin revisar sus cambios actuales. Los comandos destructivos sugeridos en el adjunto no se ejecutan automáticamente. No imprimir credenciales ni tocar archivos de secretos. Identificar procesos por comando actual antes de terminarlos.

## Corte actual de sincronía y QA

Firma vigente: 951a7a6f10f71813d826a31da4450b98f7089e515f5ed39ddfda07f791feec86. Se corrigieron el sentido tangencial de Mohr, la colisión del campo t con el reloj en el recipiente, la sincronía del extensómetro y el signo de las fibras de flexión. El auditor comprueba Cauchy y espesores/longitudes de mallas contra el modelo. Física actual: 5.388 comprobaciones correctas. Las pruebas con firmas anteriores son historial: completar de nuevo los40 casos con la firma vigente antes de cerrar. Jest completo50/4289/12 correcto; TypeScript y ESLint correctos.150 clips de voz instalados y verificados, manifiesto166→176 con sólo diez adiciones. Sin commit, push ni publicación; portadas pendientes.
