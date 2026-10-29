# fisica-23 · Efecto fotoeléctrico: frecuencia, umbral y potencial de frenado

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Implementación
Fotones y electrones en un banco óptico; distinguir energía individual e intensidad.

Reto: Calcula el potencial de frenado que anula la fotocorriente para la luz elegida y una función de trabajo2,15 eV.

Modelo: Eγ=hc/λ. Kmax=Eγ−φ, φ=2,15 eV; eVs=Kmax. h=6,62607015·10⁻³⁴ J·s, e=1,602176634·10⁻¹⁹ C, c=299792458 m/s. Corriente sintética: I=18 nA·max(0,1−V/Vs), equivalente a energías normales uniformes entre0 yKmax. En el tubo: x=v0τ−eVτ²/(2mL), L=0,10 m.

Límites: Monocromático, sin efecto de espacio de carga, emisión térmica, espectro real del material ni distribución electrónica de una superficie comercial. Ley de corriente del banco declarada, no curva universal. Intervalo espectral por encima del umbral para φ elegida. Las trayectorias representan componentes normales1D.

Escala: Electrones×1/10⁷ · tubo0,10 m · ley de corriente sintética

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/fisica-23/; src/components/ciencias/definiciones/fisica-23.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
5500 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

0/4 recorridos finales de revisión 207: pendientes. Sin medición final de prosa todavía. Los informes antiguos se conservan como historial y no se cuentan para el cierre actual.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:27:11.301Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-23-1366-dpr1-informe.json.



QA 2026-10-29T04:08:18.868Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-23-1366-dpr1-informe.json.





QA 2026-10-29T04:51:40.768Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-23-1600-dpr1-informe.json.




QA 2026-10-29T06:22:26.968Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-23-2020-dpr1.25-informe.json.

QA 2026-10-29T07:30:32.412Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-23-390-dpr1-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión7 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 207: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 75 palabras como máximo en estos tamaños.

Cambio geométrico: Sellos de vacío y color de iluminación dependiente de longitud de onda.

Componentes semánticos: Fotocátodo; Electrodo colector. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso fisica-23; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 14604 triángulos de geometría. Interacción registrada el 2026-10-29T03:02:39.216Z: 2 componentes, 43 llamadas, 28606 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo75 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

La cámara y los electrodos dejan ver la emisión; el color depende de la iluminación y la corriente sintética se explica en la ficha.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/fisica-23-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->
