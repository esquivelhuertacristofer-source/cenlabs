## Ampliación 3D · 29 de octubre de 2026 · EN REVISIÓN LOCAL

La petición del usuario es reforzar las 50 escenas: considera insuficiente el detalle del 3D publicado. Se añaden **Unidad de alimentación** y **Camisa térmica abierta**, inspeccionables y desmontables. Autoría específica en `src/components/ciencias/escenas/montajes.ts`; integración en `registro.ts`. El desmontaje separa capas o conjuntos del equipo y se restaura al cerrar el inspector; no modifica parámetros, muestras ni resultados científicos. Las piezas pasivas no tienen un control científico ficticio. Ahora también se puede arrastrar directamente el volumen de la pieza científica seleccionada. El inspector reemplaza temporalmente los ajustes del ensayo.

Comprobación geométrica local: 47140 triángulos, 4 piezas semánticas; sin normales nulas ni valores no finitos (auditor `verifica-piezas-ciencias50.mjs`). TypeScript limpio. La validación visual, el rendimiento en navegador y el recorrido completo de esta nueva ampliación están pendientes; **no se considera terminada ni publicada**. La publicación 297f91f/Cloudflare 3cfad647 pertenece a la versión anterior.

Retomar: ejecutar `montajes-ciencias50.mjs quimica-17` en escritorio/móvil, revisar capturas, corregir oclusiones y pruebas; actualizar la ficha con evidencia real antes del commit/despliegue.






### Evidencia de la ampliación (actualización automática)

Desmontaje/restauración correctos en 2/4 tamaños: 1600 px, 390 px. Recorridos completos vigentes: 0/4. La evidencia previa a esta ampliación no se cuenta como prueba nueva. Máximo observado: 67 llamadas de dibujo; 93342 triángulos. Archivos reproducibles: `scripts/auditoria/.salida/montajes50/` y `ciencias50/`. Falta cerrar revisión visual y publicación de esta versión.


# quimica-17 · Reactor continuo: cinética y tiempo de residencia

Estado: **publicado y comprobado** el 29 de octubre de 2026, 9:01 a.m. (Ciudad de México). Código 297f91fa54515c4ffb600b7394b4d06f1d0d6e02; Cloudflare 3cfad647-fa74-4034-8409-94cefbeba58a.

## Resultado y evidencia

Exploración de componentes, aislamiento, corte, mando 3D y revisión temporal en el formato nativo con ficha inicial. Modelo, límites, archivos y cambios propios de esta práctica se conservan en el historial inferior.

Cuatro recorridos completos vigentes: 1366×768, 1600×900, 2020×1055 a DPR 1,25 y 390×844. Incluyen adquisición de 6 s, rechazos, cálculo correcto, quiz, descarga, invalidación y controles 3D. Máximo 74 palabras iniciales; sin errores registrados. Catálogo destacado y portada real final.

Batería final: 50 suites/4219 pruebas correctas. Login real: 50 entradas y 4 completados representativos con lectura de vuelta 10/10 (100%). Evidencia portable: [ciencias50-evidencia.json](ciencias50-evidencia.json).

## Retomar

Mantener las simplificaciones declaradas y la incógnita oculta antes de validar. Editar definición en src/components/ciencias/definiciones/quimica-17.ts, modelo puro en src/domain/ciencias y constructor en escenas. Si cambia comportamiento, elevar la revisión afectada en ciencias50-versiones.mjs y repetir sus pruebas; regenerar guías sólo después de verifica-piezas. No ejecutar el documentador histórico que sobreescribe fichas. Publicar desde cen-deploy conservando voces y confirmar login/guardado.

## Historial de implementación y revisión

Los estados locales o pendientes siguientes describen fases anteriores al cierre confirmado de esta cabecera.

<details><summary>Modelo, archivos, autocrítica y pruebas por laboratorio</summary>

<!-- ciencias50-historial -->
# quimica-17 · Reactor continuo: cinética y tiempo de residencia

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Implementación
Un reactor mezclado convierte reactivos; medir conversión y respuesta a cambios de operación.

Reto: Determina la conversión de estado estacionario de un reactor continuo perfectamente mezclado.

Modelo: V=2 L; reacción A→B de primer orden k=0,20 min⁻¹. τ=V/Q; C∞=Centrada/(1+kτ); X∞=kτ/(1+kτ). Desde C(0)=0: C(t)=C∞[1−exp(−(Q/V+k)t)].

Límites: Reactor isotermo ideal de volumen constante; concentración uniforme, cinética conocida y sin cambios de densidad ni tiempos muertos. La conversión solicitada es estacionaria aunque el registro muestre arranque.

Escala: CSTR en corte · 1 s visual = 2 min

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/quimica-17/; src/components/ciencias/definiciones/quimica-17.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
7001 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

0/4 recorridos finales de revisión 206: pendientes. Sin medición final de prosa todavía. Los informes antiguos se conservan como historial y no se cuentan para el cierre actual.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:42:37.324Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-17-1366-dpr1-informe.json.




QA 2026-10-29T04:24:20.760Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-17-1366-dpr1-informe.json.







QA 2026-10-29T05:33:30.577Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-17-1600-dpr1-informe.json.

QA 2026-10-29T06:59:07.078Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-17-2020-dpr1.25-informe.json.

QA 2026-10-29T07:46:12.116Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-17-390-dpr1-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión6 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 206: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 74 palabras como máximo en estos tamaños.

Cambio geométrico: Accionamiento con aletas, deflectores y cierre del reactor.

Componentes semánticos: Agitador y mezcla; Especie reactiva. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso quimica-17; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 28472 triángulos de geometría. Interacción registrada el 2026-10-29T02:41:11.388Z: 2 componentes, 47 llamadas, 56006 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo74 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

El reactor seccionado muestra agitador, deflectores y contenido; el recorrido temporal corresponde al modelo de mezcla declarado.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/quimica-17-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->

<!-- /ciencias50-historial -->

</details>
