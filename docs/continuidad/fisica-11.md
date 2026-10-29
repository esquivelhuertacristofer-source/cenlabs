# fisica-11 · Ondas en una cuerda: reflexión y transmisión

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Implementación
Pulsos que se reflejan al cambiar de medio; medir velocidades y reparto de energía.

Reto: Calcula el porcentaje de energía reflejada en la unión de dos cuerdas bajo la misma tensión.

Modelo: μ1=0,003 kg/m, μ2=razón·μ1; ci=√(T/μi), Zi=√(Tμi). r=(Z1−Z2)/(Z1+Z2), tA=1+r. R=r² y Tenergía=1−R. Pulsos gaussianos de desplazamiento; el ancho transmitido escala c2/c1 para conservar duración.

Límites: Cuerdas ideales semiinfinitas con unión puntual, pequeña amplitud, sin pérdidas ni rigidez. Se muestra una ventana espacial y un tren de pulsos sin reflejos en sus límites externos.

Escala: Pulsos en unión · tiempo ×1/220 · amplitud ampliada

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/fisica-11/; src/components/ciencias/definiciones/fisica-11.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
8002 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

1/4 recorridos finales de revisión 206: 1366px / DPR1. Prosa inicial medida: 61 palabras como máximo en estos tamaños. Los informes antiguos se conservan como historial y no se cuentan para el cierre actual.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:18:51.637Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-11-1366-dpr1-informe.json.

QA 2026-10-28T22:58:27.456Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-11-1600-dpr1-informe.json.


QA 2026-10-29T03:57:09.999Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-11-1366-dpr1-informe.json.





QA 2026-10-29T04:40:23.045Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-11-1600-dpr1-informe.json.





QA 2026-10-29T05:57:46.225Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-11-2020-dpr1.25-informe.json.

QA 2026-10-29T07:21:18.187Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-11-390-dpr1-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión6 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 206: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 77 palabras como máximo en estos tamaños.

Cambio geométrico: Poleas con apoyos y radios; accionamiento del excitador.

Componentes semánticos: Tramos de cuerda; Unión entre medios. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso fisica-11; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 20168 triángulos de geometría. Interacción registrada el 2026-10-29T02:28:42.247Z: 2 componentes, 17 llamadas, 20012 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo77 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

El banco, las poleas y la cuerda mantienen una silueta clara; la onda responde al mismo modelo de tensión y transmisión.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/fisica-11-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->
