# fisica-16 · Conducción térmica multicapa y resistencias de contacto

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Implementación
Un sándwich de materiales se calienta; comparar flujo y saltos de temperatura en interfaces.

Reto: Calcula el flujo térmico por unidad de área a través de las dos capas en serie.

Modelo: q″=(80−20)/(L1/k1+L2/k2); L2=0,040 m, k2=0,12 W/(m·K). Tinterfaz=80−q″L1/k1.

Límites: Régimen estacionario 1D; propiedades constantes, contacto perfecto y caras a temperatura impuesta. Sin convección lateral ni puentes térmicos.

Escala: Pared multicapa en corte · temperaturas de 20 a 80 °C

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/fisica-16/; src/components/ciencias/definiciones/fisica-16.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
7001 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

1/4 recorridos finales de revisión 206: 1366px / DPR1. Prosa inicial medida: 59 palabras como máximo en estos tamaños. Los informes antiguos se conservan como historial y no se cuentan para el cierre actual.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:22:16.922Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-16-1366-dpr1-informe.json.

QA 2026-10-28T23:02:34.347Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-16-1600-dpr1-informe.json.


QA 2026-10-29T04:01:51.906Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-16-1366-dpr1-informe.json.





QA 2026-10-29T04:45:16.561Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-16-1600-dpr1-informe.json.





QA 2026-10-29T06:07:52.512Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-16-2020-dpr1.25-informe.json.

QA 2026-10-29T07:25:20.037Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-16-390-dpr1-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión6 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 206: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 75 palabras como máximo en estos tamaños.

Cambio geométrico: Aletas y sondas de las caras caliente y fría.

Componentes semánticos: Primera capa; Segunda capa. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso fisica-16; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 14668 triángulos de geometría. Interacción registrada el 2026-10-29T02:30:34.632Z: 2 componentes, 16 llamadas, 14672 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo75 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

Las capas en sección y las sondas permiten comparar el gradiente térmico; el banco conserva una geometría técnica simple y legible.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/fisica-16-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->
