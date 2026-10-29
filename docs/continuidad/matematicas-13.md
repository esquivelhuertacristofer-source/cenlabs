# matematicas-13 · Programación lineal: optimizar una mezcla de producción

Estado: **publicado y comprobado** el 29 de octubre de 2026, 9:01 a.m. (Ciudad de México). Código 297f91fa54515c4ffb600b7394b4d06f1d0d6e02; Cloudflare 3cfad647-fa74-4034-8409-94cefbeba58a.

## Resultado y evidencia

Exploración de componentes, aislamiento, corte, mando 3D y revisión temporal en el formato nativo con ficha inicial. Modelo, límites, archivos y cambios propios de esta práctica se conservan en el historial inferior.

Cuatro recorridos completos vigentes: 1366×768, 1600×900, 2020×1055 a DPR 1,25 y 390×844. Incluyen adquisición de 6 s, rechazos, cálculo correcto, quiz, descarga, invalidación y controles 3D. Máximo 67 palabras iniciales; sin errores registrados. Catálogo destacado y portada real final.

Batería final: 50 suites/4219 pruebas correctas. Login real: 50 entradas y 4 completados representativos con lectura de vuelta 10/10 (100%). Evidencia portable: [ciencias50-evidencia.json](ciencias50-evidencia.json).

## Retomar

Mantener las simplificaciones declaradas y la incógnita oculta antes de validar. Editar definición en src/components/ciencias/definiciones/matematicas-13.ts, modelo puro en src/domain/ciencias y constructor en escenas. Si cambia comportamiento, elevar la revisión afectada en ciencias50-versiones.mjs y repetir sus pruebas; regenerar guías sólo después de verifica-piezas. No ejecutar el documentador histórico que sobreescribe fichas. Publicar desde cen-deploy conservando voces y confirmar login/guardado.

## Historial de implementación y revisión

Los estados locales o pendientes siguientes describen fases anteriores al cierre confirmado de esta cabecera.

<details><summary>Modelo, archivos, autocrítica y pruebas por laboratorio</summary>

<!-- ciencias50-historial -->
# matematicas-13 · Programación lineal: optimizar una mezcla de producción

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Implementación
Tanques y restricciones de suministro; identificar región factible y solución económica.

Reto: Calcula la ganancia máxima factible de dos productos bajo las restricciones de recursos.

Modelo: x,y≥0; 2x+y≤R; x+2y≤R. Ganancia G=cx+30y. Evaluar vértices (0,0),(R/2,0),(R/3,R/3),(0,R/2).

Límites: Variables continuas, producción divisible y coeficientes deterministas; no programación entera, tiempos de cambio, incertidumbre ni un plan real de fábrica.

Escala: Mezcla de producción · región factible sin cifras 3D

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/matematicas-13/; src/components/ciencias/definiciones/matematicas-13.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
5002 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

0/4 recorridos finales de revisión 206: pendientes. Sin medición final de prosa todavía. Los informes antiguos se conservan como historial y no se cuentan para el cierre actual.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:29:47.439Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-13-1366-dpr1-informe.json.



QA 2026-10-29T04:11:24.009Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-13-1366-dpr1-informe.json.





QA 2026-10-29T04:54:44.949Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-13-1600-dpr1-informe.json.




QA 2026-10-29T06:29:18.217Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-13-2020-dpr1.25-informe.json.

QA 2026-10-29T07:33:15.070Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-13-390-dpr1-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión6 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 206: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 67 palabras como máximo en estos tamaños.

Cambio geométrico: Conexiones y válvulas de las dos líneas de producto.

Componentes semánticos: Producto A; Producto B. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso matematicas-13; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 15436 triángulos de geometría. Interacción registrada el 2026-10-29T02:34:27.749Z: 2 componentes, 31 llamadas, 29438 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo67 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

Los dos depósitos y las líneas de producto aportan un contexto de mezcla; la región factible y los resultados se leen en los instrumentos DOM.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/matematicas-13-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->

<!-- /ciencias50-historial -->

</details>
