# quimica-24 · Diagramas de fases y solidificación de aleaciones

Estado: **publicado y comprobado** el 29 de octubre de 2026, 9:01 a.m. (Ciudad de México). Código 297f91fa54515c4ffb600b7394b4d06f1d0d6e02; Cloudflare 3cfad647-fa74-4034-8409-94cefbeba58a.

## Resultado y evidencia

Exploración de componentes, aislamiento, corte, mando 3D y revisión temporal en el formato nativo con ficha inicial. Modelo, límites, archivos y cambios propios de esta práctica se conservan en el historial inferior.

Cuatro recorridos completos vigentes: 1366×768, 1600×900, 2020×1055 a DPR 1,25 y 390×844. Incluyen adquisición de 6 s, rechazos, cálculo correcto, quiz, descarga, invalidación y controles 3D. Máximo 79 palabras iniciales; sin errores registrados. Catálogo destacado y portada real final.

Batería final: 50 suites/4219 pruebas correctas. Login real: 50 entradas y 4 completados representativos con lectura de vuelta 10/10 (100%). Evidencia portable: [ciencias50-evidencia.json](ciencias50-evidencia.json).

## Retomar

Mantener las simplificaciones declaradas y la incógnita oculta antes de validar. Editar definición en src/components/ciencias/definiciones/quimica-24.ts, modelo puro en src/domain/ciencias y constructor en escenas. Si cambia comportamiento, elevar la revisión afectada en ciencias50-versiones.mjs y repetir sus pruebas; regenerar guías sólo después de verifica-piezas. No ejecutar el documentador histórico que sobreescribe fichas. Publicar desde cen-deploy conservando voces y confirmar login/guardado.

## Historial de implementación y revisión

Los estados locales o pendientes siguientes describen fases anteriores al cierre confirmado de esta cabecera.

<details><summary>Modelo, archivos, autocrítica y pruebas por laboratorio</summary>

<!-- ciencias50-historial -->
# quimica-24 · Diagramas de fases y solidificación de aleaciones

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Implementación
Una muestra cambia de fases al enfriarse; aplicar balances y regla de la palanca.

Reto: Aplica la regla de la palanca y calcula la fracción másica sólida de la aleación.

Modelo: Diagrama binario isomorfo sintético: Tsolidus=1000−4C, Tliquidus=1000−2C, T en °C y C en %B. A T fija: Cα=(1000−T)/4 y CL=(1000−T)/2. fs=(CL−C0)/(CL−Cα), limitada a [0,1].

Límites: Sistema docente, no diagrama medido de una aleación comercial. Equilibrio local, densidades iguales para representar volúmenes, sin segregación, sobreenfriamiento ni cinética de granos.

Escala: Muestra metalográfica ampliada · diagrama binario sintético

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/quimica-24/; src/components/ciencias/definiciones/quimica-24.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
5501 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

Geometría pendiente.

Flujos completos guardados: 0. Cada flujo exige ficha, rechazos sin registro y con respuesta errónea, adquisición, resultado, quiz, descarga, calidad e invalidación. Un informe inicial no cuenta como recorrido completo.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:48:12.757Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-24-1366-dpr1-informe.json.





QA 2026-10-29T04:30:12.255Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-24-1366-dpr1-informe.json.






QA 2026-10-29T05:40:25.159Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-24-1600-dpr1-informe.json.

QA 2026-10-29T07:12:25.897Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-24-2020-dpr1.25-informe.json.

QA 2026-10-29T07:51:45.630Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-24-390-dpr1-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión7 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 207: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 79 palabras como máximo en estos tamaños.

Cambio geométrico: Crisol refractario abierto en sección y sonda de proceso.

Componentes semánticos: Fase líquida; Granos de fase sólida. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso quimica-24; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 8028 triángulos de geometría. Interacción registrada el 2026-10-29T02:51:42.576Z: 2 componentes, 15 llamadas, 8032 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo79 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

Los granos facetados y el crisol en sección aportan lectura metalográfica; no se presenta la microestructura como una simulación atomística.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/quimica-24-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->

<!-- /ciencias50-historial -->

</details>
