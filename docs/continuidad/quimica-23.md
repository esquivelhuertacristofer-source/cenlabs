# quimica-23 · Adsorción en carbón activado: ruptura de un lecho

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Implementación
Un frente avanza por una columna; interpretar saturación y concentración de salida.

Reto: Estima el tiempo central de ruptura del lecho a partir de capacidad y carga de alimentación.

Modelo: Capacidad q=0,12 g soluto/g carbón; densidad aparente 0,5 g/mL; sección 0,002 m². mcarbón=ρaparente A L. Q=0,1 L/min; C0 se convierte a g/L. t50=q m/(Q C0). Curva logística Csal/C0=1/[1+exp(−(t−t50)/(0,12t50))].

Límites: Curva de ruptura sintética con balance de capacidad; no resuelve dispersión, transferencia intrapartícula, temperatura ni competencia de una mezcla real. El tiempo t50 es una escala operativa ideal, no una vida certificada.

Escala: Columna de carbón en corte · frente de ruptura

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/quimica-23/; src/components/ciencias/definiciones/quimica-23.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
7000 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

Geometría pendiente.

Flujos completos guardados: 0. Cada flujo exige ficha, rechazos sin registro y con respuesta errónea, adquisición, resultado, quiz, descarga, calidad e invalidación. Un informe inicial no cuenta como recorrido completo.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:47:31.636Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-23-1366-dpr1-informe.json.





QA 2026-10-29T04:29:31.822Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-23-1366-dpr1-informe.json.






QA 2026-10-29T05:39:38.988Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-23-1600-dpr1-informe.json.

QA 2026-10-29T07:11:19.242Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-23-2020-dpr1.25-informe.json.

QA 2026-10-29T07:51:09.406Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-23-390-dpr1-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión6 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 206: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 78 palabras como máximo en estos tamaños.

Cambio geométrico: Fritas, cierres y escala del lecho de carbón.

Componentes semánticos: Columna de tratamiento; Lecho de carbón. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso quimica-23; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 33532 triángulos de geometría. Interacción registrada el 2026-10-29T02:44:24.742Z: 2 componentes, 30 llamadas, 66286 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo78 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

El lecho oscuro, las fritas y los cierres distinguen la columna de carbón; el frente de ruptura se contrasta en la bitácora.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/quimica-23-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->
