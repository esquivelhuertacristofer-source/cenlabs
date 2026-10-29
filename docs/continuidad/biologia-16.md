# biologia-16 · Mecánica pulmonar y ventilación

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Implementación
Un pulmón se expande; relacionar presión, volumen, resistencia y distensibilidad en un modelo educativo.

Reto: Calcula la constante temporal RC del compartimento y relaciona su valor con el llenado y vaciado registrados.

Modelo: Modelo lineal R·dV/dt+V/C=P, P=10 cmH2O en inspiración y 0 en espiración; ambas duran 2 s. a=exp[−2/(RC)]; Vpico=CP/(1+a). Inicio inspiratorio V0=aVpico. C se convierte de mL a L por cmH2O; R en cmH2O·s/L. Constante temporal τ=RC en segundos.

Límites: Un compartimento pasivo educativo con presión impuesta y sin esfuerzo muscular, histéresis, gasometría ni decisiones clínicas. La geometría pulmonar es esquemática y el volumen se amplifica.

Escala: Pulmón educativo RC · inspiración/espiración de 2 s

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/biologia-16/; src/components/ciencias/definiciones/biologia-16.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
6502 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

1/4 recorridos finales de revisión 206: 1366px / DPR1. Prosa inicial medida: 61 palabras como máximo en estos tamaños. Los informes antiguos se conservan como historial y no se cuentan para el cierre actual.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:15:20.439Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-16-1366-dpr1-informe.json.

QA 2026-10-28T22:54:14.621Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-16-1600-dpr1-informe.json.

QA 2026-10-29T03:06:15.119Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-16-1600-dpr1-informe.json.

QA 2026-10-29T03:07:31.512Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-16-390-dpr1-informe.json.


QA 2026-10-29T03:52:31.198Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-16-1366-dpr1-informe.json.





QA 2026-10-29T04:36:11.846Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-16-1600-dpr1-informe.json.





QA 2026-10-29T05:50:42.332Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-16-2020-dpr1.25-informe.json.

QA 2026-10-29T07:17:34.266Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-16-390-dpr1-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión6 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 206: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 76 palabras como máximo en estos tamaños.

Cambio geométrico: Acinos representativos dentro de las masas pulmonares.

Componentes semánticos: Pulmón y distensibilidad; Vías aéreas; Diafragma. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso biologia-16; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 53256 triángulos de geometría. Interacción registrada el 2026-10-29T02:23:11.937Z: 3 componentes, 16 llamadas, 53260 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo76 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

Los pulmones translúcidos muestran árbol bronquial y acinos; la anatomía es esquemática y la distensión se amplifica.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/biologia-16-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->
