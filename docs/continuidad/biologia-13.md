# biologia-13 · PCR con ADN patrón

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Implementación
Un termociclador y una vista molecular; comprender amplificación y evaluar controles.

Reto: Calcula el mínimo de ciclos necesarios para alcanzar 10⁷ copias y contrasta si el registro alcanza esa meta.

Modelo: Nn=N0(1+E)^n, N0=100 copias, E=eficiencia/100. Cada ciclo ilustra desnaturalización 95 °C, alineamiento 60 °C y extensión 72 °C; el reloj comprime todos los ciclos en 6 s. Control negativo ideal sin plantilla: cero copias.

Límites: ADN patrón virtual sin secuencia ni organismo, eficiencia constante y fase exponencial sin agotamiento. No es protocolo de laboratorio ni interpretación diagnóstica. Las temperaturas son un esquema educativo.

Escala: Termociclador y ADN patrón · ciclo completo comprimido

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/biologia-13/; src/components/ciencias/definiciones/biologia-13.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
6502 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

1/4 recorridos finales de revisión 206: 1366px / DPR1. Prosa inicial medida: 60 palabras como máximo en estos tamaños. Los informes antiguos se conservan como historial y no se cuentan para el cierre actual.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:12:53.748Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-13-1366-dpr1-informe.json.

QA 2026-10-28T22:51:18.823Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-13-1600-dpr1-informe.json.


QA 2026-10-29T03:41:03.297Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-13-1366-dpr1-informe.json.

QA 2026-10-29T03:49:50.028Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-13-1366-dpr1-informe.json.





QA 2026-10-29T04:33:22.199Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-13-1600-dpr1-informe.json.





QA 2026-10-29T05:45:30.861Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-13-2020-dpr1.25-informe.json.

QA 2026-10-29T07:15:07.479Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-13-390-dpr1-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión6 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 206: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 75 palabras como máximo en estos tamaños.

Cambio geométrico: Bisagras y ventilación del termociclador.

Componentes semánticos: Bloque del termociclador; ADN en amplificación. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso biologia-13; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 50872 triángulos de geometría. Interacción registrada el 2026-10-29T02:25:45.556Z: 2 componentes, 72 llamadas, 80246 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo75 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

La tapa elevada, la placa de pocillos y las bisagras identifican el termociclador sin añadir un monitor con cifras dentro del3D.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/biologia-13-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->
