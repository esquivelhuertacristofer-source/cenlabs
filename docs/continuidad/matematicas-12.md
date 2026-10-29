# matematicas-12 · Curvas Bézier y continuidad de trayectorias

Estado: **publicado y comprobado** el 29 de octubre de 2026, 9:01 a.m. (Ciudad de México). Código 297f91fa54515c4ffb600b7394b4d06f1d0d6e02; Cloudflare 3cfad647-fa74-4034-8409-94cefbeba58a.

## Resultado y evidencia

Exploración de componentes, aislamiento, corte, mando 3D y revisión temporal en el formato nativo con ficha inicial. Modelo, límites, archivos y cambios propios de esta práctica se conservan en el historial inferior.

Cuatro recorridos completos vigentes: 1366×768, 1600×900, 2020×1055 a DPR 1,25 y 390×844. Incluyen adquisición de 6 s, rechazos, cálculo correcto, quiz, descarga, invalidación y controles 3D. Máximo 77 palabras iniciales; sin errores registrados. Catálogo destacado y portada real final.

Batería final: 50 suites/4219 pruebas correctas. Login real: 50 entradas y 4 completados representativos con lectura de vuelta 10/10 (100%). Evidencia portable: [ciencias50-evidencia.json](ciencias50-evidencia.json).

## Retomar

Mantener las simplificaciones declaradas y la incógnita oculta antes de validar. Editar definición en src/components/ciencias/definiciones/matematicas-12.ts, modelo puro en src/domain/ciencias y constructor en escenas. Si cambia comportamiento, elevar la revisión afectada en ciencias50-versiones.mjs y repetir sus pruebas; regenerar guías sólo después de verifica-piezas. No ejecutar el documentador histórico que sobreescribe fichas. Publicar desde cen-deploy conservando voces y confirmar login/guardado.

## Historial de implementación y revisión

Los estados locales o pendientes siguientes describen fases anteriores al cierre confirmado de esta cabecera.

<details><summary>Modelo, archivos, autocrítica y pruebas por laboratorio</summary>

<!-- ciencias50-historial -->
# matematicas-12 · Curvas Bézier y continuidad de trayectorias

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Seguimiento del punto arrastrado · exploración9 / nativa209

El diagnóstico con cámara congelada dejabaP1 fuera de pantalla al llevar h1 a1,5 (NDCy−1,5824). ExploradorEscena ahora notifica el final del arrastre y EscenaCiencia recalcula el encuadre con transición suave. Verificado en navegador a1600 y390/reduced-motion: h1=1,5 yP1visible, NDCy−0,34195/−0,34247. Las161 posiciones de la curva difieren como máximo5,42e−8 del modelo y el útil coincide con su trayectoria. Especiales8/8 y exploraciónv9de las trespiezas aprobados. Falta cerrar sus cuatro recorridos nativos209 y publicación; los206anteriores son históricos.

## Implementación
Una trayectoria se deforma con puntos de control; comparar tangencia y curvatura.

Reto: Calcula la longitud de la trayectoria cúbica entre los extremos, en metros, contrastando una integración numérica con el recorrido visible.

Modelo: B(u)=(1−u)³P0+3(1−u)²uP1+3(1−u)u²P2+u³P3. P0=(−1,0),P1=(−0,5,h1),P2=(0,5,h2),P3=(1,0) m. Longitud L=∫0¹||B′(u)||du; referencia Simpson compuesto con512 intervalos. Curvatura κ=|x′y″−y′x″|/(x′²+y′²)^(3/2).

Límites: Curva plana embebida en3D, sin cinemática inversa de máquina, colisiones, velocidad máxima o planificación dinámica. La herramienta recorre u de forma uniforme; eso no implica velocidad espacial uniforme. Longitudes en metros del escenario, no código de máquina.

Escala: Curva cúbica exacta · parámetro uniforme · recorrido6 s

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/matematicas-12/; src/components/ciencias/definiciones/matematicas-12.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
7500 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

0/4 recorridos finales de revisión 206: pendientes. Sin medición final de prosa todavía. Los informes antiguos se conservan como historial y no se cuentan para el cierre actual.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:29:05.000Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-12-1366-dpr1-informe.json.



QA 2026-10-29T04:10:31.969Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-12-1366-dpr1-informe.json.





QA 2026-10-29T04:53:48.055Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-12-1600-dpr1-informe.json.




QA 2026-10-29T05:21:26.317Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-12-1366-dpr1-informe.json.

QA 2026-10-29T05:22:59.494Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-12-1600-dpr1-informe.json.

QA 2026-10-29T06:26:54.582Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-12-2020-dpr1.25-informe.json.

QA 2026-10-29T07:32:27.842Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-12-390-dpr1-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión9 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 209: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 77 palabras como máximo en estos tamaños.

Cambio geométrico: Accionamientos del pórtico, husillos y detalle del portaherramientas.

Componentes semánticos: Carro CNC; Punto de control P1; Punto de control P2. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso matematicas-12; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 29836 triángulos de geometría. Interacción registrada el 2026-10-29T05:00:57.676Z: 3 componentes, 38 llamadas, 29840 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo77 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

El pórtico, los husillos y el útil siguen una curva común. Se corrigió la pérdida del punto fuera de pantalla reenfocando al soltar el mando.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/matematicas-12-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->

<!-- /ciencias50-historial -->

</details>
