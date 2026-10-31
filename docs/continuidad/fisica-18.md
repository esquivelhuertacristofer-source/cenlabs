## Ampliación 3D · 29 de octubre de 2026 · EN REVISIÓN LOCAL

La petición del usuario es reforzar las 50 escenas: considera insuficiente el detalle del 3D publicado. Se añaden **Enderezador de entrada** y **Circuito hidráulico auxiliar**, inspeccionables y desmontables. Autoría específica en `src/components/ciencias/escenas/montajes.ts`; integración en `registro.ts`. El desmontaje separa capas o conjuntos del equipo y se restaura al cerrar el inspector; no modifica parámetros, muestras ni resultados científicos. Las piezas pasivas no tienen un control científico ficticio. Ahora también se puede arrastrar directamente el volumen de la pieza científica seleccionada. El inspector reemplaza temporalmente los ajustes del ensayo.

Comprobación geométrica local: 71146 triángulos, 4 piezas semánticas; sin normales nulas ni valores no finitos (auditor `verifica-piezas-ciencias50.mjs`). TypeScript limpio. La validación visual, el rendimiento en navegador y el recorrido completo de esta nueva ampliación están pendientes; **no se considera terminada ni publicada**. La publicación 297f91f/Cloudflare 3cfad647 pertenece a la versión anterior.

Retomar: ejecutar `montajes-ciencias50.mjs fisica-18` en escritorio/móvil, revisar capturas, corregir oclusiones y pruebas; actualizar la ficha con evidencia real antes del commit/despliegue.






### Evidencia de la ampliación (actualización automática)

Desmontaje/restauración correctos en 2/4 tamaños: 1600 px, 390 px. Recorridos completos vigentes: 0/4. La evidencia previa a esta ampliación no se cuenta como prueba nueva. Máximo observado: 63 llamadas de dibujo; 96258 triángulos. Archivos reproducibles: `scripts/auditoria/.salida/montajes50/` y `ciencias50/`. Falta cerrar revisión visual y publicación de esta versión.


# fisica-18 · Túnel de agua: Reynolds y desprendimiento de vórtices

Estado: **publicado y comprobado** el 29 de octubre de 2026, 9:01 a.m. (Ciudad de México). Código 297f91fa54515c4ffb600b7394b4d06f1d0d6e02; Cloudflare 3cfad647-fa74-4034-8409-94cefbeba58a.

## Resultado y evidencia

Exploración de componentes, aislamiento, corte, mando 3D y revisión temporal en el formato nativo con ficha inicial. Modelo, límites, archivos y cambios propios de esta práctica se conservan en el historial inferior.

Cuatro recorridos completos vigentes: 1366×768, 1600×900, 2020×1055 a DPR 1,25 y 390×844. Incluyen adquisición de 6 s, rechazos, cálculo correcto, quiz, descarga, invalidación y controles 3D. Máximo 81 palabras iniciales; sin errores registrados. Catálogo destacado y portada real final.

Batería final: 50 suites/4219 pruebas correctas. Login real: 50 entradas y 4 completados representativos con lectura de vuelta 10/10 (100%). Evidencia portable: [ciencias50-evidencia.json](ciencias50-evidencia.json).

## Retomar

Mantener las simplificaciones declaradas y la incógnita oculta antes de validar. Editar definición en src/components/ciencias/definiciones/fisica-18.ts, modelo puro en src/domain/ciencias y constructor en escenas. Si cambia comportamiento, elevar la revisión afectada en ciencias50-versiones.mjs y repetir sus pruebas; regenerar guías sólo después de verifica-piezas. No ejecutar el documentador histórico que sobreescribe fichas. Publicar desde cen-deploy conservando voces y confirmar login/guardado.

## Historial de implementación y revisión

Los estados locales o pendientes siguientes describen fases anteriores al cierre confirmado de esta cabecera.

<details><summary>Modelo, archivos, autocrítica y pruebas por laboratorio</summary>

<!-- ciencias50-historial -->
# fisica-18 · Túnel de agua: Reynolds y desprendimiento de vórtices

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Implementación
Flujo alrededor de un obstáculo; medir velocidades y frecuencia con un modelo de flujo validado.

Reto: Determina el número de Reynolds del agua y relaciona su valor con el campo de flujo calculado alrededor del cilindro.

Modelo: Re=UD/ν, ν=1,0·10⁻⁶ m²/s. Campo2D por Lattice Boltzmann D2Q9/BGK con rebote no-slip en el cilindro, entrada de equilibrio y salida extrapolada. Red128×64, diámetro12 celdas, Ured=0,045 celda/paso, νred=Ured·12/Re. Relajaciónτ=1/2+3νred. dx=D/12; dt=dx·Ured/U.

Límites: Agua newtoniana incompresible aproximada, régimen de bajo Mach, cilindro2D confinado y paredes horizontales deslizantes. Se limita10≤Re≤120; no representa turbulencia3D ni fuerzas de diseño certificadas. Campo inicial preparado durante 30.000 pasos en Re10/40/80/120; cada cambio usa el estado más cercano y transita con el nuevo Re, sin asumir equilibrio instantáneo; trazadores pasivos, no moléculas individuales. La frecuencia de desprendimiento no se impone como animación.

Escala: Flujo2D D2Q9 · color: vorticidad · trazadores pasivos · tiempo equivalente por dx y dt

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/fisica-18/; src/components/ciencias/definiciones/fisica-18.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
5000 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

Geometría comprobada en 1 informe(s): 1366-dpr1.

Flujos completos guardados: 1. Cada flujo exige ficha, rechazos sin registro y con respuesta errónea, adquisición, resultado, quiz, descarga, calidad e invalidación. Un informe inicial no cuenta como recorrido completo.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:23:48.806Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-18-1366-dpr1-informe.json.

QA 2026-10-28T23:04:26.007Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-18-1600-dpr1-informe.json.

## Revisión de interacción solicitada por el usuario · 28-10-2026
El usuario pidió mejorar mucho más interactividad y 3D tras abrir este lab. Se amplió el banco con acondicionador de entrada hexagonal, barandales y remates mecanizados. Se añadieron 144 trazadores con volumen, 210 vectores instanciados derivados de u/v, capas seleccionables de vorticidad y rapidez, vista cenital con regreso a perspectiva, sonda puntual fijable por toque y un inyector de tinta recolocable sobre el agua. El tinte se integra como trazador pasivo con subpasos de hasta cuatro pasos de red; no introduce masa ni altera el solver. Las posiciones y los vectores usan el mismo reloj/campo LBM. No equivale a difusión molecular ni a CFD 3D.

Resultado final de esta iteración: auditoría de interacción correcta en 1366×768, 1600×900, 390×844 y 2020×1055 DPR1,25. La coordenada x del inyector coincide con 76,8 celdas para el punto conocido x=0,4 de la escena; hay partículas activas y la sonda se fija. Recorrido nativo completo repetido a 1600×900: registro, rechazo de respuesta errónea, validación, quiz, descarga e invalidación correctos; informe versión3. TypeScript y ESLint finales limpios. El barrido global exige ahora versión3 para fisica-18 y versión2 para los otros49, por lo que --pendientes repetirá automáticamente los otros tres recorridos de este lab. Estado: revisión local mostrada al usuario, sin publicación.

La selección usa la intersección del rayo con el plano del agua; los puntos de intersección de algunos objetos instanciados desplazaban el inyector y se corrigieron. Se verifica su coordenada contra un punto conocido, además de la presencia de partículas activas.

Archivos principales: `src/components/ciencias/escenas/fluidos.ts`, `src/components/ciencias/EscenaCiencia.tsx`, `src/components/ciencias/ciencias.css`, `src/components/ciencias/definiciones/fisica-18.ts`; auditoría `scripts/auditoria/tunel-interactivo.mjs`. Son cambios locales, sin commit, push ni despliegue. Se conserva ficha, adquisición, reto, validación y quiz.

TypeScript y ESLint limpios. Modelos, reloj e integración: 3 suites / 211 pruebas correctas. Consultar `scripts/auditoria/.salida/tunel-interactivo/informe.json` para los tamaños realmente pasados: el informe se escribe al cerrar el navegador. Modo vectores: 34 llamadas / 59250 triángulos, cero normales nulas y cero NaN. Hay capturas de perspectiva, sonda y tinta.

Autocrítica: el banco permite explorar causas y medir puntos, con datos fuera del 3D. El nuevo menú es compacto, pero se superpone ligeramente a la parte superior del canal en 1366; queda margen de mejora del encuadre. Persiste el alcance 2D del campo y no debe venderse como simulación volumétrica. El tutor de algunas capturas sigue sin avatar visible: pendiente independiente. Esta revisión no se declara publicada ni terminada hasta completar regresión del recorrido, QA restante de la tanda y despliegue.

Retomar: el barrido global 200 se interrumpió voluntariamente antes de esta revisión (sesión 3768 cerrada). Repetir los informes antiguos de fisica-18; los de los demás labs siguen siendo evidencia de su revisión previa. Reanudar secuencialmente con --pendientes después de cerrar esta revisión, sin dos navegadores de prueba a la vez. Mantener speechSynthesis silenciado sólo en auditoría. No ejecutar helpers históricos de definición sobre este descriptor refinado.

QA 2026-10-28T23:20:56.794Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-18-1600-dpr1-informe.json.

## Corrección de fluidez · 28-10-2026
El usuario reportó lag en la revisión interactiva. No quedaba en ejecución ningún navegador propio de auditoría al comenzar la revisión. No se cerraron procesos de otros proyectos ni pestañas del usuario.

Causas encontradas en el código: reset síncrono de 720 pasos LBM al cambiar parámetros; raycasting recursivo de todas las piezas y partículas; actualizaciones de matrices y buffers incluso en pausa o con capas ocultas; actualización React del HUD a cada movimiento del puntero.

Se elimina el calentamiento síncrono: el campo parte de las semillas ya preparadas de 30000 pasos y se ejecuta un paso para inicializar u/v; después transita con el Reynolds nuevo al ritmo normal. No se reduce resolución ni se cambia el operador D2Q9, las condiciones de contorno ni el número de pasos por segundo. Selección sólo sobre el plano del agua, HUD limitado a una actualización cada80ms, y capas pausadas/ocultas sin subidas continuas de buffers.

Perfil reproducible `scripts/auditoria/perfil-tunel.mjs`: reinicio18,94ms frente a446,79ms del calentamiento anterior; actualización media2,71ms, p953,82ms; selección media1,408ms antes frente a0,026ms después. Son medidas Node/CPU, NO son FPS del navegador del usuario. Evidencia: `.salida/tunel-interactivo/rendimiento-cpu.json`.

TypeScript y ESLint limpios. Pruebas del reloj3/3 correctas. Recorrido de interacción repetido después de optimizar a1600×900: sonda fija, coordenada de tinta, partículas activas, pausa, vectores, capas y retorno de cámara correctos; cero errores, cero NaN/normales nulas,34 llamadas/59250 triángulos. `informe.json` contiene ahora esta revisión de1600; las capturas de los otros tamaños corresponden a la iteración anterior. Falta repetir los otros tamaños, medir FPS del navegador real y completar QA de la tanda. El intento de inspeccionar la pestaña del usuario mediante CUA falló al inicializar el entorno; no se obtuvieron métricas de su GPU ni FPS.

La auditoría global exige versión4 para fisica-18 (versión2 para los otros49) para evitar conservar el recorrido anterior como evidencia de esta optimización. Sin commit, push ni despliegue. No ejecutar cierre-tunel.py de nuevo: fue un helper puntual anterior a esta corrección.


QA 2026-10-29T04:04:09.056Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-18-1366-dpr1-informe.json.






QA 2026-10-29T04:47:29.386Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-18-1600-dpr1-informe.json.




QA 2026-10-29T07:27:03.512Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-18-390-dpr1-informe.json.

QA 2026-10-29T13:51:50.767Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-18-2020-dpr1.25-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión7 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 207: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 81 palabras como máximo en estos tamaños.

Cambio geométrico: Canal con acondicionador de entrada, apoyos y bridas; tinta y sonda.

Componentes semánticos: Cilindro no-slip; Plano de medición. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso fisica-18; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 56182 triángulos de geometría. Interacción registrada el 2026-10-29T03:31:48.155Z: 2 componentes, 47 llamadas, 66330 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo81 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

La superficie de vorticidad, los trazadores y el canal forman el foco visual; sonda, tinta y vectores añaden exploración del campo calculado.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/fisica-18-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->

<!-- /ciencias50-historial -->

</details>
